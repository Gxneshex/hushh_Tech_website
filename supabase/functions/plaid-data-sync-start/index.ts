// plaid-data-sync-start — Fast initial sync + background max-data fanout.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { getPlaidAccessTokenForUser } from '../_shared/plaidToken.ts';
import {
  ensureProductStatuses,
  PLAID_BACKGROUND_PRODUCTS,
  PLAID_IMMEDIATE_PRODUCTS,
  summarizeProductResults,
  syncPlaidDataProduct,
} from '../_shared/plaidDataSync.ts';

// 60-second lock window. A second sync request inside this window is treated
// as a no-op (the in-flight sync owns the Plaid API quota), preventing the
// browser polling loop and a parallel manual retry from doubling Plaid calls.
const PLAID_SYNC_LOCK_WINDOW_MS = 60_000;

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function waitUntil(promise: Promise<unknown>) {
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(promise);
  }
}

async function tryAcquireSyncLock(
  supabase: any,
  plaidItemId: string,
): Promise<boolean> {
  const cutoffIso = new Date(Date.now() - PLAID_SYNC_LOCK_WINDOW_MS).toISOString();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('plaid_items')
    .update({ last_sync_started_at: nowIso })
    .eq('plaid_item_id', plaidItemId)
    .or(`last_sync_started_at.is.null,last_sync_started_at.lt.${cutoffIso}`)
    .select('plaid_item_id');

  if (error) {
    console.warn('[plaid-data-sync-start] Lock acquire query failed', error);
    // Fail open: do not block sync if the lock column is unavailable.
    return true;
  }
  return Array.isArray(data) && data.length > 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const plaidItemId = body.itemId || body.item_id || body.plaid_item_id || null;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'plaid-data-sync-start',
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
    await ensureProductStatuses(supabase, userId, item.plaid_item_id);

    const lockAcquired = await tryAcquireSyncLock(supabase, item.plaid_item_id);
    if (!lockAcquired) {
      // Another sync started within the lock window. Return current status
      // rather than re-hitting Plaid.
      const { data: statuses } = await supabase
        .from('plaid_product_sync_statuses')
        .select('product, available, status')
        .eq('user_id', userId)
        .eq('plaid_item_id', item.plaid_item_id);

      const availableMap: Record<string, boolean> = {};
      let productsAvailable = 0;
      for (const row of statuses || []) {
        availableMap[row.product] = Boolean(row.available);
        if (row.available) productsAvailable += 1;
      }

      return json({
        status: 'partial',
        item_id: item.plaid_item_id,
        institution: { id: item.institution_id, name: item.institution_name },
        available_products: availableMap,
        products_available: productsAvailable,
        fetch_errors: {},
        can_proceed: Boolean(availableMap.accounts && availableMap.balance && availableMap.auth),
        sync_in_progress: true,
        background_products: [...PLAID_BACKGROUND_PRODUCTS],
        background_sync_started: false,
      });
    }

    const immediateResults = [];
    for (const product of PLAID_IMMEDIATE_PRODUCTS) {
      immediateResults.push(await syncPlaidDataProduct({
        supabase,
        userId,
        item,
        accessToken,
        product,
      }));
    }

    const backgroundSync = (async () => {
      for (const product of PLAID_BACKGROUND_PRODUCTS) {
        await syncPlaidDataProduct({
          supabase,
          userId,
          item,
          accessToken,
          product,
        });
      }
    })();
    waitUntil(backgroundSync);
    backgroundSync.catch((error) => {
      console.warn('[plaid-data-sync-start] Background sync failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    const summary = summarizeProductResults(immediateResults);
    if (summary.can_proceed) {
      await supabase.from('onboarding_data').upsert({
        user_id: userId,
        financial_link_status: 'completed',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    return json({
      ...summary,
      item_id: item.plaid_item_id,
      institution: { id: item.institution_id, name: item.institution_name },
      background_products: [...PLAID_BACKGROUND_PRODUCTS],
      background_sync_started: true,
    });
  } catch (error) {
    console.error('[plaid-data-sync-start] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
