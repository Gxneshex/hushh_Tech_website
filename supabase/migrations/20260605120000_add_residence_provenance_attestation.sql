-- Fund-grade KYC: per-field provenance + explicit legal-residence attestation.
--
-- field_provenance records the SOURCE / verification tier of each captured legal
-- KYC field so review + audit can distinguish bank-verified data from
-- self-declared data. Values per field: 'bank_verified' (Plaid identity),
-- 'document_verified' (Stripe Identity), or 'self_declared' (user-entered).
-- The device's current GPS location is NEVER a legal source.
--
-- residence_attested_at records the moment the investor explicitly affirmed that
-- the captured address is their LEGAL / permanent residence (paired with
-- consent_version) — "where the phone is right now" is never treated as legal
-- residence.
--
-- Both columns are additive + nullable, so existing rows and in-flight clients
-- are unaffected (upsertOnboardingData also drops unknown columns gracefully if
-- this migration has not yet reached an environment).

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS field_provenance JSONB,
  ADD COLUMN IF NOT EXISTS residence_attested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.onboarding_data.field_provenance IS
  'Per-field source / verification tier for KYC fields, e.g. {"address_line_1":"bank_verified","city":"self_declared"}. One of bank_verified | document_verified | self_declared. GPS current location is never a legal source.';

COMMENT ON COLUMN public.onboarding_data.residence_attested_at IS
  'Timestamp the investor explicitly attested the captured address is their legal/permanent residence (recorded with consent_version).';
