import {
  createAdminClient,
  formatDateTime,
  formatUsdCents,
  FUND_TEAM_RECIPIENTS,
  getCorsHeaders,
  getDisplayName,
  json,
  logAndSendFundEmail,
  normalizeRecurringSummary,
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
    const adminToken = Deno.env.get("HUSHH_FUND_ADMIN_TOKEN");
    if (!adminToken) {
      return json({ error: "Admin verification is not configured" }, 503, corsHeaders);
    }
    if (req.headers.get("x-hushh-admin-token") !== adminToken) {
      return json({ error: "Unauthorized" }, 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const paymentRequestId = body.paymentRequestId || body.payment_request_id;
    const decision = String(body.decision || "").trim();
    const notes = body.notes ? String(body.notes) : null;
    const reviewerUserId = body.reviewerUserId || body.reviewer_user_id || null;

    if (!paymentRequestId) {
      return json({ error: "paymentRequestId is required" }, 400, corsHeaders);
    }
    if (!["verified_investor", "rejected"].includes(decision)) {
      return json({ error: "decision must be verified_investor or rejected" }, 400, corsHeaders);
    }

    const supabase = createAdminClient();
    const { data: paymentRequest, error: requestError } = await supabase
      .from("fund_stripe_payment_requests")
      .select("*")
      .eq("id", paymentRequestId)
      .maybeSingle();
    if (requestError) throw requestError;
    if (!paymentRequest) {
      return json({ error: "Payment request not found" }, 404, corsHeaders);
    }

    if (decision === "verified_investor" && !paymentRequest.paid_at) {
      return json({ error: "Stripe payment must be confirmed before investor approval" }, 409, corsHeaders);
    }

    const now = new Date().toISOString();
    const reviewPayload = {
      user_id: paymentRequest.user_id,
      payment_request_id: paymentRequest.id,
      plan_id: paymentRequest.plan_id,
      status: decision,
      flags: paymentRequest.risk_flags || [],
      notes,
      reviewed_by: reviewerUserId,
      reviewed_at: now,
    };

    const { data: existingReview } = await supabase
      .from("fund_payment_reviews")
      .select("id")
      .eq("payment_request_id", paymentRequest.id)
      .maybeSingle();
    if (existingReview?.id) {
      await supabase.from("fund_payment_reviews").update(reviewPayload).eq("id", existingReview.id);
    } else {
      await supabase.from("fund_payment_reviews").insert(reviewPayload);
    }

    await supabase
      .from("fund_stripe_payment_requests")
      .update({
        status: decision,
        verified_at: decision === "verified_investor" ? now : null,
        rejected_at: decision === "rejected" ? now : null,
        reviewer_user_id: reviewerUserId,
        reviewer_note: notes,
      })
      .eq("id", paymentRequest.id);

    await supabase
      .from("fund_investment_plans")
      .update({
        investor_verification_status: decision,
        manual_verified_at: decision === "verified_investor" ? now : null,
        manual_verified_by: reviewerUserId,
        manual_verification_notes: notes,
      })
      .eq("id", paymentRequest.plan_id);

    await supabase
      .from("onboarding_data")
      .update({
        fund_investor_verification_status: decision,
        updated_at: now,
      })
      .eq("user_id", paymentRequest.user_id);

    if (decision === "verified_investor" && paymentRequest.recurring_selected) {
      await supabase.from("fund_stripe_subscriptions").insert({
        user_id: paymentRequest.user_id,
        payment_request_id: paymentRequest.id,
        plan_id: paymentRequest.plan_id,
        status: "pending_setup",
        recurring_amount: paymentRequest.recurring_amount,
        recurring_frequency: paymentRequest.recurring_frequency,
        recurring_day_of_month: paymentRequest.recurring_day_of_month,
        raw_subscription: {
          note: "Recurring selected. Stripe subscription setup requires the follow-up verified investor flow.",
        },
      });
    }

    const { data: onboarding } = await supabase
      .from("onboarding_data")
      .select("legal_first_name, legal_last_name, recurring_amount, recurring_frequency, recurring_day_of_month, financial_link_status")
      .eq("user_id", paymentRequest.user_id)
      .maybeSingle();
    const { data: authUser } = await supabase.auth.admin.getUserById(paymentRequest.user_id);
    const commitmentCents = Math.round(Number(paymentRequest.commitment_amount || 0) * 100);
    const firstPaymentCents = Math.round(Number(paymentRequest.first_payment_amount || 0) * 100);
    const emailData = {
      recipientName: getDisplayName(authUser?.user, onboarding),
      userEmail: authUser?.user?.email || null,
      userId: paymentRequest.user_id,
      requestReference: paymentRequest.request_reference,
      selectedFund: paymentRequest.selected_fund,
      classAUnits: Number(paymentRequest.class_a_units || 0),
      classBUnits: Number(paymentRequest.class_b_units || 0),
      classCUnits: Number(paymentRequest.class_c_units || 0),
      commitmentLabel: formatUsdCents(commitmentCents),
      firstPaymentLabel: formatUsdCents(firstPaymentCents),
      remainingCommitmentLabel: formatUsdCents(Math.max(0, commitmentCents - firstPaymentCents)),
      recurringSummary: normalizeRecurringSummary(onboarding || paymentRequest),
      plaidStatus: onboarding?.financial_link_status || "not available",
      kycStatus: decision === "verified_investor" ? "approved" : "rejected",
      expiresAtLabel: paymentRequest.expires_at ? formatDateTime(paymentRequest.expires_at) : null,
      paymentStatus: paymentRequest.status,
      reviewStatus: decision,
    };

    if (authUser?.user?.email) {
      await logAndSendFundEmail({
        supabase,
        userId: paymentRequest.user_id,
        paymentRequestId: paymentRequest.id,
        notificationType: `manual_review_${decision}_user`,
        recipients: [authUser.user.email],
        subject: decision === "verified_investor"
          ? `Hushh Fund investor status approved ${paymentRequest.request_reference}`
          : `Hushh Fund investor review update ${paymentRequest.request_reference}`,
        html: buildFundPaymentRequestUserHtml(emailData),
      });
    }

    await logAndSendFundEmail({
      supabase,
      userId: paymentRequest.user_id,
      paymentRequestId: paymentRequest.id,
      notificationType: `manual_review_${decision}_team`,
      recipients: FUND_TEAM_RECIPIENTS,
      subject: `[Hushh Fund] Manual review ${decision} ${paymentRequest.request_reference}`,
      html: buildFundPaymentRequestTeamHtml(emailData),
    });

    return json({
      success: true,
      payment_request_id: paymentRequest.id,
      investor_verification_status: decision,
      recurring_setup_status: decision === "verified_investor" && paymentRequest.recurring_selected
        ? "pending_setup"
        : "not_applicable",
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-verify] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
