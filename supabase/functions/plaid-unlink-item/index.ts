// plaid-unlink-item — Remove a linked Plaid Item before transfers start.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { plaidRequest } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { decryptPlaidAccessToken } from '../_shared/plaidToken.ts';

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const TRANSFER_LOCK_ERROR = 'Bank changes are locked after transfer setup starts';

function isAlreadyRemovedPlaidError(error: unknown): boolean {
  const details = (error as any)?.details || {};
  const code = String(details.error_code || '').toUpperCase();
  const message = String(
    details.error_message || (error instanceof Error ? error.message : ''),
  ).toLowerCase();

  return (
    code === 'INVALID_ACCESS_TOKEN' ||
    code === 'INVALID_ACCESS_TOKEN_TYPE' ||
    code === 'ITEM_NOT_FOUND' ||
    message.includes('invalid access token') ||
    message.includes('item not found')
  );
}

async function hasRowsForUser(supabase: any, table: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

async function deleteRowsForItems(
  supabase: any,
  userId: string,
  plaidItemIds: string[],
) {
  if (plaidItemIds.length === 0) {
    await supabase.from('plaid_transfer_accounts').delete().eq('user_id', userId);
    await supabase.from('plaid_product_sync_statuses').delete().eq('user_id', userId);
    await supabase.from('plaid_statement_metadata').delete().eq('user_id', userId);
    await supabase.from('plaid_data_events').delete().eq('user_id', userId);
    await supabase.from('user_financial_data').delete().eq('user_id', userId);
    return;
  }

  const { data: accounts, error: accountsError } = await supabase
    .from('plaid_accounts')
    .select('plaid_account_id')
    .in('plaid_item_id', plaidItemIds);
  if (accountsError) throw accountsError;

  const plaidAccountIds = (accounts || [])
    .map((account: any) => account.plaid_account_id)
    .filter(Boolean);

  if (plaidAccountIds.length > 0) {
    const { error } = await supabase
      .from('plaid_transactions')
      .delete()
      .in('plaid_account_id', plaidAccountIds);
    if (error) throw error;
  }

  for (const table of [
    'plaid_transfer_accounts',
    'plaid_product_sync_statuses',
    'plaid_statement_metadata',
    'plaid_data_events',
    'plaid_sync_cursors',
    'plaid_accounts',
  ]) {
    const { error } = await supabase
      .from(table)
      .delete()
      .in('plaid_item_id', plaidItemIds);
    if (error) throw error;
  }

  const { error: financialDataError } = await supabase
    .from('user_financial_data')
    .delete()
    .eq('user_id', userId);
  if (financialDataError) throw financialDataError;

  const { error: itemDeleteError } = await supabase
    .from('plaid_items')
    .delete()
    .eq('user_id', userId)
    .in('plaid_item_id', plaidItemIds);
  if (itemDeleteError) throw itemDeleteError;
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
      label: 'plaid-unlink-item',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!userId) {
      return json({ error: 'userId is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [hasTransfers, hasRecurringTransfers] = await Promise.all([
      hasRowsForUser(supabase, 'fund_transfers', userId),
      hasRowsForUser(supabase, 'fund_recurring_transfers', userId),
    ]);

    if (hasTransfers || hasRecurringTransfers) {
      return json(
        {
          success: false,
          error: TRANSFER_LOCK_ERROR,
          code: 'TRANSFER_ALREADY_STARTED',
        },
        409,
      );
    }

    let itemQuery = supabase
      .from('plaid_items')
      .select('plaid_item_id, plaid_access_token_encrypted, status')
      .eq('user_id', userId);

    if (plaidItemId) {
      itemQuery = itemQuery.eq('plaid_item_id', plaidItemId);
    }

    const { data: items, error: itemsError } = await itemQuery;
    if (itemsError) throw itemsError;

    const plaidItems = Array.isArray(items) ? items : [];

    for (const item of plaidItems) {
      try {
        const accessToken = await decryptPlaidAccessToken(item.plaid_access_token_encrypted);
        await plaidRequest('/item/remove', { access_token: accessToken });
      } catch (error) {
        if (isAlreadyRemovedPlaidError(error)) {
          console.warn('[plaid-unlink-item] Plaid Item already removed, cleaning local rows', {
            plaid_item_id: item.plaid_item_id,
            error_code: (error as any)?.details?.error_code,
          });
          continue;
        }

        console.error('[plaid-unlink-item] Plaid remove failed', {
          plaid_item_id: item.plaid_item_id,
          error: error instanceof Error ? error.message : String(error),
          error_code: (error as any)?.details?.error_code,
        });
        return json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Plaid Item removal failed',
          },
          502,
        );
      }
    }

    const plaidItemIds = plaidItems
      .map((item: any) => item.plaid_item_id)
      .filter(Boolean);
    await deleteRowsForItems(supabase, userId, plaidItemIds);

    const now = new Date().toISOString();
    const { error: onboardingError } = await supabase
      .from('onboarding_data')
      .upsert({
        user_id: userId,
        financial_link_status: 'pending',
        updated_at: now,
      }, { onConflict: 'user_id' });
    if (onboardingError) throw onboardingError;

    return json({
      success: true,
      removed_items: plaidItems.length,
      financial_link_status: 'pending',
    });
  } catch (error) {
    console.error('[plaid-unlink-item] Error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      500,
    );
  }
});
