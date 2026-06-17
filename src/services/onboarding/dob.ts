/**
 * Date-of-birth helpers for onboarding (age gate + year options).
 *
 * Relocated out of the now-removed orphan `pages/onboarding/step-6/logic.ts`
 * so the live combined details step (`step-3`) and the DOB tests can share one
 * implementation without depending on a dead, unrouted page module.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
