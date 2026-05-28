// plaid-data-sync — Backward-compatible alias for the max-data sync start flow.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    const plaidItemId = body.itemId || body.item_id || body.plaid_item_id || null;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'plaid-data-sync',
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
      console.warn('[plaid-data-sync] Background sync failed', {
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
    console.error('[plaid-data-sync] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
