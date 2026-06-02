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
    expect(config).toContain(
      "I authorize Hushh to securely retrieve my account, balance, identity, and investment data via Plaid for verification and review."
    );
    expect(config).toContain(
      "I have reviewed the Risk Disclosures, confirm I meet the investor eligibility criteria, and accept the Subscription Agreement. I understand investing carries risk, including possible loss of principal, and returns are not guaranteed."
    );
    expect(config).toContain(
      "I consent to identity verification and the processing of my personal data in line with the Privacy Policy and Terms."
    );
    expect(config).toContain(
      "I consent to identity-document and biometric verification to confirm my identity."
    );
    expect(config).toContain(
      "Illustrative only — not an offer or solicitation. See the Risk Disclosures before committing."
    );
    expect(config).toContain(
      "By continuing you agree to the Terms and Privacy Policy."
    );
    expect(riskPage).toContain("RiskDisclosures");
  });

  it("gates Plaid linking behind a persisted data-sharing consent", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    const ui = read("src/pages/onboarding/financial-link/ui.tsx");

    expect(ui).toContain('<ConsentCheckbox');
    expect(ui).toContain('id="plaid-consent"');
    expect(ui).toContain("CONSENT_COPY.plaidDataSharing");
    expect(ui).toContain("CONSENT_LINKS.privacyPolicy");
    expect(logic).toContain("(!isDone && !plaidConsentChecked)");
    expect(logic).toContain("setPlaidConsentError(true)");
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
    expect(ui).toContain("CONSENT_LINKS.riskDisclosures");
    expect(ui).toContain("CONSENT_LINKS.terms");
    expect(ui).toContain("disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits || !commitmentAcknowledged}");
    expect(logic).toContain("setCommitmentAckError(true)");
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
    const verifyLogic = read("src/pages/onboarding/verify-identity/logic.ts");
    const step7 = read("src/pages/onboarding/step-7/ui.tsx");
    const signup = read("src/pages/signup/ui.tsx");

    expect(kyc).toContain("CONSENT_COPY.kycIdentity");
    expect(kyc).toContain("CONSENT_COPY.kycIdentity.split('Privacy Policy')[0]");
    expect(kyc).toContain("formData.consentChecked");
    expect(kyc).toContain("!formData.consentChecked");
    expect(kyc).not.toContain("securely reusing my existing KYC where possible");
    expect(verify).toContain("CONSENT_COPY.identityVerification");
    // Identity verification now gates Stripe Identity on an explicit consent
    // checkbox and persists that consent for audit (identity_consent_at).
    expect(verify).toContain("<ConsentCheckbox");
    expect(verifyLogic).toContain("identity_consent_at");
    expect(verifyLogic).toContain("setIdentityConsentError(true)");
    expect(step7).toContain("CONSENT_LINKS.riskDisclosures");
    expect(step7).not.toContain("<ConsentCheckbox");
    expect(signup).toContain("CONSENT_COPY.signup");
    expect(signup).toContain("to={CONSENT_LINKS.terms}");
    expect(signup).toContain("to={CONSENT_LINKS.privacyPolicy}");
    expect(signup).not.toContain("<ConsentCheckbox");
    expect(signup).not.toContain('to="/privacy"');
  });
});
