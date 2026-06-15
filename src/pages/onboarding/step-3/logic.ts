/**
 * Step 3 — Combined Country/Residence + Address Entry
 *
 * Merges old step-3 (country detection) and old step-6 (address entry).
 * GPS fires ONCE and auto-fills: citizenship, residence, address line, zip.
 * Country/State/City are stored via GPS columns (gps_country, gps_state, gps_city)
 * — no manual dropdowns needed.
 *
 * Flow: step-2 → step-3 → step-6
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import {
  TOTAL_VISIBLE_ONBOARDING_STEPS,
  isCurrentLocalOnboardingPreview,
  withLocalOnboardingPreview,
} from '../../../services/onboarding/flow';
import { resolveOnboardingPrefill } from '../../../services/onboarding/prefill';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import { useFooterVisibility } from '../../../utils/useFooterVisibility';
import {
  locationService,
  type LocationCacheRecord,
  type LocationData,
  COUNTRY_CODE_TO_NAME,
  isClearlyTruncatedAddressLine1,
  looksLikeAutoFilledCityStateLine2,
  normalizeDetectedAddress,
} from '../../../services/location';
import {
  MONTH_NAMES,
  buildDobYearOptions,
  resolveDobEligibility,
} from '../step-6/logic';
import {
  PHONE_DIAL_CODES,
  resolveStep4CachedDialCode,
  type DialCodeOption,
} from '../step-4/logic';

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

export const CURRENT_STEP = 4; // raw Supabase current_step value
export const TOTAL_STEPS = TOTAL_VISIBLE_ONBOARDING_STEPS;
export const PROGRESS_PCT = Math.round((3 / TOTAL_STEPS) * 100); // display step = 3

// Country list for citizenship/residence dropdowns
export const countries = [
  'United States','Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin',
  'Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cambodia','Cameroon','Canada','Cape Verde','Central African Republic','Chad','Chile','China',
  'Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti',
  'Dominica','Dominican Republic','East Timor','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea',
  'Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece',
  'Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya',
  'Kiribati','North Korea','South Korea','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia',
  'Libya','Liechtenstein','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','Norway','Oman','Pakistan','Palau','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore',
  'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Swaziland','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo',
  'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela',
  'Vietnam','Yemen','Zambia','Zimbabwe',
];

export type LocationStatus = 'detecting' | 'success' | 'ip-success' | 'denied' | 'failed' | 'manual' | null;

export interface Step3AddressFields {
  addressLine1: string;
  addressLine2: string;
  zipCode: string;
  city: string;
  state: string;
  addressCountry: string;
}

export interface Step3FormState extends Step3AddressFields {
  citizenshipCountry: string;
  residenceCountry: string;
}

export interface Step3ManualOverrides {
  citizenshipCountry: boolean;
  residenceCountry: boolean;
  addressLine1: boolean;
  addressLine2: boolean;
  city: boolean;
  state: boolean;
  zipCode: boolean;
}

/* ═══════════════════════════════════════════════
   ADDRESS VALIDATION
   ═══════════════════════════════════════════════ */

export const validateAddress = (v: string) => {
  if (!v.trim()) return 'Address is required';
  if (v.trim().length < 5) return 'Address is too short';
  if (v.trim().length > 100) return 'Address is too long';
  if (!/[a-zA-Z]/.test(v)) return 'Please enter a valid address';
  return undefined;
};

export const validateRequired = (v: string, label: string) =>
  !v ? `Please select a ${label}` : undefined;

export const validateZip = (v: string) => {
  if (!v.trim()) return 'ZIP / postal code is required';
  if (v.trim().length < 3 || v.trim().length > 10) return 'Enter a valid postal code';
  return undefined;
};

export const validateLocationText = (v: string, label: string) => {
  const value = v.trim();
  if (!value) return `${label} is required`;
  if (value.length > 80) return `${label} is too long`;
  if (!/[a-zA-Z]/.test(value)) return `Please enter a valid ${label.toLowerCase()}`;
  return undefined;
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

export const getTrustedStep4Countries = (onboardingData: {
  citizenship_country?: string | null;
  residence_country?: string | null;
  current_step?: number | null;
} | null | undefined): {
  citizenship_country?: string;
  residence_country?: string;
} => {
  if (!onboardingData) return {};
  const currentStep =
    typeof onboardingData.current_step === 'number'
      ? onboardingData.current_step
      : Number(onboardingData.current_step || 0);
  if (!Number.isFinite(currentStep) || currentStep < 4) return {};
  return {
    citizenship_country: onboardingData.citizenship_country || undefined,
    residence_country: onboardingData.residence_country || undefined,
  };
};

const getStatusFromCacheRecord = (
  cacheRecord: LocationCacheRecord | null
): LocationStatus => {
  if (!cacheRecord) return null;
  return cacheRecord.source === 'gps' ? 'success' : 'ip-success';
};

/** Check browser geolocation permission state without triggering the prompt. */
const checkGeoPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
  } catch {
    // Permissions API not supported
  }
  return 'prompt';
};

