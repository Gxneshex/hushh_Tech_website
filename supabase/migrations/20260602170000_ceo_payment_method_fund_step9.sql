-- Single $1 onboarding charge: the step-9 fund payment now also grants the
-- Meet-CEO perk (300,000 Hushh coins + the 1-on-1 unlock). The grant writes a
-- ceo_meeting_payments row with payment_method='fund_step9' — a sentinel meaning
-- "the perk was bundled into the fund payment", distinct from a separate $1
-- Stripe charge ('stripe') or a coupon ('coupon'). Relax the CHECK to allow it.
alter table public.ceo_meeting_payments
  drop constraint if exists ceo_meeting_payments_payment_method_check;

alter table public.ceo_meeting_payments
  add constraint ceo_meeting_payments_payment_method_check
  check (payment_method = any (array['stripe'::text, 'coupon'::text, 'fund_step9'::text]));
