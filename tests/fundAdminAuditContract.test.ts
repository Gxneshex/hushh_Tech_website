import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const readRepoFile = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Fund admin onboarding audit contract", () => {
  it("unions onboarding, NDA, Plaid, Stripe, CEO, and KYC evidence into the overview", () => {
    const overview = readRepoFile("supabase/functions/fund-payment-admin-overview/index.ts");

    for (const source of [
      "fund_stripe_payment_requests",
      "nda_signatures",
      "ceo_meeting_payments",
      "onboarding_data",
      "fund_stripe_payments",
      "user_financial_data",
      "plaid_items",
      "plaid_accounts",
      "plaid_product_sync_statuses",
      "kyc_attestations",
    ]) {
      expect(overview).toContain(`"${source}"`);
    }

    expect(overview).toContain("...financialByUser.keys()");
    expect(overview).toContain("...itemByUser.keys()");
    expect(overview).toContain("missing_onboarding_row");
  });

  it("keeps manual investor approval separate from onboarding and bank-link completion", () => {
    const overview = readRepoFile("supabase/functions/fund-payment-admin-overview/index.ts");
    const uiLogic = readRepoFile("src/pages/fund-admin/logic.ts");
    const ui = readRepoFile("src/pages/fund-admin/ui.tsx");

    expect(overview).toContain('"manual_approved"');
    expect(overview).toContain('"onboarding_complete"');
    expect(overview).toContain('"bank_linked"');
    expect(overview).toContain('manualInvestorStatus');
    expect(overview).toContain('onboardingComplete: Boolean');
    expect(overview).toContain('bankLinked: linked');

    expect(uiLogic).toContain("'completed_onboarding'");
    expect(uiLogic).toContain("'bank_linked'");
    expect(uiLogic).toContain("'manually_approved'");
    expect(ui).toContain("Manual approved");
    expect(ui).toContain("Onboarding complete");
    expect(ui).toContain("Bank linked");
  });

  it("returns source warnings instead of failing closed on optional source drift", () => {
    const overview = readRepoFile("supabase/functions/fund-payment-admin-overview/index.ts");
    const detail = readRepoFile("supabase/functions/fund-payment-admin-detail/index.ts");

    expect(overview).toContain("sourceWarnings");
    expect(overview).toContain("readRows");
    expect(overview).toContain("kycAvailable = !kycRes.error");
    expect(detail).toContain("sourceWarnings");
    expect(detail).toContain("kycAvailable = !kycRes.error");
    expect(detail).toContain("not_configured");
  });

  it("surfaces source warnings and missing pieces in overview and detail UI", () => {
    const ui = readRepoFile("src/pages/fund-admin/ui.tsx");
    const detailUi = readRepoFile("src/pages/fund-admin/detail/ui.tsx");

    expect(ui).toContain("sourceWarnings.length > 0");
    expect(ui).toContain("Needs attention");
    expect(ui).toContain("auditLabel(piece)");
    expect(detailUi).toContain("sourceWarnings.length > 0");
    expect(detailUi).toContain("Onboarding audit");
    expect(detailUi).toContain("Missing / needs attention");
    expect(detailUi).toContain("Data sources");
    expect(detailUi).toContain("missingPieces");
    expect(detailUi).toContain("dataSources");
  });

  it("adds a conservative backfill without synthesizing onboarding rows", () => {
    const migration = readRepoFile(
      "supabase/migrations/20260601143000_backfill_fund_admin_audit_statuses.sql",
    );

    expect(migration).toContain("financial_link_status = 'completed'");
    expect(migration).toContain("fund_payment_status");
    expect(migration).toContain("fund_investor_verification_status");
    expect(migration).toContain("does not create synthetic onboarding rows");
    expect(migration).not.toMatch(/INSERT\s+INTO\s+public\.onboarding_data/i);
  });
});
