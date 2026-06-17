/**
 * onboarding-invite-load — token-only (no login). Resolves an invite by its token
 * hash and returns a SCRUBBED payload for the public invitee page: the role, the
 * primary investor's display name only, the required field defs, and any saved
 * profile. Marks the invite opened. Mirrors fund-payment-token-status.
 */
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import {
  fetchPrimaryDisplayName,
  findInviteByToken,
  inviteState,
  roleLabel,
} from "../_shared/onboardingInvite.ts";
import { getPartyFieldDefs } from "../_shared/onboardingParties.ts";

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
    const { data: party } = await supabase
      .from("onboarding_parties")
      .select("id, display_name, profile, status")
      .eq("id", invite.party_id)
      .maybeSingle();

    const primaryName = await fetchPrimaryDisplayName(supabase, invite.primary_user_id);

    // Mark opened (only advance forward from sent → opened / invited → link_opened).
    if (state === "active" && invite.status === "sent") {
      const nowIso = new Date().toISOString();
      await supabase
        .from("onboarding_invites")
        .update({ status: "opened", opened_at: nowIso })
        .eq("id", invite.id);
      if (party && party.status === "invited") {
        await supabase
          .from("onboarding_parties")
          .update({ status: "link_opened" })
          .eq("id", party.id);
      }
    }

    return json(
      {
        success: true,
        state, // active | expired | revoked | completed
        role: invite.party_role,
        role_label: roleLabel(invite.party_role),
        primary_name: primaryName,
        fields: getPartyFieldDefs(invite.party_role),
        profile: party?.profile ?? {},
        expires_at: invite.expires_at,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-invite-load] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
