-- Retirement (PR3): custodian-is-subscriber (FBO).
--
-- The IRA custodian is the legal subscriber. The account is registered as
-- "[Custodian] FBO [Investor] IRA" and the custodian counter-signs the
-- subscription. This stores the computed registration string for subscription
-- docs + admin triage. The custodian being required + the funding name match
-- (vs the custodian) reuse existing columns:
--   - requiredParties (config) -> the review/submit gate already enforces a
--     completed retirement_custodian; no schema change needed.
--   - funding_name_match_status / funding_account_holder_name / manual_review_route
--     (added in 20260620130000 / pre-existing) -> personal-account funding is
--     flagged for manual review, matched against the custodian name.

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS retirement_registration_name text;

COMMENT ON COLUMN public.onboarding_data.retirement_registration_name IS
  'Computed IRA registration "[Custodian] FBO [Investor] IRA" for subscription docs + admin. Written by onboarding-funding-name-match for retirement accounts.';
