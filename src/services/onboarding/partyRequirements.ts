/**
 * Per-role required fields an INVITED party must complete on their tokenized
 * onboarding page (§5/§6/§7). This is the client copy; an identical copy lives at
 * supabase/functions/_shared/onboardingParties.ts for server-side validation, and
 * a contract test (tests/partyRequirementsSync.test.ts) asserts the two never drift.
 *
 * Phase 1 collects identity-level details only. Deeper per-party KYC / the party's
 * own Plaid link is Phase 2 (status values for that already exist on
 * onboarding_parties).
 */
import type { PartyRole } from './accountTypeConfig';

export interface PartyFieldDef {
  key: string;
  label: string;
  required: boolean;
}

const BASE_PARTY_FIELDS: PartyFieldDef[] = [
  { key: 'full_name', label: 'Full legal name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
];

/** Role → fields the invited party fills in. Keep in sync with the Deno copy. */
export const PARTY_FIELD_DEFS: Record<PartyRole, PartyFieldDef[]> = {
  joint_owner: BASE_PARTY_FIELDS,
  retirement_custodian: [
    { key: 'full_name', label: 'Contact name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'institution', label: 'Institution', required: false },
  ],
  retirement_administrator: [
    { key: 'full_name', label: 'Contact name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'institution', label: 'Institution', required: false },
  ],
  trustee: [...BASE_PARTY_FIELDS, { key: 'role_title', label: 'Role / title', required: false }],
  co_trustee: [...BASE_PARTY_FIELDS, { key: 'role_title', label: 'Role / title', required: false }],
  beneficial_owner: [
    ...BASE_PARTY_FIELDS,
    { key: 'ownership_percent', label: 'Ownership %', required: false },
  ],
  controlling_person: [
    ...BASE_PARTY_FIELDS,
    { key: 'role_title', label: 'Role / title', required: false },
  ],
  authorised_person: [
    ...BASE_PARTY_FIELDS,
    { key: 'relationship', label: 'Relationship to investor', required: true },
  ],
  authorised_signatory: [
    ...BASE_PARTY_FIELDS,
    { key: 'title', label: 'Title', required: false },
  ],
};

export const getPartyFieldDefs = (role: string): PartyFieldDef[] =>
  PARTY_FIELD_DEFS[role as PartyRole] ?? BASE_PARTY_FIELDS;

/** Returns the required field keys missing from a party's profile. */
export const missingPartyFields = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): string[] => {
  const data = profile ?? {};
  return getPartyFieldDefs(role)
    .filter((f) => f.required)
    .filter((f) => {
      const v = data[f.key];
      return v === undefined || v === null || String(v).trim() === '';
    })
    .map((f) => f.key);
};

export const isPartyProfileComplete = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): boolean => missingPartyFields(role, profile).length === 0;
