/**
 * Single source of truth for investor consent / disclaimer copy and the
 * documents each acknowledgment links to. Keep copy here (not inline in the
 * UI) so legal can review and edit wording in one place before PROD.
 *
 * NOTE: Wording below reuses existing HushhTech disclosure language and is a
 * placeholder pending legal sign-off. Do not ship to PROD without review.
 */

/**
 * Bump when the meaning of any consent copy changes. Persisted alongside each
 * acknowledgment so we know which version a user agreed to. A future phase can
 * re-prompt when this no longer matches the stored value.
 */
export const CONSENT_VERSION = '2026-06-01';

/** Public document links used inside consent copy. */
export const CONSENT_LINKS = {
  privacyPolicy: '/privacy-policy',
  terms: '/terms',
  riskDisclosures: '/risk-disclosures',
} as const;

export const CONSENT_COPY = {
  /** Surface 1 — before opening Plaid Link to share bank data. */
  plaidDataSharing:
    'I authorize Hushh to securely retrieve my account, balance, identity, and investment data via Plaid for verification and review.',

  /** Surface 2 — single combined acknowledgment before the money commitment. */
  fundCommitment:
    'I have reviewed the Risk Disclosures, confirm I meet the investor eligibility criteria, and accept the Subscription Agreement. I understand investing carries risk, including possible loss of principal, and returns are not guaranteed.',

  /** Surface 3 — KYC identity details. */
  kycIdentity:
    'I consent to identity verification and the processing of my personal data in line with the Privacy Policy and Terms.',

  /** Surface 4 — Stripe Identity document/biometric verification. */
  identityVerification:
    'I consent to identity-document and biometric verification to confirm my identity.',

  /** Surface 5 — passive inline disclaimer on the fund unit selection step. */
  unitSelectionDisclaimer:
    'Illustrative only — not an offer or solicitation. See the Risk Disclosures before committing.',

  /** Surface 6 — passive inline line under the signup CTA. */
  signup:
    'By continuing you agree to the Terms and Privacy Policy.',
} as const;
