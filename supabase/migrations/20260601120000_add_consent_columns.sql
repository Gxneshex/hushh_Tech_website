-- Investor consent / disclaimer acknowledgment audit columns.
-- Each *_at column records when the user agreed to a given point-of-collection
-- consent gate; consent_version records which copy version they agreed to.

ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS plaid_consent_at timestamptz;

ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS risk_acknowledged_at timestamptz;

ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS eligibility_attested_at timestamptz;

ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS subscription_agreement_ack_at timestamptz;

ALTER TABLE public.onboarding_data
ADD COLUMN IF NOT EXISTS consent_version text;

COMMENT ON COLUMN public.onboarding_data.plaid_consent_at IS
'When the user consented to share bank data via Plaid (before Plaid Link opened).';

COMMENT ON COLUMN public.onboarding_data.risk_acknowledged_at IS
'When the user acknowledged the investment Risk Disclosures (step-9 commitment gate).';

COMMENT ON COLUMN public.onboarding_data.eligibility_attested_at IS
'When the user attested they meet investor eligibility criteria (step-9 commitment gate).';

COMMENT ON COLUMN public.onboarding_data.subscription_agreement_ack_at IS
'When the user acknowledged the Subscription Agreement / LPA (step-9 commitment gate).';

COMMENT ON COLUMN public.onboarding_data.consent_version IS
'Version string of the consent copy the user agreed to (see CONSENT_VERSION in the app).';
