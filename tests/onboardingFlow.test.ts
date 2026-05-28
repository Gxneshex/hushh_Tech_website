import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildLoginRedirectPath } from "../src/auth/routePolicy";
import {
  FINANCIAL_LINK_ROUTE,
  FINANCIAL_LINK_REVIEW_ROUTE,
  getFinancialLinkContinuationRoute,
  isFinancialLinkReviewMode,
  normalizeLegacyOnboardingRedirectTarget,
  resolveFinancialLinkStatus,
} from "../src/services/onboarding/flow";

const root = process.cwd();
const readRepoFile = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("onboarding flow helpers", () => {
  it("canonicalizes legacy investor-profile redirects to the financial-link entry", () => {
    expect(normalizeLegacyOnboardingRedirectTarget("/investor-profile")).toBe(
      FINANCIAL_LINK_ROUTE
    );
    expect(buildLoginRedirectPath("/investor-profile")).toBe(
      `/login?redirect=${encodeURIComponent(FINANCIAL_LINK_ROUTE)}`
    );
  });

  it("treats completed financial data as a completed financial-link gate", () => {
    expect(resolveFinancialLinkStatus("pending", "complete")).toBe("completed");
    expect(resolveFinancialLinkStatus(undefined, "partial")).toBe("completed");
  });

  it("resumes financial-link continuations from step 1 when no later step exists", () => {
    expect(getFinancialLinkContinuationRoute(0)).toBe("/onboarding/step-1");
    expect(getFinancialLinkContinuationRoute(1)).toBe("/onboarding/step-1");
    // raw step 4 → combined step-3 after merging country + address steps
    expect(getFinancialLinkContinuationRoute(4)).toBe("/onboarding/step-3");
  });

  it("uses explicit financial-link review mode when Step 1 goes back", () => {
    const step1Logic = readRepoFile("src/pages/onboarding/step-1/logic.ts");

    expect(FINANCIAL_LINK_REVIEW_ROUTE).toBe("/onboarding/financial-link?mode=review");
    expect(isFinancialLinkReviewMode("?mode=review")).toBe(true);
    expect(isFinancialLinkReviewMode("")).toBe(false);
    expect(step1Logic).toContain("navigate(FINANCIAL_LINK_REVIEW_ROUTE)");
  });

  it("keeps completed financial-link users on the page only in review mode or mid-OAuth", () => {
    const financialLinkLogic = readRepoFile("src/pages/onboarding/financial-link/logic.ts");

    expect(financialLinkLogic).toContain("isFinancialLinkReviewMode(location.search)");
    // The legacy redirect now consults a combined "suppress" guard that
    // honors both `?mode=review` and an in-flight Plaid OAuth resume
    // (oauth_state_id). The previous bug where a paid user landed on
    // financial-link mid-OAuth and was unmounted before Plaid Link could
    // finish — surfacing as "Failed to find script" / "Something went
    // wrong" — is prevented by this guard.
    expect(financialLinkLogic).toContain(
      "effectiveStatus !== 'pending' && !suppressResumeRedirect",
    );
    expect(financialLinkLogic).toContain("isPlaidOAuthResume");
    expect(financialLinkLogic).toContain("oauth_state_id");
    expect(financialLinkLogic).toContain("handleBack");
  });
});
