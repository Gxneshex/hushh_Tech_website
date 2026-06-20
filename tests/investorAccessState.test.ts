import { describe, expect, it } from "vitest";

import {
  decideInvestorAccessRoute,
  getInvestorAccessState,
  getResumeRouteForState,
  isInvestorAccessGranted,
  type InvestorAccessInputs,
  type InvestorAccessState,
  ACCESS_DENIED_ROUTE,
  MEET_CEO_ROUTE,
  PROFILE_ROUTE,
  STEP_9_ROUTE,
} from "../src/services/investorAccess/state";
import { FINANCIAL_LINK_ROUTE } from "../src/services/onboarding/flow";

const onboarding = (
  fields: Partial<InvestorAccessInputs>,
): InvestorAccessInputs => ({
  is_completed: false,
  fund_payment_status: null,
  fund_investor_verification_status: null,
  ...fields,
});

describe("getInvestorAccessState", () => {
  it("returns needs_onboarding when no row exists", () => {
    expect(getInvestorAccessState(null)).toBe("needs_onboarding");
    expect(getInvestorAccessState(undefined)).toBe("needs_onboarding");
  });

  it.each<[string, InvestorAccessInputs, InvestorAccessState]>([
    [
      "verified_investor flag wins over payment status",
      onboarding({
        is_completed: true,
        fund_payment_status: "refunded",
        fund_investor_verification_status: "verified_investor",
      }),
      "verified_investor",
    ],
    [
      "rejected wins over paid status",
      onboarding({
        is_completed: true,
        fund_payment_status: "paid",
        fund_investor_verification_status: "rejected",
      }),
      "rejected_investor",
    ],
    [
      "refunded payment evicts access",
      onboarding({ is_completed: true, fund_payment_status: "refunded" }),
      "payment_reversed",
    ],
    [
      "disputed payment evicts access",
      onboarding({ is_completed: true, fund_payment_status: "disputed" }),
      "payment_reversed",
    ],
    [
      "paid grants payment_in_review",
      onboarding({ is_completed: true, fund_payment_status: "paid" }),
      "payment_in_review",
    ],
    [
      "pending_manual_verification grants payment_in_review",
      onboarding({
        is_completed: true,
        fund_payment_status: "pending_manual_verification",
      }),
      "payment_in_review",
    ],
    [
      "KYC complete but no payment → needs_payment",
      onboarding({ is_completed: true, fund_payment_status: "not_started" }),
      "needs_payment",
    ],
    [
      "KYC complete but only link_sent → needs_payment",
      onboarding({
        is_completed: true,
        fund_payment_status: "payment_link_sent",
      }),
      "needs_payment",
    ],
    [
      "KYC incomplete → needs_onboarding regardless of payment",
      onboarding({ is_completed: false, fund_payment_status: "not_started" }),
      "needs_onboarding",
    ],
    [
      "case-insensitive payment status",
      onboarding({ is_completed: true, fund_payment_status: "  PAID  " }),
      "payment_in_review",
    ],
  ])("%s", (_label, inputs, expected) => {
    expect(getInvestorAccessState(inputs)).toBe(expected);
  });
});

describe("isInvestorAccessGranted", () => {
  it("grants only the two paid+ states", () => {
    expect(isInvestorAccessGranted("payment_in_review")).toBe(true);
    expect(isInvestorAccessGranted("verified_investor")).toBe(true);
    expect(isInvestorAccessGranted("needs_onboarding")).toBe(false);
    expect(isInvestorAccessGranted("needs_payment")).toBe(false);
    expect(isInvestorAccessGranted("payment_reversed")).toBe(false);
    expect(isInvestorAccessGranted("rejected_investor")).toBe(false);
  });
});

describe("decideInvestorAccessRoute", () => {
  it("allows paid + verified states", () => {
    expect(decideInvestorAccessRoute("payment_in_review")).toEqual({ allow: true });
    expect(decideInvestorAccessRoute("verified_investor")).toEqual({ allow: true });
  });

  it("redirects needs_onboarding to financial-link with reason", () => {
    expect(decideInvestorAccessRoute("needs_onboarding")).toEqual({
      allow: false,
      redirectTo: FINANCIAL_LINK_ROUTE,
      reason: "needs_onboarding",
    });
  });

  it("redirects needs_payment to the payment step", () => {
    expect(decideInvestorAccessRoute("needs_payment")).toEqual({
      allow: false,
      redirectTo: STEP_9_ROUTE,
      reason: "needs_payment",
    });
  });

  it("redirects payment_reversed to the payment step with banner reason", () => {
    expect(decideInvestorAccessRoute("payment_reversed")).toEqual({
      allow: false,
      redirectTo: STEP_9_ROUTE,
      reason: "payment_reversed",
    });
  });

  it("routes rejected_investor to access-denied", () => {
    expect(decideInvestorAccessRoute("rejected_investor")).toEqual({
      allow: false,
      redirectTo: ACCESS_DENIED_ROUTE,
      reason: "rejected_investor",
    });
  });
});

describe("getResumeRouteForState", () => {
  it("routes verified investors to the profile dashboard", () => {
    expect(getResumeRouteForState("verified_investor", 13)).toBe(PROFILE_ROUTE);
  });

  it("routes paid users still in review to Meet CEO", () => {
    expect(getResumeRouteForState("payment_in_review", 13)).toBe(MEET_CEO_ROUTE);
  });

  it("routes rejected applications to access-denied", () => {
    expect(getResumeRouteForState("rejected_investor", 13)).toBe(ACCESS_DENIED_ROUTE);
  });

  it("routes reversed and unpaid states to the payment step", () => {
    expect(getResumeRouteForState("payment_reversed", 13)).toBe(STEP_9_ROUTE);
    expect(getResumeRouteForState("needs_payment", 13)).toBe(STEP_9_ROUTE);
  });

  it("routes incomplete onboarding mid-flow to financial-link", () => {
    expect(getResumeRouteForState("needs_onboarding", 5)).toBe(FINANCIAL_LINK_ROUTE);
  });

  it("routes incomplete onboarding near payment directly to the payment step", () => {
    expect(getResumeRouteForState("needs_onboarding", 13)).toBe(STEP_9_ROUTE);
  });
});
