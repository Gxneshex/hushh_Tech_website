-- Deep per-party KYC (PR1: Joint owners) — add a dedicated column for a party's
-- tax id so the sensitive value is kept OUT of onboarding_parties.profile (jsonb).
--
-- Storage posture matches onboarding_data.ssn_encrypted today: a plain text column
-- protected by RLS + service-role-only writes + masking on every read path (admin
-- detail returns only a `taxIdProvided` boolean, never the raw value). The column is
-- named `_encrypted` for parity/forward-compat; introducing real at-rest encryption
-- is a separate, repo-wide change (the primary SSN is plaintext too).
--
-- onboarding_parties.plaid_item_id (uuid, already present) now holds the invited
-- party's own connected bank: it references plaid_items.id, written by the
-- token-gated onboarding-invite-plaid-exchange edge function.

ALTER TABLE public.onboarding_parties
  ADD COLUMN IF NOT EXISTS tax_id_encrypted text;

COMMENT ON COLUMN public.onboarding_parties.tax_id_encrypted IS
  'Invited party SSN / Tax ID. Plaintext today (matches onboarding_data.ssn_encrypted); service-role write only, masked on every read. A `tax_id_provided` marker in profile satisfies the completeness gate without re-exposing the value.';

COMMENT ON COLUMN public.onboarding_parties.plaid_item_id IS
  'FK to plaid_items.id for a party''s own connected bank (e.g. a joint owner). Written by onboarding-invite-plaid-exchange; keyed off the party id since invitees have no auth user.';
