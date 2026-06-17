/**
 * onboarding-invite-revoke — primary investor revokes an invite, invalidating the
 * link. Verifies the invite belongs to the requesting primary.
 */
import {
  createAdminClient,
  getCorsHeaders,
  json,
  requireAuthenticatedUser,
} from "../_shared/fundStripe.ts";

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
      .select("id, primary_user_id, status")
      .eq("id", inviteId)
      .maybeSingle();
    if (!invite) return json({ error: "Invite not found" }, 404, corsHeaders);
    if (invite.primary_user_id !== primaryUserId) {
      return json({ error: "Not authorized" }, 403, corsHeaders);
    }
    if (invite.status === "completed") {
      return json({ error: "Cannot revoke a completed invite" }, 409, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from("onboarding_invites")
      .update({ status: "revoked", updated_at: nowIso })
      .eq("id", inviteId);

    return json({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("[onboarding-invite-revoke] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
