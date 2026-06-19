import { describe, expect, it } from "vitest";

import { resolveOnboardingStep } from "../src/services/onboarding/onboardingAnalytics";

describe("resolveOnboardingStep", () => {
  it("maps the nine numbered steps to a slug + display index", () => {
    expect(resolveOnboardingStep("/onboarding/step-1")).toEqual({ step: "step-1", stepIndex: 1 });
    expect(resolveOnboardingStep("/onboarding/step-3")).toEqual({ step: "step-3", stepIndex: 3 });
    expect(resolveOnboardingStep("/onboarding/step-4")).toEqual({ step: "step-4", stepIndex: 4 });
    expect(resolveOnboardingStep("/onboarding/step-6")).toEqual({ step: "step-6", stepIndex: 6 });
    expect(resolveOnboardingStep("/onboarding/step-9")).toEqual({ step: "step-9", stepIndex: 9 });
  });

  it("maps named onboarding surfaces without an index", () => {
    expect(resolveOnboardingStep("/onboarding/financial-link")).toEqual({ step: "financial-link" });
    expect(resolveOnboardingStep("/onboarding/meet-ceo")).toEqual({ step: "meet-ceo" });
  });

  it("tolerates a trailing slash", () => {
    expect(resolveOnboardingStep("/onboarding/step-2/")).toEqual({ step: "step-2", stepIndex: 2 });
  });

  it("returns null for non-onboarding paths", () => {
    expect(resolveOnboardingStep("/community")).toBeNull();
    expect(resolveOnboardingStep("/")).toBeNull();
    expect(resolveOnboardingStep("/hushh-user-profile")).toBeNull();
  });
});
