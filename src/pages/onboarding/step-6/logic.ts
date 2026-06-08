/**
 * Step 9 - SSN + Date of Birth — Logic Hook
 *
 * All state, effects, handlers, and constants for the SSN & DOB step.
 */
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import {
  getOnboardingDisplayMeta,
  isCurrentLocalOnboardingPreview,
  withLocalOnboardingPreview,
} from '../../../services/onboarding/flow';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import { useFooterVisibility } from '../../../utils/useFooterVisibility';
import { locationService } from '../../../services/location';
import {
  ACCOUNT_TYPE_OPTIONS,
  PHONE_DIAL_CODES,
  resolveStep4CachedDialCode,
  type DialCodeOption,
  type UIAccountType,
} from '../step-4/logic';

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const DISPLAY_META = getOnboardingDisplayMeta('/onboarding/step-6');

export const DISPLAY_STEP = DISPLAY_META.displayStep;
export const TOTAL_STEPS = DISPLAY_META.totalSteps;
export const PROGRESS_PCT = Math.round((DISPLAY_STEP / TOTAL_STEPS) * 100);

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export { ACCOUNT_TYPE_OPTIONS, PHONE_DIAL_CODES };

export const MINIMUM_ONBOARDING_AGE = 18;
export const MINIMUM_DOB_YEAR = 1930;

const normalizeToday = (value: Date) =>
  new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));

export const buildDobYearOptions = (
  today: Date = new Date(),
  minimumYear: number = MINIMUM_DOB_YEAR,
  minimumAge: number = MINIMUM_ONBOARDING_AGE
) => {
  const latestAdultYear = normalizeToday(today).getUTCFullYear() - minimumAge;
  const count = latestAdultYear - minimumYear + 1;
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => String(latestAdultYear - i));
};

export const resolveDobEligibility = (
  dobMonth: string,
  dobDay: string,
  dobYear: string,
  today: Date = new Date()
) => {
  if (!dobMonth || !dobDay || !dobYear || dobYear.length !== 4) {
    return {
      isComplete: false,
      isValidDate: false,
      isAdult: false,
      ageError: null as string | null,
    };
  }

  const month = Number(dobMonth);
  const day = Number(dobDay);
  const year = Number(dobYear);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(year) ||
    month < 1 ||
    month > 12
  ) {
    return {
      isComplete: true,
      isValidDate: false,
      isAdult: false,
      ageError: null as string | null,
    };
  }

  const birthDate = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    birthDate.getUTCFullYear() === year &&
    birthDate.getUTCMonth() === month - 1 &&
    birthDate.getUTCDate() === day;

  if (!isValidDate) {
    return {
      isComplete: true,
      isValidDate: false,
      isAdult: false,
      ageError: null as string | null,
    };
  }

  const normalizedToday = normalizeToday(today);
  let age = normalizedToday.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = normalizedToday.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && normalizedToday.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  const isAdult = age >= MINIMUM_ONBOARDING_AGE;

  return {
    isComplete: true,
    isValidDate: true,
    isAdult,
    ageError: isAdult ? null : `You must be at least ${MINIMUM_ONBOARDING_AGE} years old to continue`,
  };
};

/* ═══════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════ */

const toAccountStructure = (accountType: UIAccountType): 'individual' | 'other' =>
  accountType === 'individual' ? 'individual' : 'other';

const isUnitedStatesInvestor = (country?: string | null) => {
  const normalized = String(country || '').trim().toLowerCase();
  return normalized === 'united states' || normalized === 'united states of america' || normalized === 'us' || normalized === 'usa';
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  return digits;
};

