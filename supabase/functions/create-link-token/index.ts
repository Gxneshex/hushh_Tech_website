// create-link-token — Creates a Plaid Link token (production-ready)
import { corsHeaders } from '../_shared/cors.ts';
import { getPlaidConfig, resolvePlaidPrimaryProducts } from '../_shared/plaid.ts';
import { authenticateEdgeRequest } from '../_shared/security.ts';

const ADDITIONAL_CONSENTED_PRODUCT_ALLOWLIST = new Set([
  'balance_plus',
  'identity',
  'investments',
  'investments_auth',
  'liabilities',
  'signal',
  'transactions',
]);

function resolveAdditionalConsentedProducts() {
  const requested = (
    Deno.env.get('PLAID_ADDITIONAL_CONSENTED_PRODUCTS') ||
    'identity,transactions,investments,liabilities,signal'
  )
    .split(',')
    .map((product) => product.trim())
    .filter(Boolean);

  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const product of requested) {
    if (ADDITIONAL_CONSENTED_PRODUCT_ALLOWLIST.has(product)) {
      accepted.push(product);
    } else {
      rejected.push(product);
    }
  }

  if (rejected.length > 0) {
    console.warn('[create-link-token] Ignoring unsupported additional consented products:', rejected);
  }

  return [...new Set(accepted)];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userId, userEmail, redirectUri, receivedRedirectUri } = body;

    const authFailure = await authenticateEdgeRequest(req, {
      label: 'create-link-token',
      expectedUserId: userId || null,
    });
    if (authFailure) return authFailure;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const plaid = getPlaidConfig();
    const primaryProducts = resolvePlaidPrimaryProducts(plaid.env);
    const additionalConsentedProducts = resolveAdditionalConsentedProducts();

    // Build Plaid request body
    const plaidBody: Record<string, any> = {
      client_id: plaid.clientId,
      secret: plaid.secret,
      user: { client_user_id: userId, email_address: userEmail },
      client_name: 'Hushh',
      products: primaryProducts,
      country_codes: ['US'],
      language: 'en',
    };
    if (primaryProducts.includes('transfer') && !primaryProducts.includes('auth')) {
      plaidBody.required_if_supported_products = ['auth'];
    }
    const dataWebhookUrl = Deno.env.get('PLAID_DATA_WEBHOOK_URL');
    if (dataWebhookUrl) {
      plaidBody.webhook = dataWebhookUrl;
    }
    if (additionalConsentedProducts.length > 0) {
      plaidBody.additional_consented_products = additionalConsentedProducts;
    }

    // Statements is requested via optional_products: fetched best-effort only
    // when the institution supports it, and never blocks Link for institutions
    // that don't. (statements is not a valid additional_consented_products
    // value, so it must go here rather than there.)
    plaidBody.optional_products = ['statements'];

    // OAuth support: redirect_uri for initial call
    if (redirectUri) {
      plaidBody.redirect_uri = redirectUri;
    }

    // OAuth resume: receivedRedirectUri for returning from bank OAuth
    // When resuming, products must NOT be included per Plaid docs
    if (receivedRedirectUri) {
      plaidBody.redirect_uri = receivedRedirectUri;
      delete plaidBody.products; // Plaid requires no products on OAuth resume
      delete plaidBody.required_if_supported_products;
      delete plaidBody.optional_products;
    }

    console.log('[create-link-token] OAuth params:', {
      redirectUri: redirectUri || 'none',
      receivedRedirectUri: receivedRedirectUri || 'none',
      isResume: !!receivedRedirectUri,
    });

    const response = await fetch(`${plaid.baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plaidBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[create-link-token] Plaid error:', data);
      return new Response(
        JSON.stringify({ error: data.error_message || 'Failed to create link token' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ link_token: data.link_token, expiration: data.expiration }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    console.error('[create-link-token] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
