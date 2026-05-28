/**
 * Shared Plaid Configuration — Used by all Plaid edge functions
 * 
 * Validates PLAID_ENV and provides the base URL + credentials.
 * Centralizes config so every edge function stays consistent.
 */

const VALID_ENVS = ['sandbox', 'production'] as const;
type PlaidEnv = typeof VALID_ENVS[number];

const PRIMARY_PRODUCT_ALLOWLIST = new Set([
  'auth',
  'transactions',
  'identity',
  'investments',
  'liabilities',
  'assets',
  'transfer',
]);

export interface PlaidConfig {
  clientId: string;
  secret: string;
  env: PlaidEnv;
  baseUrl: string;
}

/** Get validated Plaid config from environment variables */
export const getPlaidConfig = (): PlaidConfig => {
  const clientId = Deno.env.get('PLAID_CLIENT_ID');
  const secret = Deno.env.get('PLAID_SECRET');
  const env = (Deno.env.get('PLAID_ENV') || 'sandbox') as string;

  if (!clientId || !secret) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set');
  }

  if (!VALID_ENVS.includes(env as PlaidEnv)) {
    throw new Error(
      `Invalid PLAID_ENV: "${env}". Must be one of: ${VALID_ENVS.join(', ')}`,
    );
  }

  return {
    clientId,
    secret,
    env: env as PlaidEnv,
    baseUrl: `https://${env}.plaid.com`,
  };
};

/** Standard Plaid API request headers */
export const plaidHeaders = {
  'Content-Type': 'application/json',
};

export async function plaidRequest<T = any>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: T; requestId?: string }> {
  const plaid = getPlaidConfig();
  const response = await fetch(`${plaid.baseUrl}${path}`, {
    method: 'POST',
    headers: plaidHeaders,
    body: JSON.stringify({
      client_id: plaid.clientId,
      secret: plaid.secret,
      ...body,
    }),
  });

  const data = await response.json().catch(() => ({})) as T & {
    error_message?: string;
    error_code?: string;
    request_id?: string;
  };

  if (!response.ok) {
    const message = data.error_message || data.error_code || `Plaid request failed: ${path}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return { data, requestId: data.request_id };
}

/** Check if we're running in production */
export const isProduction = (): boolean => {
  return (Deno.env.get('PLAID_ENV') || 'sandbox') === 'production';
};

export function resolvePlaidPrimaryProducts(env = Deno.env.get('PLAID_ENV') || 'sandbox') {
  const requested = Deno.env.get('PLAID_PRIMARY_PRODUCTS');
  const fallback = env === 'production' ? ['auth'] : ['transfer'];
  if (!requested) return fallback;

  const accepted = requested
    .split(',')
    .map((product) => product.trim())
    .filter((product) => PRIMARY_PRODUCT_ALLOWLIST.has(product));

  const unique = [...new Set(accepted)];
  return unique.length > 0 ? unique : fallback;
}
