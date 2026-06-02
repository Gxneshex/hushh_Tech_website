// NDA Signed Notification Service
// Sends email notification to manish@hushh.ai and ankit@hushh.ai when user signs NDA
// Uses Gmail API with Service Account (Domain-Wide Delegation)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { collectInlineAssets } from "../_shared/emailInlineAssets.ts";
import { base64urlEncode, createMixedEmailMessage, createRelatedEmailMessage } from "../_shared/emailMime.ts";
import { buildNDANotificationHtml, NDA_INLINE_ASSET_KEYS } from "./template.ts";
import { buildNDAUserConfirmationHtml } from "./userTemplate.ts";
import { createAdminClient, requireAuthenticatedUser } from "../_shared/fundStripe.ts";
import { FUND_ADMIN_ALLOWLIST, getPrimarySiteUrl } from "../_shared/security.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Admin recipients = the fund-admin allowlist (single source of truth, so the
// NDA list never drifts from who actually operates the fund).
const NDA_NOTIFICATION_RECIPIENTS = FUND_ADMIN_ALLOWLIST;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// The fund documents the signer acknowledged — attached to the SIGNER's copy,
// fetched from OUR OWN site assets (never a client-supplied URL).
const FUND_DOCUMENTS_FN = [
  { filename: "Delaware-Feeder-LPA.docx", path: "/fund-documents/delaware-feeder-lpa.docx" },
  { filename: "Investment-Prospectus.docx", path: "/fund-documents/investment-prospectus.docx" },
  { filename: "LP-Master-LPA.docx", path: "/fund-documents/lp-master-lpa.docx" },
  { filename: "Private-Placement-Memorandum.docx", path: "/fund-documents/ppm.docx" },
];

