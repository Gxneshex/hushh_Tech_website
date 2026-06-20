/**
 * onboarding-invite-link-token — token-only (no login). Mints a Plaid Link token
 * for an INVITED party (e.g. a joint owner connecting their OWN bank). Authorizes
 * purely by the invite token hash + service role, exactly like the other
 * onboarding-invite-* functions. The Plaid `client_user_id` is the party id, since
 * invitees have no auth user.
 */
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import { findInviteByToken, inviteState } from "../_shared/onboardingInvite.ts";
import { plaidRequest, resolvePlaidPrimaryProducts } from "../_shared/plaid.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    // OAuth banks (Chase, BofA, …) redirect back to this fixed URI; it must be
    // registered in the Plaid dashboard. Omitted for non-OAuth banks.
    const redirectUri = String(body.redirect_uri || body.redirectUri || "").trim();
    if (!token) return json({ error: "Invite token is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const invite = await findInviteByToken(supabase, token);
    if (!invite) return json({ error: "Invite not found" }, 404, corsHeaders);

    const state = inviteState(invite);
    if (state !== "active") {
      return json({ error: `Invite is ${state}`, state }, 409, corsHeaders);
    }

    const products = resolvePlaidPrimaryProducts();
    const { data } = await plaidRequest<{ link_token: string; expiration: string }>(
      "/link/token/create",
      {
        user: { client_user_id: String(invite.party_id) },
        client_name: "Hushh",
        products,
        // Banks that don't support these won't block linking.
        required_if_supported_products: ["investments", "liabilities"],
        additional_consented_products: ["identity", "transactions"],
        country_codes: ["US"],
        language: "en",
        ...(redirectUri ? { redirect_uri: redirectUri } : {}),
      },
    );

    // Mark the party as bank-pending (don't roll back a completed party).
    await supabase
      .from("onboarding_parties")
      .update({ status: "plaid_pending", updated_at: new Date().toISOString() })
      .eq("id", invite.party_id)
      .in("status", ["invited", "link_opened", "in_progress"]);

    return json({ success: true, link_token: data.link_token, expiration: data.expiration }, 200, corsHeaders);
  } catch (error) {
    console.error("[onboarding-invite-link-token] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
