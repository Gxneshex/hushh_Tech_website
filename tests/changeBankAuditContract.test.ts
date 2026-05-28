import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Plaid skip + change-bank audit hardening", () => {
  it("P0.A — step-9 surfaces manage-bank CTA for both skipped and connected users", () => {
    const ui = read("src/pages/onboarding/step-9/ui.tsx");
    expect(ui).toContain("canManageBank");
    expect(ui).toContain("Change your linked bank");
    expect(ui).toContain("Connect a bank to speed up review");
    // Old skipped-only flag should not be in the way.
    expect(ui).not.toContain("canReconnectPlaid");
  });

  it("P0.B — every onboarding step renders OnboardingBankReviewChip below the back header", () => {
    const steps = [1, 2, 3, 4, 5, 6, 7, 8];
    for (const n of steps) {
      const ui = read(`src/pages/onboarding/step-${n}/ui.tsx`);
      expect(ui, `step-${n}/ui.tsx missing chip import`).toContain(
        "import OnboardingBankReviewChip",
      );
      expect(ui, `step-${n}/ui.tsx missing chip render`).toMatch(
        /<HushhTechBackHeader[\s\S]*?\/>[\s\S]{0,80}<OnboardingBankReviewChip/,
      );
    }
  });

  it("P0.C — change-bank modal surfaces support email when transfer lock fires", () => {
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");
    expect(ui).toContain("locked after transfer setup starts");
    expect(ui).toContain("mailto:support@hushh.ai");
  });

  it("P0.D — change-bank modal warns that old bank data cannot be restored", () => {
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");
    expect(ui).toContain("permanently disconnects the current Plaid bank");
    expect(ui).toContain("cannot be restored");
  });

  it("P0.E — financial-link surfaces partial Plaid sync banner when canProceed is false", () => {
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");
    expect(ui).toMatch(
      /isDone\s*&&\s*!canProceed[\s\S]*?Your bank connected but some verification data didn't sync/,
    );
  });

  it("P0.F — change-bank broadcasts to other tabs via BroadcastChannel", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    expect(logic).toContain("new BroadcastChannel('hushh:plaid-state')");
    expect(logic).toContain("Cross-tab unlink received");
    expect(logic).toContain("postMessage({ type: 'unlinked'");
  });

  it("P0.G — nav drawer offers a Review bank connection shortcut for non-investors", () => {
    const drawer = read(
      "src/components/hushh-tech-nav-drawer/HushhTechNavDrawer.tsx",
    );
    expect(drawer).toContain("Review bank connection");
    expect(drawer).toContain("/onboarding/financial-link?mode=review");
    expect(drawer).toContain("!primaryCTA.isInvestor");
  });
});
