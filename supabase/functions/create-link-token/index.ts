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
    'identity,transactions,signal'
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

// Products to fetch ONLY if the chosen institution + account support them.
// Plaid initializes these when supported and silently ignores them otherwise,
// so they NEVER block linking (e.g. U.S. Bank doesn't support investments /
// liabilities). NOTE: do NOT put `identity` here — for OAuth banks that let a
// user separately deny Identity, required_if_supported makes the Link error.
const REQUIRED_IF_SUPPORTED_PRODUCT_ALLOWLIST = new Set([
  'investments',
  'liabilities',
  'transactions',
  'auth',
]);

function resolveRequiredIfSupportedProducts() {
  const requested = (
    Deno.env.get('PLAID_REQUIRED_IF_SUPPORTED_PRODUCTS') ||
    'investments,liabilities'
  )
    .split(',')
    .map((product) => product.trim())
    .filter(Boolean);

  const accepted: string[] = [];
  const rejected: string[] = [];
  for (const product of requested) {
    if (REQUIRED_IF_SUPPORTED_PRODUCT_ALLOWLIST.has(product)) {
      accepted.push(product);
    } else {
      rejected.push(product);
    }
  }

  if (rejected.length > 0) {
    console.warn('[create-link-token] Ignoring unsupported required_if_supported products:', rejected);
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
    // Institution-dependent products must NEVER sit in the required `products`
    // array — they block linking at banks that don't support them (e.g. U.S.
    // Bank lacks investments/liabilities). Strip them out here and request them
    // as required_if_supported instead, even if the PLAID_PRIMARY_PRODUCTS
    // secret still lists them as primary. This makes the fix self-sufficient.
    const NEVER_REQUIRED_PRODUCTS = new Set(['investments', 'liabilities']);
    const rawPrimaryProducts = resolvePlaidPrimaryProducts(plaid.env);
    const primaryProducts = rawPrimaryProducts.filter((product) => !NEVER_REQUIRED_PRODUCTS.has(product));
    const forcedGracefulProducts = rawPrimaryProducts.filter((product) => NEVER_REQUIRED_PRODUCTS.has(product));
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
    // Fetch these when the institution supports them, but NEVER block linking
    // for banks that don't (e.g. U.S. Bank lacks investments/liabilities).
    const requiredIfSupported = [
      ...resolveRequiredIfSupportedProducts(),
      ...forcedGracefulProducts,
    ].filter((product) => !primaryProducts.includes(product));
    if (primaryProducts.includes('transfer') && !primaryProducts.includes('auth')) {
      requiredIfSupported.unshift('auth');
    }
    const requiredIfSupportedProducts = [...new Set(requiredIfSupported)];
    if (requiredIfSupportedProducts.length > 0) {
      plaidBody.required_if_supported_products = requiredIfSupportedProducts;
    }
    const dataWebhookUrl = Deno.env.get('PLAID_DATA_WEBHOOK_URL');
    if (dataWebhookUrl) {
      plaidBody.webhook = dataWebhookUrl;
    }
    // Consent-only products (for calling their endpoints later). Exclude any
    // that are already in required_if_supported to avoid Plaid rejecting a
    // product listed in two fields.
    const consentedProducts = additionalConsentedProducts.filter(
      (product) => !requiredIfSupportedProducts.includes(product),
    );
    if (consentedProducts.length > 0) {
      plaidBody.additional_consented_products = consentedProducts;
    }

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
