-- Additional parties for account-type-driven onboarding (joint co-owners,
-- retirement custodian/administrator, trustees/co-trustees/beneficial owners,
-- and authorised persons acting on behalf of another investor).
--
-- One row per party. The primary investor owns the rows (RLS SELECT powers the
-- completion dashboard). Invitees are unauthenticated and never write directly —
-- all their writes go through token-scoped service-role edge functions (PR5),
-- which is why party data is a table rather than a JSONB array on onboarding_data.

CREATE TABLE IF NOT EXISTS public.onboarding_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_data_id uuid REFERENCES public.onboarding_data(id) ON DELETE SET NULL,
  party_role text NOT NULL CHECK (party_role IN (
    'joint_owner',
    'retirement_custodian',
    'retirement_administrator',
    'trustee',
    'co_trustee',
    'beneficial_owner',
    'controlling_person',
    'authorised_person',
    'authorised_signatory'
  )),
  acting_on_behalf_of text,
  display_name text,
  invite_email text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN (
    'invited',
    'link_opened',
    'in_progress',
    'plaid_pending',
    'plaid_connected',
    'kyc_pending',
    'completed',
    'manual_review'
  )),
  is_required boolean NOT NULL DEFAULT true,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_provenance jsonb,
  plaid_item_id uuid,
  residence_attested_at timestamp with time zone,
  consent_version text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_parties_primary_user_id
  ON public.onboarding_parties(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_parties_onboarding_data_id
  ON public.onboarding_parties(onboarding_data_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_parties_party_role
  ON public.onboarding_parties(party_role);

CREATE INDEX IF NOT EXISTS idx_onboarding_parties_status
  ON public.onboarding_parties(status);

DROP TRIGGER IF EXISTS set_timestamp_on_onboarding_parties
  ON public.onboarding_parties;
CREATE TRIGGER set_timestamp_on_onboarding_parties
  BEFORE UPDATE ON public.onboarding_parties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.onboarding_parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Primary investor can view own onboarding parties" ON public.onboarding_parties;
CREATE POLICY "Primary investor can view own onboarding parties"
  ON public.onboarding_parties FOR SELECT
  USING (auth.uid() = primary_user_id);

DROP POLICY IF EXISTS "Service role full access onboarding parties" ON public.onboarding_parties;
CREATE POLICY "Service role full access onboarding parties"
  ON public.onboarding_parties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.onboarding_parties TO authenticated;
GRANT ALL ON TABLE public.onboarding_parties TO service_role;

-- Now that onboarding_parties exists, point the signatory FK at it.
ALTER TABLE public.onboarding_data
  DROP CONSTRAINT IF EXISTS onboarding_data_authorised_signatory_party_id_fkey;

ALTER TABLE public.onboarding_data
  ADD CONSTRAINT onboarding_data_authorised_signatory_party_id_fkey
  FOREIGN KEY (authorised_signatory_party_id)
  REFERENCES public.onboarding_parties(id)
  ON DELETE SET NULL;
