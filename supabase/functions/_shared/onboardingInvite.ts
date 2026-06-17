/**
 * Shared helpers for the onboarding party-invite edge functions.
 * Token mechanics mirror the fund payment-request flow: a random token is emailed
 * and only its sha256 hash is stored. Token-only functions authorize purely by
 * hash + service role (no invitee login), exactly like fund-payment-token-status.
 */
import { sha256Hex } from "./fundStripe.ts";
import { getTrustedOrigin } from "./security.ts";

export const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );

export const ROLE_LABELS: Record<string, string> = {
  joint_owner: "Joint owner",
  retirement_custodian: "Custodian",
  retirement_administrator: "Administrator",
  trustee: "Trustee",
  co_trustee: "Co-trustee",
  beneficial_owner: "Beneficial owner",
  controlling_person: "Controlling person",
  authorised_person: "Authorised person",
  authorised_signatory: "Authorised signatory",
};

export const roleLabel = (role: string): string => ROLE_LABELS[role] || "Participant";

// Keep in sync with src/services/consent/consentConfig.ts (CONSENT_VERSION).
export const ONBOARDING_CONSENT_VERSION = "2026-06-01";

export const buildInviteUrl = (req: Request, token: string): string =>
  `${getTrustedOrigin(req)}/onboarding/invite/${encodeURIComponent(token)}`;

export async function findInviteByToken(supabase: any, token: string) {
  const hash = await sha256Hex(token);
  const { data, error } = await supabase
    .from("onboarding_invites")
    .select("*")
    .eq("invite_token_hash", hash)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type InviteState = "revoked" | "completed" | "expired" | "active";

export function inviteState(invite: { status?: string; expires_at?: string | null }): InviteState {
  const status = String(invite?.status || "").toLowerCase();
  if (status === "revoked") return "revoked";
  if (status === "completed") return "completed";
  const expiresAt = invite?.expires_at ? new Date(invite.expires_at).getTime() : null;
  if (expiresAt && expiresAt < Date.now()) return "expired";
  return "active";
}

export async function fetchPrimaryDisplayName(
  supabase: any,
  primaryUserId: string,
): Promise<string> {
  const { data } = await supabase
    .from("onboarding_data")
    .select("legal_first_name, legal_last_name")
    .eq("user_id", primaryUserId)
    .maybeSingle();
  const name = [data?.legal_first_name, data?.legal_last_name].filter(Boolean).join(" ").trim();
  return name || "A Hushh investor";
}

export function buildInviteEmailHtml(params: {
  primaryName: string;
  roleLabel: string;
  inviteUrl: string;
  expiresLabel: string;
}): string {
  const { primaryName, roleLabel, inviteUrl, expiresLabel } = params;
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1D1D1F">
    <h2 style="font-weight:600">You've been invited to complete a Hushh Fund onboarding section</h2>
    <p>${escapeHtml(primaryName)} has invited you to complete the <strong>${escapeHtml(roleLabel)}</strong>
    section of their Hushh Fund A investor application.</p>
    <p style="margin:24px 0">
      <a href="${inviteUrl}" style="background:#0066CC;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
        Complete your section
      </a>
    </p>
    <p style="color:#1D1D1F99;font-size:13px">This secure link expires on ${escapeHtml(expiresLabel)}.
    If you weren't expecting this, you can ignore this email.</p>
  </div>`;
}
