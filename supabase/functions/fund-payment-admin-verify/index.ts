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
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
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
    // Team-gated via Supabase JWT + fund-admin allowlist — the SAME auth as the
    // read endpoints. The reviewer identity comes from the authenticated token,
    // NEVER the request body, so fund_payment_reviews.reviewed_by is trustworthy.
    const teamAuth = await authenticateTeamMember(req);
    if (teamAuth.error || !teamAuth.user) {
      return json({ error: teamAuth.error || "Unauthorized" }, teamAuth.status || 401, corsHeaders);
    }
    const reviewerUserId = teamAuth.user.id;
    const reviewerEmail = teamAuth.user.email;

    const body = await req.json().catch(() => ({}));
    const paymentRequestId = body.paymentRequestId || body.payment_request_id;
    const decision = String(body.decision || "").trim();
    const notes = body.notes ? String(body.notes) : null;

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

    // Idempotency: a request already in a terminal state must not be re-decided
    // (prevents duplicate investor/team emails + duplicate subscription rows).
    // Return 200 with already_reviewed so the SPA shows its existing banner.
    if (["verified_investor", "rejected"].includes(paymentRequest.status)) {
      return json({
        success: true,
        already_reviewed: true,
        payment_request_id: paymentRequest.id,
        investor_verification_status: paymentRequest.status,
        message: `This investor was already ${
          paymentRequest.status === "verified_investor" ? "approved" : "rejected"
        }.`,
      }, 200, corsHeaders);
    }

    if (decision === "verified_investor" && !paymentRequest.paid_at) {
      return json({ error: "Stripe payment must be confirmed before investor approval" }, 409, corsHeaders);
    }

    // P2 KYC gate: surface KYC risk before approval. If the investor has no KYC
    // attestation, or it is HIGH risk / not active, require an explicit
    // acknowledgement so the approval is a conscious, audited decision.
    if (decision === "verified_investor") {
      const { data: kyc } = await supabase
        .from("kyc_attestations")
        .select("status, risk_band")
        .eq("user_id", paymentRequest.user_id)
        .order("verified_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const band = String(kyc?.risk_band || "").toUpperCase();
      const kycStatus = String(kyc?.status || "").toLowerCase();
      const kycRisky = !kyc || band === "HIGH" || (kycStatus !== "" && kycStatus !== "active");
      const acknowledged = body.acknowledgeKycRisk === true || body.acknowledge_kyc_risk === true;
      if (kycRisky && !acknowledged) {
        return json({
          error: "KYC review needed before approval.",
          code: "KYC_RISK_UNACKNOWLEDGED",
          kyc: { present: Boolean(kyc), status: kyc?.status ?? null, riskBand: kyc?.risk_band ?? null },
        }, 409, corsHeaders);
      }
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

    // Compliance trail: who decided what (best-effort, never blocks).
    await logAdminAccess({
      supabase,
      actorUserId: reviewerUserId,
      actorEmail: reviewerEmail,
      action: decision === "verified_investor" ? "approve" : "reject",
      targetUserId: paymentRequest.user_id,
      targetReference: paymentRequest.id,
      metadata: { request_reference: paymentRequest.request_reference, notes },
      req,
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
