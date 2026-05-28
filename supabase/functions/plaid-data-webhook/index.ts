// plaid-data-webhook — General Plaid data webhook handler.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';
import {
  parsePlaidDataProduct,
  PlaidDataProduct,
  syncPlaidDataProduct,
} from '../_shared/plaidDataSync.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function assertWebhookSecret(req: Request, body: Record<string, unknown>) {
  const expected = Deno.env.get('PLAID_DATA_WEBHOOK_SECRET') || Deno.env.get('PLAID_TRANSFER_WEBHOOK_SECRET');
  if (!expected) return;

  const provided =
    req.headers.get('x-hushh-webhook-secret') ||
    req.headers.get('x-webhook-secret') ||
    new URL(req.url).searchParams.get('secret') ||
    String(body.webhook_secret || '');

  if (provided !== expected) {
    throw Object.assign(new Error('Invalid webhook secret'), { status: 401 });
  }
}

function productsForWebhook(body: Record<string, unknown>): PlaidDataProduct[] {
  const explicit = parsePlaidDataProduct(body.product);
  if (explicit) return [explicit];

  const type = String(body.webhook_type || '').toUpperCase();
  const code = String(body.webhook_code || '').toUpperCase();

  if (type === 'TRANSACTIONS' || code === 'SYNC_UPDATES_AVAILABLE') {
    return ['transactions'];
  }
  if (type === 'ASSETS' || code === 'PRODUCT_READY') {
    return ['assets'];
  }
  if (type === 'INVESTMENTS') {
    if (code.includes('TRANSACTIONS')) return ['investment_transactions'];
    return ['investments'];
  }
  if (type === 'LIABILITIES') return ['liabilities'];
  if (type === 'IDENTITY') return ['identity', 'identity_match'];
  if (type === 'STATEMENTS') return ['statements'];
  if (type === 'INCOME') return ['income'];
  if (type === 'ITEM' && (code === 'ERROR' || code === 'PENDING_EXPIRATION' || code === 'USER_PERMISSION_REVOKED')) {
    return ['accounts', 'balance', 'auth', 'identity', 'transactions', 'assets', 'investments'];
  }

  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    assertWebhookSecret(req, body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const plaidItemId = String(body.item_id || body.plaid_item_id || '');
    if (!plaidItemId) {
      await supabase.from('plaid_data_events').insert({
        webhook_type: body.webhook_type || null,
        webhook_code: body.webhook_code || null,
        payload: body,
      });
      return json({ success: true, processed: 0, reason: 'No Plaid item_id on webhook' });
    }

    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('plaid_item_id', plaidItemId)
      .maybeSingle();
    if (itemError) throw itemError;
    if (!item) {
      return json({ success: true, processed: 0, reason: 'Plaid item not found' });
    }

    const products = productsForWebhook(body);
    await supabase.from('plaid_data_events').insert({
      user_id: item.user_id,
      plaid_item_id: plaidItemId,
      webhook_type: body.webhook_type || null,
      webhook_code: body.webhook_code || null,
      product: products[0] || null,
      payload: body,
    });

    const { accessToken } = await getPlaidAccessTokenForUser(supabase, item.user_id, plaidItemId);
    const results = [];
    for (const product of products) {
      results.push(await syncPlaidDataProduct({
        supabase,
        userId: item.user_id,
        item,
        accessToken,
        product,
      }));
    }

    return json({
      success: true,
      webhook_type: body.webhook_type || null,
      webhook_code: body.webhook_code || null,
      processed: results.length,
      results: results.map((result) => ({
        product: result.product,
        status: result.status,
        available: result.available,
        recordsCount: result.recordsCount ?? null,
        error: result.error || null,
        errorCode: result.errorCode || null,
      })),
    });
  } catch (error) {
    console.error('[plaid-data-webhook] Error:', error);
    return json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: (error as any).details || null,
    }, (error as any).status || 500);
  }
});
