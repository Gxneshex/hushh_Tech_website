/**
 * onboarding-invite-save — token-only partial save of the invited party's own
 * profile. Whitelists fields to the role's known keys; marks the party in_progress.
 */
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import { findInviteByToken, inviteState } from "../_shared/onboardingInvite.ts";
import { sanitizePartyProfile } from "../_shared/onboardingParties.ts";

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

    const profile = sanitizePartyProfile(invite.party_role, body.profile || {});
    const nowIso = new Date().toISOString();

    await supabase
      .from("onboarding_parties")
      .update({ profile, status: "in_progress", updated_at: nowIso })
      .eq("id", invite.party_id);
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
