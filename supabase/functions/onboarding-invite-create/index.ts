/**
 * onboarding-invite-create — primary investor mints a secure invite link for an
 * additional party (joint owner, custodian, trustee, beneficial owner, authorised
 * person). Modeled on fund-payment-request-create: random token, store only the
 * hash, email the tokenized link. Idempotent — reuses an active invite for the
 * same primary + role + email instead of duplicating.
 */
import {
  createAdminClient,
  createRequestReference,
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
  inviteState,
  roleLabel,
} from "../_shared/onboardingInvite.ts";
import { isInvitableRole } from "../_shared/onboardingParties.ts";

const INVITE_TTL_DAYS = 14;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const role = String(body.role || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = body.displayName ? String(body.displayName).trim() : null;

    if (!isInvitableRole(role)) {
      return json({ error: "Invalid party role" }, 400, corsHeaders);
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "A valid email is required" }, 400, corsHeaders);
    }

    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase);
    if (auth.response) return auth.response;
    const primaryUserId = auth.user.id;

    const { data: onboarding } = await supabase
      .from("onboarding_data")
      .select("id")
      .eq("user_id", primaryUserId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const primaryName = await fetchPrimaryDisplayName(supabase, primaryUserId);

    // Idempotency: reuse an existing party + active invite for this role + email.
    const { data: existingParty } = await supabase
      .from("onboarding_parties")
      .select("id")
      .eq("primary_user_id", primaryUserId)
      .eq("party_role", role)
      .eq("invite_email", email)
      .maybeSingle();

    let partyId = existingParty?.id as string | undefined;
    if (!partyId) {
      const { data: party, error: partyError } = await supabase
        .from("onboarding_parties")
        .insert({
          primary_user_id: primaryUserId,
          onboarding_data_id: onboarding?.id ?? null,
          party_role: role,
          invite_email: email,
          display_name: displayName,
          status: "invited",
          is_required: true,
        })
        .select("id")
        .single();
      if (partyError) throw partyError;
      partyId = party.id;
    }

    // Always mint a fresh token (we never store the plaintext, so we cannot resend
    // an old one). Supersede any prior active invite for this party.
    await supabase
      .from("onboarding_invites")
      .update({ status: "revoked", updated_at: nowIso })
      .eq("party_id", partyId)
      .in("status", ["sent", "opened", "in_progress"]);

    const token = createRequestToken();
    const tokenHash = await sha256Hex(token);
    const reference = createRequestReference();

    const { data: invite, error: inviteError } = await supabase
      .from("onboarding_invites")
      .insert({
        primary_user_id: primaryUserId,
        party_id: partyId,
        invite_token_hash: tokenHash,
        invite_reference: reference,
        email,
        party_role: role,
        status: "sent",
        expires_at: expiresAt.toISOString(),
      })
      .select("*")
      .single();
    if (inviteError) throw inviteError;

    const inviteUrl = buildInviteUrl(req, token);
    const emailResult = await logAndSendFundEmail({
      supabase,
      userId: primaryUserId,
      notificationType: `invite_party_${role}`,
      recipients: [email],
      subject: `Complete your section of ${primaryName}'s Hushh Fund application`,
      html: buildInviteEmailHtml({
        primaryName,
        roleLabel: roleLabel(role),
        inviteUrl,
        expiresLabel: formatDateTime(expiresAt),
      }),
    });

    return json(
      {
        success: true,
        party_id: partyId,
        invite_id: invite.id,
        invite_reference: reference,
        invite_url: inviteUrl,
        expires_at: invite.expires_at,
        state: inviteState(invite),
        email_sent: Boolean((emailResult as any)?.success),
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("[onboarding-invite-create] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
