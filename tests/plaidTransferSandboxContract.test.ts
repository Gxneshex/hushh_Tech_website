import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const readRepoFile = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Plaid Transfer sandbox contract", () => {
  it("keeps Plaid access tokens server-only after public token exchange", () => {
    const exchangeFunction = readRepoFile("supabase/functions/exchange-public-token/index.ts");
    const plaidService = readRepoFile("src/services/plaid/plaidService.ts");
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");

    expect(exchangeFunction).toContain("encryptPlaidAccessToken(data.access_token)");
    expect(exchangeFunction).toContain("plaid_access_token_encrypted");
    expect(exchangeFunction).toContain("accounts: accountsForUi.map");
    const browserResponseBlock = exchangeFunction.slice(
      exchangeFunction.indexOf("return new Response(\n      JSON.stringify({\n        item_id"),
    );
    expect(browserResponseBlock).not.toContain("access_token");
    expect(browserResponseBlock).not.toContain("accessToken");

    const exchangeResponseType = plaidService.match(
      /export interface ExchangeTokenResponse \{[\s\S]*?\n\}/,
    )?.[0];
    expect(exchangeResponseType).toBeTruthy();
    expect(exchangeResponseType).not.toContain("access_token");
    expect(exchangeResponseType).not.toContain("accessToken");

    expect(usePlaidLink).toContain("startPlaidDataSync(userId, exchange.item_id)");
    expect(usePlaidLink).not.toContain("exchange.access_token");
    expect(usePlaidLink).not.toContain("exchange.accessToken");
  });

  it("keeps Link token consent products compatible with Plaid Transfer Link", () => {
    const createLinkToken = readRepoFile("supabase/functions/create-link-token/index.ts");
    const plaidShared = readRepoFile("supabase/functions/_shared/plaid.ts");

    expect(createLinkToken).toContain("resolvePlaidPrimaryProducts(plaid.env)");
    expect(plaidShared).toContain("env === 'production' ? ['auth'] : ['transfer']");
    expect(createLinkToken).toContain("primaryProducts.includes('transfer')");
    expect(createLinkToken).toContain("delete plaidBody.required_if_supported_products");
    expect(createLinkToken).toContain("ADDITIONAL_CONSENTED_PRODUCT_ALLOWLIST");
    expect(createLinkToken).toContain("'identity'");
    expect(createLinkToken).toContain("'transactions'");
    expect(createLinkToken).toContain("'investments'");
    expect(createLinkToken).toContain("'liabilities'");
    expect(createLinkToken).toContain("'signal'");
    expect(createLinkToken).toContain("Ignoring unsupported additional consented products");
    expect(createLinkToken).not.toContain("identity,transactions,investments,liabilities,assets,signal,statements");
    expect(createLinkToken).not.toContain("'assets',");
    expect(createLinkToken).not.toContain("'statements',");
  });

  it("does not restore half-used Plaid Link tokens from session storage", () => {
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");

    expect(usePlaidLink).toContain("hasDisplayableFinancialData");
    expect(usePlaidLink).toContain("only completed data is restored");
    expect(usePlaidLink).toContain("Normal reloads create a fresh token");
    expect(usePlaidLink).not.toContain("Restoring link token from sessionStorage");
    expect(usePlaidLink).not.toContain("Valid link token restored");
  });

  it("resumes bank OAuth with the original Plaid Link token", () => {
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");

    expect(usePlaidLink).toContain("OAUTH_RESUME_KEY_PREFIX");
    expect(usePlaidLink).toContain("saveOAuthResumeState(userId, result.link_token, result.expiration, redirectUri)");
    expect(usePlaidLink).toContain("const resumeState = loadOAuthResumeState(userId)");
    expect(usePlaidLink).toContain("linkToken: resumeState.linkToken");
    expect(usePlaidLink).toContain("clearOAuthResumeState(userId)");
    expect(usePlaidLink).not.toContain("createLinkToken(userId, userEmail, undefined, receivedRedirectUri)");
  });

  it("uses direct sandbox item creation on localhost to avoid Plaid iframe OAuth noise", () => {
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");
    const financialLinkLogic = readRepoFile("src/pages/onboarding/financial-link/logic.ts");
    const plaidService = readRepoFile("src/services/plaid/plaidService.ts");

    expect(usePlaidLink).toContain("skipAutoInit");
    expect(usePlaidLink).toContain("Local sandbox direct connect enabled; skipping Link token auto-init");
    expect(financialLinkLogic).toContain("shouldUsePlaidSandboxDirectConnect");
    expect(financialLinkLogic).toContain("VITE_PLAID_ENV === 'sandbox'");
    expect(financialLinkLogic).toContain("VITE_PLAID_DISABLE_LOCAL_SANDBOX_DIRECT");
    expect(financialLinkLogic).toContain("createSandboxTestItem(userId, LOCAL_SANDBOX_INSTITUTION_ID)");
    expect(financialLinkLogic).toContain("Connect Sandbox Bank");
    expect(financialLinkLogic).toContain("startPlaidDataSync(userId, sandboxItem.item_id)");
    expect(plaidService).toContain("sandbox-create-test-item");
  });

  it("blocks Plaid Link iframe on localhost when the project is using production Plaid", () => {
    const financialLinkLogic = readRepoFile("src/pages/onboarding/financial-link/logic.ts");
    const financialLinkUi = readRepoFile("src/pages/onboarding/financial-link/ui.tsx");

    expect(financialLinkLogic).toContain("shouldBlockLocalPlaidLink");
    expect(financialLinkLogic).toContain("VITE_ALLOW_LOCAL_PLAID_LINK");
    expect(financialLinkLogic).toContain("skipAutoInit: useSandboxDirectConnect || blockLocalPlaidLink");
    expect(financialLinkLogic).toContain("Plaid bank connection is paused on localhost");
    expect(financialLinkLogic).toContain("if (blockLocalPlaidLink) {\n      return;\n    }");
    expect(financialLinkLogic).toContain("showPrimaryButtonSpinner");
    expect(financialLinkUi).toContain("localPlaidNotice");
    expect(financialLinkUi).toContain("showPrimaryButtonSpinner");
  });

  it("reloads synced financial data from the database before rendering account totals", () => {
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");

    expect(usePlaidLink).toContain("const dbState = await loadFromDatabase(userId)");
    expect(usePlaidLink).toContain("Loaded synced financial data from database");
    expect(usePlaidLink).toContain("financialDataFromSyncResult(syncResult)");
  });

  it("backfills product sync statuses for restored completed Plaid links", () => {
    const usePlaidLink = readRepoFile("src/services/plaid/usePlaidLink.ts");
    const financialLinkLogic = readRepoFile("src/pages/onboarding/financial-link/logic.ts");

    expect(usePlaidLink).toContain("plaidItemId: data.plaid_item_id || null");
    expect(usePlaidLink).toContain("SessionStorage completed state restored; refreshing database truth");
    expect(usePlaidLink).not.toContain("SessionStorage restore successful, skipping DB check");
    expect(usePlaidLink).toContain("refreshFromDatabase");
    expect(usePlaidLink).toContain("isDatabaseRestoreComplete");

    expect(financialLinkLogic).toContain("CORE_SYNC_PRODUCTS");
    expect(financialLinkLogic).toContain("syncBackfillAttemptedRef");
    expect(financialLinkLogic).toContain("startPlaidDataSync(userId, plaid.plaidItemId)");
    expect(financialLinkLogic).toContain("Starting background sync");
    expect(financialLinkLogic).toContain("Reconnect bank");
  });

  it("adds the DB tables, RLS, and anon revocation needed for transfer records", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260527090000_add_plaid_transfer_sandbox_contract.sql",
    );

    for (const table of [
      "plaid_transfer_accounts",
      "fund_investment_plans",
      "fund_transfers",
      "fund_recurring_transfers",
      "plaid_transfer_events",
      "transfer_email_notifications",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(migration).toContain(`GRANT ALL ON TABLE public.${table} TO service_role`);
    }

    expect(migration).toContain("REVOKE SELECT ON TABLE public.user_financial_data FROM anon");
    expect(migration).toContain("ach_authorized_at");
    expect(migration).toContain("plaid_transfer_setup_status");
  });

  it("adds max-data sync tables and product-level status contracts", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260527104500_add_plaid_max_data_sync.sql",
    );
    const sharedSync = readRepoFile("supabase/functions/_shared/plaidDataSync.ts");
    const startFunction = readRepoFile("supabase/functions/plaid-data-sync-start/index.ts");
    const productFunction = readRepoFile("supabase/functions/plaid-data-sync-product/index.ts");
    const webhookFunction = readRepoFile("supabase/functions/plaid-data-webhook/index.ts");
    const incomeFunction = readRepoFile("supabase/functions/plaid-income-link-token/index.ts");
    const plaidService = readRepoFile("src/services/plaid/plaidService.ts");
    const financialLinkUi = readRepoFile("src/pages/onboarding/financial-link/ui.tsx");

    for (const table of [
      "plaid_product_sync_statuses",
      "plaid_statement_metadata",
      "plaid_data_events",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(migration).toContain(`GRANT ALL ON TABLE public.${table} TO service_role`);
    }

    expect(migration).toContain("idx_plaid_sync_cursors_item_product");
    expect(migration).toContain("product text NOT NULL DEFAULT 'transactions'");
    expect(sharedSync).toContain("PLAID_IMMEDIATE_PRODUCTS");
    expect(sharedSync).toContain("PLAID_BACKGROUND_PRODUCTS");
    expect(sharedSync).toContain("/transactions/sync");
    expect(sharedSync).toContain("plaid_sync_cursors");
    expect(sharedSync).toContain("/asset_report/create");
    expect(sharedSync).toContain("/asset_report/get");
    expect(sharedSync).toContain("PRODUCT_NOT_READY");
    expect(sharedSync).toContain("/identity/match");
    expect(sharedSync).toContain("/statements/list");
    expect(sharedSync).toContain("BANK_INCOME_UPDATE_MODE_REQUIRED");
    expect(sharedSync).not.toContain("/income/get");

    expect(startFunction).toContain("plaid-data-sync-start");
    expect(startFunction).toContain("waitUntil(backgroundSync)");
    expect(productFunction).toContain("parsePlaidDataProduct");
    expect(productFunction).toContain("syncPlaidDataProduct");
    expect(webhookFunction).toContain("plaid_data_events");
    expect(webhookFunction).toContain("TRANSACTIONS");
    expect(webhookFunction).toContain("ASSETS");
    expect(webhookFunction).toContain("INVESTMENTS");
    expect(webhookFunction).toContain("ITEM");
    expect(incomeFunction).toContain("PLAID_BANK_INCOME_ENABLED");
    expect(incomeFunction).toContain("income_verification");

    expect(plaidService).toContain("startPlaidDataSync");
    expect(plaidService).toContain("getPlaidSyncStatus");
    expect(plaidService).toContain("refreshPlaidProduct");
    expect(plaidService).toContain("plaid_product_sync_statuses");
    expect(financialLinkUi).toContain("Plaid data sync");
  });

  it("sanitizes browser-facing max-data sync responses", () => {
    const productFunction = readRepoFile("supabase/functions/plaid-data-sync-product/index.ts");
    const webhookFunction = readRepoFile("supabase/functions/plaid-data-webhook/index.ts");
    const legacySync = readRepoFile("supabase/functions/plaid-data-sync/index.ts");

    for (const responseBlock of [
      productFunction.slice(productFunction.indexOf("return json({\n      success: true")),
      webhookFunction.slice(webhookFunction.lastIndexOf("return json({\n      success: true")),
      legacySync.slice(legacySync.indexOf("return json({\n      ...summary")),
    ]) {
      expect(responseBlock).not.toContain("access_token");
      expect(responseBlock).not.toContain("accessToken");
      expect(responseBlock).not.toContain("rawMetadata");
      expect(responseBlock).not.toContain("data:");
    }
  });

  it("keeps Plaid Transfer backend guarded while Step 9 uses Stripe until approval", () => {
    const transferFunction = readRepoFile("supabase/functions/fund-transfer-sandbox-start/index.ts");
    const stepLogic = readRepoFile("src/pages/onboarding/step-9/logic.ts");
    const stepUi = readRepoFile("src/pages/onboarding/step-9/ui.tsx");
    const plaidService = readRepoFile("src/services/plaid/plaidService.ts");

    expect(transferFunction).toContain("expectedUserId: userId || null");
    expect(transferFunction).toContain("ACH authorization is required");
    expect(transferFunction).toContain("toIsoCountryCode");
    expect(transferFunction).toContain("TRANSFER_ACCOUNT_NOT_ELIGIBLE");
    expect(transferFunction).toContain("checking, savings, cash-management, or money market account");
    expect(plaidService).toContain("'cash management'");
    expect(transferFunction).toContain("/transfer/authorization/create");
    expect(transferFunction).toContain("/transfer/create");
    expect(transferFunction).toContain("/transfer/recurring/create");
    expect(transferFunction).toContain("transfer_email_notifications");

    expect(stepUi).toContain("Plaid Transfer is under development");
    expect(stepLogic).toContain("createFundPaymentRequest");
    expect(stepLogic).not.toContain("startFundTransferSandbox");
    expect(stepLogic).not.toContain("achAuthorized");
    expect(stepUi).not.toContain("Authorize Sandbox Transfer");
    expect(stepUi).not.toContain("Authorize ACH Debit");
    expect(stepLogic).not.toContain("banking_info_submitted_at");
  });

  it("supports sandbox status simulation, webhook sync, and recurring test clocks", () => {
    const simulateFunction = readRepoFile("supabase/functions/plaid-transfer-sandbox-simulate/index.ts");
    const webhookFunction = readRepoFile("supabase/functions/plaid-transfer-webhook/index.ts");

    expect(simulateFunction).toContain("PLAID_ENV=sandbox");
    expect(simulateFunction).toContain("/sandbox/transfer/simulate");
    expect(simulateFunction).toContain("advance_test_clock");
    expect(simulateFunction).toContain("/sandbox/transfer/test_clock/advance");
    expect(simulateFunction).toContain("failed");
    expect(simulateFunction).toContain("returned");

    expect(webhookFunction).toContain("PLAID_TRANSFER_WEBHOOK_SECRET");
    expect(webhookFunction).toContain("/transfer/event/sync");
    expect(webhookFunction).toContain("plaid_transfer_events");
    expect(webhookFunction).toContain("fund_transfers");
    expect(webhookFunction).toContain("transfer_email_notifications");
  });

  it("supports server-only Plaid unlink before transfer setup starts", () => {
    const unlinkFunction = readRepoFile("supabase/functions/plaid-unlink-item/index.ts");
    const plaidService = readRepoFile("src/services/plaid/plaidService.ts");

    expect(unlinkFunction).toContain("authenticateEdgeRequest(req");
    expect(unlinkFunction).toContain("expectedUserId: userId || null");
    expect(unlinkFunction).toContain("fund_transfers");
    expect(unlinkFunction).toContain("fund_recurring_transfers");
    expect(unlinkFunction).toContain("TRANSFER_ALREADY_STARTED");
    expect(unlinkFunction).toContain("decryptPlaidAccessToken");
    expect(unlinkFunction).toContain("/item/remove");

    for (const table of [
      "plaid_transfer_accounts",
      "plaid_transactions",
      "plaid_product_sync_statuses",
      "plaid_statement_metadata",
      "plaid_data_events",
      "plaid_sync_cursors",
      "plaid_accounts",
      "user_financial_data",
      "plaid_items",
    ]) {
      expect(unlinkFunction).toContain(table);
    }

    expect(unlinkFunction).toContain("financial_link_status: 'pending'");
    expect(unlinkFunction).toContain("INVALID_ACCESS_TOKEN");
    expect(plaidService).toContain("unlinkPlaidAccount");
    expect(plaidService).toContain("plaid-unlink-item");

    const successResponseBlock = unlinkFunction.slice(
      unlinkFunction.indexOf("return json({\n      success: true"),
    );
    expect(successResponseBlock).not.toContain("access_token");
    expect(successResponseBlock).not.toContain("accessToken");
  });

  it("cleans up the new transfer tables during account deletion", () => {
    const sharedDelete = readRepoFile("supabase/functions/_shared/deleteAccount.ts");
    const apiDelete = readRepoFile("api/delete-account-service.js");

    for (const table of [
      "transfer_email_notifications",
      "fund_payment_notifications",
      "fund_payment_reviews",
      "fund_stripe_events",
      "fund_stripe_payments",
      "fund_stripe_subscriptions",
      "fund_stripe_payment_requests",
      "fund_recurring_transfers",
      "fund_transfers",
      "fund_investment_plans",
      "plaid_transfer_accounts",
      "plaid_product_sync_statuses",
      "plaid_statement_metadata",
      "plaid_data_events",
    ]) {
      expect(sharedDelete).toContain(`"${table}"`);
      expect(apiDelete).toContain(`"${table}"`);
    }
  });
});
