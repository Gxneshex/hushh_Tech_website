const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeComparable = (value) =>
  cleanString(value)
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitSegments = (formattedAddress) =>
  cleanString(formattedAddress)
    .split(',')
    .map((segment) => cleanString(segment))
    .filter(Boolean);

const normalizeSpacing = (value) =>
  cleanString(value)
    .replace(/[.,()/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const POSTAL_CODE_PATTERN = /^(?=.*\d)[A-Z0-9-]{2,10}(?: [A-Z0-9-]{2,10})?$/i;

const matchesSegment = (segment, candidates) => {
  const normalizedSegment = normalizeComparable(segment);
  if (!normalizedSegment) return false;

  return candidates
    .map((candidate) => normalizeComparable(candidate))
    .filter(Boolean)
    .some((candidate) => candidate === normalizedSegment);
};

const stripCandidate = (value, candidate) => {
  const cleanCandidate = cleanString(candidate);
  if (!cleanCandidate) return value;

  return value.replace(new RegExp(`\\b${escapeRegExp(cleanCandidate)}\\b`, 'gi'), ' ');
};

const isStatePostalSegment = (segment, { state, stateCode, zipCode }) => {
  let working = cleanString(segment);
  if (!working) return false;

  if (zipCode) {
    working = working.replace(new RegExp(`\\b${escapeRegExp(zipCode)}\\b`, 'gi'), ' ');
  }

  working = stripCandidate(working, state);
  working = stripCandidate(working, stateCode);
  working = normalizeSpacing(working.replace(/-/g, ' '));

  return working.length === 0 || POSTAL_CODE_PATTERN.test(working);
};

const buildCityStateLine2 = (city, state) =>
  [cleanString(city), cleanString(state)].filter(Boolean).join(', ');

const inferPostalCodeFromSegment = (segment, { state, stateCode }) => {
  const normalized = normalizeSpacing(
    stripCandidate(stripCandidate(segment, state), stateCode)
  );
  if (!normalized) return '';

  const parts = normalized.split(' ').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const previous = parts[parts.length - 2] || '';
  const lastTwo = previous ? `${previous} ${last}` : '';

  if (previous && /\d/.test(previous) && POSTAL_CODE_PATTERN.test(lastTwo)) {
    return lastTwo;
  }

  return POSTAL_CODE_PATTERN.test(last) ? last : '';
};

const inferStateFromSegment = (segment, { zipCode, stateCode }) => {
  let working = cleanString(segment);
  if (!working) return cleanString(stateCode);

  const resolvedZipCode = cleanString(zipCode) || inferPostalCodeFromSegment(segment, { state: '', stateCode });
  if (resolvedZipCode) {
    working = working.replace(new RegExp(`\\b${escapeRegExp(resolvedZipCode)}\\b`, 'gi'), ' ');
  }

  working = normalizeSpacing(stripCandidate(working, stateCode));
  return working || cleanString(stateCode);
};

export function normalizeDetectedAddress(locationData, countryNameOverride = '') {
  const gpsCity = cleanString(locationData?.city);
  const gpsState = cleanString(locationData?.state);
  const stateCode = cleanString(locationData?.stateCode);
  const gpsZipCode = cleanString(locationData?.postalCode);
  const country = cleanString(countryNameOverride) || cleanString(locationData?.country);
  const formattedAddress = cleanString(locationData?.formattedAddress);

  const segments = splitSegments(formattedAddress);

  if (segments.length && matchesSegment(segments[segments.length - 1], [country, locationData?.country])) {
    segments.pop();
  }

  const statePostalSegment = segments[segments.length - 1] || '';
  const zipCode = gpsZipCode || inferPostalCodeFromSegment(statePostalSegment, { state: gpsState, stateCode });
  const state = gpsState || inferStateFromSegment(statePostalSegment, { zipCode, stateCode });
  const city = gpsCity || (segments.length > 1 ? segments[segments.length - 2] : '');

  if (segments.length && isStatePostalSegment(segments[segments.length - 1], { state, stateCode, zipCode })) {
    segments.pop();
  }

  if (segments.length && matchesSegment(segments[segments.length - 1], [city])) {
    segments.pop();
  }

  const addressLine1 = segments.join(', ');
  const addressLine2 = buildCityStateLine2(city, state);

  return {
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    country,
    formattedAddress,
  };
}

export function looksLikeAutoFilledCityStateLine2(line2, city, state) {
  const expected = buildCityStateLine2(city, state);
  if (!expected) return false;

  return normalizeComparable(line2) === normalizeComparable(expected);
}

export function isClearlyTruncatedAddressLine1(currentLine1, normalizedAddressLine1) {
  const current = cleanString(currentLine1);
  const normalized = cleanString(normalizedAddressLine1);

  if (!current || !normalized || current === normalized) {
    return false;
  }

  const normalizedSegments = normalized.split(',').map((segment) => cleanString(segment)).filter(Boolean);
  const firstSegment = normalizedSegments[0] || '';

  return normalizedSegments.length > 1 && normalizeComparable(current) === normalizeComparable(firstSegment);
}

export function buildOnboardingAddressRepairPatch(row) {
  void row;
  // Fund KYC rule: gps_* data is current-location evidence only. It must never
  // repair or populate legal-residence fields on onboarding_data.
  return null;
}
