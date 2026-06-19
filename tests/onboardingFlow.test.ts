import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildLoginRedirectPath } from "../src/auth/routePolicy";
import {
  FINANCIAL_LINK_ROUTE,
  FINANCIAL_LINK_REVIEW_ROUTE,
  REVIEW_ROUTE,
  getFinancialLinkContinuationRoute,
  isFinancialLinkReviewMode,
  isReturnToReview,
  normalizeLegacyOnboardingRedirectTarget,
  resolveFinancialLinkStatus,
  withReviewEdit,
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
    // raw step 4 remains in the location/residence part of the restored 9-step flow
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

describe("edit-from-review (Review screen Edit-and-return)", () => {
  it("detects the ?from=review flag", () => {
    expect(isReturnToReview("?from=review")).toBe(true);
    expect(isReturnToReview("?foo=bar&from=review")).toBe(true);
    expect(isReturnToReview("")).toBe(false);
    expect(isReturnToReview("?from=elsewhere")).toBe(false);
  });

  it("appends the flag without clobbering existing query params", () => {
    expect(withReviewEdit("/onboarding/step-3")).toBe("/onboarding/step-3?from=review");
    expect(withReviewEdit("/onboarding/step-4?foo=bar")).toBe(
      "/onboarding/step-4?foo=bar&from=review"
    );
    expect(REVIEW_ROUTE).toBe("/onboarding/step-8");
  });

  it("tags every Review Edit button with ?from=review (but not Continue/Back)", () => {
    const reviewUi = readRepoFile("src/pages/onboarding/step-8/ui.tsx");
    // All Edit targets carry the flag.
    expect(reviewUi).toContain("goTo('/onboarding/step-3?from=review')");
    expect(reviewUi).toContain("goTo('/onboarding/step-4?from=review')");
    expect(reviewUi).toContain("goTo('/onboarding/step-5?from=review')");
    expect(reviewUi).toContain("goTo('/onboarding/step-6?from=review')");
    expect(reviewUi).toContain("goTo('/onboarding/step-7?from=review')");
    // The Review's own forward (payment) and back (investment) nav stay plain.
    expect(reviewUi).toContain("goTo('/onboarding/step-9')");
    expect(reviewUi).toContain("goTo('/onboarding/step-7')");
  });

  it("returns edited steps to Review and preserves current_step in edit mode", () => {
    const step2 = readRepoFile("src/pages/onboarding/step-2/logic.ts");
    const step3 = readRepoFile("src/pages/onboarding/step-3/logic.ts");
    const step4 = readRepoFile("src/pages/onboarding/step-4/logic.ts");
    const step5 = readRepoFile("src/pages/onboarding/step-5/logic.ts");
    const step6 = readRepoFile("src/pages/onboarding/step-6/logic.ts");
    const step7 = readRepoFile("src/pages/onboarding/step-7/logic.ts");

    // Each editable step reads the flag and routes back to Review.
    for (const src of [step2, step3, step4, step5, step6, step7]) {
      expect(src).toContain("isReturnToReview(location.search)");
      expect(src).toContain("REVIEW_ROUTE");
    }

    // step-2 omits current_step when editing (so the skip-guard can't bounce
    // the return to Review); step-3 drops it from the built payload.
    expect(step2).toContain("returnToReview ? {} : { current_step: 3 }");
    expect(step3).toContain("delete (payload as { current_step?: number }).current_step");
  });
});
