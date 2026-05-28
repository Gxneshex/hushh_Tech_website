import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Investor access gate contract", () => {
  it("wraps the Hushh Fund post-payment routes with InvestorAccessRoute", () => {
    const app = read("src/App.tsx");

    expect(app).toContain("import InvestorAccessRoute from './components/InvestorAccessRoute'");
    expect(app).toContain("import OnboardingAccessDeniedPage from './pages/onboarding/access-denied/ui'");

    // Meet CEO + Hushh Profile sit behind the gate now, not the bare ProtectedRoute.
    expect(app).toMatch(/path="\/onboarding\/meet-ceo"[\s\S]*?InvestorAccessRoute>\s*<MeetCeoPage/);
    expect(app).toMatch(/path="\/hushh-user-profile"[\s\S]*?InvestorAccessRoute>\s*<HushhUserProfilePage/);

    // Access-denied surface is reachable so rejected applications can see the
    // reason and contact support.
    expect(app).toMatch(/path="\/onboarding\/access-denied"[\s\S]*?OnboardingAccessDeniedPage/);
  });

  it("removes the step-9 I'll Do This Later bypass and adds the access state machine", () => {
    const stepLogic = read("src/pages/onboarding/step-9/logic.ts");
    const stepUi = read("src/pages/onboarding/step-9/ui.tsx");

    // Hard guarantees that the skip bypass is gone.
    expect(stepLogic).not.toContain("handleSkip");
    expect(stepUi).not.toContain("I'll Do This Later");
    // The old bypass set is_completed=true while marking payment as
    // not_started. The Start Over flow can still reset payment status, so
    // we look at the two together to detect the buggy combo.
    expect(stepLogic).not.toMatch(
      /is_completed:\s*true[\s\S]{0,200}fund_payment_status:\s*"not_started"/,
    );
    expect(stepLogic).not.toMatch(
      /fund_payment_status:\s*"not_started"[\s\S]{0,200}is_completed:\s*true/,
    );

    // Forward path goes through the new handler that the gate can vet.
    expect(stepLogic).toContain("handleContinueToMeetCeo");
    expect(stepUi).toContain("Continue to Meet the CEO");

    // UX state machine consumed in the UI.
    expect(stepLogic).toContain("uxState");
    expect(stepLogic).toContain("FUND_PAYMENT_PAID_STATUSES");
    expect(stepUi).toContain("flashBanner");

    // Explanatory copy replaces the misleading "I'll Do This Later" button.
    expect(stepUi).toContain("Your progress is saved");
  });

  it("flips onboarding is_completed only after Stripe webhook confirms payment", () => {
    const requestCreate = read("supabase/functions/fund-payment-request-create/index.ts");
    const webhook = read("supabase/functions/fund-stripe-webhook/index.ts");

    // The request-create endpoint no longer marks onboarding as complete.
    const onboardingUpdate = requestCreate.slice(
      requestCreate.indexOf("from(\"onboarding_data\")"),
      requestCreate.indexOf(".eq(\"user_id\", userId);"),
    );
    expect(onboardingUpdate).not.toContain("is_completed: true");

    // Webhook now flips is_completed when the charge is confirmed paid.
    expect(webhook).toContain('fund_payment_status: "paid"');
    expect(webhook).toMatch(/is_completed:\s*true/);
  });

  it("exposes a token-scoped status endpoint for webhook-race polling on the public page", () => {
    const tokenStatus = read(
      "supabase/functions/fund-payment-token-status/index.ts",
    );
    expect(tokenStatus).toContain("access_granted");
    expect(tokenStatus).toContain("findPaymentRequestByToken");

    const fundPaymentPage = read("src/pages/onboarding/fund-payment/ui.tsx");
    expect(fundPaymentPage).toContain("getFundPaymentTokenStatus");
    expect(fundPaymentPage).toContain("Waiting for Stripe webhook confirmation");
  });

  it("uses the access-state util in the financial-link resume routing", () => {
    const flLogic = read("src/pages/onboarding/financial-link/logic.ts");
    expect(flLogic).toContain("getInvestorAccessState");
    expect(flLogic).toContain("getResumeRouteForState");
  });
});
