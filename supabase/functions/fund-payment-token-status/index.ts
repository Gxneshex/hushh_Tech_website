/**
 * fund-payment-token-status — token-based, no-auth read of the current
 * payment request status. Used by the public /onboarding/fund-payment/:token
 * page to poll for Stripe webhook confirmation after the user lands on the
 * Checkout success URL (the browser cannot itself mark a payment as paid).
 *
 * No Stripe API calls. No DB writes. Cheap to poll.
 */
import {
  createAdminClient,
  findPaymentRequestByToken,
  getCorsHeaders,
  json,
} from "../_shared/fundStripe.ts";

const PAYMENT_GRANTED_STATUSES = [
  "paid",
  "pending_manual_verification",
  "verified_investor",
];

const PAYMENT_REVERSED_STATUSES = ["refunded", "disputed"];

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

    const status = String(paymentRequest.status || "").toLowerCase();
    const accessGranted = PAYMENT_GRANTED_STATUSES.includes(status);
    const accessReversed = PAYMENT_REVERSED_STATUSES.includes(status);
    const expiresAt = paymentRequest.expires_at
      ? new Date(paymentRequest.expires_at).getTime()
      : null;
    const expired = Boolean(expiresAt && expiresAt < Date.now());

    return json({
      success: true,
      status,
      access_granted: accessGranted,
      access_reversed: accessReversed,
      expired,
      request_reference: paymentRequest.request_reference,
      expires_at: paymentRequest.expires_at,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-token-status] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
