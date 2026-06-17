/**
 * onboarding-proof-of-funds — authed. Returns the funding-readiness status by
 * comparing the connected bank's available balance against the selected investment
 * amount (§3.3/§3.4, "where available"). Returns only a status + an availability
 * boolean; never the raw balance figure.
 */
import {
  computeCommitmentCents,
  createAdminClient,
  getCorsHeaders,
  json,
  requireAuthenticatedUser,
} from "../_shared/fundStripe.ts";
import { computeProofOfFundsStatus, maxAccountBalanceCents } from "../_shared/proofOfFunds.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    const { data: ob } = await supabase
      .from("onboarding_data")
      .select("initial_investment_amount, class_a_units, class_b_units, class_c_units")
      .eq("user_id", userId)
      .maybeSingle();

    const investmentCents = ob ? computeCommitmentCents(ob) : 0;

    const { data: fin } = await supabase
      .from("user_financial_data")
      .select("plaid_item_id")
      .eq("user_id", userId)
      .maybeSingle();

    let accounts: Array<{ current_balance?: unknown; available_balance?: unknown }> = [];
    if (fin?.plaid_item_id) {
      const { data } = await supabase
        .from("plaid_accounts")
        .select("current_balance, available_balance")
        .eq("plaid_item_id", fin.plaid_item_id);
      accounts = data || [];
    }

    const balanceCents = maxAccountBalanceCents(accounts);
    const status = computeProofOfFundsStatus({ balanceCents, investmentCents });

    return json(
      {
        success: true,
        status,
        balance_available: balanceCents !== null,
        investment_selected: investmentCents > 0,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-proof-of-funds] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
