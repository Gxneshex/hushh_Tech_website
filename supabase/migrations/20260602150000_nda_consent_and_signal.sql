-- NDA consent record + re-sign signal.
--
-- (a) Persist WHAT the user consented to (the acknowledged fund documents +
--     the consent copy version) on nda_signatures — the durable, auditable
--     consent artifact (handled "legally, like KYC").
-- (b) Extend sign_global_nda to return whether this sign is a first-time sign
--     or a genuine NDA-version change ("shouldNotify"), so the client only
--     fires notification emails when there is something new to notify — an
--     accidental re-sign of the same version emails no one.

alter table public.nda_signatures
  add column if not exists documents_acknowledged jsonb not null default '[]'::jsonb,
  add column if not exists consent_version text;

comment on column public.nda_signatures.documents_acknowledged is
  'Durable record of the fund documents (by fullName) the user acknowledged at signing — the auditable consent artifact.';
comment on column public.nda_signatures.consent_version is
  'The NDA / consent copy version the user agreed to.';

-- Replace the RPC with two extra (defaulted) params + a re-sign signal.
-- Drop the old 4-arg overload so only one resolvable definition remains
-- (the new one is callable with the old 4 args via the defaults).
drop function if exists public.sign_global_nda(text, text, text, text);

create or replace function public.sign_global_nda(
  p_signer_name text,
  p_nda_version text default 'v1.0',
  p_pdf_url text default null,
  p_signer_ip text default null,
  p_documents_acknowledged jsonb default '[]'::jsonb,
  p_consent_version text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_prev_id uuid;
  v_prev_version text;
  v_was_inserted boolean;
  v_version_changed boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'User not authenticated');
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  -- Inspect the prior signature (if any) to decide whether this sign is new.
  select id, nda_version into v_prev_id, v_prev_version
  from public.nda_signatures where user_id = v_user_id;

  v_was_inserted := v_prev_id is null;
  v_version_changed := (
    v_prev_id is not null
    and v_prev_version is distinct from coalesce(p_nda_version, 'v1.0')
  );

  insert into public.nda_signatures (
    user_id, signer_name, signer_email, signer_ip, nda_version, pdf_url,
    documents_acknowledged, consent_version, signed_at, created_at, updated_at
  )
  values (
    v_user_id, p_signer_name, v_user_email, coalesce(p_signer_ip, 'unknown'),
    coalesce(p_nda_version, 'v1.0'), p_pdf_url,
    coalesce(p_documents_acknowledged, '[]'::jsonb), p_consent_version,
    now(), now(), now()
  )
  on conflict (user_id) do update set
    signer_name = p_signer_name,
    signer_ip = coalesce(p_signer_ip, nda_signatures.signer_ip),
    nda_version = coalesce(p_nda_version, nda_signatures.nda_version),
    pdf_url = coalesce(p_pdf_url, nda_signatures.pdf_url),
    documents_acknowledged = coalesce(p_documents_acknowledged, nda_signatures.documents_acknowledged),
    consent_version = coalesce(p_consent_version, nda_signatures.consent_version),
    signed_at = now(),
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'signedAt', now(),
    'signerName', p_signer_name,
    'ndaVersion', coalesce(p_nda_version, 'v1.0'),
    'wasInserted', v_was_inserted,
    'versionChanged', v_version_changed,
    'shouldNotify', (v_was_inserted or v_version_changed)
  );
end;
$$;

grant execute on function public.sign_global_nda(text, text, text, text, jsonb, text) to authenticated;

notify pgrst, 'reload schema';
