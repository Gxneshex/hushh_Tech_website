import {
  buildPaymentRequestUrl,
  buildRiskFlags,
  centsToDecimal,
  computeCommitmentCents,
  createAdminClient,
  createRequestReference,
  createRequestToken,
  formatDateTime,
  formatUsdCents,
  FUND_TEAM_RECIPIENTS,
  getCorsHeaders,
  getDisplayName,
  json,
  logAndSendFundEmail,
  MIN_FIRST_PAYMENT_CENTS,
  normalizeRecurringSummary,
  parseUsdAmountToCents,
  PAYMENT_LINK_TTL_DAYS,
  requireAuthenticatedUser,
  sha256Hex,
} from "../_shared/fundStripe.ts";
import {
  buildFundPaymentRequestTeamHtml,
  buildFundPaymentRequestUserHtml,
} from "../fund-payment-request/template.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const firstPaymentCents = parseUsdAmountToCents(
      body.firstPaymentAmount ?? body.first_payment_amount ?? body.amount,
    );

    if (!userId) {
      return json({ error: "userId is required" }, 400, corsHeaders);
    }

    if (!firstPaymentCents || firstPaymentCents < MIN_FIRST_PAYMENT_CENTS) {
      return json({
        error: "First payment must be at least $1",
        code: "MINIMUM_PAYMENT_REQUIRED",
        minimum_cents: MIN_FIRST_PAYMENT_CENTS,
      }, 400, corsHeaders);
    }

    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase, userId);
    if (auth.response) return auth.response;

    const { data: onboarding, error: onboardingError } = await supabase
      .from("onboarding_data")
      .select(`
        id, selected_fund, class_a_units, class_b_units, class_c_units,
        initial_investment_amount, recurring_amount, recurring_frequency,
        recurring_day_of_month, legal_first_name, legal_last_name,
        financial_link_status
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (onboardingError) throw onboardingError;
    if (!onboarding) {
      return json({ error: "Onboarding data is required before creating a payment request" }, 400, corsHeaders);
    }

    const commitmentCents = computeCommitmentCents(onboarding);
    if (commitmentCents <= 0) {
      return json({ error: "Select at least one Hushh Fund unit before payment" }, 400, corsHeaders);
    }

    if (firstPaymentCents > commitmentCents) {
      return json({ error: "First payment cannot exceed the fund commitment" }, 400, corsHeaders);
    }

    const { data: financialData } = await supabase
      .from("user_financial_data")
      .select("status, plaid_item_id")
      .eq("user_id", userId)
      .maybeSingle();

    const recurringSelected = Number(onboarding.recurring_amount || 0) > 0;
    const riskFlags = buildRiskFlags({
      firstPaymentCents,
      commitmentCents,
      hasPlaidData: Boolean(financialData?.status === "complete" || financialData?.plaid_item_id),
      financialLinkStatus: onboarding.financial_link_status,
      recurringSelected,
    });

    // Idempotency: if user already has an active (non-expired, non-paid) request
    // with the same first payment amount, return it instead of creating a duplicate.
    // If amount differs, supersede the old one and create a new request.
    const nowIso = new Date().toISOString();
    const { data: existingRequests } = await supabase
      .from("fund_stripe_payment_requests")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["payment_link_sent", "checkout_created"])
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(5);

    const firstPaymentDecimal = centsToDecimal(firstPaymentCents);
    const matchingActive = (existingRequests || []).find(
      (r) => Number(r.first_payment_amount) === Number(firstPaymentDecimal),
    );

    if (matchingActive) {
      return json({
        success: true,
        reused: true,
        payment_request_id: matchingActive.id,
        request_reference: matchingActive.request_reference,
        payment_url: matchingActive.payment_url,
        expires_at: matchingActive.expires_at,
        status: matchingActive.status,
        manual_verification_status: "not_started",
        recurring_selected: Boolean(matchingActive.recurring_selected),
        risk_flags: matchingActive.risk_flags || [],
        email_sent: true,
        email_delivery: { user: { reused: true }, team: { reused: true } },
      }, 200, corsHeaders);
    }

    if (existingRequests && existingRequests.length > 0) {
      await supabase
        .from("fund_stripe_payment_requests")
        .update({ status: "cancelled", updated_at: nowIso })
        .in("id", existingRequests.map((r) => r.id));
    }

    const token = createRequestToken();
    const requestTokenHash = await sha256Hex(token);
    const requestReference = createRequestReference();
    const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
    const paymentUrl = buildPaymentRequestUrl(req, token);

    const planPayload = {
      user_id: userId,
      onboarding_data_id: onboarding.id,
      selected_fund: onboarding.selected_fund || "hushh_fund_a",
      class_a_units: Number(onboarding.class_a_units || 0),
      class_b_units: Number(onboarding.class_b_units || 0),
      class_c_units: Number(onboarding.class_c_units || 0),
      commitment_amount: centsToDecimal(commitmentCents),
      first_payment_amount: centsToDecimal(firstPaymentCents),
      initial_transfer_amount: null,
      paid_amount: 0,
      remaining_commitment_amount: centsToDecimal(commitmentCents),
      recurring_enabled: recurringSelected,
      recurring_amount: onboarding.recurring_amount || null,
      recurring_frequency: onboarding.recurring_frequency || null,
      recurring_day_of_month: onboarding.recurring_day_of_month || null,
      stripe_payment_status: "payment_link_sent",
      investor_verification_status: "not_started",
      plaid_verification_status: financialData?.status || onboarding.financial_link_status || "unknown",
      risk_flags: riskFlags,
      status: "draft",
    };

    const { data: plan, error: planError } = await supabase
      .from("fund_investment_plans")
      .insert(planPayload)
      .select("*")
      .single();
    if (planError) throw planError;

    const requestPayload = {
      user_id: userId,
      plan_id: plan.id,
      request_token_hash: requestTokenHash,
      request_reference: requestReference,
      selected_fund: plan.selected_fund,
      class_a_units: plan.class_a_units,
      class_b_units: plan.class_b_units,
      class_c_units: plan.class_c_units,
      commitment_amount: plan.commitment_amount,
      first_payment_amount: centsToDecimal(firstPaymentCents),
      currency: "usd",
      recurring_selected: recurringSelected,
      recurring_amount: onboarding.recurring_amount || null,
      recurring_frequency: onboarding.recurring_frequency || null,
      recurring_day_of_month: onboarding.recurring_day_of_month || null,
      status: "payment_link_sent",
      payment_url: paymentUrl,
      expires_at: expiresAt.toISOString(),
      risk_flags: riskFlags,
      plaid_match_confidence: financialData?.status === "complete" ? 0.35 : 0,
      plaid_match_details: {
        note: "Stripe is payment truth; Plaid is verification and risk truth. Bank-to-card source is confidence only.",
        financial_link_status: onboarding.financial_link_status || null,
        financial_data_status: financialData?.status || null,
      },
    };

    const { data: paymentRequest, error: requestError } = await supabase
      .from("fund_stripe_payment_requests")
      .insert(requestPayload)
      .select("*")
      .single();
    if (requestError) throw requestError;

    // Note: do NOT flip is_completed here. Onboarding is only "complete" once
    // Stripe webhook confirms the payment landed. Marking is_completed at link
    // creation lets users bypass the investor access gate.
    // See plan §4 (Investor Access Gate).
    await supabase
      .from("onboarding_data")
      .update({
        fund_payment_status: "payment_link_sent",
        fund_investor_verification_status: "not_started",
        fund_payment_request_id: paymentRequest.id,
        current_step: 13,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    const displayName = getDisplayName(auth.user, onboarding);
    const emailData = {
      recipientName: displayName,
      userEmail: auth.user.email || null,
      userId,
      paymentUrl,
      requestReference,
      selectedFund: paymentRequest.selected_fund,
      classAUnits: Number(paymentRequest.class_a_units || 0),
      classBUnits: Number(paymentRequest.class_b_units || 0),
      classCUnits: Number(paymentRequest.class_c_units || 0),
      commitmentLabel: formatUsdCents(commitmentCents),
      firstPaymentLabel: formatUsdCents(firstPaymentCents),
      remainingCommitmentLabel: formatUsdCents(commitmentCents - firstPaymentCents),
      recurringSummary: normalizeRecurringSummary(onboarding),
      plaidStatus: financialData?.status || onboarding.financial_link_status || "not available",
      kycStatus: "in review",
      expiresAtLabel: formatDateTime(expiresAt),
      paymentStatus: "payment_link_sent",
      reviewStatus: "not_started",
    };

    const emailResults: Record<string, any> = {};
    let userEmailSent = false;
    let userEmailReason: string | null = null;
    if (auth.user.email) {
      const userResult = await logAndSendFundEmail({
        supabase,
        userId,
        paymentRequestId: paymentRequest.id,
        notificationType: "payment_link_user",
        recipients: [auth.user.email],
        subject: `Hushh Fund payment link ${requestReference}`,
        html: buildFundPaymentRequestUserHtml(emailData),
      });
      emailResults.user = userResult;
      userEmailSent = Boolean(userResult && (userResult as any).success);
      if (!userEmailSent) {
        userEmailReason = (userResult as any)?.error || "Email delivery failed";
      }
    } else {
      await supabase.from("fund_payment_notifications").insert({
        user_id: userId,
        payment_request_id: paymentRequest.id,
        notification_type: "payment_link_user",
        recipient_email: "missing",
        subject: `Hushh Fund payment link ${requestReference}`,
        status: "skipped",
        error_message: "User account has no email address",
      });
      emailResults.user = { success: false, skipped: true };
      userEmailReason = "no_email_on_account";
    }

    emailResults.team = await logAndSendFundEmail({
      supabase,
      userId,
      paymentRequestId: paymentRequest.id,
      notificationType: "payment_link_team",
      recipients: FUND_TEAM_RECIPIENTS,
      subject: `[Hushh Fund] Payment link created ${requestReference}`,
      html: buildFundPaymentRequestTeamHtml(emailData),
    });

    return json({
      success: true,
      reused: false,
      payment_request_id: paymentRequest.id,
      request_reference: requestReference,
      payment_url: paymentUrl,
      expires_at: expiresAt.toISOString(),
      status: "payment_link_sent",
      manual_verification_status: "not_started",
      recurring_selected: recurringSelected,
      risk_flags: riskFlags,
      email_sent: userEmailSent,
      email_failure_reason: userEmailSent ? null : userEmailReason,
      email_delivery: emailResults,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-request-create] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
