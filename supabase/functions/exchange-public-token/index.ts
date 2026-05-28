// exchange-public-token — Exchange Plaid public token for access token
import { corsHeaders } from '../_shared/cors.ts';
import { getPlaidConfig, resolvePlaidPrimaryProducts } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';
import { encryptPlaidAccessToken } from '../_shared/plaidToken.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const publicToken = body.publicToken || body.public_token;
    const userId = body.userId || body.user_id;
    const institutionName = body.institutionName || body.institution_name || null;
    const institutionId = body.institutionId || body.institution_id || null;
    const selectedAccounts = Array.isArray(body.accounts) ? body.accounts : [];

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'exchange-public-token',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!publicToken) {
      return new Response(
        JSON.stringify({ error: 'publicToken is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const plaid = getPlaidConfig();
    const productsRequested = [
      ...resolvePlaidPrimaryProducts(plaid.env),
      'auth',
      'identity',
      'transactions',
      'investments',
      'liabilities',
      'signal',
    ].filter((product, index, products) => products.indexOf(product) === index);

    const response = await fetch(`${plaid.baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: plaid.clientId,
        secret: plaid.secret,
        public_token: publicToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[exchange-public-token] Plaid error:', data);
      return new Response(
        JSON.stringify({ error: data.error_message || 'Failed to exchange token', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service configuration is missing');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const encryptedToken = await encryptPlaidAccessToken(data.access_token);
    const now = new Date().toISOString();

    const { error: itemError } = await supabase.from('plaid_items').upsert({
      user_id: userId,
      plaid_item_id: data.item_id,
      plaid_access_token_encrypted: encryptedToken,
      institution_id: institutionId,
      institution_name: institutionName,
      products_requested: productsRequested,
      webhook_url: Deno.env.get('PLAID_DATA_WEBHOOK_URL') || null,
      status: 'active',
      error_code: null,
      error_message: null,
      updated_at: now,
    }, { onConflict: 'plaid_item_id' });
    if (itemError) throw itemError;

    await supabase
      .from('onboarding_data')
      .upsert({
        user_id: userId,
        financial_link_status: 'pending',
        updated_at: now,
      }, { onConflict: 'user_id' });

    let accountsForUi = selectedAccounts.map((account: any) => ({
      account_id: account.id || account.account_id,
      name: account.name || 'Linked account',
      mask: account.mask || null,
      subtype: account.subtype || null,
      type: account.type || null,
    })).filter((account: any) => account.account_id);

    try {
      const accountsRes = await fetch(`${plaid.baseUrl}/accounts/get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: plaid.clientId,
          secret: plaid.secret,
          access_token: data.access_token,
        }),
      });
      const accountsData = await accountsRes.json();
      if (accountsRes.ok && Array.isArray(accountsData.accounts)) {
        accountsForUi = accountsData.accounts.map((account: any) => ({
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          mask: account.mask,
          subtype: account.subtype,
          type: account.type,
          balances: account.balances,
        }));
      }
    } catch (accountErr) {
      console.warn('[exchange-public-token] Accounts fetch skipped:', accountErr);
    }

    for (const [index, account] of accountsForUi.entries()) {
      const balance = account.balances || {};
      await supabase.from('plaid_accounts').upsert({
        plaid_item_id: data.item_id,
        plaid_account_id: account.account_id,
        name: account.name || null,
        official_name: account.official_name || null,
        type: account.type || null,
        subtype: account.subtype || null,
        current_balance: balance.current ?? null,
        available_balance: balance.available ?? null,
        iso_currency_code: balance.iso_currency_code || 'USD',
        mask: account.mask || null,
        last_synced_at: now,
        updated_at: now,
      }, { onConflict: 'plaid_account_id' });

      if (['checking', 'savings', 'cash management'].includes(String(account.subtype || '').toLowerCase())) {
        await supabase.from('plaid_transfer_accounts').upsert({
          user_id: userId,
          plaid_item_id: data.item_id,
          plaid_account_id: account.account_id,
          institution_id: institutionId,
          institution_name: institutionName,
          name: account.name || null,
          official_name: account.official_name || null,
          type: account.type || null,
          subtype: account.subtype || null,
          mask: account.mask || null,
          iso_currency_code: balance.iso_currency_code || 'USD',
          available_balance: balance.available ?? null,
          current_balance: balance.current ?? null,
          is_default: index === 0,
          status: 'active',
          updated_at: now,
        }, { onConflict: 'user_id,plaid_account_id' });
      }
    }

    return new Response(
      JSON.stringify({
        item_id: data.item_id,
        institution: { name: institutionName, id: institutionId },
        accounts: accountsForUi.map((account: any) => ({
          account_id: account.account_id,
          name: account.name || account.official_name || 'Linked account',
          official_name: account.official_name || null,
          mask: account.mask || null,
          type: account.type || null,
          subtype: account.subtype || null,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('[exchange-public-token] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
