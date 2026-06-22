import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACCOUNT_TYPE_OPTIONS,
  COMING_SOON_ACCOUNT_TYPES,
  isAccountTypeAvailable,
} from "../src/services/onboarding/accountTypeConfig";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

// Step 2 ("Who is investing?") currently launches with Individual only. Joint,
// Retirement, and Trust / Entity are under development: visible but disabled with
// an "Under development" pill. These tests guard that gate.
describe("account type availability (Step 2 picker)", () => {
  it("marks only Individual as available", () => {
    expect(isAccountTypeAvailable("individual")).toBe(true);
    expect(isAccountTypeAvailable("joint")).toBe(false);
    expect(isAccountTypeAvailable("retirement")).toBe(false);
    expect(isAccountTypeAvailable("trust")).toBe(false);
  });

  it("flags the under-development types as comingSoon in the picker options", () => {
    const byValue = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map((o) => [o.value, o]));
    expect(byValue.individual.comingSoon).toBe(false);
    expect(byValue.joint.comingSoon).toBe(true);
    expect(byValue.retirement.comingSoon).toBe(true);
    expect(byValue.trust.comingSoon).toBe(true);
  });

  it("keeps the coming-soon set and options list in sync", () => {
    for (const option of ACCOUNT_TYPE_OPTIONS) {
      expect(option.comingSoon).toBe(COMING_SOON_ACCOUNT_TYPES.has(option.value));
    }
  });

  it("renders disabled coming-soon options with an Under development pill in Step 2", () => {
    const ui = read("src/pages/onboarding/step-2/ui.tsx");
    expect(ui).toContain("Under development");
    expect(ui).toContain("disabled={comingSoon}");
    expect(ui).toContain("if (comingSoon) return;");
  });

  it("does not restore a now-disabled account type from saved onboarding data", () => {
    const logic = read("src/pages/onboarding/step-2/logic.ts");
    expect(logic).toContain("isAccountTypeAvailable(data.account_type as UIAccountType)");
  });
});
