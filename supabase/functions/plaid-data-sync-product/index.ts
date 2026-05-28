// plaid-data-sync-product — Sync/retry one Plaid data product for an Item.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';
import {
  ensureProductStatuses,
  parsePlaidDataProduct,
  syncPlaidDataProduct,
} from '../_shared/plaidDataSync.ts';

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
    const product = parsePlaidDataProduct(body.product);

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'plaid-data-sync-product',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!userId) return json({ error: 'userId is required' }, 400);
    if (!product) return json({ error: 'Valid product is required' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { item, accessToken } = await getPlaidAccessTokenForUser(supabase, userId, plaidItemId);
    await ensureProductStatuses(supabase, userId, item.plaid_item_id);
    const result = await syncPlaidDataProduct({
      supabase,
      userId,
      item,
      accessToken,
      product,
    });

    return json({
      success: true,
      item_id: item.plaid_item_id,
      result: {
        product: result.product,
        status: result.status,
        available: result.available,
        recordsCount: result.recordsCount ?? null,
        error: result.error || null,
        errorCode: result.errorCode || null,
      },
    });
  } catch (error) {
    console.error('[plaid-data-sync-product] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
