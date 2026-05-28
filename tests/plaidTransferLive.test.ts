import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const WEBHOOK_SECRET = process.env.PLAID_TRANSFER_WEBHOOK_SECRET || "";
const SHOULD_RUN =
  process.env.PLAID_TRANSFER_LIVE_E2E === "1" &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY.length > 100 &&
  SUPABASE_SERVICE_ROLE_KEY.length > 100;

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const TEST_TIMEOUT = 180_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function expectNoPlaidAccessToken(payload: unknown) {
  const body = JSON.stringify(payload);
  expect(body).not.toContain("access-sandbox-");
  expect(body).not.toContain("access-development-");
  expect(body).not.toContain("access-production-");
}

describe.skipIf(!SHOULD_RUN)("Plaid Transfer live sandbox E2E", () => {
  let admin: any;
  let authClient: any;
  let userId = "";
  let userToken = "";
  let email = "";
  let password = "";
  const plaidItemIds = new Set<string>();
  const plaidAccountIds = new Set<string>();
  const plaidTransferIds = new Set<string>();

  async function invokeFunction(name: string, body: Record<string, unknown>) {
    const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(`${name} failed with ${res.status}: ${data.error || text}`);
    }
    expectNoPlaidAccessToken(data);
    return data;
  }

  async function invokeWebhook(body: Record<string, unknown> = {}) {
    const res = await fetch(`${FUNCTIONS_URL}/plaid-transfer-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_SECRET ? { "x-hushh-webhook-secret": WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        ...body,
        ...(WEBHOOK_SECRET ? { webhook_secret: WEBHOOK_SECRET } : {}),
      }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(`plaid-transfer-webhook failed with ${res.status}: ${data.error || text}`);
    }
    expectNoPlaidAccessToken(data);
    return data;
  }

  async function seedOnboarding() {
    const { error } = await admin.from("onboarding_data").upsert(
      {
        user_id: userId,
        account_type: "wealth_1m",
        selected_fund: "hushh_fund_a",
        class_a_units: 0,
        class_b_units: 0,
        class_c_units: 1,
        initial_investment_amount: 1_000_000,
        recurring_investment_enabled: true,
        recurring_amount: 111.11,
        recurring_frequency: "once_a_month",
        recurring_day_of_month: 1,
        legal_first_name: "Plaid",
        legal_last_name: "Sandbox",
        phone_country_code: "+1",
        phone_number: "4155550100",
        address_line_1: "1 Market St",
        city: "San Francisco",
        state: "CA",
        zip_code: "94105",
        address_country: "US",
        residence_country: "US",
        bank_account_holder_name: "Plaid Sandbox",
        current_step: 13,
      },
      { onConflict: "user_id" },
    );
    expect(error).toBeNull();
  }

  async function startTransfer(sandboxAmount = "10.01") {
    const result = await invokeFunction("fund-transfer-sandbox-start", {
      userId,
      achAuthorized: true,
      sandboxAmount,
      sandboxRecurringAmount: "11.11",
    });

    expect(result.success).toBe(true);
    expect(result.sandbox_mode).toBe(true);
    expect(result.transfer?.id).toBeTruthy();
    expect(result.transfer?.plaid_transfer_id).toBeTruthy();
    plaidTransferIds.add(result.transfer.plaid_transfer_id);
    return result;
  }

  async function waitForTransferStatus(fundTransferId: string, expectedStatuses: string | string[]) {
    const expected = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
    for (let attempt = 0; attempt < 20; attempt++) {
      const { data, error } = await admin
        .from("fund_transfers")
        .select("status")
        .eq("id", fundTransferId)
        .maybeSingle();
      expect(error).toBeNull();
      if (expected.includes(data?.status)) return;
      await delay(2_000);
    }

    const { data } = await admin
      .from("fund_transfers")
      .select("status")
      .eq("id", fundTransferId)
      .maybeSingle();
    expect(expected).toContain(data?.status);
  }

  async function simulateStatus(
    fundTransferId: string,
    eventType: "posted" | "settled" | "funds_available" | "failed" | "returned",
  ) {
    const simulation = await invokeFunction("plaid-transfer-sandbox-simulate", {
      userId,
      fundTransferId,
      eventType,
    });
    expect(simulation.success).toBe(true);

    const webhook = await invokeWebhook({ after_id: 0 });
    expect(webhook.success).toBe(true);
    await waitForTransferStatus(fundTransferId, eventType);
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    email = `plaid-sandbox-e2e+${suffix}@hushh.ai`;
    password = `PlaidSandbox!${Date.now()}Aa1`;

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { test_suite: "plaid-transfer-live" },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;

    const signedIn = await authClient.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    userToken = signedIn.data.session?.access_token || "";
    expect(userToken).toBeTruthy();

    await seedOnboarding();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (!admin || !userId) return;

    try {
      if (plaidTransferIds.size > 0) {
        await admin
          .from("plaid_transfer_events")
          .delete()
          .in("plaid_transfer_id", [...plaidTransferIds]);
      }
      await admin.from("transfer_email_notifications").delete().eq("user_id", userId);
      await admin.from("fund_recurring_transfers").delete().eq("user_id", userId);
      await admin.from("fund_transfers").delete().eq("user_id", userId);
      await admin.from("fund_investment_plans").delete().eq("user_id", userId);
      await admin.from("plaid_transfer_accounts").delete().eq("user_id", userId);

      if (plaidAccountIds.size > 0) {
        await admin.from("plaid_transactions").delete().in("plaid_account_id", [...plaidAccountIds]);
      }
      if (plaidItemIds.size > 0) {
        await admin.from("plaid_sync_cursors").delete().in("plaid_item_id", [...plaidItemIds]);
        await admin.from("plaid_accounts").delete().in("plaid_item_id", [...plaidItemIds]);
      }

      await admin.from("user_financial_data").delete().eq("user_id", userId);
      await admin.from("plaid_items").delete().eq("user_id", userId);
      await admin.from("onboarding_data").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
    } catch (error) {
      console.warn("[plaid-transfer-live] Cleanup failed:", error);
    }
  }, TEST_TIMEOUT);

  it("connects a sandbox bank, syncs data, creates transfers, simulates statuses, and advances recurring clock", async () => {
    const item = await invokeFunction("sandbox-create-test-item", { userId });
    expect(item.success).toBe(true);
    expect(item.item_id).toBeTruthy();
    plaidItemIds.add(item.item_id);

    const sync = await invokeFunction("plaid-data-sync", {
      userId,
      itemId: item.item_id,
    });
    expect(sync.can_proceed).toBe(true);

    const { data: storedItem, error: itemError } = await admin
      .from("plaid_items")
      .select("plaid_item_id, plaid_access_token_encrypted")
      .eq("user_id", userId)
      .eq("plaid_item_id", item.item_id)
      .maybeSingle();
    expect(itemError).toBeNull();
    expect(storedItem?.plaid_access_token_encrypted).toMatch(/^aes-gcm:v1:/);

    const { data: transferAccounts, error: accountsError } = await admin
      .from("plaid_transfer_accounts")
      .select("plaid_account_id, mask, status")
      .eq("user_id", userId);
    expect(accountsError).toBeNull();
    expect(transferAccounts?.length).toBeGreaterThan(0);
    for (const account of transferAccounts || []) {
      plaidAccountIds.add(account.plaid_account_id);
      expect(account.status).toBe("active");
      expect(account.mask).toBeTruthy();
    }

    const { data: financialData, error: financialError } = await admin
      .from("user_financial_data")
      .select("plaid_access_token, auth_numbers, plaid_sync_status")
      .eq("user_id", userId)
      .maybeSingle();
    expect(financialError).toBeNull();
    expect(financialData?.plaid_access_token).toBeNull();
    expect(financialData?.plaid_sync_status).toMatch(/complete|partial/);
    expect(financialData?.auth_numbers?.sensitive_redacted).toBe(true);

    const firstTransfer = await startTransfer("10.01");
    await simulateStatus(firstTransfer.transfer.id, "posted");
    await simulateStatus(firstTransfer.transfer.id, "settled");
    await simulateStatus(firstTransfer.transfer.id, "funds_available");

    if (firstTransfer.recurring_transfer?.test_clock_id) {
      const advancedClock = await invokeFunction("plaid-transfer-sandbox-simulate", {
        userId,
        action: "advance_test_clock",
        testClockId: firstTransfer.recurring_transfer.test_clock_id,
        days: 35,
      });
      expect(advancedClock.success).toBe(true);
    }

    const failedTransfer = await startTransfer("10.02");
    await simulateStatus(failedTransfer.transfer.id, "failed");

    const returnedTransfer = await startTransfer("10.03");
    await simulateStatus(returnedTransfer.transfer.id, "posted");
    await simulateStatus(returnedTransfer.transfer.id, "returned");

    const { data: emails, error: emailError } = await admin
      .from("transfer_email_notifications")
      .select("notification_type, status")
      .eq("user_id", userId);
    expect(emailError).toBeNull();
    expect(emails?.length).toBeGreaterThan(0);
    const emailStatuses = (emails || []).map((row: any) => row.status);
    expect(emailStatuses).not.toContain("pending");
    expect(emailStatuses.every((status: string) => ["sent", "failed", "skipped"].includes(status))).toBe(true);
  }, TEST_TIMEOUT);
});
