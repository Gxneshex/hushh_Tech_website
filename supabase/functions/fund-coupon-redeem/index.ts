/**
 * fund-coupon-redeem
 *
 * Lets an investor finish onboarding with a coupon code (e.g. `ilovehushh`)
 * INSTEAD of paying the $1 via Stripe. The outcome is identical to a successful
 * $1 payment: onboarding is marked complete, the investor enters manual review,
 * 300,000 Hushh Coins are granted, and Meet-the-CEO is unlocked.
 *
 * Security: a coupon grants free fund completion + coins + investor access, so it
 * is validated and applied entirely server-side with the service-role key. The
 * browser is never trusted to self-grant (same rule as "the browser cannot mark
 * payment successful — Stripe webhook does").
 *
 * This replicates every NON-Stripe write of `markPaymentSucceeded()` in
 * fund-stripe-webhook (plan + request rows created already paid, payment row,
 * onboarding flip, coin grant, review row, emails). Stripe-specific work
 * (fund_stripe_events dedup, PaymentIntent/charge retrieval) is skipped.
 */
import {
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
  PAYMENT_LINK_TTL_DAYS,
  requireAuthenticatedUser,
  sha256Hex,
} from "../_shared/fundStripe.ts";
import {
  buildFundPaymentRequestTeamHtml,
  buildFundPaymentRequestUserHtml,
} from "../fund-payment-request/template.ts";

const DEFAULT_COUPON_CODES = ["ilovehushh"];

/**
 * Allowed coupon codes come from the FUND_PAYMENT_COUPON_CODES secret
 * (comma-separated). Falls back to the default so the feature works before the
 * secret is set. Comparison is case-insensitive and trimmed.
 */
function getAllowedCouponCodes(): string[] {
  const raw = Deno.env.get("FUND_PAYMENT_COUPON_CODES");
  if (!raw) return DEFAULT_COUPON_CODES;
  const list = raw
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_COUPON_CODES;
}

