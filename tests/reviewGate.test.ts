import { describe, expect, it } from 'vitest';

import { computeAccountTypeReviewGate } from '../src/services/onboarding/reviewGate';

const base = {
  signatoryConfirmedAt: '2026-06-17T12:00:00Z',
  accountTypeFieldsComplete: true,
  requiredPartiesComplete: true,
};

describe('review/submit account-type gate (§9)', () => {
  it('Individual always passes (no parties, no required fields, auto signatory)', () => {
    expect(
      computeAccountTypeReviewGate({
        accountType: 'individual',
        signatoryConfirmedAt: null,
        accountTypeFieldsComplete: false,
        requiredPartiesComplete: false,
      }).ok,
    ).toBe(true);
  });

  it('Joint blocks until signatory confirmed and a joint owner completes', () => {
    const noSig = computeAccountTypeReviewGate({ ...base, accountType: 'joint', signatoryConfirmedAt: null });
    expect(noSig.ok).toBe(false);
    expect(noSig.reasons).toContain('signatory_not_confirmed');

    const noParty = computeAccountTypeReviewGate({ ...base, accountType: 'joint', requiredPartiesComplete: false });
    expect(noParty.reasons).toContain('required_party_not_completed');

    expect(computeAccountTypeReviewGate({ ...base, accountType: 'joint' }).ok).toBe(true);
  });

  it('Retirement blocks on incomplete custodian fields', () => {
    const r = computeAccountTypeReviewGate({
      ...base,
      accountType: 'retirement',
      accountTypeFieldsComplete: false,
    });
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain('account_type_fields_incomplete');
  });

  it('Trust requires entity fields + a completed trustee', () => {
    const r = computeAccountTypeReviewGate({
      accountType: 'trust',
      signatoryConfirmedAt: '2026-06-17T12:00:00Z',
      accountTypeFieldsComplete: false,
      requiredPartiesComplete: false,
    });
    expect(r.reasons).toEqual(
      expect.arrayContaining(['account_type_fields_incomplete', 'required_party_not_completed']),
    );
    expect(computeAccountTypeReviewGate({ ...base, accountType: 'trust' }).ok).toBe(true);
  });
});
