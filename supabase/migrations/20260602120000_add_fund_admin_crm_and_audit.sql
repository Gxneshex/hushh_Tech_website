-- Fund-admin CRM (investor notes + tags) and the admin-access audit log.
-- All three tables are INTERNAL: service-role only (no investor reads). Access
-- is exclusively via the team-gated fund-admin edge functions.

-- ── Investor CRM notes (separate from compliance review-decision notes) ──
CREATE TABLE IF NOT EXISTS public.fund_investor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fund_investor_notes_user_id
  ON public.fund_investor_notes (user_id, created_at DESC);

-- ── Investor tags (free-form, normalized lowercase, deduped per investor) ──
CREATE TABLE IF NOT EXISTS public.fund_investor_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_fund_investor_tags_user_id
  ON public.fund_investor_tags (user_id);

-- ── Admin-access audit log (who did / viewed what, when) ──
CREATE TABLE IF NOT EXISTS public.fund_admin_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL CHECK (action IN (
    'view_overview','view_investor','approve','reject',
    'resend_link','reminder','note_add','tag_set','export'
  )),
  -- target_user_id is intentionally NOT an FK: keep the audit trail even if the
  -- investor (and their cascading data) is later purged.
  target_user_id uuid,
  target_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fund_admin_access_log_created_at
  ON public.fund_admin_access_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_admin_access_log_actor
  ON public.fund_admin_access_log (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_admin_access_log_target
  ON public.fund_admin_access_log (target_user_id, created_at DESC);

-- ── updated_at trigger on notes (reuses the repo-wide helper) ──
DROP TRIGGER IF EXISTS set_timestamp_fund_investor_notes ON public.fund_investor_notes;
CREATE TRIGGER set_timestamp_fund_investor_notes
  BEFORE UPDATE ON public.fund_investor_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ── RLS: service-role only. Deliberately NO grant to `authenticated` and NO
--    auth.uid() SELECT policy — investors must never read internal CRM/audit
--    data. Access is exclusively via the team-gated fund-admin edge functions
--    using the service-role client. ──
ALTER TABLE public.fund_investor_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_investor_tags    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_admin_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access fund_investor_notes" ON public.fund_investor_notes;
CREATE POLICY "Service role full access fund_investor_notes"
  ON public.fund_investor_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access fund_investor_tags" ON public.fund_investor_tags;
CREATE POLICY "Service role full access fund_investor_tags"
  ON public.fund_investor_tags FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access fund_admin_access_log" ON public.fund_admin_access_log;
CREATE POLICY "Service role full access fund_admin_access_log"
  ON public.fund_admin_access_log FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.fund_investor_notes   TO service_role;
GRANT ALL ON TABLE public.fund_investor_tags    TO service_role;
GRANT ALL ON TABLE public.fund_admin_access_log TO service_role;
