/**
 * onboarding-funding-name-match — authed. Computes whether the connected bank
 * account holder name matches the expected legal name (entity legal name for a
 * trust; custodian / IRA registration for retirement), persists the status +
 * holder name, and routes the application to manual review on a mismatch. Returns
 * only a status — never the raw balance. Flag, not a hard submit block.
 */
import {
  createAdminClient,
  getCorsHeaders,
  json,
  requireAuthenticatedUser,
} from "../_shared/fundStripe.ts";
import {
  computeFundingNameMatch,
  extractPlaidHolderNames,
} from "../_shared/fundingNameMatch.ts";

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
      .select(
        "account_structure, entity_legal_name, custodian_name, legal_first_name, legal_last_name, manual_review_route",
      )
      .eq("user_id", userId)
      .maybeSingle();

    const structure = String(ob?.account_structure || "");
    // Name match only applies where the funding account should belong to a
    // non-personal subscriber (entity legal name / retirement custodian).
    const expectedName =
      structure === "trust"
        ? ob?.entity_legal_name
        : structure === "retirement"
        ? ob?.custodian_name
        : null;

    // Retirement: the account is registered "[Custodian] FBO [Investor] IRA".
    let registrationName: string | null = null;
    if (structure === "retirement" && ob?.custodian_name) {
      const investor = [ob?.legal_first_name, ob?.legal_last_name].filter(Boolean).join(" ").trim();
      registrationName = `${String(ob.custodian_name).trim()} FBO ${investor || "Investor"} IRA`;
    }

    if (!expectedName) {
      return json({ success: true, applicable: false, status: "unavailable" }, 200, corsHeaders);
    }

    const { data: fin } = await supabase
      .from("user_financial_data")
      .select("identity_data")
      .eq("user_id", userId)
      .maybeSingle();

    const holderNames = extractPlaidHolderNames(fin?.identity_data);
    const status = computeFundingNameMatch({ expectedName, accountHolderNames: holderNames });

    const update: Record<string, unknown> = {
      funding_name_match_status: status,
      funding_account_holder_name: holderNames[0] ?? null,
      updated_at: new Date().toISOString(),
    };
    if (registrationName) update.retirement_registration_name = registrationName;
    // Only set the flag on a real mismatch; never clear a flag set for other reasons.
    if (status === "mismatch") update.manual_review_route = true;

    await supabase.from("onboarding_data").update(update).eq("user_id", userId);

    return json(
      {
        success: true,
        applicable: true,
        status,
        holder_name_available: holderNames.length > 0,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-funding-name-match] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
