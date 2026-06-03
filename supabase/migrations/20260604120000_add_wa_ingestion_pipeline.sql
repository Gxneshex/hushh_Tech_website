-- WhatsApp to Blog ingestion pipeline
-- INTERNAL/TEAM tables. RLS is enabled with NO public policies, so only the
-- Supabase service-role key (used by the wa-* edge functions / worker) can read or
-- write. Team access is enforced in-function via authenticateTeamMember().
-- Conventions mirror the repo: gen_random_uuid() PKs, timestamptz created_at/updated_at,
-- CHECK enums, explicit indexes.

-- local updated_at trigger helper for this pipeline
create or replace function public.wa_set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- 1. groups (the monitored WhatsApp groups)
create table if not exists public.wa_groups (
  id uuid primary key default gen_random_uuid(),
  group_jid text unique not null,
  display_name text not null,
  is_monitored boolean not null default true,
  relevance_prior numeric not null default 0.7,
  oldest_retrievable_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. senders (one logical person) + identities (their JIDs / push-names)
create table if not exists public.wa_senders (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  is_priority boolean not null default false,
  priority_weight numeric not null default 0.3 check (priority_weight >= 0 and priority_weight <= 10),
  role_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wa_sender_identities (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.wa_senders(id) on delete cascade,
  wa_jid text unique,
  phone_e164 text,
  display_name text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_ident_sender on public.wa_sender_identities(sender_id);

-- 3. messages (raw capture + provenance)
create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.wa_groups(id) on delete cascade,
  group_jid text not null,
  sender_id uuid references public.wa_senders(id) on delete set null,
  sender_display text,
  wa_message_id text,
  wa_timestamp timestamptz,
  body text,
  is_forwarded boolean not null default false,
  source text not null default 'realtime' check (source in ('realtime','backfill_export','backfill_gateway')),
  raw_evidence_path text,
  dedupe_hash text unique not null,
  content_item_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_msg_group on public.wa_messages(group_id);
create index if not exists idx_wa_msg_ts on public.wa_messages(wa_timestamp desc);
create index if not exists idx_wa_msg_content on public.wa_messages(content_item_id);

-- 4. media (attachments; bytes live in the wa-evidence bucket)
create table if not exists public.wa_media (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.wa_messages(id) on delete cascade,
  artifact_type text,
  original_filename text,
  mime_type text,
  byte_size bigint,
  sha256 text,
  evidence_path text,
  media_status text not null default 'available'
    check (media_status in ('available','downloading','expired','too_large','unsupported')),
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_media_msg on public.wa_media(message_id);
create unique index if not exists uq_wa_media_sha on public.wa_media(sha256) where sha256 is not null;

-- 5. links
create table if not exists public.wa_links (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.wa_messages(id) on delete cascade,
  url text,
  canonical_url text,
  link_type text check (link_type in ('youtube','gdoc','gdrive','claude_share','generic')),
  fetch_status text not null default 'pending',
  dedupe_hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_links_msg on public.wa_links(message_id);

-- 6. extractions (per-artifact extracted text — read before classification)
create table if not exists public.wa_extractions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.wa_messages(id) on delete cascade,
  media_id uuid references public.wa_media(id) on delete cascade,
  link_id uuid references public.wa_links(id) on delete cascade,
  artifact_type text,
  extracted_text text,
  extras jsonb,
  method text,
  confidence numeric,
  status text not null default 'pending'
    check (status in ('pending','done','partial','failed','unavailable')),
  error text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_extr_msg on public.wa_extractions(message_id);
create index if not exists idx_wa_extr_media on public.wa_extractions(media_id);

-- 7. content_items (deduped logical unit) + content_versions (re-share history)
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_hash text unique not null,
  canonical_text text,
  doc_fingerprint text,
  cluster_id uuid,
  is_cluster_primary boolean not null default true,
  current_version_id uuid,
  created_at timestamptz not null default now()
);
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version_no integer not null,
  source_message_id uuid references public.wa_messages(id) on delete set null,
  structured_summary jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_ver_item on public.content_versions(content_item_id);
-- wire wa_messages.content_item_id now that content_items exists
alter table public.wa_messages drop constraint if exists fk_wa_msg_content;
alter table public.wa_messages
  add constraint fk_wa_msg_content foreign key (content_item_id)
  references public.content_items(id) on delete set null;

-- 8. classifications (topic + relevance + sensitivity per the AI brain)
create table if not exists public.wa_classifications (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  message_id uuid references public.wa_messages(id) on delete cascade,
  topic_label text,
  secondary_labels jsonb,
  relevance_score integer,
  route text check (route in ('accept','needs_human','reject')),
  route_confidence numeric,
  sensitivity text,
  compliance_flags jsonb,
  score_breakdown jsonb,
  model text,
  rationale text,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_class_route on public.wa_classifications(route);
create index if not exists idx_wa_class_item on public.wa_classifications(content_item_id);

-- 9. blog_drafts (the reviewable output)
create table if not exists public.blog_drafts (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete set null,
  title text,
  slug text,
  description text,
  body text,
  target_folder text,
  category text,
  access_level text default 'NDA' check (access_level in ('Public','NDA')),
  status text not null default 'new'
    check (status in ('new','ai_reviewed','needs_human','approved','published','rejected')),
  cover_path text,
  attachment_paths jsonb,
  reviewer_email text,
  approver_email text,
  pr_url text,
  source_refs jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_status on public.blog_drafts(status);
create trigger trg_blog_drafts_updated before update on public.blog_drafts
  for each row execute function public.wa_set_updated_at();

-- 10. review actions (audit trail; mirrors fund_admin_access_log)
create table if not exists public.wa_review_actions (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text,
  draft_id uuid references public.blog_drafts(id) on delete cascade,
  from_status text,
  to_status text,
  note text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_review_draft on public.wa_review_actions(draft_id);

-- 11. jobs queue (worker pulls these)
create table if not exists public.wa_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null
    check (job_type in ('extract','classify','draft_gen','resolve_link','reclassify','publish_pr','backfill_parse')),
  status text not null default 'pending'
    check (status in ('pending','processing','completed','failed')),
  payload jsonb,
  result jsonb,
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  scheduled_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wa_jobs_poll on public.wa_jobs(status, scheduled_at);
create trigger trg_wa_jobs_updated before update on public.wa_jobs
  for each row execute function public.wa_set_updated_at();

-- atomic job claim for the worker (FOR UPDATE SKIP LOCKED)
create or replace function public.claim_wa_job(p_types text[] default null)
returns public.wa_jobs as $$
declare j public.wa_jobs;
begin
  select * into j from public.wa_jobs
   where status='pending'
     and (scheduled_at is null or scheduled_at <= now())
     and (p_types is null or job_type = any(p_types))
   order by created_at asc
   for update skip locked
   limit 1;
  if not found then return null; end if;
  update public.wa_jobs set status='processing', locked_at=now() where id=j.id returning * into j;
  return j;
end; $$ language plpgsql;

-- RLS: enable on every table, add NO permissive policy; service-role key only.
do $$ declare t text;
begin
  foreach t in array array[
    'wa_groups','wa_senders','wa_sender_identities','wa_messages','wa_media','wa_links',
    'wa_extractions','content_items','content_versions','wa_classifications',
    'blog_drafts','wa_review_actions','wa_jobs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- private storage bucket for raw evidence (media, export zips, snapshots)
insert into storage.buckets (id, name, public)
values ('wa-evidence', 'wa-evidence', false)
on conflict (id) do nothing;

drop policy if exists "wa-evidence service role only" on storage.objects;
create policy "wa-evidence service role only" on storage.objects for all
  using (bucket_id = 'wa-evidence' and auth.role() = 'service_role')
  with check (bucket_id = 'wa-evidence' and auth.role() = 'service_role');
