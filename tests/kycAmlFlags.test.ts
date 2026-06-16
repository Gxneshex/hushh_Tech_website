import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/**
 * PR 3 — AML review flags + US-person consistency.
 * Edge functions are Deno modules (with URL imports) that vitest cannot import,
 * so these are source-contract tests in the repo's established style.
 */
describe("KYC AML flags + US-person consistency (PR 3)", () => {
  const overviewFiles = [
    "supabase/functions/_shared/fundAdminOverview.ts",
    "supabase/functions/fund-payment-admin-detail/index.ts",
    "supabase/functions/fund-payment-admin-overview/index.ts",
  ];

  it("flags current-location-vs-legal-residence mismatch in every reviewer surface", () => {
    for (const f of overviewFiles) {
      const src = read(f);
      expect(src).toContain('pieces.push("current_location_differs_from_residence")');
      // computed from the AML signal (current GPS country vs declared residence)
      expect(src).toContain("params.onboarding?.gps_country");
      expect(src).toContain("params.onboarding?.residence_country");
    }
  });

  it("US-person check at review uses citizenship OR residence (not residence only)", () => {
    const ui = read("src/pages/onboarding/step-8/ui.tsx");
    expect(ui).toContain(
      "isUnitedStates(summary?.residence_country) || isUnitedStates(summary?.citizenship_country)",
    );
    expect(ui).not.toContain("const isUsInvestor = isUnitedStates(summary?.residence_country);");
  });

  it("A2A protocol no longer assumes US when citizenship is unknown", () => {
    const a2a = read("supabase/functions/kyc-agent-a2a-protocol/index.ts");
    expect(a2a).not.toContain("foundUser.citizenship_country || 'US'");
    expect(a2a).toContain(
      "foundUser.citizenship_country || foundUser.residence_country || null",
    );
  });
});
