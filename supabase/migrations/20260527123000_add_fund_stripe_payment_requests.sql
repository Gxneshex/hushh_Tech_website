-- Hushh Fund payment rail while Plaid Transfer approval is pending.
-- Plaid remains the verification/data layer. Stripe is the payment source of truth.

ALTER TABLE public.onboarding_data
  ADD COLUMN IF NOT EXISTS fund_payment_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS fund_investor_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS fund_payment_request_id uuid;

ALTER TABLE public.fund_investment_plans
  ADD COLUMN IF NOT EXISTS first_payment_amount numeric,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_commitment_amount numeric,
  ADD COLUMN IF NOT EXISTS stripe_payment_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS investor_verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS plaid_verification_status text,
  ADD COLUMN IF NOT EXISTS risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS manual_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manual_verification_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fund_investment_plans_stripe_payment_status_check'
  ) THEN
    ALTER TABLE public.fund_investment_plans
      ADD CONSTRAINT fund_investment_plans_stripe_payment_status_check
      CHECK (stripe_payment_status IN (
        'not_started',
        'payment_link_sent',
        'checkout_created',
        'paid',
        'failed',
        'refunded',
        'disputed'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fund_investment_plans_investor_verification_status_check'
  ) THEN
    ALTER TABLE public.fund_investment_plans
      ADD CONSTRAINT fund_investment_plans_investor_verification_status_check
      CHECK (investor_verification_status IN (
        'not_started',
        'pending_manual_verification',
        'verified_investor',
        'rejected'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_data_fund_payment_status_check'
  ) THEN
    ALTER TABLE public.onboarding_data
      ADD CONSTRAINT onboarding_data_fund_payment_status_check
      CHECK (fund_payment_status IN (
        'not_started',
        'payment_link_sent',
        'checkout_created',
        'paid',
        'failed',
        'expired',
        'refunded',
        'disputed'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_data_fund_investor_status_check'
  ) THEN
    ALTER TABLE public.onboarding_data
      ADD CONSTRAINT onboarding_data_fund_investor_status_check
      CHECK (fund_investor_verification_status IN (
        'not_started',
        'pending_manual_verification',
        'verified_investor',
        'rejected'
      ));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.fund_stripe_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  request_token_hash text UNIQUE NOT NULL,
  request_reference text UNIQUE NOT NULL,
  selected_fund text NOT NULL DEFAULT 'hushh_fund_a',
  class_a_units integer NOT NULL DEFAULT 0,
  class_b_units integer NOT NULL DEFAULT 0,
  class_c_units integer NOT NULL DEFAULT 0,
  commitment_amount numeric NOT NULL,
  first_payment_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  recurring_selected boolean NOT NULL DEFAULT false,
  recurring_amount numeric,
  recurring_frequency text,
  recurring_day_of_month integer,
  status text NOT NULL DEFAULT 'payment_link_sent' CHECK (status IN (
    'payment_link_sent',
    'checkout_created',
    'paid',
    'expired',
    'cancelled',
    'failed',
    'pending_manual_verification',
    'verified_investor',
    'rejected',
    'refunded',
    'disputed'
  )),
  payment_url text,
  stripe_checkout_session_id text UNIQUE,
  latest_stripe_payment_intent_id text,
  latest_stripe_charge_id text,
  latest_stripe_customer_id text,
  latest_stripe_subscription_id text,
  expires_at timestamp with time zone NOT NULL,
  paid_at timestamp with time zone,
  verified_at timestamp with time zone,
  rejected_at timestamp with time zone,
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_note text,
  risk_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  plaid_match_confidence numeric,
  plaid_match_details jsonb,
  raw_checkout_session jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_payment_requests_user_id
  ON public.fund_stripe_payment_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_payment_requests_plan_id
  ON public.fund_stripe_payment_requests(plan_id);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_payment_requests_status
  ON public.fund_stripe_payment_requests(status);

CREATE TABLE IF NOT EXISTS public.fund_stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_request_id uuid REFERENCES public.fund_stripe_payment_requests(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_invoice_id text,
  stripe_subscription_id text,
  amount_cents integer NOT NULL,
  amount numeric GENERATED ALWAYS AS ((amount_cents::numeric) / 100.0) STORED,
  currency text NOT NULL DEFAULT 'usd',
  payment_kind text NOT NULL DEFAULT 'initial_commitment' CHECK (payment_kind IN (
    'initial_commitment',
    'recurring_invoice',
    'follow_up'
  )),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'disputed',
    'requires_action',
    'processing'
  )),
  stripe_risk_level text,
  stripe_risk_score integer,
  stripe_outcome jsonb,
  payment_method_brand text,
  payment_method_last4 text,
  payment_method_country text,
  raw_payment_intent jsonb,
  raw_charge jsonb,
  raw_invoice jsonb,
  paid_at timestamp with time zone,
  failed_at timestamp with time zone,
  refunded_at timestamp with time zone,
  disputed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (stripe_payment_intent_id, payment_kind)
);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_payments_user_id
  ON public.fund_stripe_payments(user_id);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_payments_request_id
  ON public.fund_stripe_payments(payment_request_id);

CREATE TABLE IF NOT EXISTS public.fund_stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_request_id uuid REFERENCES public.fund_stripe_payment_requests(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'pending_manual_verification' CHECK (status IN (
    'pending_manual_verification',
    'pending_setup',
    'active',
    'past_due',
    'paused',
    'cancelled',
    'incomplete',
    'unpaid'
  )),
  recurring_amount numeric,
  recurring_frequency text,
  recurring_day_of_month integer,
  interval text,
  interval_count integer,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  ended_at timestamp with time zone,
  latest_invoice_id text,
  raw_subscription jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_subscriptions_user_id
  ON public.fund_stripe_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS public.fund_stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_request_id uuid REFERENCES public.fund_stripe_payment_requests(id) ON DELETE SET NULL,
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  api_version text,
  livemode boolean,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_stripe_events_user_id
  ON public.fund_stripe_events(user_id);

CREATE TABLE IF NOT EXISTS public.fund_payment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_request_id uuid REFERENCES public.fund_stripe_payment_requests(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.fund_investment_plans(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN (
    'pending_manual_verification',
    'verified_investor',
    'rejected'
  )),
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_payment_reviews_user_id
  ON public.fund_payment_reviews(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fund_payment_reviews_request_unique
  ON public.fund_payment_reviews(payment_request_id)
  WHERE payment_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.fund_payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_request_id uuid REFERENCES public.fund_stripe_payment_requests(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.fund_stripe_payments(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_fund_payment_notifications_user_id
  ON public.fund_payment_notifications(user_id);

ALTER TABLE public.onboarding_data
  DROP CONSTRAINT IF EXISTS onboarding_data_fund_payment_request_id_fkey;

ALTER TABLE public.onboarding_data
  ADD CONSTRAINT onboarding_data_fund_payment_request_id_fkey
  FOREIGN KEY (fund_payment_request_id)
  REFERENCES public.fund_stripe_payment_requests(id)
  ON DELETE SET NULL;

DROP TRIGGER IF EXISTS set_timestamp_on_fund_stripe_payment_requests
  ON public.fund_stripe_payment_requests;
CREATE TRIGGER set_timestamp_on_fund_stripe_payment_requests
  BEFORE UPDATE ON public.fund_stripe_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_stripe_payments
  ON public.fund_stripe_payments;
CREATE TRIGGER set_timestamp_on_fund_stripe_payments
  BEFORE UPDATE ON public.fund_stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_stripe_subscriptions
  ON public.fund_stripe_subscriptions;
CREATE TRIGGER set_timestamp_on_fund_stripe_subscriptions
  BEFORE UPDATE ON public.fund_stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_fund_payment_reviews
  ON public.fund_payment_reviews;
CREATE TRIGGER set_timestamp_on_fund_payment_reviews
  BEFORE UPDATE ON public.fund_payment_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.fund_stripe_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_stripe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_payment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_payment_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own fund payment requests" ON public.fund_stripe_payment_requests;
CREATE POLICY "Users can view own fund payment requests"
  ON public.fund_stripe_payment_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund payment requests" ON public.fund_stripe_payment_requests;
CREATE POLICY "Service role full access fund payment requests"
  ON public.fund_stripe_payment_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund Stripe payments" ON public.fund_stripe_payments;
CREATE POLICY "Users can view own fund Stripe payments"
  ON public.fund_stripe_payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund Stripe payments" ON public.fund_stripe_payments;
CREATE POLICY "Service role full access fund Stripe payments"
  ON public.fund_stripe_payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund Stripe subscriptions" ON public.fund_stripe_subscriptions;
CREATE POLICY "Users can view own fund Stripe subscriptions"
  ON public.fund_stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund Stripe subscriptions" ON public.fund_stripe_subscriptions;
CREATE POLICY "Service role full access fund Stripe subscriptions"
  ON public.fund_stripe_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access fund Stripe events" ON public.fund_stripe_events;
CREATE POLICY "Service role full access fund Stripe events"
  ON public.fund_stripe_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund payment reviews" ON public.fund_payment_reviews;
CREATE POLICY "Users can view own fund payment reviews"
  ON public.fund_payment_reviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund payment reviews" ON public.fund_payment_reviews;
CREATE POLICY "Service role full access fund payment reviews"
  ON public.fund_payment_reviews FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own fund payment notifications" ON public.fund_payment_notifications;
CREATE POLICY "Users can view own fund payment notifications"
  ON public.fund_payment_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access fund payment notifications" ON public.fund_payment_notifications;
CREATE POLICY "Service role full access fund payment notifications"
  ON public.fund_payment_notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.fund_stripe_payment_requests TO authenticated;
GRANT SELECT ON TABLE public.fund_stripe_payments TO authenticated;
GRANT SELECT ON TABLE public.fund_stripe_subscriptions TO authenticated;
GRANT SELECT ON TABLE public.fund_payment_reviews TO authenticated;
GRANT SELECT ON TABLE public.fund_payment_notifications TO authenticated;

GRANT ALL ON TABLE public.fund_stripe_payment_requests TO service_role;
GRANT ALL ON TABLE public.fund_stripe_payments TO service_role;
GRANT ALL ON TABLE public.fund_stripe_subscriptions TO service_role;
GRANT ALL ON TABLE public.fund_stripe_events TO service_role;
GRANT ALL ON TABLE public.fund_payment_reviews TO service_role;
GRANT ALL ON TABLE public.fund_payment_notifications TO service_role;
