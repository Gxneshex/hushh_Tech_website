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
  it("renders the canonical onboarding routes as steps 1 through 9 without gaps", () => {
    const displaySteps = CANONICAL_ONBOARDING_ROUTES.map(
      (route) => getOnboardingDisplayMeta(route).displayStep,
    );

    expect(displaySteps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(displaySteps).size).toBe(9);
    CANONICAL_ONBOARDING_ROUTES.forEach((route) => {
      expect(getOnboardingDisplayMeta(route).totalSteps).toBe(9);
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
});
