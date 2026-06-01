import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Investor journey entry-point contract", () => {
  it("removes the misleading 'Invest with Hushh' label override on the home page", () => {
    const home = read("src/pages/home/ui.tsx");
    // The override block used to map any non-"View Your Profile" text to
    // the hard-coded marketing label. Make sure the conditional/ternary
    // override is gone — the only mention of the old label should now be
    // in the explanatory comment above the assignment.
    expect(home).not.toMatch(/\?\s*"View Investor Profile"/);
    expect(home).not.toMatch(/:\s*"Invest with Hushh"/);
    expect(home).toContain("primaryCTA.text");
  });

  it("home page consumes the unified journey hook", () => {
    const homeLogic = read("src/pages/home/logic.ts");
    expect(homeLogic).toContain("useInvestorJourneyCta");
    expect(homeLogic).not.toContain("useHushhProfileCta");
  });

  it("does not render a decorative down-arrow cue on the home hero", () => {
    const home = read("src/pages/home/ui.tsx");
    expect(home).not.toContain('Icon.chevronDown("#1D1D1F", 20)');
  });

  it("Hero stops re-implementing the CTA state machine", () => {
    const hero = read("src/components/Hero.tsx");
    expect(hero).toContain("useInvestorJourneyCta");
    expect(hero).not.toContain("getContinueOnboardingCta");
    // The old branch on currentStep > 1 must be gone.
    expect(hero).not.toContain("onboardingStatus.currentStep > 1");
  });

  it("profile pages consume the unified journey hook", () => {
    const profileLogic = read("src/pages/profile/logic.ts");
    const profilePage = read("src/components/profile/profilePage.tsx");
    expect(profileLogic).toContain("useInvestorJourneyCta");
    expect(profilePage).toContain("useInvestorJourneyCta");
    expect(profileLogic).not.toContain("hasClearedFinancialLink");
  });

  it("shared journey CTA is aware of completed investor profile build-up", () => {
    const hook = read("src/hooks/useInvestorJourneyCta.ts");

    expect(hook).toContain('.from("investor_profiles")');
    expect(hook).toContain(".select(\"user_confirmed, investor_profile\")");
    expect(hook).toContain("hasBuiltInvestorProfile");
    expect(hook).toContain("View your profile");
    expect(hook).toContain("hasBuiltInvestorProfile: profileBuilt");
  });

  it("Navbar routes Book Consultation + Unlock Coins via the journey hook", () => {
    const navbar = read("src/components/Navbar.tsx");
    expect(navbar).toContain("useInvestorJourneyCta");
    expect(navbar).toContain("handleMeetCeoClick");
    // The direct bypass into Meet CEO is gone.
    const bypassCount = (navbar.match(/handleLinkClick\("\/onboarding\/meet-ceo"\)/g) || []).length;
    expect(bypassCount).toBe(0);
  });

  it("AuthCallback resumes via the access-state machine, not just is_completed", () => {
    const cb = read("src/pages/AuthCallback.tsx");
    expect(cb).toContain("getResumeRouteForState");
    expect(cb).toContain("getInvestorAccessState");
    expect(cb).toContain("fetchResolvedOnboardingProgress");
  });

  it("deprecated useHushhProfileCta now thin-wraps the new hook", () => {
    const old = read("src/hooks/useHushhProfileCta.ts");
    expect(old).toContain("@deprecated");
    expect(old).toContain("useInvestorJourneyCta");
    // No duplicate branching logic should remain in the old hook.
    expect(old).not.toContain("hasClearedFinancialLink");
    expect(old).not.toContain("hasProfile");
  });

  it("ProtectedRoute blocks URL-paste step skips and exposes a flash for the bumped step", () => {
    const pr = read("src/components/ProtectedRoute.tsx");
    expect(pr).toContain("STEP_SKIP_FLASH_KEY");
    expect(pr).toContain("consumeStepSkipFlash");
    expect(pr).toContain("attemptedStep > currentStepNumber + 1");
  });

  it("Mobile bottom nav intercepts Profile tap for unpaid users", () => {
    const nav = read("src/components/MobileBottomNav.tsx");
    expect(nav).toContain("useInvestorJourneyCta");
    expect(nav).toContain("shouldInterceptProfile");
  });

  it("paid users under manual review can still open the profile dashboard route", () => {
    const route = read("src/services/investorAccess/state.ts");
    expect(route).toMatch(/case "verified_investor":[\s\S]*case "payment_in_review":[\s\S]*return \{ allow: true \}/);
  });
});
