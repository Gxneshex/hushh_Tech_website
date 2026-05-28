-- Plaid maximum data sync contract.
-- Adds product-level sync status so onboarding can proceed quickly while
-- slower/async Plaid products finish through background jobs and webhooks.

ALTER TABLE public.plaid_items
  ADD COLUMN IF NOT EXISTS products_requested jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS last_data_sync_at timestamp with time zone;

ALTER TABLE public.user_financial_data
  ADD COLUMN IF NOT EXISTS transactions_data jsonb,
  ADD COLUMN IF NOT EXISTS investment_transactions jsonb,
  ADD COLUMN IF NOT EXISTS liabilities_data jsonb,
  ADD COLUMN IF NOT EXISTS income_data jsonb,
  ADD COLUMN IF NOT EXISTS data_sync_summary jsonb,
  ADD COLUMN IF NOT EXISTS asset_report_status text,
  ADD COLUMN IF NOT EXISTS asset_report_created_at timestamp with time zone;

ALTER TABLE public.plaid_sync_cursors
  ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'transactions',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.plaid_sync_cursors
  DROP CONSTRAINT IF EXISTS plaid_sync_cursors_plaid_item_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plaid_sync_cursors_item_product
  ON public.plaid_sync_cursors (plaid_item_id, product);

CREATE TABLE IF NOT EXISTS public.plaid_product_sync_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id text NOT NULL REFERENCES public.plaid_items(plaid_item_id) ON DELETE CASCADE,
  product text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'syncing', 'complete', 'partial', 'unsupported', 'access_required', 'failed')
  ),
  available boolean NOT NULL DEFAULT false,
  records_count integer,
  error_code text,
  error_message text,
  request_id text,
  attempts integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  next_retry_at timestamp with time zone,
  raw_metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, plaid_item_id, product)
);

CREATE INDEX IF NOT EXISTS idx_plaid_product_sync_statuses_user_id
  ON public.plaid_product_sync_statuses (user_id);

CREATE INDEX IF NOT EXISTS idx_plaid_product_sync_statuses_item_product
  ON public.plaid_product_sync_statuses (plaid_item_id, product);

CREATE TABLE IF NOT EXISTS public.plaid_statement_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id text NOT NULL REFERENCES public.plaid_items(plaid_item_id) ON DELETE CASCADE,
  plaid_account_id text,
  statement_id text NOT NULL,
  statement_date date,
  period_start date,
  period_end date,
  status text NOT NULL DEFAULT 'available',
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, statement_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_statement_metadata_user_id
  ON public.plaid_statement_metadata (user_id);

CREATE TABLE IF NOT EXISTS public.plaid_data_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plaid_item_id text,
  webhook_type text,
  webhook_code text,
  product text,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plaid_data_events_item_product
  ON public.plaid_data_events (plaid_item_id, product);

DROP TRIGGER IF EXISTS set_timestamp_on_plaid_product_sync_statuses
  ON public.plaid_product_sync_statuses;
CREATE TRIGGER set_timestamp_on_plaid_product_sync_statuses
  BEFORE UPDATE ON public.plaid_product_sync_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_plaid_statement_metadata
  ON public.plaid_statement_metadata;
CREATE TRIGGER set_timestamp_on_plaid_statement_metadata
  BEFORE UPDATE ON public.plaid_statement_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_plaid_sync_cursors
  ON public.plaid_sync_cursors;
CREATE TRIGGER set_timestamp_on_plaid_sync_cursors
  BEFORE UPDATE ON public.plaid_sync_cursors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.plaid_product_sync_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_statement_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_data_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own Plaid product sync statuses"
  ON public.plaid_product_sync_statuses;
CREATE POLICY "Users can view own Plaid product sync statuses"
  ON public.plaid_product_sync_statuses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access Plaid product sync statuses"
  ON public.plaid_product_sync_statuses;
CREATE POLICY "Service role full access Plaid product sync statuses"
  ON public.plaid_product_sync_statuses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own Plaid statement metadata"
  ON public.plaid_statement_metadata;
CREATE POLICY "Users can view own Plaid statement metadata"
  ON public.plaid_statement_metadata FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access Plaid statement metadata"
  ON public.plaid_statement_metadata;
CREATE POLICY "Service role full access Plaid statement metadata"
  ON public.plaid_statement_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access Plaid data events"
  ON public.plaid_data_events;
CREATE POLICY "Service role full access Plaid data events"
  ON public.plaid_data_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.plaid_product_sync_statuses TO authenticated;
GRANT SELECT ON TABLE public.plaid_statement_metadata TO authenticated;

GRANT ALL ON TABLE public.plaid_product_sync_statuses TO service_role;
GRANT ALL ON TABLE public.plaid_statement_metadata TO service_role;
GRANT ALL ON TABLE public.plaid_data_events TO service_role;
