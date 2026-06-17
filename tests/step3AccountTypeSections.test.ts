import { describe, expect, it } from 'vitest';

import {
  isAccountTypeSectionComplete,
  buildAccountTypeSavePayload,
  type AccountTypeSectionState,
} from '../src/pages/onboarding/step-3/sections/logic';
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

  it('Retirement requires account type + custodian name + signatory', () => {
    const partial: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: { retirement_account_type: 'roth_ira' },
    };
    expect(isAccountTypeSectionComplete('retirement', partial)).toBe(false);

    const complete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: {
        retirement_account_type: 'roth_ira',
        custodian_name: 'Fidelity',
        custodian_approval_required: true,
      },
    };
    expect(isAccountTypeSectionComplete('retirement', complete)).toBe(true);

    const payload = buildAccountTypeSavePayload('retirement', complete, NOW);
    expect(payload.retirement_account_type).toBe('roth_ira');
    expect(payload.custodian_name).toBe('Fidelity');
    expect(payload.custodian_approval_required).toBe(true);
    expect(payload.authorised_signatory_confirmed_at).toBe(NOW);
  });

  it('Trust requires entity type + legal name + signatory; addresses persist as jsonb', () => {
    const incomplete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: { entity_type: 'llc' },
    };
    expect(isAccountTypeSectionComplete('trust', incomplete)).toBe(false);

    const complete: AccountTypeSectionState = {
      signatoryConfirmed: true,
      fields: {
        entity_type: 'llc',
        entity_legal_name: 'Acme Holdings LLC',
        registered_address: '1 Market St, San Francisco, CA',
        principal_address: '',
      },
    };
    expect(isAccountTypeSectionComplete('trust', complete)).toBe(true);

    const payload = buildAccountTypeSavePayload('trust', complete, NOW);
    expect(payload.entity_type).toBe('llc');
    expect(payload.entity_legal_name).toBe('Acme Holdings LLC');
    expect(payload.registered_address).toEqual({ formatted: '1 Market St, San Francisco, CA' });
    expect(payload.principal_address).toBeNull();
  });
});
