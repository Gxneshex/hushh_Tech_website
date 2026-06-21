import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

/**
 * v2: every investor supplies legal residence + full address. Bank/Plaid data
 * can lock verified fields, while "Use current location" only helps prefill
 * blank self-declared fields for review.
 */
describe('step-3 residence visibility — full investor address', () => {
  const logic = read('src/pages/onboarding/step-3/logic.ts');
  const ui = read('src/pages/onboarding/step-3/ui.tsx');

  it('requires legal residence and full address before continuing', () => {
    const canContinue = logic.slice(
      logic.indexOf('const canContinue = Boolean('),
      logic.indexOf('const isErrorStatus'),
    );

    expect(canContinue).toContain('citizenshipCountry &&');
    expect(canContinue).toContain('residenceCountry &&');
    expect(canContinue).toContain('addressLine1.trim() &&');
    expect(canContinue).toContain('addressCity.trim() &&');
    expect(canContinue).toContain('addressState.trim() &&');
    expect(canContinue).toContain('zipCode.trim() &&');
    expect(canContinue).toContain('(!hasBankResidence || residenceAttested)');
  });

  it('renders residence selector, full address fields, and location prefill affordance', () => {
    expect(ui).toContain('Use current location');
    expect(ui).toContain('onChange={(e) => s.handleResidenceChange(e.target.value)}');
    expect(ui).toContain('onChange={(e) => s.handleAddressLine1Change(e.target.value)}');
    expect(ui).toContain('onChange={(e) => s.handleAddressCityChange(e.target.value)}');
    expect(ui).toContain('onChange={(e) => s.handleAddressStateChange(e.target.value)}');
    expect(ui).toContain('onChange={(e) => s.handleZipCodeChange(e.target.value)}');
    expect(ui).not.toContain('s.hasBankResidence && (\n                <div className="grid gap-3 border-t');
  });

  it('keeps bank-sourced residence fields read-only but allows self-declared prefill', () => {
    expect(logic).toContain("if (fieldSources['residence_country'] === 'plaid') return;");
    expect(logic).toContain("if (fieldSources['address_line_1'] === 'plaid') return;");
    expect(logic).toContain('!manualOverridesRef.current.addressLine1');
    expect(logic).toContain('setAddressLine1(normalizedAddress.addressLine1)');
    expect(logic).toContain('setAddressCity(normalizedAddress.city)');
    expect(logic).toContain('setZipCode(normalizedAddress.zipCode)');
  });

  it('persists residence and address fields for preview and real saves', () => {
    expect(logic).toContain('residence_country: residenceCountry');
    expect(logic).toContain('address_line_1: addressLine1.trim()');
    expect(logic).toContain('city: addressCity.trim()');
    expect(logic).toContain('state: addressState.trim()');
    expect(logic).toContain('zip_code: zipCode.trim()');
    expect(logic).toContain('addressCountry: addressCountry || residenceCountry');
    expect(logic).not.toContain('Object.assign(payload, buildStep3LegalResidenceClearPayload())');
  });
});