export const resolveDetectedLocationForStep3 = (
  locationData: LocationData,
  availableCountries: string[] = countries
) => {
  const countryName = COUNTRY_CODE_TO_NAME[locationData.countryCode] || locationData.country;
  const matchedCountry = availableCountries.includes(countryName) ? countryName : '';
  const normalizedAddress = normalizeDetectedAddress(locationData, countryName);

  return {
    matchedCountry,
    normalizedAddress: {
      addressLine1: normalizedAddress.addressLine1,
      addressLine2: normalizedAddress.addressLine2,
      zipCode: normalizedAddress.zipCode,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      addressCountry: normalizedAddress.country,
    } satisfies Step3AddressFields,
    detectedLocation:
      locationData.formattedAddress || locationData.city || locationData.state || countryName,
  };
};

export const buildStep3AutofillPatch = ({
  current,
  manual,
  locationData,
  availableCountries = countries,
}: {
  current: Step3FormState;
  manual: Step3ManualOverrides;
  locationData: LocationData;
  availableCountries?: string[];
}): Partial<Step3FormState> => {
  const { matchedCountry, normalizedAddress } = resolveDetectedLocationForStep3(
    locationData,
    availableCountries
  );
  const patch: Partial<Step3FormState> = {};

  if (!manual.citizenshipCountry && matchedCountry && current.citizenshipCountry !== matchedCountry) {
    patch.citizenshipCountry = matchedCountry;
  }

  if (!manual.residenceCountry && matchedCountry && current.residenceCountry !== matchedCountry) {
    patch.residenceCountry = matchedCountry;
  }

  if (
    !manual.addressLine1 &&
    normalizedAddress.addressLine1 &&
    current.addressLine1 !== normalizedAddress.addressLine1
  ) {
    patch.addressLine1 = normalizedAddress.addressLine1;
  }

  if (!manual.addressLine2 && current.addressLine2 !== normalizedAddress.addressLine2) {
    patch.addressLine2 = normalizedAddress.addressLine2;
  }

  if (!manual.zipCode && normalizedAddress.zipCode && current.zipCode !== normalizedAddress.zipCode) {
    patch.zipCode = normalizedAddress.zipCode;
  }

  if (!manual.city && normalizedAddress.city && current.city !== normalizedAddress.city) {
    patch.city = normalizedAddress.city;
  }

  if (!manual.state && normalizedAddress.state && current.state !== normalizedAddress.state) {
    patch.state = normalizedAddress.state;
  }

  if (normalizedAddress.addressCountry && current.addressCountry !== normalizedAddress.addressCountry) {
    patch.addressCountry = normalizedAddress.addressCountry;
  }

  return patch;
};

export const buildStep3SavePayload = ({
  citizenshipCountry,
  residenceCountry,
  addressLine1,
  addressLine2,
  zipCode,
  city,
  state,
  addressCountry,
  currentStep = 4,
}: Step3FormState & { currentStep?: number }): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    citizenship_country: citizenshipCountry,
    residence_country: residenceCountry,
    current_step: currentStep,
  };

  const hasAddressContext = Boolean(
    addressLine1.trim() ||
    addressLine2.trim() ||
    zipCode.trim() ||
    city.trim() ||
    state.trim() ||
    addressCountry.trim()
  );

  if (addressLine1.trim()) payload.address_line_1 = addressLine1.trim();
  if (zipCode.trim()) payload.zip_code = zipCode.trim();
  if (city.trim()) payload.city = city.trim();
  if (state.trim()) payload.state = state.trim();
  if (addressCountry.trim()) payload.address_country = addressCountry.trim();
  if (hasAddressContext) payload.address_line_2 = addressLine2.trim() || null;

  return payload;
};

const isUnitedStatesInvestor = (country?: string | null) => {
  const normalized = String(country || '').trim().toLowerCase();
  return normalized === 'united states' ||
    normalized === 'united states of america' ||
    normalized === 'us' ||
    normalized === 'usa';
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  return digits;
};

/* ═══════════════════════════════════════════════
   COMBINED HOOK
   ═══════════════════════════════════════════════ */

