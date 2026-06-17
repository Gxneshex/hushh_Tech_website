-- Account-type-driven onboarding: scalar columns on onboarding_data.
-- These back the per-account-type fields, the authorised signatory confirmation,
-- the application status flow, and submission audit. All additive/nullable so the
-- upsertOnboardingData missing-column retry path stays happy pre-deploy.
--
-- Party/invite data lives in dedicated tables (see the two following migrations)
-- because token-scoped invitees are unauthenticated and write only via service-role
-- edge functions — they cannot satisfy a per-row auth.uid() RLS policy.

ALTER TABLE public.onboarding_data
  -- Application status flow (spec §12). Milestones up to ready_to_submit are
  -- computed client-side; submitted+ are written only by the submit edge fn.
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'started',

  -- Authorised signatory (spec §3.2). Individual auto-confirms the primary.
  ADD COLUMN IF NOT EXISTS authorised_signatory_party_id uuid,
  ADD COLUMN IF NOT EXISTS authorised_signatory_is_primary boolean,
  ADD COLUMN IF NOT EXISTS authorised_signatory_confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS signatory_consent_version text,

  -- Retirement account details (spec §6). custodian_account_number is PII.
  ADD COLUMN IF NOT EXISTS retirement_account_type text,
  ADD COLUMN IF NOT EXISTS custodian_name text,
  ADD COLUMN IF NOT EXISTS custodian_contact_email text,
  ADD COLUMN IF NOT EXISTS custodian_contact_phone text,
  ADD COLUMN IF NOT EXISTS custodian_account_number text,
  ADD COLUMN IF NOT EXISTS custodian_approval_required boolean,

  -- Trust / entity details (spec §7). entity_tax_id_ein is PII.
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_legal_name text,
  ADD COLUMN IF NOT EXISTS entity_tax_id_ein text,
  ADD COLUMN IF NOT EXISTS formation_state text,
  ADD COLUMN IF NOT EXISTS formation_country text,
  ADD COLUMN IF NOT EXISTS registered_address jsonb,
  ADD COLUMN IF NOT EXISTS principal_address jsonb,

  -- Submission audit.
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS manual_review_route boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_data_application_status_check'
  ) THEN
    ALTER TABLE public.onboarding_data
      ADD CONSTRAINT onboarding_data_application_status_check
      CHECK (application_status IN (
        'started',
        'account_type_selected',
        'primary_details_complete',
        'parties_pending',
        'parties_complete',
        'signatory_confirmed',
        'investment_selected',
        'investment_deferred',
        'plaid_pending',
        'plaid_connected',
        'ready_to_submit',
        'submitted',
        'compliance_review',
        'approved',
        'rejected'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_data_retirement_account_type_check'
  ) THEN
    ALTER TABLE public.onboarding_data
      ADD CONSTRAINT onboarding_data_retirement_account_type_check
      CHECK (retirement_account_type IS NULL OR retirement_account_type IN (
        'traditional_ira',
        'roth_ira',
        'sep_ira',
        'simple_ira',
        '401k',
        'pension',
        'other'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_data_entity_type_check'
  ) THEN
    ALTER TABLE public.onboarding_data
      ADD CONSTRAINT onboarding_data_entity_type_check
      CHECK (entity_type IS NULL OR entity_type IN (
        'revocable_trust',
        'irrevocable_trust',
        'llc',
        'c_corp',
        's_corp',
        'lp',
        'llp',
        'partnership',
        'family_office',
        'holding_company',
        'other'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_onboarding_data_application_status
  ON public.onboarding_data(application_status);
