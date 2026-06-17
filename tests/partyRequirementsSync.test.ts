import { describe, expect, it } from 'vitest';

import {
  PARTY_FIELD_DEFS as CLIENT_DEFS,
  missingPartyFields as clientMissing,
  isPartyProfileComplete as clientComplete,
} from '../src/services/onboarding/partyRequirements';
import {
  PARTY_FIELD_DEFS as DENO_DEFS,
  missingPartyFields as denoMissing,
} from '../supabase/functions/_shared/onboardingParties';
import { ACCOUNT_TYPE_CONFIG } from '../src/services/onboarding/accountTypeConfig';

describe('party requirements contract', () => {
  it('client and Deno party field matrices are identical', () => {
    expect(CLIENT_DEFS).toEqual(DENO_DEFS);
  });

  it('every party role required by an account type has a field definition', () => {
    for (const cfg of Object.values(ACCOUNT_TYPE_CONFIG)) {
      for (const party of cfg.requiredParties) {
        expect(CLIENT_DEFS[party.role], `missing field defs for role ${party.role}`).toBeTruthy();
      }
    }
  });

  it('missingPartyFields agrees across client and Deno and flags required gaps', () => {
    const role = 'joint_owner';
    expect(clientMissing(role, {})).toEqual(['full_name', 'email']);
    expect(denoMissing(role, {})).toEqual(clientMissing(role, {}));

    const full = { full_name: 'Jane Doe', email: 'jane@example.com' };
    expect(clientMissing(role, full)).toEqual([]);
    expect(clientComplete(role, full)).toBe(true);
  });

  it('authorised_person additionally requires the relationship field', () => {
    expect(clientMissing('authorised_person', { full_name: 'A', email: 'a@b.com' })).toEqual([
      'relationship',
    ]);
  });
});
