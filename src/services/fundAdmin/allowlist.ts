/**
 * Hushh Fund admin allowlist (frontend gate — secondary to the server-side
 * allowlist enforced in the `fund-payment-admin-*` edge functions). The edge
 * functions are the real authority; this constant only controls whether the
 * `/fund-admin` UI renders so non-team members never see the dashboard shell.
 */
export const FUND_ADMIN_ALLOWLIST: string[] = [
  'manish@hushh.ai',
  'ankit@hushh.ai',
  'kushal@hushh.ai',
  'jhumma@hushh.ai',
];

export function isFundAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return FUND_ADMIN_ALLOWLIST.includes(email.trim().toLowerCase());
}
