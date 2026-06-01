// fund-payment-admin-overview — funnel metrics + full investor list for the
// /fund-admin cockpit. Team-gated (Supabase JWT + email allowlist). Read-only.
import {
  createAdminClient,
  formatUsdCents,
  getCorsHeaders,
  getDisplayName,
  json,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";

const toCents = (amount: unknown) => Math.round(Number(amount || 0) * 100);

// Furthest stage a user has reached (the funnel is NOT strictly nested — a user
// can pay without doing Meet-CEO — so we pick the most-advanced reached stage).
type Stage =
  | "verified"
  | "rejected"
  | "awaiting_review"
  | "meet_ceo"
  | "onboarding"
  | "nda_signed"
  | "lead";

const STAGE_ORDER: Record<Stage, number> = {
  awaiting_review: 0,
  verified: 1,
  meet_ceo: 2,
  onboarding: 3,
  nda_signed: 4,
  rejected: 5,
  lead: 6,
};

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

    // ── Pull the funnel sources in parallel ──
    const [payRes, ndaRes, ceoRes, onbRes, paidRes] = await Promise.all([
      supabase
        .from("fund_stripe_payment_requests")
        .select(
          "id, user_id, request_reference, selected_fund, status, commitment_amount, first_payment_amount, class_a_units, class_b_units, class_c_units, risk_flags, paid_at, verified_at, rejected_at, reviewer_user_id, created_at",
        ),
      supabase
        .from("nda_signatures")
        .select("user_id, signer_name, signed_at")
        .not("signed_at", "is", null),
      supabase
        .from("ceo_meeting_payments")
        .select("user_id, payment_status, calendly_booked")
        .eq("payment_status", "completed"),
      supabase
        .from("onboarding_data")
        .select(
          "user_id, legal_first_name, legal_last_name, current_step, is_completed, fund_investor_verification_status, financial_link_status, nda_signed_at",
        ),
      supabase
        .from("fund_stripe_payments")
        .select("user_id, amount, status")
        .eq("status", "succeeded"),
    ]);
    if (payRes.error) throw payRes.error;

    // Latest payment request per user (avoid double-counting multiple requests).
    const latestPaymentByUser = new Map<string, any>();
    for (const p of payRes.data || []) {
      const prev = latestPaymentByUser.get(p.user_id);
      if (!prev || new Date(p.created_at) > new Date(prev.created_at)) {
        latestPaymentByUser.set(p.user_id, p);
      }
    }
    const ndaByUser = new Map<string, any>((ndaRes.data || []).map((r) => [r.user_id, r]));
    const ceoByUser = new Map<string, any>((ceoRes.data || []).map((r) => [r.user_id, r]));
    const onboardingByUser = new Map<string, any>((onbRes.data || []).map((r) => [r.user_id, r]));

    // Resolve emails via paginated listUsers (cheaper than per-user getUserById).
    const emailByUser = new Map<string, string | null>();
    const authObjByUser = new Map<string, any>();
    const perPage = 1000;
    for (let page = 1; page <= 50; page++) {
      const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ page, perPage });
      if (usersErr) break;
      const list = usersData?.users || [];
      for (const u of list) {
        emailByUser.set(u.id, u.email ?? null);
        authObjByUser.set(u.id, u);
      }
      if (list.length < perPage) break;
    }

    // Universe = anyone who entered the funnel (NDA OR onboarding OR payment).
    const allUserIds = new Set<string>([
      ...latestPaymentByUser.keys(),
      ...ndaByUser.keys(),
      ...onboardingByUser.keys(),
    ]);

    const stageOf = (uid: string): Stage => {
      const p = latestPaymentByUser.get(uid);
      if (p?.status === "verified_investor") return "verified";
      if (p?.status === "rejected") return "rejected";
      if (p?.paid_at) return "awaiting_review";
      if (ceoByUser.has(uid)) return "meet_ceo";
      const ob = onboardingByUser.get(uid);
      if (ob && ((ob.current_step ?? 0) > 1 || ob.is_completed)) return "onboarding";
      if (ndaByUser.has(uid) || ob?.nda_signed_at) return "nda_signed";
      return "lead";
    };

    // ── Funnel counts (distinct users) + $ totals ──
    let firstPaymentPaid = 0, pendingReview = 0, verified = 0, rejected = 0;
    let committedCents = 0, approvedCents = 0;
    for (const p of latestPaymentByUser.values()) {
      if (p.paid_at) {
        firstPaymentPaid++;
        committedCents += toCents(p.commitment_amount);
      }
      if (p.status === "pending_manual_verification") pendingReview++;
      if (p.status === "verified_investor") {
        verified++;
        approvedCents += toCents(p.commitment_amount);
      }
      if (p.status === "rejected") rejected++;
    }
    let collectedCents = 0;
    for (const sp of paidRes.data || []) collectedCents += toCents(sp.amount);

    // ── Investor list ──
    const investors = Array.from(allUserIds)
      .map((uid) => {
        const p = latestPaymentByUser.get(uid) || null;
        const ob = onboardingByUser.get(uid) || null;
        const nda = ndaByUser.get(uid) || null;
        const stage = stageOf(uid);
        return {
          userId: uid,
          recipientName: getDisplayName(authObjByUser.get(uid), ob),
          userEmail: emailByUser.get(uid) ?? null,
          stage,
          requestReference: p?.request_reference ?? null,
          selectedFund: p?.selected_fund ?? null,
          commitmentLabel: p ? formatUsdCents(toCents(p.commitment_amount)) : null,
          status: p?.status ?? null,
          paidAt: p?.paid_at ?? null,
          verifiedAt: p?.verified_at ?? null,
          rejectedAt: p?.rejected_at ?? null,
          ndaSignedAt: nda?.signed_at ?? ob?.nda_signed_at ?? null,
          meetCeoDone: ceoByUser.has(uid),
          currentStep: ob?.current_step ?? null,
          riskFlags: Array.isArray(p?.risk_flags) ? p.risk_flags : [],
        };
      })
      .sort((a, b) => {
        const s = (STAGE_ORDER[a.stage] ?? 9) - (STAGE_ORDER[b.stage] ?? 9);
        if (s !== 0) return s;
        // within a stage, most recent activity first
        const ta = new Date(a.verifiedAt || a.paidAt || a.ndaSignedAt || 0).getTime();
        const tb = new Date(b.verifiedAt || b.paidAt || b.ndaSignedAt || 0).getTime();
        return tb - ta;
      });

    return json({
      success: true,
      funnel: {
        ndaSigned: ndaByUser.size,
        meetCeoDone: ceoByUser.size,
        firstPaymentPaid,
        pendingReview,
        verified,
        rejected,
        totalInvestors: allUserIds.size,
        money: {
          committed: formatUsdCents(committedCents),
          approved: formatUsdCents(approvedCents),
          collected: formatUsdCents(collectedCents),
        },
      },
      investors,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-overview] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
