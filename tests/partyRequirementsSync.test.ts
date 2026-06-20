import { describe, expect, it } from 'vitest';

import {
  PARTY_FIELD_DEFS as CLIENT_DEFS,
  missingPartyFields as clientMissing,
  isPartyProfileComplete as clientComplete,
  sanitizePartyProfile,
  extractSensitivePartyFields,
  SENSITIVE_FIELD_COLUMNS,
} from '../src/services/onboarding/partyRequirements';
import {
  PARTY_FIELD_DEFS as DENO_DEFS,
  missingPartyFields as denoMissing,
  SENSITIVE_FIELD_COLUMNS as DENO_SENSITIVE_COLUMNS,
} from '../supabase/functions/_shared/onboardingParties';
import { ACCOUNT_TYPE_CONFIG } from '../src/services/onboarding/accountTypeConfig';

const JOINT_REQUIRED = [
  'full_name',
  'date_of_birth',
  'citizenship_country',
  'residence_country',
  'address_line_1',
  'city',
  'zip_code',
  'tax_id',
  'email',
];

const fullJointProfile = (): Record<string, string> => ({
  full_name: 'Jane Doe',
  date_of_birth: '1990-04-12',
  citizenship_country: 'US',
  residence_country: 'US',
  address_line_1: '1 Market St',
  city: 'San Francisco',
  zip_code: '94105',
  tax_id: '123-45-6789',
  email: 'jane@example.com',
});

describe('party requirements contract', () => {
  it('client and Deno party field matrices are identical', () => {
    expect(CLIENT_DEFS).toEqual(DENO_DEFS);
  });

  it('client and Deno sensitive-field column maps are identical', () => {
    expect(SENSITIVE_FIELD_COLUMNS).toEqual(DENO_SENSITIVE_COLUMNS);
  });

  it('every party role required by an account type has a field definition', () => {
    for (const cfg of Object.values(ACCOUNT_TYPE_CONFIG)) {
      for (const party of cfg.requiredParties) {
        expect(CLIENT_DEFS[party.role], `missing field defs for role ${party.role}`).toBeTruthy();
      }
    }
  });

  it('joint owner now requires full KYC, agreeing across client and Deno', () => {
    expect(clientMissing('joint_owner', {})).toEqual(JOINT_REQUIRED);
    expect(denoMissing('joint_owner', {})).toEqual(clientMissing('joint_owner', {}));

    const full = fullJointProfile();
    expect(clientMissing('joint_owner', full)).toEqual([]);
    expect(clientComplete('joint_owner', full)).toBe(true);
  });

  it('a partially-filled joint owner is incomplete until every required field is present', () => {
    const partial = { ...fullJointProfile(), zip_code: '', tax_id: '' };
    expect(clientMissing('joint_owner', partial)).toEqual(['zip_code', 'tax_id']);
  });

  it('a sensitive field is satisfied by either the raw value or the provided marker', () => {
    const withRaw = { ...fullJointProfile() };
    expect(clientMissing('joint_owner', withRaw)).toEqual([]);

    const { tax_id: _omit, ...withoutRaw } = fullJointProfile();
    expect(clientMissing('joint_owner', withoutRaw)).toEqual(['tax_id']);
    expect(clientMissing('joint_owner', { ...withoutRaw, tax_id_provided: 'true' })).toEqual([]);
  });

  it('sanitize keeps PII out of the profile jsonb and extract pulls it for the column', () => {
    const raw = fullJointProfile();
    const sanitized = sanitizePartyProfile('joint_owner', raw);
    expect(sanitized.tax_id).toBeUndefined();
    expect(sanitized.tax_id_provided).toBe('true');
    expect(sanitized.full_name).toBe('Jane Doe');

    const sensitive = extractSensitivePartyFields('joint_owner', raw);
    expect(sensitive).toEqual({ tax_id: '123-45-6789' });
    expect(SENSITIVE_FIELD_COLUMNS.tax_id).toBe('tax_id_encrypted');
  });

  it('authorised_person additionally requires the relationship field', () => {
    expect(clientMissing('authorised_person', { full_name: 'A', email: 'a@b.com' })).toEqual([
      'relationship',
    ]);
  });
});
