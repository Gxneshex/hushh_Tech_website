// get-auth-numbers — Fetch Plaid Auth server-side and redact sensitive ACH values by default.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPlaidConfig, plaidRequest } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function redactAuthNumbers(data: any) {
  const ach = Array.isArray(data?.numbers?.ach) ? data.numbers.ach : [];
  return {
    accounts: data?.accounts || [],
    numbers: {
      ach: ach.map((entry: any) => ({
        account_id: entry.account_id,
        account_mask: entry.account ? String(entry.account).slice(-4) : null,
        routing_mask: entry.routing ? String(entry.routing).slice(-4) : null,
        wire_routing_mask: entry.wire_routing ? String(entry.wire_routing).slice(-4) : null,
      })),
    },
    sensitive_redacted: true,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id || null;
    const plaidItemId = body.itemId || body.item_id || body.plaid_item_id || null;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'get-auth-numbers',
      expectedUserId: userId,
    });
    if (authFailure) return authFailure;

    let data: any;
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase service configuration is missing');
      }

      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { accessToken } = await getPlaidAccessTokenForUser(supabase, userId, plaidItemId);
      data = (await plaidRequest('/auth/get', { access_token: accessToken })).data;
    } else {
      const accessToken = body.accessToken || body.access_token;
      if (!accessToken || Deno.env.get('PLAID_ALLOW_CLIENT_ACCESS_TOKEN') !== 'true') {
        return json({ error: 'Server-side userId is required for Plaid Auth' }, 400);
      }

      const plaid = getPlaidConfig();
      const response = await fetch(`${plaid.baseUrl}/auth/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: plaid.clientId,
          secret: plaid.secret,
          access_token: accessToken,
        }),
      });

      data = await response.json();
      if (!response.ok) {
        return json({ error: data.error_message, error_code: data.error_code }, response.status);
      }
    }

    if (body.redact === false && Deno.env.get('PLAID_ALLOW_RAW_AUTH_NUMBERS') === 'true') {
      return json({ accounts: data.accounts, numbers: data.numbers, sensitive_redacted: false });
    }

    return json(redactAuthNumbers(data));
  } catch (err) {
    console.error('[get-auth-numbers] Error:', err);
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500);
  }
});
