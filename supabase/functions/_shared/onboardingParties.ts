/**
 * Server-side (Deno edge functions) copy of the per-role party field matrix.
 * MUST stay byte-identical in DATA to src/services/onboarding/partyRequirements.ts
 * — tests/partyRequirementsSync.test.ts asserts the two never drift. Pure TS, no
 * Deno globals, so vitest can import it directly for that contract test.
 *
 * Sensitive fields (tax id) are never persisted into the party `profile` jsonb:
 * the edge functions move them to a dedicated column and leave a `<key>_provided`
 * marker so the completeness gate and reloads still see the field as satisfied.
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

export type PartyFieldType = 'text' | 'email' | 'tel' | 'date' | 'country' | 'ssn' | 'select';

export interface PartyFieldDef {
  key: string;
  label: string;
  required: boolean;
  type?: PartyFieldType;
  section?: string;
  sensitive?: boolean;
  options?: { value: string; label: string }[];
}

const BASE_PARTY_FIELDS: PartyFieldDef[] = [
  { key: 'full_name', label: 'Full legal name', required: true },
  { key: 'email', label: 'Email', required: true, type: 'email' },
  { key: 'phone', label: 'Phone', required: false, type: 'tel' },
];

/**
 * Full-KYC field set mirroring the primary investor's Step-3. Used by a joint
 * owner and by trust/entity parties (trustee, signatory, beneficial owner,
 * controlling person) — anyone the fund must KYC, not just leave contact details.
 */
const FULL_KYC_FIELDS: PartyFieldDef[] = [
  { key: 'full_name', label: 'Full legal name', required: true, section: 'Identity' },
  { key: 'date_of_birth', label: 'Date of birth', required: true, type: 'date', section: 'Identity' },
  { key: 'citizenship_country', label: 'Citizenship', required: true, type: 'country', section: 'Residence' },
  { key: 'residence_country', label: 'Country of residence', required: true, type: 'country', section: 'Residence' },
  { key: 'address_line_1', label: 'Address line 1', required: true, section: 'Residence' },
  { key: 'address_line_2', label: 'Address line 2', required: false, section: 'Residence' },
  { key: 'city', label: 'City', required: true, section: 'Residence' },
  { key: 'state', label: 'State / region', required: false, section: 'Residence' },
  { key: 'zip_code', label: 'ZIP / postal code', required: true, section: 'Residence' },
  { key: 'tax_id', label: 'SSN / Tax ID', required: true, type: 'ssn', sensitive: true, section: 'Tax' },
  { key: 'email', label: 'Email', required: true, type: 'email', section: 'Contact' },
  { key: 'phone', label: 'Phone', required: false, type: 'tel', section: 'Contact' },
];

const ROLE_TITLE_FIELD: PartyFieldDef = { key: 'role_title', label: 'Role / title', required: false, section: 'Role' };

export const PARTY_FIELD_DEFS: Record<PartyRole, PartyFieldDef[]> = {
  joint_owner: FULL_KYC_FIELDS,
  retirement_custodian: [
    { key: 'full_name', label: 'Contact name', required: true },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'phone', label: 'Phone', required: false, type: 'tel' },
    { key: 'institution', label: 'Institution', required: false },
  ],
  retirement_administrator: [
    { key: 'full_name', label: 'Contact name', required: true },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'phone', label: 'Phone', required: false, type: 'tel' },
    { key: 'institution', label: 'Institution', required: false },
  ],
  trustee: [...FULL_KYC_FIELDS, ROLE_TITLE_FIELD],
  co_trustee: [...FULL_KYC_FIELDS, ROLE_TITLE_FIELD],
  beneficial_owner: [
    ...FULL_KYC_FIELDS,
    { key: 'ownership_percent', label: 'Ownership %', required: false, section: 'Role' },
  ],
  controlling_person: [...FULL_KYC_FIELDS, ROLE_TITLE_FIELD],
  authorised_person: [
    ...BASE_PARTY_FIELDS,
    { key: 'relationship', label: 'Relationship to investor', required: true },
  ],
  authorised_signatory: [
    ...FULL_KYC_FIELDS,
    { key: 'title', label: 'Title', required: false, section: 'Role' },
  ],
};

/** Maps a sensitive field key to the dedicated column the edge functions write it to. */
export const SENSITIVE_FIELD_COLUMNS: Record<string, string> = {
  tax_id: 'tax_id_encrypted',
};

export const INVITABLE_ROLES: PartyRole[] = Object.keys(PARTY_FIELD_DEFS) as PartyRole[];

export const isInvitableRole = (role: string): role is PartyRole =>
  (INVITABLE_ROLES as string[]).includes(role);

export const getPartyFieldDefs = (role: string): PartyFieldDef[] =>
  PARTY_FIELD_DEFS[role as PartyRole] ?? BASE_PARTY_FIELDS;

const isProvided = (value: unknown): boolean =>
  value === true || String(value ?? '').trim().toLowerCase() === 'true';

/** Returns the required field keys missing from a party's profile. */
export const missingPartyFields = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): string[] => {
  const data = profile ?? {};
  return getPartyFieldDefs(role)
    .filter((f) => f.required)
    .filter((f) => {
      if (f.sensitive && isProvided(data[`${f.key}_provided`])) return false;
      const v = data[f.key];
      return v === undefined || v === null || String(v).trim() === '';
    })
    .map((f) => f.key);
};

/**
 * Whitelist an incoming profile to only the known fields for the role. Sensitive
 * raw values are NEVER kept in the profile jsonb — only their `<key>_provided`
 * marker survives (the raw value goes to a dedicated column).
 */
export const sanitizePartyProfile = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): Record<string, string> => {
  const data = profile ?? {};
  const out: Record<string, string> = {};
  for (const f of getPartyFieldDefs(role)) {
    if (f.sensitive) {
      if (isProvided(data[`${f.key}_provided`]) || (data[f.key] != null && String(data[f.key]).trim() !== '')) {
        out[`${f.key}_provided`] = 'true';
      }
      continue;
    }
    const v = data[f.key];
    if (v !== undefined && v !== null) out[f.key] = String(v).slice(0, 500);
  }
  return out;
};

/** Extracts raw sensitive values present in an incoming profile (for column writes). */
export const extractSensitivePartyFields = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): Record<string, string> => {
  const data = profile ?? {};
  const out: Record<string, string> = {};
  for (const f of getPartyFieldDefs(role)) {
    if (!f.sensitive) continue;
    const v = data[f.key];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      out[f.key] = String(v).trim().slice(0, 500);
    }
  }
  return out;
};

export const isPartyProfileComplete = (
  role: string,
  profile: Record<string, unknown> | null | undefined,
): boolean => missingPartyFields(role, profile).length === 0;
