-- Secure email invites for additional onboarding parties.
-- Token mechanics mirror fund_stripe_payment_requests exactly: a sha256 hash of a
-- random token is stored (never the token itself); the tokenized link is delivered
-- by email and resolved by token-only edge functions (no invitee login).
-- Invite email delivery is logged via the existing fund_payment_notifications table
-- (its user_id is nullable), so no separate notifications table is needed.

CREATE TABLE IF NOT EXISTS public.onboarding_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id uuid REFERENCES public.onboarding_parties(id) ON DELETE CASCADE,
  invite_token_hash text UNIQUE NOT NULL,
  invite_reference text UNIQUE NOT NULL,
  email text,
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
  status text NOT NULL DEFAULT 'sent' CHECK (status IN (
    'sent',
    'opened',
    'in_progress',
    'completed',
    'expired',
    'revoked'
  )),
  expires_at timestamp with time zone NOT NULL,
  opened_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_primary_user_id
  ON public.onboarding_invites(primary_user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_party_id
  ON public.onboarding_invites(party_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_invites_status
  ON public.onboarding_invites(status);

DROP TRIGGER IF EXISTS set_timestamp_on_onboarding_invites
  ON public.onboarding_invites;
CREATE TRIGGER set_timestamp_on_onboarding_invites
  BEFORE UPDATE ON public.onboarding_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.onboarding_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Primary investor can view own onboarding invites" ON public.onboarding_invites;
CREATE POLICY "Primary investor can view own onboarding invites"
  ON public.onboarding_invites FOR SELECT
  USING (auth.uid() = primary_user_id);

DROP POLICY IF EXISTS "Service role full access onboarding invites" ON public.onboarding_invites;
CREATE POLICY "Service role full access onboarding invites"
  ON public.onboarding_invites FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.onboarding_invites TO authenticated;
GRANT ALL ON TABLE public.onboarding_invites TO service_role;
