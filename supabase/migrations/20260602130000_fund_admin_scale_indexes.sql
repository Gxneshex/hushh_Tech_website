-- Indexes supporting the /fund-admin cockpit's aggregate + lookup queries
-- (overview funnel, analytics, per-user latest payment). Tables are small
-- today; these are cheap insurance for when the funnel grows. Non-concurrent
-- (tables are tiny) so this stays transactional under the migration runner.

-- Join key the overview/analytics group plaid_accounts on (was unindexed).
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_plaid_item_id
  ON public.plaid_accounts (plaid_item_id);

-- "Collected" sums fund_stripe_payments WHERE status='succeeded'; analytics
-- buckets them by paid_at.
CREATE INDEX IF NOT EXISTS idx_fund_stripe_payments_status
  ON public.fund_stripe_payments (status);
CREATE INDEX IF NOT EXISTS idx_fund_stripe_payments_status_paid_at
  ON public.fund_stripe_payments (status, paid_at DESC);

-- Latest-payment-request-per-user (DISTINCT ON (user_id) ORDER BY created_at DESC)
-- and recency sort/pagination.
CREATE INDEX IF NOT EXISTS idx_fund_stripe_payment_requests_user_created
  ON public.fund_stripe_payment_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_stripe_payment_requests_created_at
  ON public.fund_stripe_payment_requests (created_at DESC);
