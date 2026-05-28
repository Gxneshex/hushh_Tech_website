-- Plaid Link diagnostics — append-only audit trail for every notable
-- event during the financial-link / Plaid Link flow. Lets the team
-- reconstruct exactly what happened when a user reports a stuck
-- "Something went wrong" Plaid modal: page state, OAuth resume detection,
-- SDK events, edge function failures, and uncaught Plaid CDN errors.

CREATE TABLE IF NOT EXISTS public.plaid_link_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Session correlation: a client-generated UUID emitted from the same
  -- financial-link page mount so all events in one user attempt cluster.
  session_id uuid,
  -- High-level taxonomy of the event. Open vocabulary (text, not enum) so
  -- new event types can be added without a migration; queries should
  -- filter by event_type prefixes (e.g., `plaid_link_%`).
  event_type text NOT NULL,
  -- Plaid hook step machine label at the time of the event.
  plaid_step text,
  -- Page-level snapshot: route, search params, isReviewMode, oauth_state_id
  -- present, financial_link_status, fund_payment_status, etc. Anything
  -- needed to reconstruct the routing intent.
  page_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Plaid SDK metadata (institution name/id, exit reason code, accounts
  -- count, view name). Mirrors react-plaid-link's onEvent payload shape.
  plaid_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Error capture: message, stack, source URL, type. Empty when the
  -- event is informational (mount, step change).
  error_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Lean browser context for triage: userAgent, language, viewport, dpr,
  -- extension shim presence. No PII.
  browser_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plaid_link_diagnostics_user_id
  ON public.plaid_link_diagnostics(user_id);

CREATE INDEX IF NOT EXISTS idx_plaid_link_diagnostics_session_id
  ON public.plaid_link_diagnostics(session_id);

CREATE INDEX IF NOT EXISTS idx_plaid_link_diagnostics_event_type
  ON public.plaid_link_diagnostics(event_type);

CREATE INDEX IF NOT EXISTS idx_plaid_link_diagnostics_created_at
  ON public.plaid_link_diagnostics(created_at DESC);

ALTER TABLE public.plaid_link_diagnostics ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own diagnostic trail (useful if we
-- ever surface a "Show technical details" affordance in support flows).
DROP POLICY IF EXISTS "Users read own Plaid diagnostics" ON public.plaid_link_diagnostics;
CREATE POLICY "Users read own Plaid diagnostics"
  ON public.plaid_link_diagnostics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access (used by the plaid-diagnostics-log edge
-- function and by ops support tooling). No INSERT policy for clients —
-- everything funnels through the edge function so we can sanitize.
DROP POLICY IF EXISTS "Service role full access Plaid diagnostics" ON public.plaid_link_diagnostics;
CREATE POLICY "Service role full access Plaid diagnostics"
  ON public.plaid_link_diagnostics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON TABLE public.plaid_link_diagnostics TO authenticated;
GRANT ALL ON TABLE public.plaid_link_diagnostics TO service_role;
