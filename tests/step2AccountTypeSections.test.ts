import { describe, expect, it } from 'vitest';

import {
  isAccountTypeSectionComplete,
  buildAccountTypeSavePayload,
  type AccountTypeSectionState,
} from '../src/pages/onboarding/step-2/sections/logic';
import { CONSENT_VERSION } from '../src/services/consent/consentConfig';

const NOW = '2026-06-17T12:00:00.000Z';
const empty: AccountTypeSectionState = { signatoryConfirmed: false, fields: {} };

describe('step-3 account-type section completeness (§1 core rule)', () => {
  it('Individual is always complete and auto-confirms the primary as signatory', () => {
    expect(isAccountTypeSectionComplete('individual', empty)).toBe(true);

    const payload = buildAccountTypeSavePayload('individual', empty, NOW);
    expect(payload.authorised_signatory_is_primary).toBe(true);
    expect(payload.authorised_signatory_confirmed_at).toBe(NOW);
    expect(payload.signatory_consent_version).toBe(CONSENT_VERSION);
  });

  it('Joint requires explicit signatory confirmation', () => {
    expect(isAccountTypeSectionComplete('joint', empty)).toBe(false);
    expect(
      isAccountTypeSectionComplete('joint', { signatoryConfirmed: true, fields: {} }),
    ).toBe(true);

    const unconfirmed = buildAccountTypeSavePayload('joint', empty, NOW);
    expect(unconfirmed.authorised_signatory_confirmed_at).toBeNull();
    expect(unconfirmed.signatory_consent_version).toBeNull();
  });

  it('Retirement requires account type + custodian name + custodian email + signatory', () => {
    // Missing custodian email (now required — the custodian is the subscriber).
    const partial: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: { retirement_account_type: 'roth_ira', custodian_name: 'Fidelity' },
    };
    expect(isAccountTypeSectionComplete('retirement', partial)).toBe(false);

    const complete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: {
        retirement_account_type: 'roth_ira',
        custodian_name: 'Fidelity',
        custodian_contact_email: 'custody@fidelity.com',
        custodian_approval_required: true,
      },
    };
    expect(isAccountTypeSectionComplete('retirement', complete)).toBe(true);

    const payload = buildAccountTypeSavePayload('retirement', complete, NOW);
    expect(payload.retirement_account_type).toBe('roth_ira');
    expect(payload.custodian_name).toBe('Fidelity');
    expect(payload.custodian_contact_email).toBe('custody@fidelity.com');
    expect(payload.custodian_approval_required).toBe(true);
    expect(payload.authorised_signatory_confirmed_at).toBe(NOW);
  });

  it('Trust requires entity type + legal name + tax id + addresses + signatory; addresses persist as jsonb', () => {
    // Missing Tax ID / EIN + addresses (now required for fund-grade KYB).
    const incomplete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: { entity_type: 'llc', entity_legal_name: 'Acme Holdings LLC' },
    };
    expect(isAccountTypeSectionComplete('trust', incomplete)).toBe(false);

    const complete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: {
        entity_type: 'llc',
        entity_legal_name: 'Acme Holdings LLC',
        entity_tax_id_ein: '12-3456789',
        registered_address: '1 Market St, San Francisco, CA',
        principal_address: '1 Market St, San Francisco, CA',
      },
    };
    expect(isAccountTypeSectionComplete('trust', complete)).toBe(true);

    const payload = buildAccountTypeSavePayload('trust', complete, NOW);
    expect(payload.entity_type).toBe('llc');
    expect(payload.entity_legal_name).toBe('Acme Holdings LLC');
    expect(payload.registered_address).toEqual({ formatted: '1 Market St, San Francisco, CA' });
    expect(payload.principal_address).toEqual({ formatted: '1 Market St, San Francisco, CA' });

    // An empty address still persists as null jsonb (conversion is independent of the gate).
    const emptyPrincipal = buildAccountTypeSavePayload(
      'trust',
      { signatoryConfirmed: true, fields: { ...complete.fields, principal_address: '' } },
      NOW,
    );
    expect(emptyPrincipal.principal_address).toBeNull();
  });
});
