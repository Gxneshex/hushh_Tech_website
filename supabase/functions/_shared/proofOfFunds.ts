/**
 * Proof-of-funds status (Deno copy). Keep in sync with
 * src/services/onboarding/proofOfFunds.ts. Used by the admin detail endpoint and
 * the onboarding-proof-of-funds edge function.
 */
export type ProofOfFundsStatus = "funds_sufficient" | "funds_insufficient" | "balance_unavailable";

export const computeProofOfFundsStatus = (params: {
  balanceCents: number | null | undefined;
  investmentCents: number | null | undefined;
}): ProofOfFundsStatus => {
  const balance = Number(params.balanceCents);
  const investment = Number(params.investmentCents);
  if (!params.balanceCents || !Number.isFinite(balance) || balance <= 0) return "balance_unavailable";
  if (!params.investmentCents || !Number.isFinite(investment) || investment <= 0) {
    return "balance_unavailable";
  }
  return balance >= investment ? "funds_sufficient" : "funds_insufficient";
};

/** Largest current/available balance (in cents) across funding accounts. */
export const maxAccountBalanceCents = (
  accounts: Array<{ current_balance?: unknown; available_balance?: unknown }>,
): number | null => {
  let max: number | null = null;
  for (const a of accounts || []) {
    const raw = a.available_balance ?? a.current_balance;
    if (raw == null) continue;
    const cents = Math.round(Number(raw) * 100);
    if (!Number.isFinite(cents)) continue;
    if (max === null || cents > max) max = cents;
  }
  return max;
};
