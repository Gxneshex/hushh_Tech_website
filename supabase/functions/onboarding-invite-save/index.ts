/**
 * onboarding-invite-save — token-only partial save of the invited party's own
 * profile. Whitelists fields to the role's known keys; sensitive fields (tax id)
 * are split into their dedicated column and kept out of the profile jsonb. Marks
 * the party in_progress without downgrading a bank-connected / completed party.
 */
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import { findInviteByToken, inviteState } from "../_shared/onboardingInvite.ts";
import {
  extractSensitivePartyFields,
  sanitizePartyProfile,
  SENSITIVE_FIELD_COLUMNS,
} from "../_shared/onboardingParties.ts";

// Statuses past which a draft save must not roll the party back.
const ADVANCED_PARTY_STATUSES = ["plaid_pending", "plaid_connected", "kyc_pending", "completed"];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "").trim();
    if (!token) return json({ error: "Invite token is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const invite = await findInviteByToken(supabase, token);
    if (!invite) return json({ error: "Invite not found" }, 404, corsHeaders);

    const state = inviteState(invite);
    if (state !== "active") {
      return json({ error: `Invite is ${state}`, state }, 409, corsHeaders);
    }

    const raw = body.profile || {};
    const profile = sanitizePartyProfile(invite.party_role, raw);
    const sensitive = extractSensitivePartyFields(invite.party_role, raw);
    const nowIso = new Date().toISOString();

    const { data: party } = await supabase
      .from("onboarding_parties")
      .select("status")
      .eq("id", invite.party_id)
      .maybeSingle();

    const update: Record<string, unknown> = { profile, updated_at: nowIso };
    for (const [key, value] of Object.entries(sensitive)) {
      const col = SENSITIVE_FIELD_COLUMNS[key];
      if (col) update[col] = value;
    }
    // Don't downgrade a party that has already connected a bank or completed.
    if (!ADVANCED_PARTY_STATUSES.includes(String(party?.status || ""))) {
      update.status = "in_progress";
    }

    await supabase.from("onboarding_parties").update(update).eq("id", invite.party_id);
    await supabase
      .from("onboarding_invites")
      .update({ status: "in_progress", updated_at: nowIso })
      .eq("id", invite.id);

    return json({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("[onboarding-invite-save] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
