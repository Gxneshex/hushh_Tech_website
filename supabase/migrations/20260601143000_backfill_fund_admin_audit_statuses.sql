-- Backfill admin-audit status fields from historical Plaid and Stripe evidence.
-- This is intentionally conservative: it updates existing onboarding rows only.
-- It does not create synthetic onboarding rows for users who only have legacy
-- financial data; the fund-admin union query surfaces those users with a
-- missing_onboarding_row flag instead.

DO $$
DECLARE
  link_condition text;
  has_sync_status boolean;
BEGIN
  IF to_regclass('public.onboarding_data') IS NOT NULL
    AND to_regclass('public.user_financial_data') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'onboarding_data'
        AND column_name = 'financial_link_status'
    )
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_financial_data'
        AND column_name = 'plaid_item_id'
    )
  THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_financial_data'
        AND column_name = 'plaid_sync_status'
    ) INTO has_sync_status;

    link_condition :=
      'financial.plaid_item_id IS NOT NULL OR LOWER(COALESCE(financial.status, '''')) IN (''complete'', ''partial'')';
    IF has_sync_status THEN
      link_condition := link_condition ||
        ' OR LOWER(COALESCE(financial.plaid_sync_status, '''')) IN (''complete'', ''partial'')';
    END IF;

    EXECUTE format($sql$
      UPDATE public.onboarding_data AS onboarding
      SET
        financial_link_status = 'completed',
        updated_at = now()
      FROM public.user_financial_data AS financial
      WHERE financial.user_id = onboarding.user_id
        AND COALESCE(onboarding.financial_link_status, '') <> 'completed'
        AND (%s)
    $sql$, link_condition);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.onboarding_data') IS NOT NULL
    AND to_regclass('public.fund_stripe_payment_requests') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'onboarding_data'
        AND column_name = 'fund_payment_status'
    )
  THEN
    EXECUTE $sql$
      WITH latest_payment_request AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          status,
          paid_at,
          verified_at,
          rejected_at
        FROM public.fund_stripe_payment_requests
        ORDER BY user_id, created_at DESC
      )
      UPDATE public.onboarding_data AS onboarding
      SET
        fund_payment_status = CASE
          WHEN latest.paid_at IS NOT NULL THEN 'paid'
          WHEN latest.status IN ('payment_link_sent', 'checkout_created') THEN latest.status
          ELSE COALESCE(onboarding.fund_payment_status, 'not_started')
        END,
        updated_at = now()
      FROM latest_payment_request AS latest
      WHERE latest.user_id = onboarding.user_id
        AND (
          latest.paid_at IS NOT NULL
          OR latest.status IN ('payment_link_sent', 'checkout_created')
        )
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.onboarding_data') IS NOT NULL
    AND to_regclass('public.fund_stripe_payment_requests') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'onboarding_data'
        AND column_name = 'fund_investor_verification_status'
    )
  THEN
    EXECUTE $sql$
      WITH latest_payment_request AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          status
        FROM public.fund_stripe_payment_requests
        ORDER BY user_id, created_at DESC
      )
      UPDATE public.onboarding_data AS onboarding
      SET
        fund_investor_verification_status = latest.status,
        updated_at = now()
      FROM latest_payment_request AS latest
      WHERE latest.user_id = onboarding.user_id
        AND latest.status IN ('verified_investor', 'rejected', 'pending_manual_verification')
        AND COALESCE(onboarding.fund_investor_verification_status, '') <> latest.status
    $sql$;
  END IF;
END $$;
