-- Checkpoint-driven KYC: record the user's explicit consent to identity-document
-- + biometric verification BEFORE the Stripe Identity session is created, and an
-- explicit "deferred" marker when they choose to verify later. Additive +
-- idempotent (upsertOnboardingData drops unknown columns and retries, so the UI
-- is safe even if this migration lands slightly after the frontend).
alter table public.onboarding_data
  add column if not exists identity_consent_at timestamptz,
  add column if not exists identity_verification_deferred_at timestamptz;

comment on column public.onboarding_data.identity_consent_at is
  'When the user consented to identity-document + biometric verification, before the Stripe Identity session was created.';
comment on column public.onboarding_data.identity_verification_deferred_at is
  'When the user explicitly chose to defer identity verification ("I''ll do this later").';
