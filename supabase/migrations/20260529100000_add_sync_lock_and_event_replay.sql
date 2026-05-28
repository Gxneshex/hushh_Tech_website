-- Concurrency lock for Plaid product sync runs, and deferred-replay tracking
-- for Stripe webhook events that arrive before their dependent payment row
-- has been written.

-- Plaid sync lock: a single timestamp on plaid_items lets startPlaidDataSync
-- short-circuit when another sync is already in flight within the lock window.
ALTER TABLE public.plaid_items
  ADD COLUMN IF NOT EXISTS last_sync_started_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_plaid_items_last_sync_started_at
  ON public.plaid_items(last_sync_started_at);

-- Webhook deferred-replay tracking. Stripe events such as charge.refunded
-- can arrive before checkout.session.completed under retry storms. We
-- record those as "deferred" so a follow-up worker (or the next webhook
-- arrival) can replay them once the dependent payment row exists.
ALTER TABLE public.fund_stripe_events
  ADD COLUMN IF NOT EXISTS processing_status text
    NOT NULL DEFAULT 'processed'
    CHECK (processing_status IN ('processed', 'deferred', 'replayed', 'failed'));

ALTER TABLE public.fund_stripe_events
  ADD COLUMN IF NOT EXISTS defer_reason text;

ALTER TABLE public.fund_stripe_events
  ADD COLUMN IF NOT EXISTS replayed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_fund_stripe_events_processing_status
  ON public.fund_stripe_events(processing_status)
  WHERE processing_status IN ('deferred', 'failed');
