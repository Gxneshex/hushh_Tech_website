import {
  createAdminClient,
  findPaymentRequestByToken,
  formatUsdCents,
  getCorsHeaders,
  getStripeClient,
  json,
} from "../_shared/fundStripe.ts";
import { getTrustedOrigin } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    if (!token) {
      return json({ error: "Payment token is required" }, 400, corsHeaders);
    }

    const supabase = createAdminClient();
    const paymentRequest = await findPaymentRequestByToken(supabase, token);
    if (!paymentRequest) {
      return json({ error: "Payment link not found" }, 404, corsHeaders);
    }

    if (new Date(paymentRequest.expires_at).getTime() < Date.now()) {
      await supabase
        .from("fund_stripe_payment_requests")
        .update({ status: "expired" })
        .eq("id", paymentRequest.id);
      return json({ error: "Payment link expired", code: "PAYMENT_LINK_EXPIRED" }, 410, corsHeaders);
    }

    if (["paid", "pending_manual_verification", "verified_investor"].includes(paymentRequest.status)) {
      return json({
        success: true,
        already_paid: true,
        status: paymentRequest.status,
        request_reference: paymentRequest.request_reference,
      }, 200, corsHeaders);
    }

    if (["cancelled", "expired", "failed", "rejected", "refunded", "disputed"].includes(paymentRequest.status)) {
      return json({
        error: "This payment link is no longer active. Please request a new link from your Hushh Fund dashboard.",
        code: "PAYMENT_LINK_INACTIVE",
        status: paymentRequest.status,
      }, 410, corsHeaders);
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(paymentRequest.user_id);
    const stripe = getStripeClient();
    const origin = getTrustedOrigin(req);
    const successUrl = `${origin}/onboarding/fund-payment/${encodeURIComponent(token)}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/onboarding/fund-payment/${encodeURIComponent(token)}?payment=cancel`;
    const amountCents = Math.round(Number(paymentRequest.first_payment_amount || 0) * 100);

    // Reuse an existing open Stripe Checkout session if one is still valid. A
    // cancel-URL spam-reload would otherwise mint a fresh Stripe session per
    // refresh, wasting quotas and confusing the customer record.
    if (paymentRequest.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(
          paymentRequest.stripe_checkout_session_id,
        );
        // Defensive race-tolerance: Stripe knows the session is complete but
        // our webhook hasn't flipped the local row to "paid" yet. Treat as
        // already paid so the user is not re-prompted to create another
        // Stripe session.
        if (existing?.status === "complete") {
          return json({
            success: true,
            already_paid: true,
            status: "pending_webhook",
            request_reference: paymentRequest.request_reference,
          }, 200, corsHeaders);
        }
        const stillOpen = existing?.status === "open" && existing?.url;
        const notExpired = !existing?.expires_at || existing.expires_at * 1000 > Date.now();
        const sameAmount = Math.round(Number(existing?.amount_total || 0)) === amountCents;
        if (stillOpen && notExpired && sameAmount) {
          return json({
            success: true,
            checkout_url: existing.url,
            session_id: existing.id,
            request_reference: paymentRequest.request_reference,
            amount_label: formatUsdCents(amountCents),
            recurring_selected: Boolean(paymentRequest.recurring_selected),
            reused: true,
          }, 200, corsHeaders);
        }
      } catch (err) {
        // Stripe rejected the retrieve (deleted / expired / wrong env). Fall
        // through and create a new session.
        console.warn("[fund-payment-checkout] Existing session retrieve failed", err);
      }
    }
    const recurringNote = paymentRequest.recurring_selected
      ? "Recurring setup selected. Hushh will activate recurring payments after manual investor verification."
      : "No recurring investment selected.";

    const metadata = {
      user_id: paymentRequest.user_id,
      payment_request_id: paymentRequest.id,
      plan_id: paymentRequest.plan_id || "",
      payment_kind: "initial_commitment",
      request_reference: paymentRequest.request_reference,
      selected_fund: paymentRequest.selected_fund,
      class_a_units: String(paymentRequest.class_a_units || 0),
      class_b_units: String(paymentRequest.class_b_units || 0),
      class_c_units: String(paymentRequest.class_c_units || 0),
      commitment_amount: String(paymentRequest.commitment_amount || 0),
      recurring_selected: String(Boolean(paymentRequest.recurring_selected)),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: authUser?.user?.email || undefined,
      customer_creation: "always",
      line_items: [{
        price_data: {
          currency: paymentRequest.currency || "usd",
          product_data: {
            name: "Hushh Fund initial payment",
            description: `${paymentRequest.request_reference} - ${recurringNote}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        setup_future_usage: "off_session",
        metadata,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    await supabase
      .from("fund_stripe_payment_requests")
      .update({
        status: "checkout_created",
        stripe_checkout_session_id: session.id,
        latest_stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        raw_checkout_session: session,
      })
      .eq("id", paymentRequest.id);

    await supabase
      .from("onboarding_data")
      .update({
        fund_payment_status: "checkout_created",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", paymentRequest.user_id);

    return json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      request_reference: paymentRequest.request_reference,
      amount_label: formatUsdCents(amountCents),
      recurring_selected: Boolean(paymentRequest.recurring_selected),
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-checkout] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
