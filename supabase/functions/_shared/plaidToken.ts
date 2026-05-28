const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function getTokenKey(): Promise<CryptoKey | null> {
  const secret = Deno.env.get('PLAID_TOKEN_ENCRYPTION_KEY') || Deno.env.get('PLAID_TOKEN_SECRET');
  if (!secret) {
    if ((Deno.env.get('PLAID_ENV') || 'sandbox') === 'production') {
      throw new Error('PLAID_TOKEN_ENCRYPTION_KEY is required in production');
    }
    return null;
  }

  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptPlaidAccessToken(accessToken: string): Promise<string> {
  const key = await getTokenKey();
  if (!key) {
    return `sandbox-obfuscated:v1:${base64UrlEncode(textEncoder.encode(accessToken))}`;
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(accessToken),
  );

  return `aes-gcm:v1:${base64UrlEncode(iv)}:${base64UrlEncode(new Uint8Array(cipher))}`;
}

export async function decryptPlaidAccessToken(storedToken: string): Promise<string> {
  if (!storedToken) {
    throw new Error('Missing stored Plaid access token');
  }

  if (storedToken.startsWith('sandbox-obfuscated:v1:')) {
    if ((Deno.env.get('PLAID_ENV') || 'sandbox') === 'production') {
      throw new Error('Refusing sandbox-obfuscated Plaid token in production');
    }
    return textDecoder.decode(base64UrlDecode(storedToken.split(':')[2]));
  }

  if (!storedToken.startsWith('aes-gcm:v1:')) {
    if ((Deno.env.get('PLAID_ENV') || 'sandbox') === 'production') {
      throw new Error('Refusing legacy Plaid token format in production');
    }
    return storedToken;
  }

  const [, , ivEncoded, cipherEncoded] = storedToken.split(':');
  const key = await getTokenKey();
  if (!key) {
    throw new Error('PLAID_TOKEN_ENCRYPTION_KEY is required to decrypt this Plaid token');
  }

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(ivEncoded) },
    key,
    base64UrlDecode(cipherEncoded),
  );

  return textDecoder.decode(plain);
}

export async function getStoredPlaidItemForUser(
  supabase: any,
  userId: string,
  plaidItemId?: string | null,
): Promise<any> {
  let query = supabase
    .from('plaid_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (plaidItemId) {
    query = query.eq('plaid_item_id', plaidItemId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No active Plaid Item found for this user');
  return data;
}

export async function getPlaidAccessTokenForUser(
  supabase: any,
  userId: string,
  plaidItemId?: string | null,
): Promise<{ item: any; accessToken: string }> {
  const item = await getStoredPlaidItemForUser(supabase, userId, plaidItemId);
  return {
    item,
    accessToken: await decryptPlaidAccessToken(item.plaid_access_token_encrypted),
  };
}