export function useStep9Logic() {
  const navigate = useNavigate();
  const isPreview = isCurrentLocalOnboardingPreview();
  const isFooterVisible = useFooterVisibility();
  const [userId, setUserId] = useState<string | null>(null);
  const [ssn, setSsn] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<UIAccountType | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [selectedDialCountryIso, setSelectedDialCountryIso] = useState('US');
  const [isAutoDetectingDialCode, setIsAutoDetectingDialCode] = useState(false);
  const [showDialPicker, setShowDialPicker] = useState(false);
  const [isPreFilledFromBank, setIsPreFilledFromBank] = useState(false);
  const [isUsInvestor, setIsUsInvestor] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* ─── Load saved data ─── */
  useEffect(() => {
    const loadData = async () => {
      if (isPreview) {
        setUserId('local-preview');
        return;
      }
      if (!config.supabaseClient) return;
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      const { data } = await config.supabaseClient
        .from('onboarding_data')
        .select('ssn_encrypted, account_type, account_structure, phone_number, phone_country_code, citizenship_country, residence_country')
        .eq('user_id', user.id)
        .maybeSingle();

      const validTypes: UIAccountType[] = ['individual', 'joint', 'retirement', 'trust'];
      if (data?.account_type && validTypes.includes(data.account_type as UIAccountType)) {
        setSelectedAccountType(data.account_type as UIAccountType);
      } else if (data?.account_structure === 'individual') {
        setSelectedAccountType('individual');
      }

      if (data?.phone_number) {
        setPhoneNumber(String(data.phone_number).replace(/\D/g, ''));
        setIsPreFilledFromBank(true);
      }

      setIsUsInvestor(
        isUnitedStatesInvestor(data?.residence_country) ||
        isUnitedStatesInvestor(data?.citizenship_country)
      );

      const sharedLocationRecord = await locationService.readSharedLocationCache(user.id);
      const cachedLocation = sharedLocationRecord?.data || await locationService.getCachedLocation(user.id);
      const cachedDialState = resolveStep4CachedDialCode({
        savedPhoneCode: data?.phone_country_code ? String(data.phone_country_code) : '',
        cachedLocation,
      });

      if (cachedDialState.dialCode) {
        setCountryCode(cachedDialState.dialCode);
        const matchedIso = cachedDialState.countryIso
          ? PHONE_DIAL_CODES.find((o) => o.iso === cachedDialState.countryIso)
          : PHONE_DIAL_CODES.find((o) => o.code === cachedDialState.dialCode);
        if (matchedIso) {
          setSelectedDialCountryIso(matchedIso.iso);
        }
      } else {
        setIsAutoDetectingDialCode(true);
        try {
          const resolvedLocation = cachedLocation || await locationService.getLocationByIp();
          if (resolvedLocation?.phoneDialCode) {
            setCountryCode(resolvedLocation.phoneDialCode);
            const matched = PHONE_DIAL_CODES.find((o) => o.code === resolvedLocation.phoneDialCode);
            if (matched) setSelectedDialCountryIso(matched.iso);
          }
          if (resolvedLocation?.countryCode) {
            const iso = String(resolvedLocation.countryCode).toUpperCase();
            if (PHONE_DIAL_CODES.some((o) => o.iso === iso)) setSelectedDialCountryIso(iso);
          }
        } finally {
          setIsAutoDetectingDialCode(false);
        }
      }

      if (data?.ssn_encrypted && data.ssn_encrypted !== '999-99-9999') {
        setSsn(data.ssn_encrypted);
      }
    };
    loadData();
  }, [isPreview, navigate]);

  /* ─── Formatters ─── */
  const formatSSN = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 9)}`;
  };

  const handleSSNChange = (e: ChangeEvent<HTMLInputElement>) => setSsn(formatSSN(e.target.value));
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 15));
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpInput('');
    if (isPreFilledFromBank) setIsPreFilledFromBank(false);
  };

  const selectedDialOption = useMemo(() => {
    return PHONE_DIAL_CODES.find((o) => o.code === countryCode && o.iso === selectedDialCountryIso)
      || PHONE_DIAL_CODES.find((o) => o.code === countryCode)
      || PHONE_DIAL_CODES[0];
  }, [countryCode, selectedDialCountryIso]);

  const isValidPhone = phoneNumber.length >= 8 && phoneNumber.length <= 15;
  const isValidSsn = ssn.replace(/\D/g, '').length === 9;
  const canSendOtp = isValidPhone && !isPhoneVerified;
  const isTaxReady = !isUsInvestor || isValidSsn;
  const canContinue = Boolean(selectedAccountType && isTaxReady && isValidPhone && isPhoneVerified);

  /* ─── Handlers ─── */
  const handleSelectDialCode = (option: DialCodeOption) => {
    setCountryCode(option.code);
    setSelectedDialCountryIso(option.iso);
    setShowDialPicker(false);
    setIsPhoneVerified(false);
    setOtpSent(false);
  };

  const handleSendOtp = () => {
    if (!isValidPhone) {
      setError('Please enter a valid contact number');
      return;
    }
    const nextCode = '240924';
    setOtpCode(nextCode);
    setOtpSent(true);
    setOtpInput('');
    setIsPhoneVerified(false);
    setError(null);
  };

  const handleVerifyOtp = () => {
    if (!otpSent) {
      setError('Send the verification code first');
      return;
    }
    if (otpInput.trim() !== otpCode) {
      setError('That code does not match');
      return;
    }
    setIsPhoneVerified(true);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedAccountType) { setError('Please choose an account type'); return; }
    if (isUsInvestor && !isValidSsn) { setError('Please enter a valid SSN for US tax reporting'); return; }
    if (!isValidPhone) { setError('Please enter a valid contact number'); return; }
    if (!isPhoneVerified) { setError('Please verify your contact number'); return; }
    if (isPreview) {
      navigate(withLocalOnboardingPreview('/onboarding/step-7'));
      return;
    }
    if (!userId || !config.supabaseClient) { setError('Not authenticated'); return; }

    setLoading(true); setError(null);
    const { error: e } = await upsertOnboardingData(userId, {
      account_type: selectedAccountType,
      account_structure: toAccountStructure(selectedAccountType),
      phone_number: phoneNumber,
      phone_country_code: countryCode,
      ssn_encrypted: ssn || (isUsInvestor ? null : '999-99-9999'),
      current_step: 10,
    });
    if (e) { setError('Failed to save data'); setLoading(false); return; }
    navigate('/onboarding/step-7');
  };

  const handleSkip = () => navigate(withLocalOnboardingPreview('/onboarding/step-7'));

  const handleBack = () => navigate(withLocalOnboardingPreview('/onboarding/step-3'));

  const handleShowInfoToggle = (open: boolean) => setShowInfo(open);

  return {
    // State
    ssn,
    selectedAccountType,
    setSelectedAccountType,
    phoneNumber,
    countryCode,
    selectedDialCountryIso,
    isAutoDetectingDialCode,
    showDialPicker,
    setShowDialPicker,
    isPreFilledFromBank,
    isUsInvestor,
    otpSent,
    otpCode,
    otpInput,
    setOtpInput,
    isPhoneVerified,
    loading,
    error,
    showInfo,
    canContinue,
    isFooterVisible,

    // Derived
    selectedDialOption,
    isValidPhone,
    canSendOtp,
    formatPhoneNumber,
    isTaxReady,

    // Handlers
    handleSSNChange,
    handlePhoneChange,
    handleSelectDialCode,
    handleSendOtp,
    handleVerifyOtp,
    handleContinue,
    handleSkip,
    handleBack,
    handleShowInfoToggle,
  };
}
