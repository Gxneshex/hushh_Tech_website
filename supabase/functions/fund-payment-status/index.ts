import {
  createAdminClient,
  getCorsHeaders,
  json,
  requireAuthenticatedUser,
} from "../_shared/fundStripe.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    if (!userId) return json({ error: "userId is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase, userId);
    if (auth.response) return auth.response;

    const { data: request, error: requestError } = await supabase
      .from("fund_stripe_payment_requests")
      .select(`
        id, request_reference, selected_fund, class_a_units, class_b_units, class_c_units,
        commitment_amount, first_payment_amount, recurring_selected, recurring_amount,
        recurring_frequency, recurring_day_of_month, status, expires_at, paid_at,
        verified_at, rejected_at, risk_flags, plaid_match_confidence, created_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (requestError) throw requestError;

    const { data: payments, error: paymentsError } = await supabase
      .from("fund_stripe_payments")
      .select("id, amount_cents, currency, payment_kind, status, paid_at, failed_at, refunded_at, disputed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (paymentsError) throw paymentsError;

    const { data: reviews, error: reviewsError } = await supabase
      .from("fund_payment_reviews")
      .select("id, status, flags, notes, reviewed_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (reviewsError) throw reviewsError;

    return json({
      success: true,
      latest_request: request || null,
      payments: payments || [],
      reviews: reviews || [],
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-status] Error:", error);
    return json({
      error: error instanceof Error ? error.message : "Internal server error",
    }, 500, corsHeaders);
  }
});
