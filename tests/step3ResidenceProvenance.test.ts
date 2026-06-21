import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildStep3FieldProvenance,
  buildStep3LegalResidenceClearPayload,
} from '../src/pages/onboarding/step-3/logic';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('step-3 residence provenance + attestation (PR 2)', () => {
  it('tags bank-sourced fields bank_verified and the rest self_declared (never gps)', () => {
    const prov = buildStep3FieldProvenance({
      residence_country: 'plaid',
      address_line_1: 'plaid',
      city: 'plaid',
      state: 'plaid',
      zip_code: 'plaid',
    });
    expect(prov.residence_country).toBe('bank_verified');
    expect(prov.address_line_1).toBe('bank_verified');
    expect(prov.city).toBe('bank_verified');
    expect(prov.state).toBe('bank_verified');
    expect(prov.zip_code).toBe('bank_verified');
    // Not bank-sourced → self_declared (APT, country, names, phone)
    expect(prov.address_line_2).toBe('self_declared');
    expect(prov.address_country).toBe('self_declared');
    expect(prov.legal_first_name).toBe('self_declared');
    // The device's current GPS location is never a legal source.
    expect(Object.values(prov)).not.toContain('gps');
  });

  it('treats an empty source map as fully self_declared', () => {
    const prov = buildStep3FieldProvenance({});
    expect(new Set(Object.values(prov))).toEqual(new Set(['self_declared']));
  });

  it('builds an explicit null patch for stale legal-residence fields when Plaid has no address', () => {
    expect(buildStep3LegalResidenceClearPayload()).toEqual({
      residence_country: null,
      address_line_1: null,
      address_line_2: null,
      city: null,
      state: null,
      zip_code: null,
      address_country: null,
    });
  });

  it('persists provenance + full legal residence on save, with attestation only for bank-verified residence', () => {
    const logic = read('src/pages/onboarding/step-3/logic.ts');
    expect(logic).toContain('payload.field_provenance = buildStep3FieldProvenance(fieldSources)');
    expect(logic).not.toContain('Object.assign(payload, buildStep3LegalResidenceClearPayload())');
    expect(logic).toContain('addressLine1.trim() &&');
    expect(logic).toContain('addressCity.trim() &&');
    expect(logic).toContain('addressState.trim() &&');
    expect(logic).toContain('zipCode.trim() &&');
    expect(logic).toContain('payload.residence_attested_at = new Date().toISOString()');
    expect(logic).toContain('payload.consent_version = CONSENT_VERSION');
    // Attestation is still required + persisted ONLY when there is a bank-verified
    // residence to attest, but self-declared residence/address are required for everyone.
    expect(logic).toContain('if (hasBankResidence && !residenceAttested)');
    expect(logic).toContain('if (hasBankResidence && residenceAttested) {');
    expect(logic).toContain('(!hasBankResidence || residenceAttested)');
    expect(logic).toContain('residenceAttested');
  });

  it('ships the additive migration for provenance + attestation columns', () => {
    const mig = read('supabase/migrations/20260605120000_add_residence_provenance_attestation.sql');
    expect(mig).toContain('ADD COLUMN IF NOT EXISTS field_provenance JSONB');
    expect(mig).toContain('ADD COLUMN IF NOT EXISTS residence_attested_at');
  });

  it('renders the required legal-residence attestation checkbox in the UI', () => {
    const ui = read('src/pages/onboarding/step-3/ui.tsx');
    expect(ui).toContain('id="residence-attest"');
    expect(ui).toContain('s.handleResidenceAttestChange');
    expect(ui).toContain('legal/permanent residence');
  });
});
