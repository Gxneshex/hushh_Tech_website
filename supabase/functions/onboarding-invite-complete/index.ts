/**
 * onboarding-invite-complete — token-only. Validates the invited party's required
 * fields, marks the party completed + invite completed, and notifies the team.
 */
import {
  createAdminClient,
  FUND_TEAM_RECIPIENTS,
  getCorsHeaders,
  json,
  logAndSendFundEmail,
} from "../_shared/fundStripe.ts";
import {
  escapeHtml,
  fetchPrimaryDisplayName,
  findInviteByToken,
  inviteState,
  ONBOARDING_CONSENT_VERSION,
  roleLabel,
} from "../_shared/onboardingInvite.ts";
import { missingPartyFields, sanitizePartyProfile } from "../_shared/onboardingParties.ts";

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
    const missing = missingPartyFields(invite.party_role, profile);
    if (missing.length > 0) {
      return json({ error: "Missing required fields", missing }, 400, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from("onboarding_parties")
      .update({
        profile,
        status: "completed",
        completed_at: nowIso,
        consent_version: ONBOARDING_CONSENT_VERSION,
        updated_at: nowIso,
      })
      .eq("id", invite.party_id);
    await supabase
      .from("onboarding_invites")
      .update({ status: "completed", completed_at: nowIso, updated_at: nowIso })
      .eq("id", invite.id);

    const primaryName = await fetchPrimaryDisplayName(supabase, invite.primary_user_id);
    await logAndSendFundEmail({
      supabase,
      userId: invite.primary_user_id,
      notificationType: `invite_party_completed_${invite.party_role}`,
      recipients: FUND_TEAM_RECIPIENTS,
      subject: `[Hushh Fund] ${roleLabel(invite.party_role)} completed for ${primaryName}`,
      html: `<p>${escapeHtml(roleLabel(invite.party_role))} (${escapeHtml(
        String(profile.full_name || invite.email),
      )}) completed their section for ${escapeHtml(primaryName)}'s application.</p>`,
    });

    return json({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("[onboarding-invite-complete] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
