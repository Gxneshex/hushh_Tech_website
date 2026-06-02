import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const readRepoFile = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Hushh Fund Stripe payment contract", () => {
  it("adds payment, review, notification, and manual-verification tables", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260527123000_add_fund_stripe_payment_requests.sql",
    );

    for (const table of [
      "fund_stripe_payment_requests",
      "fund_stripe_payments",
      "fund_stripe_subscriptions",
      "fund_stripe_events",
      "fund_payment_reviews",
      "fund_payment_notifications",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(migration).toContain(`GRANT ALL ON TABLE public.${table} TO service_role`);
    }

    expect(migration).toContain("request_token_hash text UNIQUE NOT NULL");
    expect(migration).not.toContain("request_token text");
    expect(migration).toContain("fund_investor_verification_status");
    expect(migration).toContain("pending_manual_verification");
    expect(migration).toContain("verified_investor");
    expect(migration).toContain("risk_flags jsonb");
  });

  it("creates a seven-day Hushh payment request with server-side $1 minimum and email logs", () => {
    const createFunction = readRepoFile("supabase/functions/fund-payment-request-create/index.ts");
    const shared = readRepoFile("supabase/functions/_shared/fundStripe.ts");

    expect(shared).toContain("MIN_FIRST_PAYMENT_CENTS = 100");
    expect(shared).toContain("PAYMENT_LINK_TTL_DAYS = 7");
    expect(createFunction).toContain("parseUsdAmountToCents");
    expect(createFunction).toContain("First payment must be at least $1");
    expect(createFunction).toContain("sha256Hex(token)");
    expect(createFunction).toContain("fund_stripe_payment_requests");
    expect(createFunction).toContain("fund_payment_status: \"payment_link_sent\"");
    expect(createFunction).toContain("logAndSendFundEmail");
    expect(createFunction).toContain("FUND_TEAM_RECIPIENTS");

    const responseBlock = createFunction.slice(createFunction.lastIndexOf("return json({\n      success: true"));
    expect(responseBlock).not.toContain("request_token_hash");
    expect(responseBlock).not.toContain("STRIPE_SECRET_KEY");
    expect(responseBlock).not.toContain("PLAID_SECRET");
  });

  it("opens fresh Stripe Checkout from the Hushh token without trusting the browser for success", () => {
    const checkoutFunction = readRepoFile("supabase/functions/fund-payment-checkout/index.ts");
    const paymentPage = readRepoFile("src/pages/onboarding/fund-payment/ui.tsx");

    expect(checkoutFunction).toContain("findPaymentRequestByToken");
    expect(checkoutFunction).toContain("stripe.checkout.sessions.create");
    expect(checkoutFunction).toContain("mode: \"payment\"");
    expect(checkoutFunction).toContain("setup_future_usage: \"off_session\"");
    expect(checkoutFunction).toContain("PAYMENT_LINK_EXPIRED");
    expect(checkoutFunction).toContain("status: \"checkout_created\"");
    expect(checkoutFunction).not.toContain("mode: \"subscription\"");

    expect(paymentPage).toContain("Stripe webhook");
    expect(paymentPage).toContain("The backend updates the Hushh ledger only from Stripe webhooks");
  });

  it("requires Stripe webhook signature verification and processes payment truth idempotently", () => {
    const webhook = readRepoFile("supabase/functions/fund-stripe-webhook/index.ts");
    const sharedStripe = readRepoFile("supabase/functions/_shared/fundStripe.ts");

    expect(webhook).toContain("STRIPE_FUND_WEBHOOK_SECRET");
    expect(webhook).toContain("stripe.webhooks.constructEventAsync");
    expect(sharedStripe).toContain("Stripe.createSubtleCryptoProvider()");
    expect(webhook).toContain("STRIPE_FUND_WEBHOOK_ALLOW_UNSIGNED");
    expect(webhook).toContain("duplicate: true");
    expect(webhook).toContain("checkout.session.completed");
    expect(webhook).toContain("payment_intent.succeeded");
    expect(webhook).toContain("payment_intent.payment_failed");
    expect(webhook).toContain("charge.refunded");
    expect(webhook).toContain("charge.dispute.created");
    expect(webhook).toContain("fund_investor_verification_status: \"pending_manual_verification\"");
    expect(webhook).toContain("Stripe webhook confirmed payment. Manual investor review required before unlock.");
  });

  it("refuses unsigned webhook bypass when SUPABASE_URL is not localhost", () => {
    const webhook = readRepoFile("supabase/functions/fund-stripe-webhook/index.ts");
    expect(webhook).toContain("isLocalSupabaseHost");
    expect(webhook).toContain("UNSIGNED_NOT_ALLOWED_IN_NON_LOCAL");
  });

  it("defers out-of-order refund / dispute events and replays them once the payment row exists", () => {
    const webhook = readRepoFile("supabase/functions/fund-stripe-webhook/index.ts");
    expect(webhook).toContain("markEventDeferred");
    expect(webhook).toContain("replayDeferredEventsForPayment");
    expect(webhook).toContain("processing_status: \"deferred\"");
    expect(webhook).toContain("processing_status: \"replayed\"");
  });

  it("treats any non-completed financial link status as weak Plaid data for the risk flag", () => {
    const sharedStripe = readRepoFile("supabase/functions/_shared/fundStripe.ts");
    expect(sharedStripe).toContain('linkStatus !== "completed"');
    expect(sharedStripe).not.toContain('params.financialLinkStatus === "skipped"');
  });

  it("creates a single Plaid sync lock window so concurrent runs do not double-write", () => {
    const syncStart = readRepoFile("supabase/functions/plaid-data-sync-start/index.ts");
    expect(syncStart).toContain("PLAID_SYNC_LOCK_WINDOW_MS");
    expect(syncStart).toContain("tryAcquireSyncLock");
    expect(syncStart).toContain("sync_in_progress: true");
    const migration = readRepoFile(
      "supabase/migrations/20260529100000_add_sync_lock_and_event_replay.sql",
    );
    expect(migration).toContain("last_sync_started_at");
    expect(migration).toContain("processing_status");
  });

  it("reuses an open Stripe Checkout session so cancel-URL reloads do not multiply sessions", () => {
    const checkoutFunction = readRepoFile("supabase/functions/fund-payment-checkout/index.ts");
    expect(checkoutFunction).toContain("checkout.sessions.retrieve");
    expect(checkoutFunction).toContain("reused: true");
  });

  it("gates the parked Plaid Transfer money path behind an explicit env flag", () => {
    const transferStart = readRepoFile(
      "supabase/functions/fund-transfer-sandbox-start/index.ts",
    );
    expect(transferStart).toContain("HUSHH_FUND_TRANSFER_ENABLED");
    expect(transferStart).toContain("FUND_TRANSFER_DISABLED");
  });

  it("keeps investor unlock behind a manual admin decision", () => {
    const adminVerify = readRepoFile("supabase/functions/fund-payment-admin-verify/index.ts");

    expect(adminVerify).toContain("authenticateTeamMember");
    expect(adminVerify).toContain("Stripe payment must be confirmed before investor approval");
    expect(adminVerify).toContain("verified_investor");
    expect(adminVerify).toContain("rejected");
    expect(adminVerify).toContain("fund_stripe_subscriptions");
    expect(adminVerify).toContain("pending_setup");
  });

  it("replaces Step 9 ACH transfer with Plaid verification plus Stripe payment request UX", () => {
    const stepUi = readRepoFile("src/pages/onboarding/step-9/ui.tsx");
    const stepLogic = readRepoFile("src/pages/onboarding/step-9/logic.ts");
    const fundService = readRepoFile("src/services/fundPayment/fundPaymentService.ts");

    expect(stepUi).toContain("Plaid Transfer is under development");
    expect(stepUi).toContain("Stripe collects the first payment");
    expect(stepUi).toContain("Minimum $1");
    expect(stepUi).toContain("Send Secure Payment Link");
    expect(stepLogic).toContain("createFundPaymentRequest");
    expect(stepLogic).toContain("Minimum first payment is $1");
    expect(stepLogic).toContain("fund_investor_verification_status");
    expect(stepLogic).not.toContain("startFundTransferSandbox");
    expect(stepUi).not.toContain("ACH Authorization");
    expect(stepUi).not.toContain("Authorize Sandbox Transfer");

    expect(fundService).toContain("fund-payment-request-create");
    expect(fundService).toContain("fund-payment-checkout");
    expect(fundService).toContain("fund-payment-status");
    expect(fundService).not.toContain("STRIPE_SECRET_KEY");
    expect(fundService).not.toContain("PLAID_SECRET");
    expect(fundService).not.toContain("plaid_access_token");
  });

  it("cleans up fund Stripe tables during account deletion", () => {
    const sharedDelete = readRepoFile("supabase/functions/_shared/deleteAccount.ts");
    const apiDelete = readRepoFile("api/delete-account-service.js");

    for (const table of [
      "fund_payment_notifications",
      "fund_payment_reviews",
      "fund_stripe_events",
      "fund_stripe_payments",
      "fund_stripe_subscriptions",
      "fund_stripe_payment_requests",
    ]) {
      expect(sharedDelete).toContain(`"${table}"`);
      expect(apiDelete).toContain(`"${table}"`);
    }
  });
});
