import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildStep3SavePayload } from '../src/pages/onboarding/step-3/logic';
import { resolveStep4CachedDialCode } from '../src/pages/onboarding/step-4/logic';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('step 3 address save payload', () => {
  it('writes the normalized onboarding address columns that later screens read', () => {
    const payload = buildStep3SavePayload({
      citizenshipCountry: 'India',
      residenceCountry: 'United States',
      addressLine1: '1021 5TH ST W',
      addressLine2: 'Apt 4B',
      zipCode: '98033-5330',
      city: 'KIRKLAND',
      state: 'WA',
      addressCountry: 'United States',
      currentStep: 4,
    });

    expect(payload).toEqual({
      citizenship_country: 'India',
      residence_country: 'United States',
      current_step: 4,
      address_line_1: '1021 5TH ST W',
      address_line_2: 'Apt 4B',
      city: 'KIRKLAND',
      state: 'WA',
      zip_code: '98033-5330',
      address_country: 'United States',
    });
  });
});

describe('step 3 — GPS never fills legal fields (v1 model)', () => {
  const logic = read('src/pages/onboarding/step-3/logic.ts');

  it('removed the GPS→legal patch builder entirely', () => {
    expect(logic).not.toContain('buildStep3AutofillPatch');
  });

  it('applyDetectedLocation only updates the current-location banner, not legal inputs', () => {
    const fn = logic.slice(
      logic.indexOf('const applyDetectedLocation'),
      logic.indexOf('/* ─── GPS refresh ─── */'),
    );
    expect(fn).toContain('setDetectedLocation');
    // No legal-field writes from GPS:
    expect(fn).not.toContain('setResidenceCountry(');
    expect(fn).not.toContain('setCitizenshipCountry(');
    expect(fn).not.toContain('setAddressCity(');
    expect(fn).not.toContain('setAddressState(');
    expect(fn).not.toContain('setZipCode(');
    expect(fn).not.toContain('setAddressLine1(');
  });
});

describe('step 4 cached dial-code fallback', () => {
  it('resolves dial code from normalized cached location data without legacy GPS blob fields', () => {
    expect(resolveStep4CachedDialCode({
      savedPhoneCode: '',
      cachedLocation: {
        phoneDialCode: '+91',
        countryCode: 'IN',
      },
    })).toEqual({
      dialCode: '+91',
      countryIso: 'IN',
    });
  });
});
