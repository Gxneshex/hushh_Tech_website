import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("onboarding consent contract", () => {
  it("routes risk disclosures and keeps consent copy centralized", () => {
    const app = read("src/App.tsx");
    const config = read("src/services/consent/consentConfig.ts");
    const riskPage = read("src/pages/risk-disclosures/index.tsx");

    expect(app).toContain("import RiskDisclosuresPage from './pages/risk-disclosures'");
    expect(app).toContain("<Route path='/risk-disclosures' element={<RiskDisclosuresPage />} />");
    expect(config).toContain("export const CONSENT_VERSION");
    expect(config).toContain("riskDisclosures: '/risk-disclosures'");
    expect(riskPage).toContain("RiskDisclosures");
  });

  it("gates Plaid linking behind a persisted data-sharing consent", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");

    expect(ui).toContain('<ConsentCheckbox');
    expect(ui).toContain('id="plaid-consent"');
    expect(ui).toContain("CONSENT_COPY.plaidDataSharing");
    expect(logic).toContain("plaid_consent_at");
    expect(logic).toContain("consent_version: CONSENT_VERSION");
    expect(logic).toContain("const consentSaved = await persistPlaidConsent()");
    expect(logic).not.toContain("void persistPlaidConsent()");
  });

  it("gates payment link creation behind persisted risk and subscription acknowledgment", () => {
    const logic = read("src/pages/onboarding/step-9/logic.ts");
    const ui = read("src/pages/onboarding/step-9/ui.tsx");
    const migration = read("supabase/migrations/20260601120000_add_consent_columns.sql");

    expect(ui).toContain('id="commitment-ack"');
    expect(ui).toContain("CONSENT_COPY.fundCommitment");
    expect(ui).toContain("disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits || !commitmentAcknowledged}");
    expect(logic).toContain("risk_acknowledged_at");
    expect(logic).toContain("eligibility_attested_at");
    expect(logic).toContain("subscription_agreement_ack_at");
    expect(logic).toContain("const acknowledgmentSaved = await persistCommitmentAck()");
    expect(logic).not.toContain("void persistCommitmentAck()");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS plaid_consent_at");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS subscription_agreement_ack_at");
  });

  it("shows consent language on KYC and identity verification surfaces", () => {
    const kyc = read("src/components/kyc/screens/KycDetailsConsentScreen.tsx");
    const verify = read("src/pages/onboarding/verify-identity/ui.tsx");
    const step7 = read("src/pages/onboarding/step-7/ui.tsx");

    expect(kyc).toContain("CONSENT_COPY.kycIdentity");
    expect(verify).toContain("CONSENT_COPY.identityVerification");
    expect(step7).toContain("CONSENT_LINKS.riskDisclosures");
  });
});
