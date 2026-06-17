/**
 * Phone dial-code helpers for onboarding.
 *
 * Relocated out of the now-removed orphan `pages/onboarding/step-4/logic.ts`
 * so the live combined details step (`step-3`) and its tests can share one
 * implementation without depending on a dead, unrouted page module.
 */

export interface DialCodeOption {
  code: string;
  country: string;
  iso: string;
}

export const resolveStep4CachedDialCode = ({
  savedPhoneCode,
  cachedLocation,
}: {
  savedPhoneCode?: string | null;
  cachedLocation?: { phoneDialCode?: string | null; countryCode?: string | null } | null;
}) => ({
  dialCode: savedPhoneCode
    ? String(savedPhoneCode)
    : cachedLocation?.phoneDialCode
    ? String(cachedLocation.phoneDialCode)
    : '',
  countryIso: cachedLocation?.countryCode ? String(cachedLocation.countryCode).toUpperCase() : '',
});

export const PHONE_DIAL_CODES: DialCodeOption[] = [
  { code: '+1', country: 'United States', iso: 'US' },
  { code: '+44', country: 'United Kingdom', iso: 'GB' },
  { code: '+33', country: 'France', iso: 'FR' },
  { code: '+49', country: 'Germany', iso: 'DE' },
  { code: '+39', country: 'Italy', iso: 'IT' },
  { code: '+34', country: 'Spain', iso: 'ES' },
  { code: '+31', country: 'Netherlands', iso: 'NL' },
  { code: '+91', country: 'India', iso: 'IN' },
  { code: '+86', country: 'China', iso: 'CN' },
  { code: '+81', country: 'Japan', iso: 'JP' },
  { code: '+82', country: 'South Korea', iso: 'KR' },
  { code: '+61', country: 'Australia', iso: 'AU' },
  { code: '+65', country: 'Singapore', iso: 'SG' },
  { code: '+971', country: 'United Arab Emirates', iso: 'AE' },
  { code: '+966', country: 'Saudi Arabia', iso: 'SA' },
  { code: '+55', country: 'Brazil', iso: 'BR' },
  { code: '+52', country: 'Mexico', iso: 'MX' },
  { code: '+7', country: 'Russia', iso: 'RU' },
  { code: '+62', country: 'Indonesia', iso: 'ID' },
  { code: '+60', country: 'Malaysia', iso: 'MY' },
  { code: '+66', country: 'Thailand', iso: 'TH' },
  { code: '+63', country: 'Philippines', iso: 'PH' },
  { code: '+92', country: 'Pakistan', iso: 'PK' },
  { code: '+880', country: 'Bangladesh', iso: 'BD' },
  { code: '+27', country: 'South Africa', iso: 'ZA' },
  { code: '+234', country: 'Nigeria', iso: 'NG' },
  { code: '+20', country: 'Egypt', iso: 'EG' },
  { code: '+90', country: 'Turkey', iso: 'TR' },
];