interface EmailAttachment {
  filename: string;
  mimeType: string;
  base64Data: string;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Best-effort: fetch the four fund docs from our assets; a doc that fails is
// skipped (never fatal), so the signer still gets whatever is available.
async function fetchFundDocAttachments(): Promise<EmailAttachment[]> {
  const base = getPrimarySiteUrl();
  const out: EmailAttachment[] = [];
  for (const doc of FUND_DOCUMENTS_FN) {
    try {
      const r = await fetch(`${base}${doc.path}`);
      if (!r.ok) {
        console.warn(`[nda-signed-notification] fund doc fetch ${r.status}: ${doc.path}`);
        continue;
      }
      out.push({ filename: doc.filename, mimeType: DOCX_MIME, base64Data: arrayBufferToBase64(await r.arrayBuffer()) });
    } catch (err) {
      console.warn(`[nda-signed-notification] fund doc fetch failed: ${doc.path}`, err);
    }
  }
  return out;
}

interface NDANotificationPayload {
  signerName: string;
  signedAt: string;
  ndaVersion: string;
  signerIp?: string;
  pdfUrl?: string;
  pdfBase64?: string;
  documentsAcknowledged?: string[];
}

/**
 * Create a signed JWT for Google Service Account authentication
 */
async function createSignedJWT(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string,
  scopes: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccountEmail,
    sub: userToImpersonate,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: exp,
    scope: scopes.join(" "),
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyPem = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Get an access token using the Service Account JWT
 */
async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  userToImpersonate: string
): Promise<string> {
  const scopes = ["https://www.googleapis.com/auth/gmail.send"];

  const signedJwt = await createSignedJWT(
    serviceAccountEmail,
    privateKey,
    userToImpersonate,
    scopes
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create RFC 2822 formatted email with optional PDF attachment
 */
function createEmailMessage(
  from: string,
  recipients: string[],
  subject: string,
  htmlContent: string,
  attachments: EmailAttachment[] = [],
  fromLabel = "Hushh NDA Notifications"
): string {
  const inlineAssets = collectInlineAssets(NDA_INLINE_ASSET_KEYS);

  if (attachments.length > 0) {
    return createMixedEmailMessage({
      fromLabel,
      fromEmail: from,
      recipients,
      subject,
      htmlContent,
      inlineAssets,
      attachments,
    });
  }

  return createRelatedEmailMessage({
    fromLabel,
    fromEmail: from,
    recipients,
    subject,
    htmlContent,
    inlineAssets,
  });
}

/**
 * Send email using Gmail API
 */
async function sendGmailEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  attachments: EmailAttachment[] = [],
  fromLabel = "Hushh NDA Notifications"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const serviceAccountEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
    const senderEmail = Deno.env.get("GMAIL_SENDER_EMAIL") || "ankit@hushh.ai";

    if (!serviceAccountEmail || !privateKey) {
      return { success: false, error: "Missing Google Service Account credentials" };
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

    console.log(`Sending NDA email from ${senderEmail} to ${recipients.join(", ")} (${attachments.length} attachment(s))`);

    const accessToken = await getAccessToken(serviceAccountEmail, formattedPrivateKey, senderEmail);

    const rawMessage = createEmailMessage(senderEmail, recipients, subject, htmlContent, attachments, fromLabel);
    const encodedMessage = base64urlEncode(rawMessage);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gmail API error:", error);
      return { success: false, error: `Gmail API error: ${error}` };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Durable per-recipient send log — reuses fund_payment_notifications (like the
// fund emails) so a failed admin/signer send is visible + auditable + retriable,
// not console-only.
async function logNdaEmail(
  supabase: any,
  params: {
    userId: string | null;
    type: string;
    recipients: string[];
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
    fromLabel?: string;
    pdfMissing?: boolean;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { data: logRow } = await supabase
    .from("fund_payment_notifications")
    .insert({
      user_id: params.userId,
      notification_type: params.type,
      recipient_email: params.recipients.join(", "),
      subject: params.subject,
      status: "pending",
      error_message: params.pdfMissing ? "signed_pdf_missing" : null,
    })
    .select("id")
    .maybeSingle();

  const res = await sendGmailEmail(
    params.recipients,
    params.subject,
    params.html,
    params.attachments ?? [],
    params.fromLabel,
  );

  await supabase
    .from("fund_payment_notifications")
    .update({
      status: res.success ? "sent" : "failed",
      provider_message_id: res.messageId ?? null,
      error_message: res.error ?? (params.pdfMissing ? "signed_pdf_missing" : null),
      sent_at: res.success ? new Date().toISOString() : null,
    })
    .eq("id", logRow?.id);

  return res;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Authenticate: identity comes from the JWT, NEVER the client body. This
    // closes the abuse surface (anyone could previously email arbitrary
    // addresses / spam admins via the anon key). ──
    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase);
    if (auth.response || !auth.user) {
      return auth.response ?? new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const userId: string = auth.user.id;
    const signerEmail: string | null = auth.user.email ?? null;

    const payload: NDANotificationPayload = await req.json().catch(() => ({} as NDANotificationPayload));
    const {
      signerName,
      signedAt,
      ndaVersion,
      signerIp = 'Unknown',
      pdfUrl,
      pdfBase64,
      documentsAcknowledged = [],
    } = payload;

    if (!signerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: signerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signedDate = new Date(signedAt || new Date().toISOString()).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    });

    const pdfMissing = !pdfBase64;
    const safeName = signerName.replace(/[^a-zA-Z0-9]/g, '_');
    const signedNdaFileName = `NDA_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const signedNdaAttachment: EmailAttachment | null = pdfBase64
      ? { filename: signedNdaFileName, mimeType: 'application/pdf', base64Data: pdfBase64 }
      : null;

    // ── Admin notification — signed NDA only (admins already have the docs) ──
    const adminHtml = buildNDANotificationHtml({
      signerName,
      signerEmail: signerEmail ?? 'unknown',
      signedDate,
      ndaVersion,
      signerIp,
      pdfUrl,
      pdfBase64,
      userId,
      documentsAcknowledged,
    });
    const adminResult = await logNdaEmail(supabase, {
      userId,
      type: 'nda_admin',
      recipients: NDA_NOTIFICATION_RECIPIENTS,
      subject: `[Hushh NDA] Agreement Signed by ${signerName}`,
      html: adminHtml,
      attachments: signedNdaAttachment ? [signedNdaAttachment] : [],
      pdfMissing,
    });

    // ── Signer confirmation — signed NDA + ALL FOUR fund documents attached ──
    let signerNotified = false;
    let signerError: string | null = null;
    const looksLikeEmail = signerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail);
    if (looksLikeEmail) {
      const fundDocAttachments = await fetchFundDocAttachments();
      const signerAttachments = [
        ...(signedNdaAttachment ? [signedNdaAttachment] : []),
        ...fundDocAttachments,
      ];
      const userHtml = buildNDAUserConfirmationHtml({
        signerName,
        signerEmail: signerEmail as string,
        signedDate,
        ndaVersion,
        pdfAttached: Boolean(pdfBase64),
        pdfUrl,
        documentsAcknowledged,
        profileUrl: `${getPrimarySiteUrl()}/hushh-user-profile`,
      });
      const signerResult = await logNdaEmail(supabase, {
        userId,
        type: 'nda_signer',
        recipients: [signerEmail as string],
        subject: 'Your signed NDA — Hushh Technologies',
        html: userHtml,
        attachments: signerAttachments,
        fromLabel: 'Hushh Technologies',
        pdfMissing,
      });
      signerNotified = signerResult.success;
      signerError = signerResult.error ?? null;
    } else {
      // No usable email — record a skipped row so the gap is auditable.
      signerError = 'no_email_on_account';
      await supabase.from('fund_payment_notifications').insert({
        user_id: userId,
        notification_type: 'nda_signer',
        recipient_email: signerEmail || 'missing',
        subject: 'Your signed NDA — Hushh Technologies',
        status: 'skipped',
        error_message: 'no_email_on_account',
      });
    }

    // Never 500 after a recorded signature — both sends are best-effort + logged.
    return new Response(
      JSON.stringify({
        success: true,
        adminSent: adminResult.success,
        signerSent: signerNotified,
        pdfMissing,
        email_delivery: {
          admin: { success: adminResult.success, error: adminResult.error ?? null, recipients: NDA_NOTIFICATION_RECIPIENTS },
          signer: { success: signerNotified, error: signerError },
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NDA notification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to send NDA notification' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
