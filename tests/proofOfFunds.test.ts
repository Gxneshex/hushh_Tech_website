import { describe, expect, it } from 'vitest';

import { computeProofOfFundsStatus } from '../src/services/onboarding/proofOfFunds';

describe('proof-of-funds status (§3.3/§3.4, where available)', () => {
  it('sufficient when balance >= investment', () => {
    expect(computeProofOfFundsStatus({ balanceCents: 2_000_000_00, investmentCents: 1_000_000_00 })).toBe(
      'funds_sufficient',
    );
    expect(computeProofOfFundsStatus({ balanceCents: 1_000_000_00, investmentCents: 1_000_000_00 })).toBe(
      'funds_sufficient',
    );
  });

  it('insufficient when balance < investment', () => {
    expect(computeProofOfFundsStatus({ balanceCents: 500_000_00, investmentCents: 1_000_000_00 })).toBe(
      'funds_insufficient',
    );
  });

  it('unavailable when balance missing/zero (where available)', () => {
    expect(computeProofOfFundsStatus({ balanceCents: null, investmentCents: 1_000_000_00 })).toBe(
      'balance_unavailable',
    );
    expect(computeProofOfFundsStatus({ balanceCents: 0, investmentCents: 1_000_000_00 })).toBe(
      'balance_unavailable',
    );
  });

  it('unavailable when no investment amount chosen', () => {
    expect(computeProofOfFundsStatus({ balanceCents: 2_000_000_00, investmentCents: 0 })).toBe(
      'balance_unavailable',
    );
  });
});
