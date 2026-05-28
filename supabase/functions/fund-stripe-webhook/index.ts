import {
  centsToDecimal,
  createAdminClient,
  formatDateTime,
  formatUsdCents,
  FUND_TEAM_RECIPIENTS,
  getCorsHeaders,
  getDisplayName,
  getStripeClient,
  getStripeWebhookCryptoProvider,
  json,
  logAndSendFundEmail,
  normalizeRecurringSummary,
} from "../_shared/fundStripe.ts";
import {
  buildFundPaymentRequestTeamHtml,
  buildFundPaymentRequestUserHtml,
} from "../fund-payment-request/template.ts";

function isLocalSupabaseHost(): boolean {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  try {
    const host = new URL(supabaseUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
  } catch {
    return false;
  }
}

async function markEventDeferred(
  supabase: any,
  stripeEventId: string,
  reason: string,
): Promise<void> {
  try {
    await supabase
      .from("fund_stripe_events")
      .update({ processing_status: "deferred", defer_reason: reason })
      .eq("stripe_event_id", stripeEventId);
  } catch (err) {
    console.warn("[fund-stripe-webhook] Failed to mark event deferred", { err, stripeEventId });
  }
}

async function replayDeferredEventsForPayment(
  supabase: any,
  paymentIntentId: string | null,
): Promise<void> {
  if (!paymentIntentId) return;

  const { data: deferred } = await supabase
    .from("fund_stripe_events")
    .select("id, stripe_event_id, event_type, payload")
    .eq("processing_status", "deferred")
    .order("created_at", { ascending: true });

  if (!deferred || deferred.length === 0) return;

  for (const row of deferred) {
    const eventPaymentIntentId =
      row.payload?.data?.object?.payment_intent &&
      (typeof row.payload.data.object.payment_intent === "string"
        ? row.payload.data.object.payment_intent
        : row.payload.data.object.payment_intent.id);

    if (eventPaymentIntentId !== paymentIntentId) continue;

    const { data: payment } = await supabase
      .from("fund_stripe_payments")
      .select("id, user_id, payment_request_id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();
    if (!payment) continue;

    const nextStatus = row.event_type === "charge.refunded" ? "refunded" : "disputed";
    await supabase
      .from("fund_stripe_payments")
      .update({
        status: nextStatus,
        refunded_at: nextStatus === "refunded" ? new Date().toISOString() : null,
        disputed_at: nextStatus === "disputed" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);
    await supabase
      .from("fund_stripe_payment_requests")
      .update({ status: nextStatus })
      .eq("id", payment.payment_request_id);
    await supabase
      .from("onboarding_data")
      .update({ fund_payment_status: nextStatus, updated_at: new Date().toISOString() })
      .eq("user_id", payment.user_id);
    await supabase
      .from("fund_stripe_events")
      .update({ processing_status: "replayed", replayed_at: new Date().toISOString() })
      .eq("id", row.id);
    console.log("[fund-stripe-webhook] Replayed deferred event", {
      eventType: row.event_type,
      stripeEventId: row.stripe_event_id,
    });
  }
}

function isDuplicateError(error: any): boolean {
  return error?.code === "23505" || String(error?.message || "").includes("duplicate key");
}

function getObjectId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) return String((value as any).id);
  return null;
}

function getChargeSnapshot(charge: any) {
  const card = charge?.payment_method_details?.card || {};
  return {
    chargeId: charge?.id || null,
    riskLevel: charge?.outcome?.risk_level || null,
    riskScore: charge?.outcome?.risk_score ?? null,
    outcome: charge?.outcome || null,
    brand: card.brand || null,
    last4: card.last4 || null,
    country: card.country || null,
  };
}

async function fetchRequestContext(supabase: any, requestId: string) {
  const { data: paymentRequest, error: requestError } = await supabase
    .from("fund_stripe_payment_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (requestError) throw requestError;
  if (!paymentRequest) throw new Error("Payment request not found");

  const { data: onboarding } = await supabase
    .from("onboarding_data")
    .select("legal_first_name, legal_last_name, recurring_amount, recurring_frequency, recurring_day_of_month, financial_link_status")
    .eq("user_id", paymentRequest.user_id)
    .maybeSingle();

  const { data: authUser } = await supabase.auth.admin.getUserById(paymentRequest.user_id);
  return { paymentRequest, onboarding, user: authUser?.user || null };
}

async function sendPaymentConfirmedEmails(supabase: any, params: {
  paymentRequest: any;
  onboarding: any;
  user: any;
  paymentId?: string | null;
  amountCents: number;
}) {
  const displayName = getDisplayName(params.user, params.onboarding);
  const commitmentCents = Math.round(Number(params.paymentRequest.commitment_amount || 0) * 100);
  const emailData = {
    recipientName: displayName,
    userEmail: params.user?.email || null,
    userId: params.paymentRequest.user_id,
    requestReference: params.paymentRequest.request_reference,
    selectedFund: params.paymentRequest.selected_fund,
    classAUnits: Number(params.paymentRequest.class_a_units || 0),
    classBUnits: Number(params.paymentRequest.class_b_units || 0),
    classCUnits: Number(params.paymentRequest.class_c_units || 0),
    commitmentLabel: formatUsdCents(commitmentCents),
    firstPaymentLabel: formatUsdCents(params.amountCents),
    remainingCommitmentLabel: formatUsdCents(Math.max(0, commitmentCents - params.amountCents)),
    recurringSummary: normalizeRecurringSummary(params.onboarding || params.paymentRequest),
    plaidStatus: params.onboarding?.financial_link_status || "not available",
    kycStatus: "manual review",
    expiresAtLabel: params.paymentRequest.expires_at ? formatDateTime(params.paymentRequest.expires_at) : null,
    stripeSessionId: params.paymentRequest.stripe_checkout_session_id || null,
    paymentStatus: "paid",
    reviewStatus: "pending_manual_verification",
  };

  if (params.user?.email) {
    await logAndSendFundEmail({
      supabase,
      userId: params.paymentRequest.user_id,
      paymentRequestId: params.paymentRequest.id,
      paymentId: params.paymentId || null,
      notificationType: "payment_confirmed_user",
      recipients: [params.user.email],
      subject: `Hushh Fund payment received ${params.paymentRequest.request_reference}`,
      html: buildFundPaymentRequestUserHtml(emailData),
    });
  }

  await logAndSendFundEmail({
    supabase,
    userId: params.paymentRequest.user_id,
    paymentRequestId: params.paymentRequest.id,
    paymentId: params.paymentId || null,
    notificationType: "payment_confirmed_team",
    recipients: FUND_TEAM_RECIPIENTS,
    subject: `[Hushh Fund] Payment received ${params.paymentRequest.request_reference}`,
    html: buildFundPaymentRequestTeamHtml(emailData),
  });
}

async function markPaymentSucceeded(supabase: any, stripe: any, params: {
  requestId: string;
  sessionId?: string | null;
  paymentIntentId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
}) {
  const { paymentRequest, onboarding, user } = await fetchRequestContext(supabase, params.requestId);
  let paymentIntent: any = null;
  let charge: any = null;

  if (params.paymentIntentId) {
    paymentIntent = await stripe.paymentIntents.retrieve(params.paymentIntentId, {
      expand: ["latest_charge"],
    });
    charge = typeof paymentIntent.latest_charge === "object" ? paymentIntent.latest_charge : null;
  }

  const chargeSnapshot = getChargeSnapshot(charge);
  const amountCents = params.amountCents || paymentIntent?.amount_received || Math.round(Number(paymentRequest.first_payment_amount || 0) * 100);
  const paidAt = new Date().toISOString();

  const { data: payment, error: paymentError } = await supabase
    .from("fund_stripe_payments")
    .upsert({
      user_id: paymentRequest.user_id,
      payment_request_id: paymentRequest.id,
      plan_id: paymentRequest.plan_id,
      stripe_checkout_session_id: params.sessionId || paymentRequest.stripe_checkout_session_id || null,
      stripe_payment_intent_id: params.paymentIntentId || null,
      stripe_charge_id: chargeSnapshot.chargeId,
      amount_cents: amountCents,
      currency: params.currency || paymentRequest.currency || "usd",
      payment_kind: "initial_commitment",
      status: "succeeded",
      stripe_risk_level: chargeSnapshot.riskLevel,
      stripe_risk_score: chargeSnapshot.riskScore,
      stripe_outcome: chargeSnapshot.outcome,
      payment_method_brand: chargeSnapshot.brand,
      payment_method_last4: chargeSnapshot.last4,
      payment_method_country: chargeSnapshot.country,
      raw_payment_intent: paymentIntent,
      raw_charge: charge,
      paid_at: paidAt,
    }, { onConflict: "stripe_payment_intent_id,payment_kind" })
    .select("id")
    .maybeSingle();
  if (paymentError) throw paymentError;

  const paidAmount = Number(paymentRequest.first_payment_amount || centsToDecimal(amountCents));
  const commitment = Number(paymentRequest.commitment_amount || 0);
  const remaining = Math.max(0, commitment - paidAmount);
  const riskFlags = Array.isArray(paymentRequest.risk_flags) ? [...paymentRequest.risk_flags] : [];
  if (chargeSnapshot.riskLevel && chargeSnapshot.riskLevel !== "normal") {
    riskFlags.push(`stripe_radar_${chargeSnapshot.riskLevel}`);
  }

  await supabase
    .from("fund_stripe_payment_requests")
    .update({
      status: "pending_manual_verification",
      latest_stripe_payment_intent_id: params.paymentIntentId || null,
      latest_stripe_charge_id: chargeSnapshot.chargeId,
      latest_stripe_customer_id: paymentIntent?.customer || paymentRequest.latest_stripe_customer_id || null,
      paid_at: paidAt,
      risk_flags: [...new Set(riskFlags)],
    })
    .eq("id", paymentRequest.id);

  await supabase
    .from("fund_investment_plans")
    .update({
      paid_amount: paidAmount,
      remaining_commitment_amount: remaining,
      stripe_payment_status: "paid",
      investor_verification_status: "pending_manual_verification",
      risk_flags: [...new Set(riskFlags)],
    })
    .eq("id", paymentRequest.plan_id);

  // Payment confirmed by Stripe is the only legitimate signal to flip
  // onboarding_data.is_completed. Prior to the Investor Access Gate the flip
  // happened at link-creation time, which let users bypass the Stripe gate.
  await supabase
    .from("onboarding_data")
    .update({
      fund_payment_status: "paid",
      fund_investor_verification_status: "pending_manual_verification",
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", paymentRequest.user_id);

  const reviewPayload = {
    user_id: paymentRequest.user_id,
    payment_request_id: paymentRequest.id,
    plan_id: paymentRequest.plan_id,
    status: "pending_manual_verification",
    flags: [...new Set(riskFlags)],
    notes: "Stripe webhook confirmed payment. Manual investor review required before unlock.",
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

  await sendPaymentConfirmedEmails(supabase, {
    paymentRequest: { ...paymentRequest, risk_flags: riskFlags },
    onboarding,
    user,
    paymentId: payment?.id || null,
    amountCents,
  });
}

async function markPaymentFailed(supabase: any, params: {
  requestId: string;
  paymentIntentId?: string | null;
  message?: string | null;
}) {
  const { paymentRequest } = await fetchRequestContext(supabase, params.requestId);
  await supabase
    .from("fund_stripe_payment_requests")
    .update({
      status: "failed",
      latest_stripe_payment_intent_id: params.paymentIntentId || null,
    })
    .eq("id", paymentRequest.id);
  await supabase
    .from("onboarding_data")
    .update({ fund_payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("user_id", paymentRequest.user_id);
  await supabase
    .from("fund_stripe_payments")
    .insert({
      user_id: paymentRequest.user_id,
      payment_request_id: paymentRequest.id,
      plan_id: paymentRequest.plan_id,
      stripe_payment_intent_id: params.paymentIntentId || null,
      amount_cents: Math.round(Number(paymentRequest.first_payment_amount || 0) * 100),
      status: "failed",
      payment_kind: "initial_commitment",
      failed_at: new Date().toISOString(),
      raw_payment_intent: { error_message: params.message || null },
    });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let stripe: any;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("[fund-stripe-webhook] Stripe configuration error:", error);
    return json({ error: "Stripe webhook is not configured" }, 500, corsHeaders);
  }
  const webhookSecret = Deno.env.get("STRIPE_FUND_WEBHOOK_SECRET");
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event: any;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret,
        undefined,
        getStripeWebhookCryptoProvider(),
      );
    } else if (Deno.env.get("STRIPE_FUND_WEBHOOK_ALLOW_UNSIGNED") === "1") {
      // Local-only escape hatch for fixture tests. We refuse to honour it on
      // any non-localhost SUPABASE_URL so that an accidental production env
      // flip cannot let attackers forge events.
      if (!isLocalSupabaseHost()) {
        console.error(
          "[fund-stripe-webhook] STRIPE_FUND_WEBHOOK_ALLOW_UNSIGNED ignored: SUPABASE_URL is not localhost",
        );
        return json({
          error: "Webhook signature verification is required",
          code: "UNSIGNED_NOT_ALLOWED_IN_NON_LOCAL",
        }, 400, corsHeaders);
      }
      event = JSON.parse(rawBody);
    } else {
      return json({ error: "Webhook signature verification is required" }, 400, corsHeaders);
    }
  } catch (error) {
    console.error("[fund-stripe-webhook] Signature error:", error);
    return json({ error: "Invalid Stripe webhook signature" }, 400, corsHeaders);
  }

  try {
    const supabase = createAdminClient();
    const object = event.data?.object || {};
    const requestId =
      object.metadata?.payment_request_id ||
      object.metadata?.request_id ||
      object.payment_intent?.metadata?.payment_request_id ||
      null;

    const { error: eventError } = await supabase
      .from("fund_stripe_events")
      .insert({
        user_id: object.metadata?.user_id || null,
        payment_request_id: requestId,
        stripe_event_id: event.id,
        event_type: event.type,
        api_version: event.api_version || null,
        livemode: event.livemode ?? null,
        payload: event,
      });

    if (eventError) {
      if (isDuplicateError(eventError)) {
        return json({ received: true, duplicate: true }, 200, corsHeaders);
      }
      throw eventError;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        if (!requestId) break;
        const paymentIntentId = getObjectId(object.payment_intent);
        await markPaymentSucceeded(supabase, stripe, {
          requestId,
          sessionId: object.id,
          paymentIntentId,
          amountCents: object.amount_total || null,
          currency: object.currency || null,
        });
        await replayDeferredEventsForPayment(supabase, paymentIntentId);
        break;
      }
      case "payment_intent.succeeded": {
        const intentRequestId = object.metadata?.payment_request_id;
        if (!intentRequestId) break;
        await markPaymentSucceeded(supabase, stripe, {
          requestId: intentRequestId,
          paymentIntentId: object.id,
          amountCents: object.amount_received || object.amount || null,
          currency: object.currency || null,
        });
        await replayDeferredEventsForPayment(supabase, object.id);
        break;
      }
      case "payment_intent.payment_failed": {
        const intentRequestId = object.metadata?.payment_request_id;
        if (!intentRequestId) break;
        await markPaymentFailed(supabase, {
          requestId: intentRequestId,
          paymentIntentId: object.id,
          message: object.last_payment_error?.message || null,
        });
        break;
      }
      case "charge.refunded":
      case "charge.dispute.created": {
        const paymentIntentId = getObjectId(object.payment_intent);
        if (!paymentIntentId) {
          await markEventDeferred(supabase, event.id, "missing_payment_intent_id");
          break;
        }
        const { data: payment } = await supabase
          .from("fund_stripe_payments")
          .select("id, user_id, payment_request_id, plan_id")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .maybeSingle();
        if (!payment) {
          // Out-of-order: refund / dispute arrived before checkout.session.completed
          // created the payment row. Park as deferred so a replay can pick it up.
          await markEventDeferred(supabase, event.id, "payment_row_missing");
          console.warn("[fund-stripe-webhook] Deferred out-of-order event", {
            type: event.type,
            paymentIntentId,
            eventId: event.id,
          });
          break;
        }
        const nextStatus = event.type === "charge.refunded" ? "refunded" : "disputed";
        await supabase
          .from("fund_stripe_payments")
          .update({
            status: nextStatus,
            refunded_at: nextStatus === "refunded" ? new Date().toISOString() : null,
            disputed_at: nextStatus === "disputed" ? new Date().toISOString() : null,
          })
          .eq("id", payment.id);
        await supabase
          .from("fund_stripe_payment_requests")
          .update({ status: nextStatus })
          .eq("id", payment.payment_request_id);
        await supabase
          .from("onboarding_data")
          .update({ fund_payment_status: nextStatus, updated_at: new Date().toISOString() })
          .eq("user_id", payment.user_id);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await supabase.from("fund_stripe_subscriptions").upsert({
          user_id: object.metadata?.user_id || null,
          payment_request_id: object.metadata?.payment_request_id || null,
          plan_id: object.metadata?.plan_id || null,
          stripe_subscription_id: getObjectId(object.subscription) || object.id,
          stripe_customer_id: getObjectId(object.customer),
          status: object.status || (event.type === "invoice.payment_failed" ? "past_due" : "active"),
          latest_invoice_id: event.type.startsWith("invoice.") ? object.id : object.latest_invoice || null,
          raw_subscription: object,
        }, { onConflict: "stripe_subscription_id" });
        break;
      default:
        break;
    }

    return json({ received: true }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-stripe-webhook] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
