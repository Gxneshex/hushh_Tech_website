/**
 * Server-side (Deno edge functions) copy of the per-role party field matrix.
 * MUST stay byte-identical in DATA to src/services/onboarding/partyRequirements.ts
 * — tests/partyRequirementsSync.test.ts asserts the two never drift. Pure TS, no
 * Deno globals, so vitest can import it directly for that contract test.
 */

export type PartyRole =
  | 'joint_owner'
  | 'retirement_custodian'
  | 'retirement_administrator'
  | 'trustee'
  | 'co_trustee'
  | 'beneficial_owner'
  | 'controlling_person'
  | 'authorised_person'
  | 'authorised_signatory';

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

export const INVITABLE_ROLES: PartyRole[] = Object.keys(PARTY_FIELD_DEFS) as PartyRole[];

export const isInvitableRole = (role: string): role is PartyRole =>
  (INVITABLE_ROLES as string[]).includes(role);

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

/** Whitelist an incoming profile to only the known fields for the role. */
export const sanitizePartyProfile = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): Record<string, string> => {
  const data = profile ?? {};
  const out: Record<string, string> = {};
  for (const f of getPartyFieldDefs(role)) {
    const v = data[f.key];
    if (v !== undefined && v !== null) out[f.key] = String(v).slice(0, 500);
  }
  return out;
};

export const isPartyProfileComplete = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): boolean => missingPartyFields(role, profile).length === 0;
