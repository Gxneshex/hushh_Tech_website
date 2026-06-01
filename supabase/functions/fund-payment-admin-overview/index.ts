// fund-payment-admin-overview — onboarding + investor operations audit for the
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

type Stage =
  | "manual_approved"
  | "manual_rejected"
  | "awaiting_manual_review"
  | "payment_started"
  | "onboarding_complete"
  | "bank_linked"
  | "in_onboarding"
  | "nda_signed"
  | "lead";

const STAGE_ORDER: Record<Stage, number> = {
  awaiting_manual_review: 0,
  manual_approved: 1,
  manual_rejected: 2,
  payment_started: 3,
  onboarding_complete: 4,
  bank_linked: 5,
  in_onboarding: 6,
  nda_signed: 7,
  lead: 8,
};

type SourceWarning = {
  source: string;
  code?: string | null;
  message: string;
};

function readRows<T = any>(
  source: string,
  result: { data?: T[] | null; error?: any },
  warnings: SourceWarning[],
): T[] {
  if (result.error) {
    warnings.push({
      source,
      code: result.error.code ?? null,
      message: result.error.message || "Unable to load source",
    });
    return [];
  }
  return result.data || [];
}

function latestByUser(rows: any[], dateField = "created_at") {
  const out = new Map<string, any>();
  for (const row of rows) {
    if (!row?.user_id) continue;
    const prev = out.get(row.user_id);
    if (!prev || new Date(row[dateField] || 0) > new Date(prev[dateField] || 0)) {
      out.set(row.user_id, row);
    }
  }
  return out;
}

function addSource(sources: Set<string>, condition: unknown, source: string) {
  if (condition) sources.add(source);
}

function financialDataStatus(params: {
  onboarding: any | null;
  financial: any | null;
  item: any | null;
  productRows: any[];
  accountRows: any[];
}) {
  const finStatus = String(params.financial?.status || "").toLowerCase();
  const syncStatus = String(params.financial?.plaid_sync_status || "").toLowerCase();
  const linkStatus = String(params.onboarding?.financial_link_status || "").toLowerCase();
  const hasLinkedEvidence = Boolean(
    params.financial?.plaid_item_id ||
      params.item?.plaid_item_id ||
      params.productRows.length > 0 ||
      params.accountRows.length > 0,
  );

  if (finStatus === "complete" || syncStatus === "complete") return "complete";
  if (finStatus === "partial" || syncStatus === "partial") return "partial";
  if (hasLinkedEvidence) return "linked";
  if (linkStatus === "skipped") return "skipped";
  if (linkStatus === "pending") return "pending";
  return "missing";
}

function stageFor(params: {
  payment: any | null;
  onboarding: any | null;
  bankLinked: boolean;
  ndaSigned: boolean;
}): Stage {
  const status = String(params.payment?.status || "").toLowerCase();
  if (status === "verified_investor") return "manual_approved";
  if (status === "rejected") return "manual_rejected";
  if (params.payment?.paid_at || status === "pending_manual_verification") return "awaiting_manual_review";
  if (params.payment) return "payment_started";
  if (params.onboarding?.is_completed) return "onboarding_complete";
  if (params.bankLinked) return "bank_linked";
  if (params.onboarding && ((params.onboarding.current_step ?? 0) > 1 || params.onboarding.is_completed)) {
    return "in_onboarding";
  }
  if (params.ndaSigned) return "nda_signed";
  return "lead";
}

