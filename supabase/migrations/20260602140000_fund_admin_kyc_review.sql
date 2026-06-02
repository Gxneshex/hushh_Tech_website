-- P2 KYC: allow the fund-admin access log to record KYC operations.
--
-- The cockpit can now record a manual KYC review outcome (sanctions/PEP cleared
-- or flagged) and, once an automated provider is wired, an automated re-screen.
-- Both write to the existing kyc_attestations table; here we only widen the
-- audit-action vocabulary so those actions can be logged for compliance.
alter table public.fund_admin_access_log
  drop constraint if exists fund_admin_access_log_action_check;

alter table public.fund_admin_access_log
  add constraint fund_admin_access_log_action_check
  check (action in (
    'view_overview','view_investor','approve','reject',
    'resend_link','reminder','note_add','tag_set','export',
    'kyc_review','kyc_rescreen'
  ));
