import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

/**
 * v1.1 (Plaid pivot): the legal residence section renders ONLY when Plaid
 * returned a bank address. No-Plaid investors see no residence section (no
 * manual entry) and are not blocked. Citizenship is always shown (user-declared);
 * current location is shown separately (read-only, AML signal).
 */
describe('step-3 residence visibility — Plaid pivot (v1.1)', () => {
  const logic = read('src/pages/onboarding/step-3/logic.ts');
  const ui = read('src/pages/onboarding/step-3/ui.tsx');

  it('logic derives + exposes hasBankResidence from Plaid sources', () => {
    expect(logic).toContain('resolvePlaidLegalResidence(financialResult.data?.identity_data)');
    expect(logic).toContain(
      "fieldSources['residence_country'] === 'plaid' || fieldSources['address_line_1'] === 'plaid'",
    );
    expect(logic).toContain('hasBankResidence,'); // returned from the hook
  });

  it('canContinue does NOT require residence/address when there is no bank residence', () => {
    const canContinue = logic.slice(
      logic.indexOf('const canContinue = Boolean('),
      logic.indexOf('const isErrorStatus'),
    );
    // residence/address/attestation are behind the hasBankResidence gate
    expect(canContinue).toContain('!hasBankResidence || (');
    expect(canContinue).toContain('residenceAttested');
    // citizenship is always required (outside the gate)
    expect(canContinue).toContain('citizenshipCountry &&');
  });

  it('ui gates the residence selector / address block / attestation behind hasBankResidence', () => {
    expect(ui).toContain('s.hasBankResidence && (');
    expect(ui).toContain('s.hasPlaidAddressLine2 && (');
    // citizenship dropdown is rendered before (outside) the first residence gate
    expect(ui.indexOf('handleCitizenshipChange')).toBeGreaterThan(-1);
    expect(ui.indexOf('handleCitizenshipChange')).toBeLessThan(
      ui.indexOf('s.hasBankResidence && ('),
    );
  });

  it('does not hydrate legal residence from cached GPS/current location fallbacks', () => {
    expect(logic).not.toContain('cachedLocationDetails.normalizedAddress.addressLine1');
    expect(logic).not.toContain('cachedLocationDetails.normalizedAddress.addressLine2');
    expect(logic).not.toContain('cachedLocationDetails.normalizedAddress.zipCode');
    expect(logic).not.toContain('cachedLocationDetails.matchedCountry');
    expect(logic).toContain('Object.assign(payload, buildStep3LegalResidenceClearPayload())');
  });
});