export function useCombinedLocationLogic() {
  const navigate = useNavigate();
  const isPreview = isCurrentLocalOnboardingPreview();
  const isFooterVisible = useFooterVisibility();
  const autoDetectionStartedRef = useRef(false);
  const citizenshipCountryRef = useRef('');
  const residenceCountryRef = useRef('');
  const manualOverridesRef = useRef<Step3ManualOverrides>({
    citizenshipCountry: false,
    residenceCountry: false,
    addressLine1: false,
    addressLine2: false,
    city: false,
    state: false,
    zipCode: false,
  });
  const formStateRef = useRef<Step3FormState>({
    citizenshipCountry: '',
    residenceCountry: '',
    addressLine1: '',
    addressLine2: '',
    zipCode: '',
    city: '',
    state: '',
    addressCountry: '',
  });

  // ─── Auth ───
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Identity fields ───
  const [legalFirstName, setLegalFirstName] = useState('');
  const [legalLastName, setLegalLastName] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [ssn, setSsn] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [selectedDialCountryIso, setSelectedDialCountryIso] = useState('US');

  // ─── Country/Residence fields ───
  const [citizenshipCountry, setCitizenshipCountry] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');

  // ─── Address fields ───
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressCountry, setAddressCountry] = useState('');

  // ─── Location detection state ───
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(null);
  const [detectedLocation, setDetectedLocation] = useState('');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // ─── Auto-fill status (simple — no cascade needed) ───
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string | null>(null);

  // ─── Validation state ───
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Per-field provenance for the "From your bank" notation. Only fields whose
  // value came from the linked bank (Plaid identity) are marked 'plaid'.
  const [fieldSources, setFieldSources] = useState<Partial<Record<string, string>>>({});
  const markFieldEdited = (key: string) => {
    setFieldSources((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ─── Derived state ───
  const dobEligibility = resolveDobEligibility(dobMonth, dobDay, dobYear);
  const isUnder18 =
    dobEligibility.isComplete && dobEligibility.isValidDate && !dobEligibility.isAdult;
  const ageError = dobEligibility.ageError;
  const yearOptions = buildDobYearOptions();
  const daysInMonth = dobMonth && dobYear
    ? new Date(parseInt(dobYear, 10), parseInt(dobMonth, 10), 0).getDate()
    : 31;
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const isDobValid =
    dobEligibility.isComplete && dobEligibility.isValidDate && dobEligibility.isAdult;
  const isUsInvestor =
    isUnitedStatesInvestor(citizenshipCountry) ||
    isUnitedStatesInvestor(residenceCountry);
  const isValidSsn = ssn.replace(/\D/g, '').length === 9;
  const isTaxReady = !isUsInvestor || isValidSsn;
  const isValidPhone = phoneNumber.length >= 8 && phoneNumber.length <= 15;
  const selectedDialOption = useMemo(() => {
    return PHONE_DIAL_CODES.find((option) => option.code === countryCode && option.iso === selectedDialCountryIso)
      || PHONE_DIAL_CODES.find((option) => option.code === countryCode)
      || PHONE_DIAL_CODES[0];
  }, [countryCode, selectedDialCountryIso]);
  const canContinue = Boolean(
    legalFirstName.trim() &&
    legalLastName.trim() &&
    isDobValid &&
    citizenshipCountry &&
    residenceCountry &&
    addressLine1.trim() &&
    addressCity.trim() &&
    addressState.trim() &&
    zipCode.trim() &&
    isTaxReady &&
    isValidPhone
  );
  const isErrorStatus = locationStatus === 'denied' || locationStatus === 'failed';
  const isSuccessStatus = locationStatus === 'success' || locationStatus === 'ip-success';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.classList.add('onboarding-page-scroll');
    document.body.classList.add('onboarding-page-scroll');
    return () => {
      document.documentElement.classList.remove('onboarding-page-scroll');
      document.body.classList.remove('onboarding-page-scroll');
    };
  }, []);

  // Keep refs in sync
  useEffect(() => { citizenshipCountryRef.current = citizenshipCountry; }, [citizenshipCountry]);
  useEffect(() => { residenceCountryRef.current = residenceCountry; }, [residenceCountry]);
  useEffect(() => {
    formStateRef.current = {
      citizenshipCountry,
      residenceCountry,
      addressLine1,
      addressLine2,
      zipCode,
      city: addressCity,
      state: addressState,
      addressCountry,
    };
  }, [
    citizenshipCountry,
    residenceCountry,
    addressLine1,
    addressLine2,
    zipCode,
    addressCity,
    addressState,
    addressCountry,
  ]);

  useEffect(() => {
    if (dobDay && parseInt(dobDay, 10) > daysInMonth) {
      setDobDay(String(daysInMonth).padStart(2, '0'));
    }
  }, [dobMonth, dobYear, dobDay, daysInMonth]);

  /* ─── Apply GPS result to fields (country + address + zip) ─── */
  const applyDetectedLocation = (locationData: LocationData, status: LocationStatus) => {
    const { detectedLocation: nextDetectedLocation } = resolveDetectedLocationForStep3(
      locationData,
      countries
    );
    const patch = buildStep3AutofillPatch({
      current: formStateRef.current,
      manual: manualOverridesRef.current,
      locationData,
      availableCountries: countries,
    });

    if (patch.citizenshipCountry !== undefined) {
      citizenshipCountryRef.current = patch.citizenshipCountry;
      setCitizenshipCountry(patch.citizenshipCountry);
    }

    if (patch.residenceCountry !== undefined) {
      residenceCountryRef.current = patch.residenceCountry;
      setResidenceCountry(patch.residenceCountry);
    }

    if (patch.addressLine1 !== undefined) {
      setAddressLine1(patch.addressLine1);
    }

    if (patch.addressLine2 !== undefined) {
      setAddressLine2(patch.addressLine2);
    }

    if (patch.zipCode !== undefined) {
      setZipCode(patch.zipCode);
    }

    if (patch.city !== undefined) {
      setAddressCity(patch.city);
    }

    if (patch.state !== undefined) {
      setAddressState(patch.state);
    }

    if (patch.addressCountry !== undefined) {
      setAddressCountry(patch.addressCountry);
    }

    setDetectedLocation(nextDetectedLocation);
    setLocationDetected(true);
    setLocationStatus(status);

    // Show auto-fill success
    setIsAutoFilling(false);
    setDetectionStatus('Address auto-filled from GPS');
    setTimeout(() => setDetectionStatus(null), 3000);
  };

  /* ─── GPS refresh ─── */
  const refreshLocation = async (uid: string) => {
    setIsDetectingLocation(true);
    setLocationStatus('detecting');
    try {
      const result = await locationService.refreshStep4Location(uid);
      if (result.fresh) {
        applyDetectedLocation(
          result.fresh.data,
          result.fresh.source === 'gps' ? 'success' : 'ip-success'
        );
        // Save to DB in background (GPS columns are written here)
        locationService
          .saveLocationToOnboarding(uid, result.fresh.data, result.fresh.source === 'gps' ? 'gps' : 'ip')
          .catch(() => {});
        return;
      }
      if (result.cached) {
        applyDetectedLocation(result.cached.data, getStatusFromCacheRecord(result.cached));
        return;
      }
      setLocationStatus('failed');
    } catch (err) {
      console.error('[Step3-Combined] Location refresh error:', err);
      const cachedRecord = await locationService.readSharedLocationCache(uid);
      if (cachedRecord) {
        applyDetectedLocation(cachedRecord.data, getStatusFromCacheRecord(cachedRecord));
      } else {
        setLocationStatus('failed');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  /* ─── Init: Load saved data, detect location ─── */
  useEffect(() => {
    const init = async () => {
      if (isPreview) {
        setUserId('local-preview');
        const saved = window.localStorage.getItem('hushh_onboarding_preview');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.legal_first_name) setLegalFirstName(String(parsed.legal_first_name));
          if (parsed.legal_last_name) setLegalLastName(String(parsed.legal_last_name));
          if (parsed.date_of_birth) {
            const [savedYear, savedMonth, savedDay] = String(parsed.date_of_birth).split('-');
            if (savedYear && savedMonth && savedDay) {
              setDobYear(savedYear);
              setDobMonth(savedMonth);
              setDobDay(savedDay);
            }
          }
          if (parsed.citizenship_country) setCitizenshipCountry(String(parsed.citizenship_country));
          if (parsed.residence_country) setResidenceCountry(String(parsed.residence_country));
          if (parsed.address_line_1) setAddressLine1(String(parsed.address_line_1));
          if (parsed.address_line_2) setAddressLine2(String(parsed.address_line_2));
          if (parsed.city) setAddressCity(String(parsed.city));
          if (parsed.state) setAddressState(String(parsed.state));
          if (parsed.zip_code) setZipCode(String(parsed.zip_code));
          if (parsed.address_country) setAddressCountry(String(parsed.address_country));
          if (parsed.ssn_encrypted) setSsn(String(parsed.ssn_encrypted));
          if (parsed.phone_number) {
            setPhoneNumber(String(parsed.phone_number).replace(/\D/g, ''));
          }
          if (parsed.phone_country_code) setCountryCode(String(parsed.phone_country_code));
        }
        return;
      }
      if (!config.supabaseClient) return;
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      // Fetch all relevant data in parallel
      const [onboardingResult, financialResult, enrichedResult, sharedCache] = await Promise.all([
        config.supabaseClient
          .from('onboarding_data')
          .select(`
            citizenship_country, residence_country, current_step,
            legal_first_name, legal_last_name, date_of_birth,
            address_line_1, address_line_2, city, state, zip_code, address_country,
            ssn_encrypted, phone_number, phone_country_code
          `)
          .eq('user_id', user.id)
          .maybeSingle(),
        config.supabaseClient
          .from('user_financial_data')
          .select('identity_data')
          .eq('user_id', user.id)
          .maybeSingle(),
        config.supabaseClient
          .from('user_enriched_profiles')
          .select('enriched_address_line1, enriched_address_zip')
          .eq('user_id', user.id)
          .maybeSingle(),
        locationService.readSharedLocationCache(user.id),
      ]);

      const cachedLocation = sharedCache?.data || await locationService.getCachedLocation(user.id);
      const onboardingData = onboardingResult.data || null;
      if (onboardingData?.legal_first_name) {
        setLegalFirstName(String(onboardingData.legal_first_name));
      }
      if (onboardingData?.legal_last_name) {
        setLegalLastName(String(onboardingData.legal_last_name));
      }
      if (onboardingData?.date_of_birth) {
        const [savedYear, savedMonth, savedDay] = String(onboardingData.date_of_birth).split('-');
        if (savedYear && savedMonth && savedDay) {
          setDobYear(savedYear);
          setDobMonth(savedMonth);
          setDobDay(savedDay);
        }
      }
      if (onboardingData?.ssn_encrypted && onboardingData.ssn_encrypted !== '999-99-9999') {
        setSsn(String(onboardingData.ssn_encrypted));
      }
      if (onboardingData?.phone_number) {
        setPhoneNumber(String(onboardingData.phone_number).replace(/\D/g, ''));
      }
      const cachedDialState = resolveStep4CachedDialCode({
        savedPhoneCode: onboardingData?.phone_country_code ? String(onboardingData.phone_country_code) : '',
        cachedLocation,
      });
      if (cachedDialState.dialCode) {
        setCountryCode(cachedDialState.dialCode);
        const matchedIso = cachedDialState.countryIso
          ? PHONE_DIAL_CODES.find((option) => option.iso === cachedDialState.countryIso)
          : PHONE_DIAL_CODES.find((option) => option.code === cachedDialState.dialCode);
        if (matchedIso) setSelectedDialCountryIso(matchedIso.iso);
      }
      const initialFormState: Step3FormState = {
        citizenshipCountry: '',
        residenceCountry: '',
        addressLine1: '',
        addressLine2: '',
        zipCode: '',
        city: '',
        state: '',
        addressCountry: '',
      };

      // ─── Prefill citizenship/residence countries ───
      const trustedCountries = getTrustedStep4Countries(onboardingData);
      const resolved = resolveOnboardingPrefill({
        onboardingData: { ...trustedCountries, ...(onboardingData || {}) },
        plaidIdentity: financialResult.data?.identity_data,
        enrichedProfile: enrichedResult.data
          ? {
              address_line_1: enrichedResult.data.enriched_address_line1 || '',
              zip_code: enrichedResult.data.enriched_address_zip || '',
            }
          : undefined,
        locationData: cachedLocation || undefined,
      });

      initialFormState.citizenshipCountry = resolved.values.citizenship_country || '';
      initialFormState.residenceCountry = resolved.values.residence_country || '';
      initialFormState.addressLine1 = resolved.values.address_line_1 || '';
      initialFormState.addressLine2 = resolved.values.address_line_2 || '';
      initialFormState.zipCode = resolved.values.zip_code || '';
      initialFormState.city = resolved.values.city || '';
      initialFormState.state = resolved.values.state || '';
      initialFormState.addressCountry = resolved.values.address_country || '';

      if (cachedLocation) {
        const cachedLocationDetails = resolveDetectedLocationForStep3(cachedLocation, countries);

        if (
          !initialFormState.addressLine1 ||
          isClearlyTruncatedAddressLine1(
            initialFormState.addressLine1,
            cachedLocationDetails.normalizedAddress.addressLine1
          )
        ) {
          initialFormState.addressLine1 = cachedLocationDetails.normalizedAddress.addressLine1;
        }

        if (
          !initialFormState.addressLine2 ||
          looksLikeAutoFilledCityStateLine2(
            initialFormState.addressLine2,
            cachedLocationDetails.normalizedAddress.city,
            cachedLocationDetails.normalizedAddress.state
          )
        ) {
          initialFormState.addressLine2 = cachedLocationDetails.normalizedAddress.addressLine2;
        }

        if (!initialFormState.zipCode && cachedLocationDetails.normalizedAddress.zipCode) {
          initialFormState.zipCode = cachedLocationDetails.normalizedAddress.zipCode;
        }

        if (!initialFormState.city && cachedLocationDetails.normalizedAddress.city) {
          initialFormState.city = cachedLocationDetails.normalizedAddress.city;
        }

        if (!initialFormState.state && cachedLocationDetails.normalizedAddress.state) {
          initialFormState.state = cachedLocationDetails.normalizedAddress.state;
        }

        if (!initialFormState.addressCountry && cachedLocationDetails.normalizedAddress.addressCountry) {
          initialFormState.addressCountry = cachedLocationDetails.normalizedAddress.addressCountry;
        }

        if (!initialFormState.citizenshipCountry && cachedLocationDetails.matchedCountry) {
          initialFormState.citizenshipCountry = cachedLocationDetails.matchedCountry;
        }

        if (!initialFormState.residenceCountry && cachedLocationDetails.matchedCountry) {
          initialFormState.residenceCountry = cachedLocationDetails.matchedCountry;
        }
      }

      citizenshipCountryRef.current = initialFormState.citizenshipCountry;
      residenceCountryRef.current = initialFormState.residenceCountry;
      formStateRef.current = initialFormState;

      if (initialFormState.citizenshipCountry) setCitizenshipCountry(initialFormState.citizenshipCountry);
      if (initialFormState.residenceCountry) setResidenceCountry(initialFormState.residenceCountry);
      if (initialFormState.addressLine1) setAddressLine1(initialFormState.addressLine1);
      if (initialFormState.addressLine2) setAddressLine2(initialFormState.addressLine2);
      if (initialFormState.zipCode) setZipCode(initialFormState.zipCode);
      if (initialFormState.city) setAddressCity(initialFormState.city);
      if (initialFormState.state) setAddressState(initialFormState.state);
      if (initialFormState.addressCountry) setAddressCountry(initialFormState.addressCountry);

      // ─── Auto-fill name + phone from the linked bank (Plaid) when the user
      //     hasn't already saved them, and record per-field provenance for the
      //     "From your bank" notation. Plaid-sourced address fields are locked
      //     (manualOverridesRef) so the GPS auto-detect below cannot overwrite
      //     the bank's authoritative values.
      if (!onboardingData?.legal_first_name && resolved.values.legal_first_name) {
        setLegalFirstName(resolved.values.legal_first_name);
      }
      if (!onboardingData?.legal_last_name && resolved.values.legal_last_name) {
        setLegalLastName(resolved.values.legal_last_name);
      }
      if (!onboardingData?.phone_number && resolved.values.phone_number) {
        setPhoneNumber(String(resolved.values.phone_number).replace(/\D/g, '').slice(0, 15));
      }
      if (!onboardingData?.phone_country_code && resolved.values.phone_country_code) {
        setCountryCode(resolved.values.phone_country_code);
        const matchedBankDial = PHONE_DIAL_CODES.find((o) => o.code === resolved.values.phone_country_code);
        if (matchedBankDial) setSelectedDialCountryIso(matchedBankDial.iso);
      }

      const bankSources: Record<string, string> = {};
      if (resolved.sources.legal_first_name === 'plaid' && resolved.values.legal_first_name) {
        bankSources.legal_first_name = 'plaid';
      }
      if (resolved.sources.legal_last_name === 'plaid' && resolved.values.legal_last_name) {
        bankSources.legal_last_name = 'plaid';
      }
      if (resolved.sources.phone_number === 'plaid' && resolved.values.phone_number) {
        bankSources.phone_number = 'plaid';
      }
      // Address fields: mark + lock only when the final form value still equals the bank value
      // (the GPS/cached-location patch above may have replaced a truncated bank value).
      if (resolved.sources.address_line_1 === 'plaid' && initialFormState.addressLine1 === resolved.values.address_line_1) {
        bankSources.address_line_1 = 'plaid';
        manualOverridesRef.current.addressLine1 = true;
      }
      if (resolved.sources.address_line_2 === 'plaid' && initialFormState.addressLine2 && initialFormState.addressLine2 === resolved.values.address_line_2) {
        bankSources.address_line_2 = 'plaid';
        manualOverridesRef.current.addressLine2 = true;
      }
      if (resolved.sources.city === 'plaid' && initialFormState.city === resolved.values.city) {
        bankSources.city = 'plaid';
        manualOverridesRef.current.city = true;
      }
      if (resolved.sources.state === 'plaid' && initialFormState.state === resolved.values.state) {
        bankSources.state = 'plaid';
        manualOverridesRef.current.state = true;
      }
      if (resolved.sources.zip_code === 'plaid' && initialFormState.zipCode === resolved.values.zip_code) {
        bankSources.zip_code = 'plaid';
        manualOverridesRef.current.zipCode = true;
      }
      if (resolved.sources.residence_country === 'plaid' && initialFormState.residenceCountry === resolved.values.residence_country) {
        bankSources.residence_country = 'plaid';
        manualOverridesRef.current.residenceCountry = true;
      }
      if (Object.keys(bankSources).length > 0) setFieldSources(bankSources);

      // Fallback: extract country from cached GPS for citizenship/residence
      if (cachedLocation) {
        const cachedCountryName = COUNTRY_CODE_TO_NAME[cachedLocation.countryCode] || cachedLocation.country;
        const matchedCached = countries.includes(cachedCountryName) ? cachedCountryName : '';
        if (!citizenshipCountryRef.current && matchedCached) {
          citizenshipCountryRef.current = matchedCached;
          setCitizenshipCountry(matchedCached);
        }
        if (!residenceCountryRef.current && matchedCached) {
          residenceCountryRef.current = matchedCached;
          setResidenceCountry(matchedCached);
        }
        setDetectedLocation(
          cachedLocation.formattedAddress || cachedLocation.city || cachedLocation.state || cachedLocation.country
        );
        setLocationDetected(true);
        setLocationStatus(getStatusFromCacheRecord(sharedCache) || 'ip-success');
      }

      // ─── Auto-detect GPS if needed ───
      if (!autoDetectionStartedRef.current) {
        autoDetectionStartedRef.current = true;
        if (cachedLocation) {
          void refreshLocation(user.id);
        } else {
          const permState = await checkGeoPermission();
          if (permState === 'granted') {
            void refreshLocation(user.id);
          } else {
            setShowLocationModal(true);
          }
        }
      }
    };
    init();
    return () => { locationService.cancel(); };
  }, [isPreview, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Country/Residence handlers ─── */
  const handleCitizenshipChange = (value: string) => {
    manualOverridesRef.current.citizenshipCountry = true;
    citizenshipCountryRef.current = value;
    setCitizenshipCountry(value);
    setLocationStatus('manual');
  };

  const handleResidenceChange = (value: string) => {
    manualOverridesRef.current.residenceCountry = true;
    markFieldEdited('residence_country');
    residenceCountryRef.current = value;
    setResidenceCountry(value);
    setLocationStatus('manual');
  };

  /* ─── Location modal handlers ─── */
  const handleAllowLocation = async () => {
    if (!userId) return;
    setShowLocationModal(false);
    await refreshLocation(userId);
  };
  const handleDontAllow = () => {
    setShowLocationModal(false);
    setLocationStatus('manual');
  };

  const handleRetry = async () => {
    if (userId) await refreshLocation(userId);
  };

  const handleDetectClick = async () => {
    if (!userId) return;
    setIsDetectingLocation(true);
    setIsAutoFilling(true);
    setDetectionStatus('Detecting location...');
    try {
      const result = await locationService.detectLocation();
      if (result.data) {
        applyDetectedLocation(
          result.data,
          result.source === 'detected' ? 'success' : 'ip-success'
        );
        locationService
          .saveLocationToOnboarding(userId, result.data, result.source === 'detected' ? 'gps' : 'ip')
          .catch(() => {});
      } else {
        setDetectionStatus(null);
        setIsAutoFilling(false);
      }
    } catch {
      setDetectionStatus(null);
      setIsAutoFilling(false);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  /* ─── Address field handlers ─── */
  const handleAddressLine1Change = (value: string) => {
    manualOverridesRef.current.addressLine1 = true;
    markFieldEdited('address_line_1');
    setAddressLine1(value);
    if (touched.addressLine1) setErrors((p) => ({ ...p, addressLine1: validateAddress(value) }));
  };

  const handleAddressLine2Change = (value: string) => {
    manualOverridesRef.current.addressLine2 = true;
    markFieldEdited('address_line_2');
    setAddressLine2(value);
  };

  const handleAddressCityChange = (value: string) => {
    manualOverridesRef.current.city = true;
    markFieldEdited('city');
    setAddressCity(value);
    if (touched.addressCity) setErrors((p) => ({ ...p, addressCity: validateLocationText(value, 'City') }));
  };

  const handleAddressStateChange = (value: string) => {
    manualOverridesRef.current.state = true;
    markFieldEdited('state');
    setAddressState(value);
    if (touched.addressState) setErrors((p) => ({ ...p, addressState: validateLocationText(value, 'State / region') }));
  };

  const handleZipCodeChange = (value: string) => {
    const next = value.slice(0, 10);
    manualOverridesRef.current.zipCode = true;
    markFieldEdited('zip_code');
    setZipCode(next);
    if (touched.zipCode) setErrors((p) => ({ ...p, zipCode: validateZip(next) }));
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const handleSSNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSsn(formatSSN(event.target.value));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    markFieldEdited('phone_number');
    setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 15));
  };

  const handleSelectDialCode = (option: DialCodeOption) => {
    setCountryCode(option.code);
    setSelectedDialCountryIso(option.iso);
  };

  const validate = (field: string, value: string) => {
    switch (field) {
      case 'addressLine1': return validateAddress(value);
      case 'addressCity': return validateLocationText(value, 'City');
      case 'addressState': return validateLocationText(value, 'State / region');
      case 'zipCode': return validateZip(value);
      default: return undefined;
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ({ ...p, [field]: validate(field, value) }));
  };

  const validateAll = () => {
    const next = {
      addressLine1: validateAddress(addressLine1),
      addressCity: validateLocationText(addressCity, 'City'),
      addressState: validateLocationText(addressState, 'State / region'),
      zipCode: validateZip(zipCode),
    };
    setErrors(next);
    setTouched({ addressLine1: true, addressCity: true, addressState: true, zipCode: true });
    return !Object.values(next).some(Boolean);
  };

  /* ─── Navigation ─── */
  const handleContinue = async () => {
    if (!userId || (!isPreview && !config.supabaseClient)) return;

    if (!legalFirstName.trim() || !legalLastName.trim()) {
      setError('Please enter your legal first and last name');
      return;
    }

    if (!dobEligibility.isComplete) {
      setError('Please enter your date of birth');
      return;
    }

    if (!dobEligibility.isValidDate) {
      setError('Please enter a valid date of birth');
      return;
    }

    if (!dobEligibility.isAdult) {
      setError(ageError || 'You must be at least 18 years old to continue');
      return;
    }

    if (!citizenshipCountry || !residenceCountry) {
      setError('Please confirm citizenship and residence');
      return;
    }

    if (!validateAll()) {
      setError('Please enter your complete residence address');
      return;
    }

    if (isUsInvestor && !isValidSsn) {
      setError('Please enter a valid SSN for US tax reporting');
      return;
    }

    if (!isValidPhone) {
      setError('Please enter a valid contact number');
      return;
    }

    if (isPreview) {
      const saved = window.localStorage.getItem('hushh_onboarding_preview');
      const parsed = saved ? JSON.parse(saved) : {};
      window.localStorage.setItem('hushh_onboarding_preview', JSON.stringify({
        ...parsed,
        legal_first_name: legalFirstName.trim(),
        legal_last_name: legalLastName.trim(),
        date_of_birth: `${dobYear}-${dobMonth}-${dobDay}`,
        citizenship_country: citizenshipCountry,
        residence_country: residenceCountry,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || null,
        city: addressCity.trim() || null,
        state: addressState.trim() || null,
        zip_code: zipCode.trim(),
        address_country: addressCountry.trim() || residenceCountry,
        ssn_encrypted: ssn || (isUsInvestor ? null : '999-99-9999'),
        phone_number: phoneNumber,
        phone_country_code: countryCode,
      }));
      navigate(withLocalOnboardingPreview('/onboarding/step-4'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = buildStep3SavePayload({
        citizenshipCountry,
        residenceCountry,
        addressLine1,
        addressLine2,
        zipCode,
        city: addressCity,
        state: addressState,
        addressCountry,
        currentStep: 9,
      } as Step3FormState & { currentStep: number });
      payload.legal_first_name = legalFirstName.trim();
      payload.legal_last_name = legalLastName.trim();
      payload.date_of_birth = `${dobYear}-${dobMonth}-${dobDay}`;
      payload.ssn_encrypted = ssn || (isUsInvestor ? null : '999-99-9999');
      payload.phone_number = phoneNumber;
      payload.phone_country_code = countryCode;

      const { error: saveError } = await upsertOnboardingData(userId, payload);
      if (saveError) {
        throw new Error(saveError.message);
      }
      navigate('/onboarding/step-4');
    } catch (err) {
      console.error('[Step3-Combined] Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate(withLocalOnboardingPreview('/onboarding/step-2'));

  const handleSkip = async () => {
    if (isLoading) return;
    if (isPreview) {
      navigate(withLocalOnboardingPreview('/onboarding/step-4'));
      return;
    }
    setIsLoading(true);
    try {
      if (userId && config.supabaseClient) {
        const { error: saveError } = await upsertOnboardingData(userId, { current_step: 9 });
        if (saveError) {
          throw new Error(saveError.message);
        }
      }
      navigate('/onboarding/step-4');
    } catch (err) {
      console.error('[Step3-Combined] Skip save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Identity
    legalFirstName,
    legalLastName,
    dobMonth,
    dobDay,
    dobYear,
    setLegalFirstName,
    setLegalLastName,
    setDobMonth,
    setDobDay,
    setDobYear,
    monthNames: MONTH_NAMES,
    yearOptions,
    dayOptions,
    isUnder18,
    ageError,
    ssn,
    phoneNumber,
    countryCode,
    selectedDialOption,
    isUsInvestor,
    isValidPhone,
    formatPhoneNumber,
    handleSSNChange,
    handlePhoneChange,
    handleSelectDialCode,
    phoneDialCodes: PHONE_DIAL_CODES,
    fieldSources,
    markFieldEdited,
    hasBankPrefill: Object.values(fieldSources).some((v) => v === 'plaid'),
    // A field whose value is bank-verified (Plaid) is locked read-only — the
    // verification badge attests it, so it's changed by re-linking the bank.
    isPlaidLocked: (key: string) => fieldSources[key] === 'plaid',

    // Country/Residence
    citizenshipCountry,
    residenceCountry,
    handleCitizenshipChange,
    handleResidenceChange,

    // Address fields
    addressLine1,
    addressLine2,
    handleAddressLine2Change,
    addressCity,
    addressState,
    handleAddressCityChange,
    handleAddressStateChange,
    zipCode,
    handleAddressLine1Change,
    handleZipCodeChange,
    handleBlur,
    touched,
    errors,
    error,

    // Location detection
    isDetectingLocation,
    locationDetected,
    locationStatus,
    detectedLocation,
    showPermissionHelp,
    setShowPermissionHelp,
    showLocationModal,
    isAutoFilling,
    detectionStatus,

    // Handlers
    handleAllowLocation,
    handleDontAllow,
    handleRetry,
    handleDetectClick,
    handleContinue,
    handleBack,
    handleSkip,

    // UI state
    isLoading,
    isFooterVisible,
    canContinue,
    isErrorStatus,
    isSuccessStatus,
  };
}
