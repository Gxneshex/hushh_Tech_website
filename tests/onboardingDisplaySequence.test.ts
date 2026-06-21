import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_ONBOARDING_ROUTES,
  getCanonicalOnboardingRoute,
  getOnboardingDisplayMeta,
} from "../src/services/onboarding/flow";

const readRepoFile = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

// The routed onboarding step pages. URLs are sequential step-1..6, but the
// component folders keep legacy names: step-7 = investment, step-8 = review,
// step-9 = payment. The unrouted step-4/5/6 dirs were removed as dead code.
const ROUTED_STEP_UI_PATHS = [1, 2, 3, 7, 8, 9].map(
  (n) => `src/pages/onboarding/step-${n}/ui.tsx`,
);

describe("onboarding display sequence", () => {
  it("renders the canonical onboarding routes as steps 1 through 6 without gaps", () => {
    expect(CANONICAL_ONBOARDING_ROUTES).toEqual([
      "/onboarding/step-1",
      "/onboarding/step-2",
      "/onboarding/step-3",
      "/onboarding/step-4",
      "/onboarding/step-5",
      "/onboarding/step-6",
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

  it("lets a post-investment user reach the payment step (review → payment is not skip-blocked)", () => {
    // The investment step (step-4) writes current_step = 12 on Continue. After
    // that the user is at the review step, so payment must be within the
    // ProtectedRoute skip-guard allowance of currentStep + 1.
    const postInvestmentRoute = getCanonicalOnboardingRoute(12);
    const reachedStep = getOnboardingDisplayMeta(postInvestmentRoute).displayStep;
    const paymentStep = getOnboardingDisplayMeta("/onboarding/step-6").displayStep;

    expect(reachedStep).toBe(5);
    expect(paymentStep).toBeLessThanOrEqual(reachedStep + 1);
  });

  it("uses the display step, not the raw saved step, on the investment step (display step 4)", () => {
    // Display step 4 is served by the legacy-named dir step-7 (investment).
    const investmentUi = readRepoFile("src/pages/onboarding/step-7/ui.tsx");

    expect(investmentUi).toContain("Step {DISPLAY_STEP}/");
    expect(investmentUi).not.toContain("Step {CURRENT_STEP}/");
  });

  it("does not show decorative hero app logos on the onboarding steps", () => {
    ROUTED_STEP_UI_PATHS.forEach((path) => {
      const ui = readRepoFile(path);

      expect(ui).not.toMatch(/<AppIcon kind="(?:monoA|person|shield|chart|dollar)" size=\{58\} \/>/);
    });
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
    expect(header).toContain("h-[72px]");
    expect(header).toContain("h-[146px]");
    expect(readRepoFile("src/index.css")).toContain(
      ".onboarding-shell > header:not([data-hushh-back-header])",
    );

    ROUTED_STEP_UI_PATHS.forEach((path) => {
      const ui = readRepoFile(path);

      expect(ui).toContain("<HushhTechBackHeader");
      expect(ui).toContain("rightLabel=\"FAQ\"");
    });

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
