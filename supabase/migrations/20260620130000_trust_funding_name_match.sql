-- Trust/Entity (PR2): funding account-holder name match.
--
-- The fund needs to know whether the connected bank account's holder name matches
-- the entity's legal name (for retirement in PR3: the custodian/IRA registration).
-- A mismatch — e.g. a personal account funding an entity subscription — is a review
-- flag that routes the application to manual review (onboarding_data.manual_review_route,
-- which already exists). The raw balance/PII is never stored here; only the computed
-- status + the Plaid-reported holder name (a name, shown to admins for triage).
--
-- Note: the entity Tax ID / EIN already lives in onboarding_data.entity_tax_id_ein as
-- plaintext + masked on read (admin returns only entityTaxIdProvided). That matches
-- the repo's SSN posture, so no separate `_encrypted` column is added here.

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS funding_name_match_status text
    CHECK (funding_name_match_status IS NULL
      OR funding_name_match_status IN ('match', 'mismatch', 'unavailable'));

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS funding_account_holder_name text;

COMMENT ON COLUMN public.onboarding_data.funding_name_match_status IS
  'Computed match between the connected bank holder name and the expected legal name (entity legal name for trust; custodian/IRA registration for retirement). mismatch -> manual_review_route. Flag, not a hard submit block.';

COMMENT ON COLUMN public.onboarding_data.funding_account_holder_name IS
  'Plaid-reported account-holder name used for the funding name match, surfaced to admins for triage.';
