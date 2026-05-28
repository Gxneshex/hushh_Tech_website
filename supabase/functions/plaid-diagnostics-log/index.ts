/**
 * plaid-diagnostics-log — fire-and-forget append endpoint for the
 * financial-link / Plaid Link diagnostic trail. The frontend calls this
 * on every notable Plaid Link event (mount, step transitions, SDK events,
 * uncaught CDN errors) so the team can reconstruct exactly what happened
 * when a user reports a stuck "Something went wrong" modal.
 *
 * Conventions:
 * - PUBLIC endpoint (no auth check). Authenticated users will pass their
 *   Supabase JWT so we can derive user_id. Anonymous events (pre-login
 *   landing on financial-link) are accepted with user_id null.
 * - Never throws back to the caller. Diagnostics must be lossy-OK; we
 *   should not break the real flow when logging fails.
 * - Caps payload sizes per field to keep one bad client from filling the
 *   table.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const MAX_EVENT_TYPE_LEN = 64;
const MAX_PLAID_STEP_LEN = 32;
const MAX_FIELD_BYTES = 16_000; // 16KB per jsonb field is plenty for any
                                // single Plaid event; protects against
                                // accidental dump-the-DOM attacks.

const truncateJson = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  const serialised = JSON.stringify(value);
  if (serialised.length <= MAX_FIELD_BYTES) return value;
  return {
    __truncated: true,
    __original_bytes: serialised.length,
    sample: serialised.slice(0, MAX_FIELD_BYTES),
  };
};

const truncateText = (value: unknown, limit: number): string | null => {
  if (value == null) return null;
  const text = String(value);
  return text.length > limit ? text.slice(0, limit) : text;
};

async function deriveUserId(
  supabase: any,
  authHeader: string | null,
): Promise<string | null> {
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token && token !== Deno.env.get('SUPABASE_ANON_KEY')) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.id) return user.id;
      } catch {
        // Invalid or expired JWTs are logged anonymously.
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      // Without service creds we cannot insert. Swallow silently — never
      // surface infra errors to the client.
      return json({ accepted: false, reason: 'service_unavailable' }, 200);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return json({ accepted: false, reason: 'invalid_payload' }, 200);
    }

    const userId = await deriveUserId(
      supabase,
      req.headers.get('Authorization'),
    );

    const event_type = truncateText(body.event_type, MAX_EVENT_TYPE_LEN);
    if (!event_type) {
      return json({ accepted: false, reason: 'missing_event_type' }, 200);
    }

    const row = {
      user_id: userId,
      session_id:
        typeof body.session_id === 'string' && body.session_id.length === 36
          ? body.session_id
          : null,
      event_type,
      plaid_step: truncateText(body.plaid_step, MAX_PLAID_STEP_LEN),
      page_state: truncateJson(body.page_state ?? {}),
      plaid_metadata: truncateJson(body.plaid_metadata ?? {}),
      error_details: truncateJson(body.error_details ?? {}),
      browser_context: truncateJson(body.browser_context ?? {}),
    };

    const { error } = await supabase
      .from('plaid_link_diagnostics')
      .insert(row);

    if (error) {
      console.warn('[plaid-diagnostics-log] insert failed', error.message);
      return json({ accepted: false, reason: 'db_error' }, 200);
    }

    return json({ accepted: true }, 200);
  } catch (error) {
    console.warn(
      '[plaid-diagnostics-log] unexpected',
      error instanceof Error ? error.message : String(error),
    );
    return json({ accepted: false, reason: 'unexpected' }, 200);
  }
});
