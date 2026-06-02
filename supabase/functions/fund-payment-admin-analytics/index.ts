// fund-payment-admin-analytics — fund-operations analytics for the /fund-admin
// cockpit. Team-gated (Supabase JWT + email allowlist). Read-only.
// Computes funnel conversion, time-in-stage, capital-over-time, per-fund /
// per-share-class breakdowns, and AUM + recurring-revenue projection.
import {
  createAdminClient,
  formatUsdCents,
  getCorsHeaders,
  json,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";

const toCents = (amount: unknown) => Math.round(Number(amount || 0) * 100);

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const daysBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000;

// Monday-start ISO week bucket (UTC), as YYYY-MM-DD.
function weekStart(iso: string): string {
  const d = new Date(iso);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dow);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const FUND_LABELS: Record<string, string> = {
  hushh_fund_a: "Hushh Fund A",
};
const fundLabel = (k: string | null | undefined) =>
  (k && FUND_LABELS[k]) || (k ? k.replace(/_/g, " ") : "Unspecified");

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const teamAuth = await authenticateTeamMember(req);
    if (teamAuth.error || !teamAuth.user) {
      return json({ error: teamAuth.error || "Unauthorized" }, teamAuth.status || 401, corsHeaders);
    }

    const supabase = createAdminClient();

    const [payRes, ndaRes, onbRes, paidRes, finRes, ceoRes, subRes, kycRes] = await Promise.all([
      supabase
        .from("fund_stripe_payment_requests")
        .select(
          "user_id, selected_fund, status, commitment_amount, first_payment_amount, class_a_units, class_b_units, class_c_units, recurring_selected, recurring_amount, paid_at, verified_at, rejected_at, created_at",
        ),
      supabase.from("nda_signatures").select("user_id, signed_at").not("signed_at", "is", null),
      supabase.from("onboarding_data").select("user_id, is_completed, completed_at, financial_link_status, selected_fund"),
      supabase
        .from("fund_stripe_payments")
        .select("user_id, amount_cents, status, payment_kind, paid_at, created_at")
        .eq("status", "succeeded"),
      supabase.from("user_financial_data").select("user_id, status, plaid_sync_status, plaid_item_id"),
      supabase.from("ceo_meeting_payments").select("user_id, payment_status").eq("payment_status", "completed"),
      supabase.from("fund_stripe_subscriptions").select("user_id, status, recurring_amount, recurring_frequency"),
      supabase.from("kyc_attestations").select("user_id, status, risk_band"),
    ]);

    const payReqs = payRes.data || [];
    const ndaRows = ndaRes.data || [];
    const onbRows = onbRes.data || [];
    const paidRows = paidRes.data || [];
    const finRows = finRes.data || [];
    const ceoRows = ceoRes.data || [];
    const subRows = subRes.data || [];
    const kycRows = kycRes.data || [];

    // Latest payment request per user (don't double-count multiple requests).
    const latestByUser = new Map<string, any>();
    for (const p of payReqs) {
      const prev = latestByUser.get(p.user_id);
      if (!prev || new Date(p.created_at) > new Date(prev.created_at)) latestByUser.set(p.user_id, p);
    }
    const ndaByUser = new Map<string, any>(ndaRows.map((r) => [r.user_id, r]));
    const onbByUser = new Map<string, any>(onbRows.map((r) => [r.user_id, r]));
    const ceoByUser = new Set<string>(ceoRows.map((r) => r.user_id));
    const finByUser = new Map<string, any>(finRows.map((r) => [r.user_id, r]));
    const kycByUser = new Map<string, any>(kycRows.map((r) => [r.user_id, r]));

    const bankLinked = (uid: string): boolean => {
      const f = finByUser.get(uid);
      if (!f) return false;
      const s = String(f.status || f.plaid_sync_status || "").toLowerCase();
      return s === "complete" || s === "partial" || s === "linked" || Boolean(f.plaid_item_id);
    };

    // ── Funnel (distinct-user counts at each stage) + conversion ──
    const entered = new Set<string>([
      ...ndaByUser.keys(),
      ...onbByUser.keys(),
      ...latestByUser.keys(),
    ]);
    const ndaCount = ndaByUser.size;
    const onbCompleteCount = onbRows.filter((o) => o.is_completed).length;
    const bankCount = [...entered].filter(bankLinked).length;
    const paidCount = [...latestByUser.values()].filter((p) => p.paid_at).length;
    const verifiedCount = [...latestByUser.values()].filter((p) => p.status === "verified_investor").length;

    const STAGES = [
      { key: "entered", label: "Entered funnel", count: entered.size },
      { key: "nda_signed", label: "NDA signed", count: ndaCount },
      { key: "onboarding_complete", label: "Onboarding complete", count: onbCompleteCount },
      { key: "bank_linked", label: "Bank linked", count: bankCount },
      { key: "first_paid", label: "$1 activated", count: paidCount },
      { key: "verified", label: "Verified", count: verifiedCount },
    ];
    const top = STAGES[0].count || 0;
    const funnel = STAGES.map((s, i) => {
      const prev = i === 0 ? s.count : STAGES[i - 1].count;
      return {
        ...s,
        conversionFromPrev: prev > 0 ? Math.round((s.count / prev) * 1000) / 10 : null, // %
        conversionFromTop: top > 0 ? Math.round((s.count / top) * 1000) / 10 : null,
      };
    });

    // ── Time-in-stage (median days) ──
    const ndaToOnb: number[] = [];
    const onbToPaid: number[] = [];
    const paidToVerified: number[] = [];
    for (const uid of entered) {
      const nda = ndaByUser.get(uid);
      const onb = onbByUser.get(uid);
      const p = latestByUser.get(uid);
      if (nda?.signed_at && onb?.completed_at) {
        const d = daysBetween(nda.signed_at, onb.completed_at);
        if (d >= 0) ndaToOnb.push(d);
      }
      if (onb?.completed_at && p?.paid_at) {
        const d = daysBetween(onb.completed_at, p.paid_at);
        if (d >= 0) onbToPaid.push(d);
      }
      if (p?.paid_at && p?.verified_at) {
        const d = daysBetween(p.paid_at, p.verified_at);
        if (d >= 0) paidToVerified.push(d);
      }
    }
    const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);
    const timeInStageDays = {
      ndaToOnboarding: round1(median(ndaToOnb)),
      onboardingToPaid: round1(median(onbToPaid)),
      paidToVerified: round1(median(paidToVerified)),
    };

    // ── Capital over time (weekly collected, last 16 weeks) ──
    const weekMap = new Map<string, { collectedCents: number; payments: number }>();
    for (const sp of paidRows) {
      const ts = sp.paid_at || sp.created_at;
      if (!ts) continue;
      const wk = weekStart(ts);
      const cur = weekMap.get(wk) || { collectedCents: 0, payments: 0 };
      cur.collectedCents += Number(sp.amount_cents || 0);
      cur.payments += 1;
      weekMap.set(wk, cur);
    }
    const capitalWeekly = [...weekMap.entries()]
      .map(([weekStartDate, v]) => ({
        weekStart: weekStartDate,
        collected: formatUsdCents(v.collectedCents),
        collectedCents: v.collectedCents,
        payments: v.payments,
      }))
      .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1))
      .slice(-16);

    // ── Per-fund breakdown (latest request per user) ──
    const fundMap = new Map<string, { investors: number; committedCents: number; approvedCents: number }>();
    for (const p of latestByUser.values()) {
      const key = p.selected_fund || "unspecified";
      const cur = fundMap.get(key) || { investors: 0, committedCents: 0, approvedCents: 0 };
      cur.investors += 1;
      if (p.paid_at) cur.committedCents += toCents(p.commitment_amount);
      if (p.status === "verified_investor") cur.approvedCents += toCents(p.commitment_amount);
      fundMap.set(key, cur);
    }
    const byFund = [...fundMap.entries()]
      .map(([fund, v]) => ({
        fund,
        label: fundLabel(fund),
        investors: v.investors,
        committed: formatUsdCents(v.committedCents),
        approved: formatUsdCents(v.approvedCents),
        committedCents: v.committedCents,
        approvedCents: v.approvedCents,
      }))
      .sort((a, b) => b.committedCents - a.committedCents);

    // ── Per-share-class unit totals (across paid investors) ──
    const byShareClass = { a: 0, b: 0, c: 0 };
    for (const p of latestByUser.values()) {
      if (!p.paid_at) continue;
      byShareClass.a += Number(p.class_a_units || 0);
      byShareClass.b += Number(p.class_b_units || 0);
      byShareClass.c += Number(p.class_c_units || 0);
    }

    // ── Capital totals + AUM + recurring projection ──
    let committedCents = 0, approvedCents = 0;
    for (const p of latestByUser.values()) {
      if (p.paid_at) committedCents += toCents(p.commitment_amount);
      if (p.status === "verified_investor") approvedCents += toCents(p.commitment_amount);
    }
    let collectedCents = 0;
    let recurringCollectedCents = 0;
    for (const sp of paidRows) {
      collectedCents += Number(sp.amount_cents || 0);
      if (sp.payment_kind === "recurring_invoice") recurringCollectedCents += Number(sp.amount_cents || 0);
    }
    // Projected monthly recurring from configured subscriptions (exclude cancelled).
    let recurringMonthlyCents = 0;
    let recurringCount = 0;
    for (const s of subRows) {
      if (String(s.status || "").toLowerCase() === "cancelled") continue;
      const amt = toCents(s.recurring_amount);
      if (amt > 0) {
        recurringMonthlyCents += amt;
        recurringCount += 1;
      }
    }

    const totals = {
      committed: formatUsdCents(committedCents),
      approved: formatUsdCents(approvedCents),
      collected: formatUsdCents(collectedCents),
      // AUM = capital committed by verified investors.
      aum: formatUsdCents(approvedCents),
      recurringMonthly: formatUsdCents(recurringMonthlyCents),
      recurringCount,
      recurringCollected: formatUsdCents(recurringCollectedCents),
    };

    // ── KYC coverage + risk distribution ──
    const kycBand = { LOW: 0, MEDIUM: 0, HIGH: 0, unknown: 0 };
    for (const k of kycByUser.values()) {
      const band = String(k.risk_band || "").toUpperCase();
      if (band === "LOW" || band === "MEDIUM" || band === "HIGH") kycBand[band] += 1;
      else kycBand.unknown += 1;
    }
    const kyc = {
      covered: kycByUser.size,
      coveragePct: entered.size > 0 ? Math.round((kycByUser.size / entered.size) * 1000) / 10 : null,
      riskBands: kycBand,
    };

    return json({
      success: true,
      funnel,
      timeInStageDays,
      capitalWeekly,
      byFund,
      byShareClass,
      totals,
      kyc,
      meetCeoDone: ceoByUser.size,
      totalInvestors: entered.size,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-analytics] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
