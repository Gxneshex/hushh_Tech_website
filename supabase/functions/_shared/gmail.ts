import { createRelatedEmailMessage } from "./emailMime.ts";
import type { EmailInlineAsset } from "./emailInlineAssets.ts";

function base64urlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createSignedJWT(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string,
  scopes: string[],
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = base64urlEncode(JSON.stringify({
    iss: serviceAccountEmail,
    sub: userToImpersonate,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: scopes.join(' '),
  }));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const privateKeyPem = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), (char) => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput),
  );
  return `${signatureInput}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string,
): Promise<string> {
  const signedJwt = await createSignedJWT(
    serviceAccountEmail,
    privateKey,
    userToImpersonate,
    ['https://www.googleapis.com/auth/gmail.send'],
  );
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get Gmail access token: ${await response.text()}`);
  }
  return (await response.json()).access_token;
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
}

function encodeBase64WithLineBreaks(content: string): string {
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 76) {
    lines.push(base64.slice(i, i + 76));
  }
  return lines.join('\r\n');
}

export async function sendGmailEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  fromName = 'Hushh Fund Operations',
  inlineAssets: readonly EmailInlineAsset[] = [],
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    const senderEmail = Deno.env.get('GMAIL_SENDER_EMAIL') || 'ankit@hushh.ai';
    if (!serviceAccountEmail || !privateKey) {
      return { success: false, error: 'Missing Google Service Account credentials' };
    }

    const accessToken = await getAccessToken(
      serviceAccountEmail,
      privateKey.replace(/\\n/g, '\n'),
      senderEmail,
    );
    // With inline assets (e.g. the brand logo + footer social icons) build a
    // multipart/related message so the cid: images render; otherwise keep the
    // plain text/html message for callers that don't ship inline assets.
    const rawMessage = inlineAssets.length > 0
      ? createRelatedEmailMessage({
          fromLabel: fromName,
          fromEmail: senderEmail,
          recipients,
          subject,
          htmlContent,
          inlineAssets,
        })
      : [
          `From: ${fromName} <${senderEmail}>`,
          `To: ${recipients.join(', ')}`,
          `Subject: ${encodeSubject(subject)}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset="UTF-8"',
          'Content-Transfer-Encoding: base64',
          '',
          encodeBase64WithLineBreaks(htmlContent),
        ].join('\r\n');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64urlEncode(rawMessage) }),
    });

    if (!response.ok) {
      return { success: false, error: `Gmail API error: ${await response.text()}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Gmail error',
    };
  }
}
