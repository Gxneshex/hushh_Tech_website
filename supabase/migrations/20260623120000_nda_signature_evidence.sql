-- Electronic-signature evidence columns on nda_signatures.
--
-- Additive only (no RPC change, so no deploy-ordering dependency): the
-- nda-signed-notification edge function backfills these with the server-attested
-- IP (x-forwarded-for), the signer's device (user agent), and the unique
-- signature ID — completing the electronic-signature audit record (ESIGN/UETA)
-- alongside the existing signer_ip / consent_version / documents_acknowledged.

alter table public.nda_signatures
  add column if not exists signer_user_agent text,
  add column if not exists signature_id text;

comment on column public.nda_signatures.signer_user_agent is
  'Signer browser/device user-agent — electronic-signature attribution evidence.';
comment on column public.nda_signatures.signature_id is
  'Unique per-signature identifier stamped on the signed documents (ties the record to the certificate).';

notify pgrst, 'reload schema';
