import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/**
 * P0 edge-case hardening for the onboarding / financial-link flow.
 * These are source-contract tests (matching the repo's existing
 * financialLinkRenderSafety / onboardingConsentContract style) because the
 * behaviors live inside React hooks/callbacks that the repo does not render in
 * unit tests.
 */
describe("onboarding edge-case hardening (P0)", () => {
  it("GAP-1: Plaid handleExit resets a cancelled 'linking' state back to 'ready'", () => {
    const hook = read("src/services/plaid/usePlaidLink.ts");
    const handleExit = hook.slice(
      hook.indexOf("const handleExit: PlaidLinkOnExit"),
      hook.indexOf("// Log events"),
    );

    // On a no-error exit (user closed the modal), step must return to 'ready'
    // so the primary button is not stuck on "Connecting..." forever.
    expect(handleExit).toContain("} else {");
    expect(handleExit).toContain("s.step === 'linking' ? { ...s, step: 'ready' } : s");
    // The error path is unchanged.
    expect(handleExit).toContain("step: 'error'");
  });

  it("GAP-01: financial-link pre-checks consent only when the persisted version matches CONSENT_VERSION", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");

    expect(logic).toContain("CONSENT_VERSION");
    expect(logic).toContain(".select('plaid_consent_at, consent_version')");
    expect(logic).toContain("consentRow?.consent_version === CONSENT_VERSION");
    // The old version-blind pre-check (any plaid_consent_at => checked) is gone.
    expect(logic).not.toContain(".select('plaid_consent_at')");
  });

  it("GAP-05: financial-link has no Plaid skip bypass", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");

    expect(logic).not.toContain("handleConfirmSkip");
    expect(logic).not.toContain("openSkipConfirm");
    expect(logic).not.toContain("isSkipConfirmOpen");
    expect(logic).not.toContain("financial_link_status: 'skipped'");
    expect(logic).not.toContain("trackFinancialLink('skipped')");

    expect(ui).not.toContain("Skip Plaid verification?");
    expect(ui).not.toContain("Skip and continue");
    expect(ui).not.toContain("openSkipConfirm");
    expect(ui).not.toMatch(/>\s*Skip\s*</);
  });

  it("GAP-03: continue-to-KYC logs (does not silently swallow) a failed completed-status write", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    expect(logic).toContain("const { error: completeError } = await upsertOnboardingData");
    expect(logic).toContain("Failed to persist completed status (continuing, self-heals)");
  });
});