function missingPieces(params: {
  onboarding: any | null;
  payment: any | null;
  bankLinked: boolean;
  financialStatus: string;
  ndaSigned: boolean;
  kycAvailable: boolean;
  kyc: any | null;
}) {
  const pieces: string[] = [];
  if (params.bankLinked && !params.onboarding) pieces.push("missing_onboarding_row");
  if (params.bankLinked && params.onboarding?.financial_link_status !== "completed") {
    pieces.push("onboarding_financial_link_status_not_completed");
  }
  if (!params.bankLinked && params.financialStatus !== "skipped") pieces.push("bank_not_linked");
  if (!params.ndaSigned) pieces.push("nda_not_signed");
  if (params.onboarding?.is_completed && !params.payment) pieces.push("payment_not_started");
  if (params.payment && !params.payment.paid_at) pieces.push("first_payment_not_paid");
  if (params.payment?.paid_at && !["verified_investor", "rejected"].includes(params.payment.status)) {
    pieces.push("awaiting_manual_verification");
  }
  if (params.kycAvailable && !params.kyc) pieces.push("kyc_not_found");
  return [...new Set(pieces)];
}

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
    const sourceWarnings: SourceWarning[] = [];

    const [
      payRes,
      ndaRes,
      ceoRes,
      onbRes,
      paidRes,
      finRes,
      itemRes,
      acctRes,
      syncRes,
      kycRes,
    ] = await Promise.all([
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
        .select("user_id, payment_status, calendly_booked, created_at")
        .eq("payment_status", "completed"),
      supabase
        .from("onboarding_data")
        .select(
          "user_id, legal_first_name, legal_last_name, current_step, is_completed, completed_at, fund_payment_status, fund_investor_verification_status, financial_link_status, nda_signed_at, initial_investment_amount, selected_fund, class_a_units, class_b_units, class_c_units, updated_at",
        ),
      supabase
        .from("fund_stripe_payments")
        .select("user_id, amount, status")
        .eq("status", "succeeded"),
      supabase
        .from("user_financial_data")
        .select("user_id, institution_name, status, plaid_sync_status, plaid_item_id, plaid_sync_completed_at, updated_at"),
      supabase
        .from("plaid_items")
        .select("user_id, plaid_item_id, institution_name, status, updated_at"),
      supabase
        .from("plaid_accounts")
        .select("plaid_item_id, plaid_account_id, name, official_name, type, subtype, mask, current_balance"),
      supabase
        .from("plaid_product_sync_statuses")
        .select("user_id, plaid_item_id, product, status, available, records_count, updated_at, completed_at"),
      supabase
        .from("kyc_attestations")
        .select("user_id, status, risk_band, risk_score, verified_at, provider_name")
        .order("verified_at", { ascending: false }),
    ]);

    const paymentRows = readRows("fund_stripe_payment_requests", payRes, sourceWarnings);
    const ndaRows = readRows("nda_signatures", ndaRes, sourceWarnings);
    const ceoRows = readRows("ceo_meeting_payments", ceoRes, sourceWarnings);
    const onboardingRows = readRows("onboarding_data", onbRes, sourceWarnings);
    const paidRows = readRows("fund_stripe_payments", paidRes, sourceWarnings);
    const financialRows = readRows("user_financial_data", finRes, sourceWarnings);
    const itemRows = readRows("plaid_items", itemRes, sourceWarnings);
    const accountRows = readRows("plaid_accounts", acctRes, sourceWarnings);
    const productRows = readRows("plaid_product_sync_statuses", syncRes, sourceWarnings);
    const kycRows = readRows("kyc_attestations", kycRes, sourceWarnings);
    const kycAvailable = !kycRes.error;

    const latestPaymentByUser = latestByUser(paymentRows);
    const ndaByUser = new Map<string, any>(ndaRows.map((r) => [r.user_id, r]));
    const ceoByUser = latestByUser(ceoRows);
    const onboardingByUser = new Map<string, any>(onboardingRows.map((r) => [r.user_id, r]));
    const financialByUser = new Map<string, any>(financialRows.map((r) => [r.user_id, r]));
    const itemByUser = latestByUser(itemRows, "updated_at");
    const kycByUser = latestByUser(kycRows, "verified_at");

    const accountsByItem = new Map<string, any[]>();
    for (const account of accountRows) {
      if (!account?.plaid_item_id) continue;
      accountsByItem.set(account.plaid_item_id, [...(accountsByItem.get(account.plaid_item_id) || []), account]);
    }

    const productsByUser = new Map<string, any[]>();
    for (const product of productRows) {
      if (!product?.user_id) continue;
      productsByUser.set(product.user_id, [...(productsByUser.get(product.user_id) || []), product]);
    }

    const emailByUser = new Map<string, string | null>();
    const authObjByUser = new Map<string, any>();
    const perPage = 1000;
    for (let page = 1; page <= 50; page++) {
      const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ page, perPage });
      if (usersErr) {
        sourceWarnings.push({
          source: "auth.users",
          code: usersErr.status ? String(usersErr.status) : null,
          message: usersErr.message || "Unable to load auth users",
        });
        break;
      }
      const list = usersData?.users || [];
      for (const u of list) {
        emailByUser.set(u.id, u.email ?? null);
        authObjByUser.set(u.id, u);
      }
      if (list.length < perPage) break;
    }

    const allUserIds = new Set<string>([
      ...latestPaymentByUser.keys(),
      ...ndaByUser.keys(),
      ...ceoByUser.keys(),
      ...onboardingByUser.keys(),
      ...financialByUser.keys(),
      ...itemByUser.keys(),
      ...kycByUser.keys(),
    ]);

    let firstPaymentPaid = 0;
    let pendingReview = 0;
    let verified = 0;
    let rejected = 0;
    let paymentLinkSent = 0;
    let committedCents = 0;
    let approvedCents = 0;
    for (const p of latestPaymentByUser.values()) {
      if (p) paymentLinkSent++;
      if (p.paid_at) {
        firstPaymentPaid++;
        committedCents += toCents(p.commitment_amount);
      }
      if (p.status === "pending_manual_verification" || (p.paid_at && !["verified_investor", "rejected"].includes(p.status))) {
        pendingReview++;
      }
      if (p.status === "verified_investor") {
        verified++;
        approvedCents += toCents(p.commitment_amount);
      }
      if (p.status === "rejected") rejected++;
    }

    let collectedCents = 0;
    for (const sp of paidRows) collectedCents += toCents(sp.amount);

    let bankLinked = 0;
    let financialDataReady = 0;
    let financialDataPartial = 0;
    let onboardingComplete = 0;
    let needsAttention = 0;

    const investors = Array.from(allUserIds)
      .map((uid) => {
        const p = latestPaymentByUser.get(uid) || null;
        const ob = onboardingByUser.get(uid) || null;
        const nda = ndaByUser.get(uid) || null;
        const fin = financialByUser.get(uid) || null;
        const item = itemByUser.get(uid) || null;
        const plaidItemId = fin?.plaid_item_id || item?.plaid_item_id || null;
        const userAccounts = plaidItemId ? accountsByItem.get(plaidItemId) || [] : [];
        const userProducts = productsByUser.get(uid) || [];
        const kyc = kycByUser.get(uid) || null;
        const financialStatus = financialDataStatus({
          onboarding: ob,
          financial: fin,
          item,
          productRows: userProducts,
          accountRows: userAccounts,
        });
        const linked = ["complete", "partial", "linked"].includes(financialStatus);
        const ndaSignedAt = nda?.signed_at ?? ob?.nda_signed_at ?? null;
        const ndaSigned = Boolean(ndaSignedAt);
        const pieces = missingPieces({
          onboarding: ob,
          payment: p,
          bankLinked: linked,
          financialStatus,
          ndaSigned,
          kycAvailable,
          kyc,
        });
        const sources = new Set<string>();
        addSource(sources, p, "fund_stripe_payment_requests");
        addSource(sources, paidRows.some((row) => row.user_id === uid), "fund_stripe_payments");
        addSource(sources, nda, "nda_signatures");
        addSource(sources, ob, "onboarding_data");
        addSource(sources, ceoByUser.has(uid), "ceo_meeting_payments");
        addSource(sources, fin, "user_financial_data");
        addSource(sources, item, "plaid_items");
        addSource(sources, userAccounts.length, "plaid_accounts");
        addSource(sources, userProducts.length, "plaid_product_sync_statuses");
        addSource(sources, kyc, "kyc_attestations");

        if (linked) bankLinked++;
        if (financialStatus === "complete") financialDataReady++;
        if (financialStatus === "partial" || financialStatus === "linked") financialDataPartial++;
        if (ob?.is_completed) onboardingComplete++;
        if (pieces.length > 0) needsAttention++;

        const stage = stageFor({
          payment: p,
          onboarding: ob,
          bankLinked: linked,
          ndaSigned,
        });

        const displayName = ob || authObjByUser.has(uid)
          ? getDisplayName(authObjByUser.get(uid), ob)
          : nda?.signer_name || "Hushh investor";

        return {
          userId: uid,
          recipientName: displayName,
          userEmail: emailByUser.get(uid) ?? null,
          stage,
          requestReference: p?.request_reference ?? null,
          selectedFund: p?.selected_fund ?? ob?.selected_fund ?? null,
          commitmentLabel: p ? formatUsdCents(toCents(p.commitment_amount)) : null,
          status: p?.status ?? null,
          paymentRequestStatus: p?.status ?? null,
          manualReviewStatus: p?.paid_at && !["verified_investor", "rejected"].includes(p.status)
            ? "pending_manual_verification"
            : p?.status === "verified_investor" || p?.status === "rejected"
              ? p.status
              : null,
          manualInvestorStatus: p?.status === "verified_investor" || p?.status === "rejected" ? p.status : "not_verified",
          paidAt: p?.paid_at ?? null,
          firstPaymentPaid: Boolean(p?.paid_at),
          verifiedAt: p?.verified_at ?? null,
          rejectedAt: p?.rejected_at ?? null,
          ndaSignedAt,
          ndaSigned,
          meetCeoDone: ceoByUser.has(uid),
          currentStep: ob?.current_step ?? null,
          onboardingComplete: Boolean(ob?.is_completed),
          financialLinkStatus: ob?.financial_link_status ?? null,
          bankLinked: linked,
          institutionName: fin?.institution_name || item?.institution_name || null,
          financialDataStatus: financialStatus,
          plaidProductCount: userProducts.length,
          plaidAccountCount: userAccounts.length,
          kycStatus: kyc?.status ?? (kycAvailable ? "not_found" : "not_configured"),
          riskFlags: Array.isArray(p?.risk_flags) ? p.risk_flags : [],
          missingPieces: pieces,
          dataSources: Array.from(sources).sort(),
        };
      })
      .sort((a, b) => {
        const s = (STAGE_ORDER[a.stage] ?? 9) - (STAGE_ORDER[b.stage] ?? 9);
        if (s !== 0) return s;
        const ta = new Date(a.verifiedAt || a.paidAt || a.ndaSignedAt || 0).getTime();
        const tb = new Date(b.verifiedAt || b.paidAt || b.ndaSignedAt || 0).getTime();
        return tb - ta;
      });

    return json({
      success: true,
      funnel: {
        ndaSigned: ndaByUser.size,
        bankLinked,
        financialDataReady,
        financialDataPartial,
        onboardingComplete,
        paymentLinkSent,
        meetCeoDone: ceoByUser.size,
        firstPaymentPaid,
        pendingReview,
        verified,
        rejected,
        needsAttention,
        totalInvestors: allUserIds.size,
        money: {
          committed: formatUsdCents(committedCents),
          approved: formatUsdCents(approvedCents),
          collected: formatUsdCents(collectedCents),
        },
      },
      sourceWarnings,
      investors,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-overview] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
