-- Plaid Transfer sandbox contract for Fund A onboarding.
-- Keeps existing KYC/onboarding flow intact while adding server-side
-- money-movement records and safe Plaid account metadata.

CREATE TABLE IF NOT EXISTS public.plaid_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  plaid_item_id text NOT NULL UNIQUE,
  plaid_access_token_encrypted text NOT NULL,
  institution_id text,
  institution_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'error', 'expired', 'revoked')),
  consent_expiration timestamp with time zone,
  error_code text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.plaid_items
  ADD COLUMN IF NOT EXISTS plaid_access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS institution_id text,
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS consent_expiration timestamp with time zone,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_item_id text NOT NULL REFERENCES public.plaid_items(plaid_item_id) ON DELETE CASCADE,
  plaid_account_id text NOT NULL UNIQUE,
  name text,
  official_name text,
  type text,
  subtype text,
  current_balance numeric,
  available_balance numeric,
  iso_currency_code text DEFAULT 'USD',
  mask text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plaid_sync_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_item_id text NOT NULL UNIQUE REFERENCES public.plaid_items(plaid_item_id) ON DELETE CASCADE,
  cursor text NOT NULL DEFAULT '',
  last_synced_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_account_id text NOT NULL REFERENCES public.plaid_accounts(plaid_account_id) ON DELETE CASCADE,
  plaid_transaction_id text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  iso_currency_code text DEFAULT 'USD',
  date date NOT NULL,
  name text,
  merchant_name text,
  category text[],
  pending boolean DEFAULT false,
  payment_channel text,
  transaction_type text,
  location jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS ach_authorized_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ach_authorization_ip text,
  ADD COLUMN IF NOT EXISTS ach_authorization_user_agent text,
  ADD COLUMN IF NOT EXISTS plaid_transfer_setup_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS plaid_transfer_setup_error text;

ALTER TABLE public.user_financial_data
  ADD COLUMN IF NOT EXISTS plaid_access_token text,
  ADD COLUMN IF NOT EXISTS statements_data jsonb,
  ADD COLUMN IF NOT EXISTS plaid_sync_status text,
  ADD COLUMN IF NOT EXISTS plaid_sync_completed_at timestamp with time zone;

COMMENT ON COLUMN public.user_financial_data.plaid_access_token IS
  'Deprecated. Plaid access tokens must be stored in plaid_items.plaid_access_token_encrypted and never returned to browser clients.';

REVOKE SELECT ON TABLE public.user_financial_data FROM anon;

CREATE TABLE IF NOT EXISTS public.plaid_transfer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id text NOT NULL REFERENCES public.plaid_items(plaid_item_id) ON DELETE CASCADE,
  plaid_account_id text NOT NULL,
  institution_id text,
  institution_name text,
  name text,
  official_name text,
  type text,
  subtype text,
  mask text,
  iso_currency_code text DEFAULT 'USD',
  available_balance numeric,
  current_balance numeric,
  ach_account_mask text,
  ach_routing_mask text,
  transfer_capabilities jsonb,
  is_default boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, plaid_account_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_transfer_accounts_user_id
  ON public.plaid_transfer_accounts (user_id);

CREATE TABLE IF NOT EXISTS public.fund_investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_data_id uuid REFERENCES public.onboarding_data(id) ON DELETE SET NULL,
  selected_fund text NOT NULL DEFAULT 'hushh_fund_a',
  class_a_units integer DEFAULT 0,
  class_b_units integer DEFAULT 0,
  class_c_units integer DEFAULT 0,
  commitment_amount numeric,
  initial_transfer_amount numeric,
  recurring_enabled boolean DEFAULT false,
  recurring_amount numeric,
  recurring_frequency text,
  recurring_day_of_month integer,
  ach_authorized_at timestamp with time zone,
  ach_authorization_ip text,
  ach_authorization_user_agent text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'transfer_pending', 'failed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_investment_plans_user_id
  ON public.fund_investment_plans (user_id);

CREATE TABLE IF NOT EXISTS public.fund_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  plaid_item_id text REFERENCES public.plaid_items(plaid_item_id) ON DELETE SET NULL,
  plaid_account_id text,
  plaid_transfer_id text UNIQUE,
  plaid_authorization_id text,
  transfer_type text NOT NULL DEFAULT 'debit',
  network text NOT NULL DEFAULT 'ach',
  ach_class text NOT NULL DEFAULT 'web',
  requested_amount numeric,
  plaid_amount numeric,
  description text,
  status text NOT NULL DEFAULT 'created',
  failure_code text,
  failure_message text,
  idempotency_key text UNIQUE,
  sandbox_mode boolean NOT NULL DEFAULT true,
  raw_authorization jsonb,
  raw_transfer jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_transfers_user_id
  ON public.fund_transfers (user_id);

CREATE INDEX IF NOT EXISTS idx_fund_transfers_plan_id
  ON public.fund_transfers (plan_id);

