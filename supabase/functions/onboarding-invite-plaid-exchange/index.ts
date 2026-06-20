/**
 * onboarding-invite-plaid-exchange — token-only (no login). Exchanges the Plaid
 * public token for an INVITED party (e.g. a joint owner's own bank), stores the
 * encrypted item + accounts, and links the item to the party. Keyed off the party
 * id (plaid_items.user_id is text, no FK) since invitees have no auth user.
 */
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import { findInviteByToken, inviteState } from "../_shared/onboardingInvite.ts";
import { getPlaidConfig, plaidRequest, resolvePlaidPrimaryProducts } from "../_shared/plaid.ts";
import { encryptPlaidAccessToken } from "../_shared/plaidToken.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    const publicToken = String(body.publicToken || body.public_token || "").trim();
    const institutionName = body.institutionName || body.institution_name || null;
    const institutionId = body.institutionId || body.institution_id || null;
    if (!token) return json({ error: "Invite token is required" }, 400, corsHeaders);
    if (!publicToken) return json({ error: "publicToken is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const invite = await findInviteByToken(supabase, token);
    if (!invite) return json({ error: "Invite not found" }, 404, corsHeaders);

    const state = inviteState(invite);
    if (state !== "active") {
      return json({ error: `Invite is ${state}`, state }, 409, corsHeaders);
    }

    const plaid = getPlaidConfig();
    const { data: exchange } = await plaidRequest<{ access_token: string; item_id: string }>(
      "/item/public_token/exchange",
      { public_token: publicToken },
    );

    const encryptedToken = await encryptPlaidAccessToken(exchange.access_token);
    const now = new Date().toISOString();
    const productsRequested = [...resolvePlaidPrimaryProducts(plaid.env), "auth", "identity"]
      .filter((p, i, arr) => arr.indexOf(p) === i);

    const { error: itemError } = await supabase.from("plaid_items").upsert(
      {
        user_id: String(invite.party_id),
        plaid_item_id: exchange.item_id,
        plaid_access_token_encrypted: encryptedToken,
        institution_id: institutionId,
        institution_name: institutionName,
        products_requested: productsRequested,
        status: "active",
        error_code: null,
        error_message: null,
        updated_at: now,
      },
      { onConflict: "plaid_item_id" },
    );
    if (itemError) throw itemError;

    // Fetch + persist account metadata (balances power the proof-of-funds signal).
    let accountsForUi: Array<Record<string, unknown>> = [];
    try {
      const { data: accountsData } = await plaidRequest<{ accounts: any[] }>("/accounts/get", {
        access_token: exchange.access_token,
      });
      if (Array.isArray(accountsData.accounts)) {
        for (const account of accountsData.accounts) {
          const balance = account.balances || {};
          await supabase.from("plaid_accounts").upsert(
            {
              plaid_item_id: exchange.item_id,
              plaid_account_id: account.account_id,
              name: account.name || null,
              official_name: account.official_name || null,
              type: account.type || null,
              subtype: account.subtype || null,
              current_balance: balance.current ?? null,
              available_balance: balance.available ?? null,
              iso_currency_code: balance.iso_currency_code || "USD",
              mask: account.mask || null,
              last_synced_at: now,
              updated_at: now,
            },
            { onConflict: "plaid_account_id" },
          );
          accountsForUi.push({
            account_id: account.account_id,
            name: account.name || account.official_name || "Linked account",
            mask: account.mask || null,
            type: account.type || null,
            subtype: account.subtype || null,
          });
        }
      }
    } catch (accountErr) {
      console.warn("[onboarding-invite-plaid-exchange] Accounts fetch skipped:", accountErr);
    }

    // Link the item (uuid PK) to the party + advance status.
    const { data: itemRow } = await supabase
      .from("plaid_items")
      .select("id")
      .eq("plaid_item_id", exchange.item_id)
      .maybeSingle();
    await supabase
      .from("onboarding_parties")
      .update({ plaid_item_id: itemRow?.id ?? null, status: "plaid_connected", updated_at: now })
      .eq("id", invite.party_id);

    return json(
      {
        success: true,
        item_id: exchange.item_id,
        institution: { name: institutionName, id: institutionId },
        accounts: accountsForUi,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-invite-plaid-exchange] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
