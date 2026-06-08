import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_ONBOARDING_ROUTES,
  getOnboardingDisplayMeta,
} from "../src/services/onboarding/flow";

const readRepoFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("onboarding display sequence", () => {
  it("renders the canonical onboarding routes as steps 1 through 6 without gaps", () => {
    expect(CANONICAL_ONBOARDING_ROUTES).toEqual([
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/step-7",
      "/onboarding/step-8",
      "/onboarding/step-9",
    ]);

    const displaySteps = CANONICAL_ONBOARDING_ROUTES.map(
      (route) => getOnboardingDisplayMeta(route).displayStep,
    );

    expect(displaySteps).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(displaySteps).size).toBe(6);
    CANONICAL_ONBOARDING_ROUTES.forEach((route) => {
      expect(getOnboardingDisplayMeta(route).totalSteps).toBe(6);
    });
  });

  it("uses the display step, not the raw saved step, on step 4", () => {
    const step4Ui = readRepoFile("src/pages/onboarding/step-4/ui.tsx");

    expect(step4Ui).toContain("Step {DISPLAY_STEP}/{TOTAL_STEPS}");
    expect(step4Ui).not.toContain("Step {CURRENT_STEP}/{TOTAL_STEPS}");
  });

  it("does not show decorative hero app logos on the nine onboarding steps", () => {
    for (let step = 1; step <= 9; step += 1) {
      const ui = readRepoFile(`src/pages/onboarding/step-${step}/ui.tsx`);

      expect(ui).not.toMatch(/<AppIcon kind="(?:monoA|person|shield|chart|dollar)" size=\{58\} \/>/);
    }
  });

  it("does not show decorative hero app logos on adjacent onboarding surfaces", () => {
    [
      "src/pages/onboarding/financial-link/ui.tsx",
      "src/pages/onboarding/meet-ceo/ui.tsx",
      "src/pages/onboarding/fund-payment/ui.tsx",
      "src/pages/onboarding/access-denied/ui.tsx",
      "src/pages/signed-out/ui.tsx",
    ].forEach((path) => {
      const ui = readRepoFile(path);

      expect(ui).not.toMatch(/<AppIcon kind=\{?["']?(?:person|shield|dollar)/);
    });
  });

  it("keeps onboarding navigation fixed with both back and home affordances", () => {
    const header = readRepoFile(
      "src/components/hushh-tech-back-header/HushhTechBackHeader.tsx",
    );

    expect(header).toContain("fixed left-0 right-0 top-0 z-50");
    expect(header).toContain('aria-label="Go back"');
    expect(header).toContain('aria-label="Go to Hushh Technologies home"');
    expect(header).toContain('<div className="flex min-w-0 items-center">');
    expect(header).toContain('<div className="h-[72px]" />');
    expect(readRepoFile("src/index.css")).toContain(
      ".onboarding-shell > header:not([data-hushh-back-header])",
    );

    for (let step = 1; step <= 9; step += 1) {
      const ui = readRepoFile(`src/pages/onboarding/step-${step}/ui.tsx`);

      expect(ui).toContain("<HushhTechBackHeader");
      expect(ui).toContain("rightLabel=\"FAQs\"");
    }

    [
      "src/pages/onboarding/financial-link/ui.tsx",
      "src/pages/onboarding/verify-identity/ui.tsx",
      "src/pages/onboarding/verify-complete/ui.tsx",
      "src/pages/onboarding/access-denied/ui.tsx",
      "src/pages/onboarding/fund-payment/ui.tsx",
      "src/pages/onboarding/meet-ceo/ui.tsx",
      "src/pages/onboarding/InvestorGuide.tsx",
    ].forEach((path) => {
      const ui = readRepoFile(path);

      expect(ui).toContain("<HushhTechBackHeader");
    });
  });

  it("keeps onboarding FAQ and verification surfaces on the Apple font stack", () => {
    [
      "src/components/hushh-tech-faq-sheet/HushhTechFaqSheet.tsx",
      "src/pages/onboarding/verify-identity/ui.tsx",
      "src/pages/onboarding/verify-complete/ui.tsx",
      "src/pages/onboarding/InvestorGuide.tsx",
    ].forEach((path) => {
      const ui = readRepoFile(path);

      expect(ui).toContain("appleFont");
      expect(ui).not.toMatch(/Playfair|Manrope|font-serif/);
    });
  });
});
