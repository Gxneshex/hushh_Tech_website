/**
 * onboarding-invite-resend — primary investor re-sends an invite. Because only the
 * token hash is stored, "resend" mints a FRESH token (rotating the old one) and
 * re-emails the link. Verifies the invite belongs to the requesting primary.
 */
import {
  createAdminClient,
  createRequestToken,
  formatDateTime,
  getCorsHeaders,
  json,
  logAndSendFundEmail,
  requireAuthenticatedUser,
  sha256Hex,
} from "../_shared/fundStripe.ts";
import {
  buildInviteEmailHtml,
  buildInviteUrl,
  fetchPrimaryDisplayName,
  roleLabel,
} from "../_shared/onboardingInvite.ts";

const INVITE_TTL_DAYS = 14;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const inviteId = String(body.invite_id || body.inviteId || "").trim();
    if (!inviteId) return json({ error: "invite_id is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase);
    if (auth.response) return auth.response;
    const primaryUserId = auth.user.id;

    const { data: invite } = await supabase
      .from("onboarding_invites")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle();
    if (!invite) return json({ error: "Invite not found" }, 404, corsHeaders);
    if (invite.primary_user_id !== primaryUserId) {
      return json({ error: "Not authorized" }, 403, corsHeaders);
    }
    if (invite.status === "completed") {
      return json({ error: "Invite already completed" }, 409, corsHeaders);
    }

    const token = createRequestToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const nowIso = new Date().toISOString();

    await supabase
      .from("onboarding_invites")
      .update({
        invite_token_hash: tokenHash,
        status: "sent",
        opened_at: null,
        expires_at: expiresAt.toISOString(),
        updated_at: nowIso,
      })
      .eq("id", inviteId);

    const primaryName = await fetchPrimaryDisplayName(supabase, primaryUserId);
    const inviteUrl = buildInviteUrl(req, token);
    const emailResult = await logAndSendFundEmail({
      supabase,
      userId: primaryUserId,
      notificationType: `invite_party_resend_${invite.party_role}`,
      recipients: [invite.email],
      subject: `Reminder: complete your section of ${primaryName}'s Hushh Fund application`,
      html: buildInviteEmailHtml({
        primaryName,
        roleLabel: roleLabel(invite.party_role),
        inviteUrl,
        expiresLabel: formatDateTime(expiresAt),
      }),
    });

    return json(
      {
        success: true,
        invite_url: inviteUrl,
        expires_at: expiresAt.toISOString(),
        email_sent: Boolean((emailResult as any)?.success),
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-invite-resend] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
