import { describe, expect, it, vi } from "vitest";

import { __testing__, type InvestorJourneyCta } from "../src/hooks/useInvestorJourneyCta";
import type { InvestorAccessState } from "../src/services/investorAccess/state";

const { ctaForState } = __testing__;

type JourneyState = "loading" | "unauthenticated" | InvestorAccessState;

const navigatorOf = () => {
  const navigate = vi.fn();
  return { navigate, mock: navigate };
};

describe("useInvestorJourneyCta CTA matrix", () => {
  const cases: Array<{
    label: string;
    state: JourneyState;
    currentStep: number;
    expectedText: string;
    expectedRoute?: string;
    isInvestor: boolean;
  }> = [
    {
      label: "loading shows neutral copy",
      state: "loading",
      currentStep: 1,
      expectedText: "Loading...",
      isInvestor: false,
    },
    {
      label: "unauthenticated visitors are pulled into the funnel",
      state: "unauthenticated",
      currentStep: 1,
      expectedText: "Start investing",
      expectedRoute: "/onboarding/financial-link",
      isInvestor: false,
    },
    {
      label: "needs_onboarding + step 1 sends user through FL (PD-1 fresh restart)",
      state: "needs_onboarding",
      currentStep: 1,
      expectedText: "Start investing",
      expectedRoute: "/onboarding/financial-link",
      isInvestor: false,
    },
    {
      label: "needs_onboarding + step 5 resumes from that step",
      state: "needs_onboarding",
      currentStep: 5,
      expectedText: "Continue from step 4",
      expectedRoute: "/onboarding/step-4",
      isInvestor: false,
    },
    {
      label: "needs_payment routes to step-9",
      state: "needs_payment",
      currentStep: 13,
      expectedText: "Complete your investment",
      expectedRoute: "/onboarding/step-9",
      isInvestor: false,
    },
    {
      label: "payment_in_review grants Meet CEO access",
      state: "payment_in_review",
      currentStep: 13,
      expectedText: "Continue to Meet the CEO",
      expectedRoute: "/onboarding/meet-ceo",
      isInvestor: true,
    },
    {
      label: "verified_investor lands on portfolio dashboard",
      state: "verified_investor",
      currentStep: 13,
      expectedText: "View your portfolio",
      expectedRoute: "/hushh-user-profile",
      isInvestor: true,
    },
    {
      label: "payment_reversed pushes user back to step-9 to retry",
      state: "payment_reversed",
      currentStep: 13,
      expectedText: "Resume your investment",
      expectedRoute: "/onboarding/step-9",
      isInvestor: false,
    },
    {
      label: "rejected_investor routes to access-denied",
      state: "rejected_investor",
      currentStep: 13,
      expectedText: "Application status",
      expectedRoute: "/onboarding/access-denied",
      isInvestor: false,
    },
  ];

  it.each(cases)("$label", ({ state, currentStep, expectedText, expectedRoute, isInvestor }) => {
    const { navigate, mock } = navigatorOf();
    const cta: InvestorJourneyCta = ctaForState(state, currentStep, navigate);
    expect(cta.text).toBe(expectedText);
    expect(cta.isInvestor).toBe(isInvestor);
    expect(cta.loading).toBe(state === "loading");

    cta.action();
    if (expectedRoute) {
      expect(mock).toHaveBeenCalledWith(expectedRoute);
    } else {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it("never reuses the same misleading 'Invest with Hushh' label across all states", () => {
    const navigate = vi.fn();
    const allStates: JourneyState[] = [
      "loading",
      "unauthenticated",
      "needs_onboarding",
      "needs_payment",
      "payment_in_review",
      "verified_investor",
      "payment_reversed",
      "rejected_investor",
    ];
    for (const state of allStates) {
      expect(ctaForState(state, 1, navigate).text).not.toBe("Invest with Hushh");
    }
  });
});
