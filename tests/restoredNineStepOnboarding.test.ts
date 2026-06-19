import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("restored nine-step onboarding structure", () => {
  it("keeps account/contact details on step-4 instead of the temporary compressed step-3 sections", () => {
    const step3 = read("src/pages/onboarding/step-3/logic.ts");
    const step4Logic = read("src/pages/onboarding/step-4/logic.ts");
    const step4Ui = read("src/pages/onboarding/step-4/ui.tsx");

    expect(step3).not.toContain("AccountTypeSections");
    expect(step3).not.toContain("PartiesSection");
    expect(step4Logic).toContain("getOnboardingDisplayMeta('/onboarding/step-4')");
    expect(step4Logic).toContain("account_type: selectedAccountType");
    expect(step4Logic).toContain("phone_number: phoneNumber");
    expect(step4Ui).toContain("Account Type");
    expect(step4Ui).toContain("Phone Number");
  });
});