// Mirror of grantMeetCeoPerk() in fund-stripe-webhook, but attributed to the
// coupon. Idempotent on the user_id-unique ceo_meeting_payments row: an existing
// 'completed' row (a prior $1 payment or coupon) is preserved so coins are never
// double-granted.
async function grantMeetCeoPerk(supabase: any, userId: string, couponCode: string) {
  try {
    const { data: existing } = await supabase
      .from("ceo_meeting_payments")
      .select("payment_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.payment_status === "completed") return;
    await supabase.from("ceo_meeting_payments").upsert({
      user_id: userId,
      payment_status: "completed",
      payment_method: "coupon",
      coupon_code: couponCode,
      amount_cents: 0,
      hushh_coins_awarded: 300000,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch (err) {
    console.warn("[fund-coupon-redeem] grantMeetCeoPerk failed (non-blocking):", err);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const rawCoupon = String(body.couponCode ?? body.coupon_code ?? "").trim();

    if (!userId) {
      return json({ error: "userId is required" }, 400, corsHeaders);
    }
    if (!rawCoupon) {
      return json({ error: "Enter a coupon code" }, 400, corsHeaders);
    }

    const couponCode = rawCoupon.toLowerCase();
    if (!getAllowedCouponCodes().includes(couponCode)) {
      return json({ error: "Invalid coupon code", code: "INVALID_COUPON" }, 400, corsHeaders);
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
        financial_link_status, fund_payment_status
      `)
      .eq("user_id", userId)
      .maybeSingle();

    if (onboardingError) throw onboardingError;
    if (!onboarding) {
      return json({ error: "Onboarding data is required before redeeming a coupon" }, 400, corsHeaders);
    }

    const commitmentCents = computeCommitmentCents(onboarding);
    if (commitmentCents <= 0) {
      return json({ error: "Select at least one Hushh Fund unit before applying a coupon" }, 400, corsHeaders);
    }

    // Idempotency: never create duplicate rows or double-grant coins. If the user
    // already paid (via $1 or a prior coupon), short-circuit. Coins are already
    // granted; re-call the idempotent grant defensively then return.
    const { data: existingPaid } = await supabase
      .from("fund_stripe_payment_requests")
      .select("id, request_reference, status")
      .eq("user_id", userId)
      .in("status", ["paid", "pending_manual_verification", "verified_investor"])
      .order("created_at", { ascending: false })
      .limit(1);

    if ((existingPaid && existingPaid.length > 0) || onboarding.fund_payment_status === "paid") {
      await grantMeetCeoPerk(supabase, userId, couponCode);
      return json({
        success: true,
        already_redeemed: true,
        status: "paid",
        request_reference: existingPaid?.[0]?.request_reference || null,
        coins_awarded: 300000,
      }, 200, corsHeaders);
    }

    const { data: financialData } = await supabase
      .from("user_financial_data")
      .select("status, plaid_item_id")
      .eq("user_id", userId)
      .maybeSingle();

    // Coupon waives the money but records a nominal $1 first payment so the
    // ledger/admin views look exactly like a $1 payer.
    const firstPaymentCents = MIN_FIRST_PAYMENT_CENTS;
    const firstPaymentDecimal = centsToDecimal(firstPaymentCents);
    const commitmentDecimal = centsToDecimal(commitmentCents);
    const remainingDecimal = Math.max(0, commitmentDecimal - firstPaymentDecimal);

    const recurringSelected = Number(onboarding.recurring_amount || 0) > 0;
    const riskFlags = [
      ...buildRiskFlags({
        firstPaymentCents,
        commitmentCents,
        hasPlaidData: Boolean(financialData?.status === "complete" || financialData?.plaid_item_id),
        financialLinkStatus: onboarding.financial_link_status,
        recurringSelected,
      }),
      "coupon_redemption",
      `coupon:${couponCode}`,
    ];

    const token = createRequestToken();
    const requestTokenHash = await sha256Hex(token);
    const requestReference = createRequestReference();
    const expiresAt = new Date(Date.now() + PAYMENT_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);
    const paidAt = new Date().toISOString();

    // 1) Investment plan — created directly in the paid state (mirrors the
    //    request-create payload + the webhook's post-payment plan update).
    const planPayload = {
      user_id: userId,
      onboarding_data_id: onboarding.id,
      selected_fund: onboarding.selected_fund || "hushh_fund_a",
      class_a_units: Number(onboarding.class_a_units || 0),
      class_b_units: Number(onboarding.class_b_units || 0),
      class_c_units: Number(onboarding.class_c_units || 0),
      commitment_amount: commitmentDecimal,
      first_payment_amount: firstPaymentDecimal,
      initial_transfer_amount: null,
      paid_amount: firstPaymentDecimal,
      remaining_commitment_amount: remainingDecimal,
      recurring_enabled: recurringSelected,
      recurring_amount: onboarding.recurring_amount || null,
      recurring_frequency: onboarding.recurring_frequency || null,
      recurring_day_of_month: onboarding.recurring_day_of_month || null,
      stripe_payment_status: "paid",
      investor_verification_status: "pending_manual_verification",
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

    // 2) Payment request — created directly as pending_manual_verification (no
    //    payment link / Stripe session involved).
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
      first_payment_amount: firstPaymentDecimal,
      currency: "usd",
      recurring_selected: recurringSelected,
      recurring_amount: onboarding.recurring_amount || null,
      recurring_frequency: onboarding.recurring_frequency || null,
      recurring_day_of_month: onboarding.recurring_day_of_month || null,
      status: "pending_manual_verification",
      payment_url: null,
      expires_at: expiresAt.toISOString(),
      paid_at: paidAt,
      risk_flags: riskFlags,
      plaid_match_confidence: financialData?.status === "complete" ? 0.35 : 0,
      plaid_match_details: {
        note: "Coupon redemption — no Stripe charge. Plaid remains verification and risk truth.",
        coupon_code: couponCode,
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

    // 3) Payment row — Stripe columns left null; records the waived $1.
    const { data: payment, error: paymentError } = await supabase
      .from("fund_stripe_payments")
      .insert({
        user_id: userId,
        payment_request_id: paymentRequest.id,
        plan_id: plan.id,
        amount_cents: firstPaymentCents,
        currency: "usd",
        payment_kind: "initial_commitment",
        status: "succeeded",
        paid_at: paidAt,
      })
      .select("id")
      .maybeSingle();
    if (paymentError) throw paymentError;

    // 4) Flip onboarding to complete + in-review (the access gate reads this).
    //    NOTE: fund_payment_status CHECK forbids 'pending_manual_verification',
    //    so we write 'paid' here — exactly what the Stripe webhook writes.
    await supabase
      .from("onboarding_data")
      .update({
        fund_payment_status: "paid",
        fund_investor_verification_status: "pending_manual_verification",
        is_completed: true,
        completed_at: paidAt,
        fund_payment_request_id: paymentRequest.id,
        current_step: 13,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // 5) Grant 300k Hushh Coins + Meet-CEO perk (idempotent).
    await grantMeetCeoPerk(supabase, userId, couponCode);

    // 6) Manual review row (one per payment request).
    const reviewPayload = {
      user_id: userId,
      payment_request_id: paymentRequest.id,
      plan_id: plan.id,
      status: "pending_manual_verification",
      flags: riskFlags,
      notes: `Coupon redemption (${couponCode}). No Stripe charge. Manual investor review required before unlock.`,
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

    // 7) Notify the user + team (non-blocking — never fail the redemption on email).
    try {
      const emailData = {
        recipientName: getDisplayName(auth.user, onboarding),
        userEmail: auth.user.email || null,
        userId,
        requestReference,
        selectedFund: paymentRequest.selected_fund,
        classAUnits: Number(paymentRequest.class_a_units || 0),
        classBUnits: Number(paymentRequest.class_b_units || 0),
        classCUnits: Number(paymentRequest.class_c_units || 0),
        commitmentLabel: formatUsdCents(commitmentCents),
        firstPaymentLabel: `${formatUsdCents(firstPaymentCents)} (waived — coupon ${couponCode})`,
        remainingCommitmentLabel: formatUsdCents(Math.max(0, commitmentCents - firstPaymentCents)),
        recurringSummary: normalizeRecurringSummary(onboarding),
        plaidStatus: financialData?.status || onboarding.financial_link_status || "not available",
        kycStatus: "manual review",
        expiresAtLabel: formatDateTime(expiresAt),
        paymentStatus: "paid",
        reviewStatus: "pending_manual_verification",
      };

      if (auth.user.email) {
        await logAndSendFundEmail({
          supabase,
          userId,
          paymentRequestId: paymentRequest.id,
          paymentId: payment?.id || null,
          notificationType: "coupon_redeemed_user",
          recipients: [auth.user.email],
          subject: `Hushh Fund coupon applied ${requestReference}`,
          html: buildFundPaymentRequestUserHtml(emailData),
        });
      }
      await logAndSendFundEmail({
        supabase,
        userId,
        paymentRequestId: paymentRequest.id,
        paymentId: payment?.id || null,
        notificationType: "coupon_redeemed_team",
        recipients: FUND_TEAM_RECIPIENTS,
        subject: `[Hushh Fund] Coupon redeemed (${couponCode}) ${requestReference}`,
        html: buildFundPaymentRequestTeamHtml(emailData),
      });
    } catch (emailErr) {
      console.warn("[fund-coupon-redeem] Email notification failed (non-blocking):", emailErr);
    }

    return json({
      success: true,
      already_redeemed: false,
      payment_request_id: paymentRequest.id,
      request_reference: requestReference,
      status: "paid",
      manual_verification_status: "pending_manual_verification",
      coins_awarded: 300000,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-coupon-redeem] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
