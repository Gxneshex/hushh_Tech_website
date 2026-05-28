// plaid-income-link-token — Dedicated Bank Income/update-mode entrypoint.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { plaidRequest } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const plaidItemId = body.itemId || body.item_id || body.plaid_item_id || null;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'plaid-income-link-token',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!userId) return json({ error: 'userId is required' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { item, accessToken } = await getPlaidAccessTokenForUser(supabase, userId, plaidItemId);

    if (Deno.env.get('PLAID_BANK_INCOME_ENABLED') !== 'true') {
      await supabase.from('plaid_product_sync_statuses').upsert({
        user_id: userId,
        plaid_item_id: item.plaid_item_id,
        product: 'income',
        status: 'access_required',
        available: false,
        error_code: 'BANK_INCOME_UPDATE_MODE_REQUIRED',
        error_message: 'Bank Income requires product approval and dedicated update-mode Link',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,plaid_item_id,product' });

      return json({
        error: 'Bank Income update mode is not enabled for this environment',
        code: 'BANK_INCOME_UPDATE_MODE_REQUIRED',
      }, 409);
    }

    const { data } = await plaidRequest('/link/token/create', {
      access_token: accessToken,
      user: { client_user_id: userId },
      client_name: 'Hushh',
      products: ['income_verification'],
      country_codes: ['US'],
      language: 'en',
      income_verification: {
        income_source_types: ['bank'],
        bank_income: {
          days_requested: Number(Deno.env.get('PLAID_BANK_INCOME_DAYS_REQUESTED') || 365),
        },
      },
    });

    return json({
      link_token: (data as any).link_token,
      expiration: (data as any).expiration,
      item_id: item.plaid_item_id,
    });
  } catch (error) {
    console.error('[plaid-income-link-token] Error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: (error as any).details || null,
    }, (error as any).status || 500);
  }
});
