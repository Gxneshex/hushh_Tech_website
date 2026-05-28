import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";
import { sendGmailEmail } from "./gmail.ts";
import { getTrustedOrigin } from "./security.ts";

export const MIN_FIRST_PAYMENT_CENTS = 100;
export const PAYMENT_LINK_TTL_DAYS = 7;
export const FUND_PAYMENT_CURRENCY = "usd";

export const SHARE_PRICE_CENTS = {
  class_a_units: 2_500_000_000,
  class_b_units: 500_000_000,
  class_c_units: 100_000_000,
};

export const FUND_TEAM_RECIPIENTS = [
  "manish@hushh.ai",
  "ankit@hushh.ai",
  "neelesh1@hushh.ai",
];

export const json = (payload: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

export function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-hushh-admin-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service configuration is missing");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getStripeClient() {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });
}

export function getStripeWebhookCryptoProvider() {
  return Stripe.createSubtleCryptoProvider();
}

export async function requireAuthenticatedUser(req: Request, supabase: any, expectedUserId?: string | null) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { response: json({ error: "Missing authorization header" }, 401, getCorsHeaders()) };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { response: json({ error: "Invalid or expired token" }, 401, getCorsHeaders()) };
  }

  if (expectedUserId && user.id !== expectedUserId) {
    return { response: json({ error: "Authenticated user mismatch" }, 403, getCorsHeaders()) };
  }

  return { user };
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function createRequestToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `hfp_${encoded}`;
}

export function createRequestReference(): string {
  return `HF-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export function centsToDecimal(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function formatUsdCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function parseUsdAmountToCents(value: unknown): number | null {
  if (value == null || value === "") return null;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export function computeCommitmentCents(onboarding: Record<string, unknown>): number {
  const explicit = Number(onboarding.initial_investment_amount || 0);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit * 100);

  return (
    Number(onboarding.class_a_units || 0) * SHARE_PRICE_CENTS.class_a_units +
    Number(onboarding.class_b_units || 0) * SHARE_PRICE_CENTS.class_b_units +
    Number(onboarding.class_c_units || 0) * SHARE_PRICE_CENTS.class_c_units
  );
}

export function normalizeRecurringSummary(onboarding: Record<string, unknown>): string | null {
  const amount = Number(onboarding.recurring_amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const frequency = String(onboarding.recurring_frequency || "once_a_month")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  const day = Number(onboarding.recurring_day_of_month || 1);
  const dayLabel = day === 31 ? "last day of the month" : `day ${day}`;
  return `${formatUsdCents(Math.round(amount * 100))} ${frequency.toLowerCase()} on ${dayLabel}`;
}

export function getDisplayName(user: any, onboarding: Record<string, unknown> | null | undefined): string {
  const legalName = [onboarding?.legal_first_name, onboarding?.legal_last_name]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return legalName || user?.user_metadata?.full_name || user?.email || "Hushh investor";
}

export function buildRiskFlags(params: {
  firstPaymentCents: number;
  commitmentCents: number;
  hasPlaidData: boolean;
  financialLinkStatus?: string | null;
  recurringSelected: boolean;
}): string[] {
  const flags: string[] = [];
  if (params.firstPaymentCents <= MIN_FIRST_PAYMENT_CENTS && params.commitmentCents >= 1_000_000_00) {
    flags.push("minimum_payment_against_large_commitment");
  }
  const linkStatus = String(params.financialLinkStatus || "").trim().toLowerCase();
  if (!params.hasPlaidData || linkStatus !== "completed") {
    flags.push("weak_or_skipped_plaid_data");
  }
  if (params.recurringSelected) {
    flags.push("recurring_requires_manual_activation");
  }
  return flags;
}

export function buildPaymentRequestUrl(req: Request, token: string): string {
  return `${getTrustedOrigin(req)}/onboarding/fund-payment/${encodeURIComponent(token)}`;
}

export async function logAndSendFundEmail(params: {
  supabase: any;
  userId?: string | null;
  paymentRequestId?: string | null;
  paymentId?: string | null;
  notificationType: string;
  recipients: string[];
  subject: string;
  html: string;
}) {
  const { data: logRow } = await params.supabase
    .from("fund_payment_notifications")
    .insert({
      user_id: params.userId || null,
      payment_request_id: params.paymentRequestId || null,
      payment_id: params.paymentId || null,
      notification_type: params.notificationType,
      recipient_email: params.recipients.join(", "),
      subject: params.subject,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  const result = await sendGmailEmail(params.recipients, params.subject, params.html);
  await params.supabase
    .from("fund_payment_notifications")
    .update({
      status: result.success ? "sent" : "failed",
      provider_message_id: result.messageId || null,
      error_message: result.error || null,
      sent_at: result.success ? new Date().toISOString() : null,
    })
    .eq("id", logRow?.id);

  return result;
}

export async function findPaymentRequestByToken(supabase: any, token: string) {
  const requestTokenHash = await sha256Hex(token);
  const { data, error } = await supabase
    .from("fund_stripe_payment_requests")
    .select("*")
    .eq("request_token_hash", requestTokenHash)
    .maybeSingle();
  if (error) throw error;
  return data;
}