CREATE TABLE IF NOT EXISTS public.fund_recurring_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  plaid_recurring_transfer_id text UNIQUE,
  plaid_item_id text REFERENCES public.plaid_items(plaid_item_id) ON DELETE SET NULL,
  plaid_account_id text,
  requested_amount numeric,
  plaid_amount numeric,
  recurring_frequency text,
  recurring_day_of_month integer,
  schedule jsonb,
  test_clock_id text,
  status text NOT NULL DEFAULT 'created',
  idempotency_key text UNIQUE,
  raw_recurring_transfer jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_recurring_transfers_user_id
  ON public.fund_recurring_transfers (user_id);

CREATE TABLE IF NOT EXISTS public.plaid_transfer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid_event_id integer UNIQUE,
  event_type text,
  event_code text,
  plaid_transfer_id text,
  plaid_recurring_transfer_id text,
  event_created_at timestamp with time zone,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plaid_transfer_events_transfer_id
  ON public.plaid_transfer_events (plaid_transfer_id);

CREATE TABLE IF NOT EXISTS public.transfer_email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fund_transfer_id uuid REFERENCES public.fund_transfers(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_transfer_email_notifications_user_id
  ON public.transfer_email_notifications (user_id);

DROP TRIGGER IF EXISTS set_timestamp_on_plaid_transfer_accounts
  ON public.plaid_transfer_accounts;
CREATE TRIGGER set_timestamp_on_plaid_transfer_accounts
  BEFORE UPDATE ON public.plaid_transfer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_investment_plans
  ON public.fund_investment_plans;
CREATE TRIGGER set_timestamp_on_fund_investment_plans
  BEFORE UPDATE ON public.fund_investment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_transfers
  ON public.fund_transfers;
CREATE TRIGGER set_timestamp_on_fund_transfers
  BEFORE UPDATE ON public.fund_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_recurring_transfers
  ON public.fund_recurring_transfers;
CREATE TRIGGER set_timestamp_on_fund_recurring_transfers
  BEFORE UPDATE ON public.fund_recurring_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.plaid_transfer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_recurring_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own Plaid transfer accounts" ON public.plaid_transfer_accounts;
CREATE POLICY "Users can view own Plaid transfer accounts"
  ON public.plaid_transfer_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access Plaid transfer accounts" ON public.plaid_transfer_accounts;
CREATE POLICY "Service role full access Plaid transfer accounts"
  ON public.plaid_transfer_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid items" ON public.plaid_items;
CREATE POLICY "Service role full access Plaid items"
  ON public.plaid_items FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid accounts" ON public.plaid_accounts;
CREATE POLICY "Service role full access Plaid accounts"
  ON public.plaid_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid sync cursors" ON public.plaid_sync_cursors;
CREATE POLICY "Service role full access Plaid sync cursors"
  ON public.plaid_sync_cursors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid transactions" ON public.plaid_transactions;
CREATE POLICY "Service role full access Plaid transactions"
  ON public.plaid_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund plans" ON public.fund_investment_plans;
CREATE POLICY "Users can view own fund plans"
  ON public.fund_investment_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund plans" ON public.fund_investment_plans;
CREATE POLICY "Service role full access fund plans"
  ON public.fund_investment_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund transfers" ON public.fund_transfers;
CREATE POLICY "Users can view own fund transfers"
  ON public.fund_transfers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund transfers" ON public.fund_transfers;
CREATE POLICY "Service role full access fund transfers"
  ON public.fund_transfers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own recurring fund transfers" ON public.fund_recurring_transfers;
CREATE POLICY "Users can view own recurring fund transfers"
  ON public.fund_recurring_transfers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access recurring fund transfers" ON public.fund_recurring_transfers;
CREATE POLICY "Service role full access recurring fund transfers"
  ON public.fund_recurring_transfers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid transfer events" ON public.plaid_transfer_events;
CREATE POLICY "Service role full access Plaid transfer events"
  ON public.plaid_transfer_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own transfer emails" ON public.transfer_email_notifications;
CREATE POLICY "Users can view own transfer emails"
  ON public.transfer_email_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access transfer emails" ON public.transfer_email_notifications;
CREATE POLICY "Service role full access transfer emails"
  ON public.transfer_email_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.plaid_transfer_accounts TO authenticated;
GRANT SELECT ON TABLE public.fund_investment_plans TO authenticated;
GRANT SELECT ON TABLE public.fund_transfers TO authenticated;
GRANT SELECT ON TABLE public.fund_recurring_transfers TO authenticated;
GRANT SELECT ON TABLE public.transfer_email_notifications TO authenticated;

GRANT ALL ON TABLE public.plaid_transfer_accounts TO service_role;
GRANT ALL ON TABLE public.plaid_items TO service_role;
GRANT ALL ON TABLE public.plaid_accounts TO service_role;
GRANT ALL ON TABLE public.plaid_sync_cursors TO service_role;
GRANT ALL ON TABLE public.plaid_transactions TO service_role;
GRANT ALL ON TABLE public.fund_investment_plans TO service_role;
GRANT ALL ON TABLE public.fund_transfers TO service_role;
GRANT ALL ON TABLE public.fund_recurring_transfers TO service_role;
GRANT ALL ON TABLE public.plaid_transfer_events TO service_role;
GRANT ALL ON TABLE public.transfer_email_notifications TO service_role;
