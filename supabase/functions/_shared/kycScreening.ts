// KYC screening for the /fund-admin cockpit.
//
// Today Hushh has NO external sanctions/PEP/AML provider — kyc_attestations is
// written by a DB trigger that scores *form completeness*, not real screening
// (sanctions_checked/pep_checked are false). This module gives the cockpit two
// honest, compliance-sound paths:
//
//   1. recordManualReview() — a human did the diligence (e.g. an OFAC / PEP
//      lookup) and records the OUTCOME. This writes a real, dated attestation
//      and satisfies the approval gate. No vendor required.
//   2. runProviderScreening() — automated provider screening. ComplyAdvantage
//      is wired (sanctions/PEP/adverse-media). It stays INERT until
//      KYC_PROVIDER=complyadvantage + COMPLYADVANTAGE_API_KEY are set, and is
//      FAIL-CLOSED — any error or ambiguous response surfaces to the caller
//      instead of auto-clearing an investor.
//
// Both write to the existing public.kyc_attestations table; the approval gate
// in fund-payment-admin-verify reads the latest row (status + risk_band).

import { screenComplyAdvantage } from "./kycProviders/complyAdvantage.ts";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type KycDecision = "cleared" | "flagged";

export interface ManualReviewInput {
  userId: string;
  decision: KycDecision;
  /** LOW | MEDIUM | HIGH — defaults to LOW (cleared) / HIGH (flagged). */
  riskBand?: string | null;
  /** Did the reviewer run a sanctions check? Defaults to true (they reviewed). */
  sanctionsChecked?: boolean;
  /** Did the reviewer run a PEP check? Defaults to true. */
  pepChecked?: boolean;
  note?: string | null;
  reviewerEmail?: string | null;
}

/**
 * Build a kyc_attestations INSERT payload that records a MANUAL admin review.
 * Values respect the table CHECK constraints:
 *   provider_type ∈ {hushh,bank,kyc_provider,government}     -> 'hushh'
 *   verification_level ∈ {basic,standard,enhanced,premium}   -> 'standard'
 *   status ∈ {active,expired,revoked,suspended}              -> active|suspended
 *   risk_band ∈ {LOW,MEDIUM,HIGH}
 */
export function buildManualReviewAttestation(input: ManualReviewInput) {
  const cleared = input.decision === "cleared";
  const band = String(input.riskBand || (cleared ? "LOW" : "HIGH")).toUpperCase();
  const nowIso = new Date().toISOString();
  return {
    user_id: input.userId,
    provider_id: "manual_admin_review",
    provider_name: "Manual review (admin)",
    provider_type: "hushh",
    verified_attributes: ["manual_review"],
    verification_level: "standard",
    risk_band: ["LOW", "MEDIUM", "HIGH"].includes(band) ? band : cleared ? "LOW" : "HIGH",
    risk_score: cleared ? 10 : 60,
    // Cleared diligence -> active attestation that satisfies the gate.
    // Flagged -> suspended, which keeps the approval gate engaged.
    status: cleared ? "active" : "suspended",
    sanctions_checked: input.sanctionsChecked ?? true,
    sanctions_clear: cleared,
    pep_checked: input.pepChecked ?? true,
    pep_status: cleared ? "clear" : "review",
    verified_at: nowIso,
    expires_at: cleared ? new Date(Date.now() + YEAR_MS).toISOString() : null,
    risk_factors: {
      manual_review: true,
      decision: input.decision,
      reviewer_email: input.reviewerEmail ?? null,
      note: input.note ?? null,
    },
  };
}

export interface KycIdentity {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  birthYear?: number | null;
}

export interface ScreeningResult {
  /** 'cleared' ONLY when the provider returns zero hits. Anything else flags. */
  decision: KycDecision;
  riskBand: "LOW" | "MEDIUM" | "HIGH";
  sanctionsChecked: boolean;
  pepChecked: boolean;
  sanctionsClear: boolean;
  pepStatus: string; // 'clear' | 'review'
  amlScore: number | null;
  matchCount: number;
  provider: string; // human label, e.g. 'ComplyAdvantage'
  providerRef: string | null; // provider's search id, for the audit trail
  details: Record<string, unknown>;
}

/**
 * Map a provider ScreeningResult onto a kyc_attestations INSERT payload.
 * provider_type 'kyc_provider'; status is 'active' only when CLEARED, otherwise
 * 'suspended' so the approval gate stays engaged until a human resolves the hit.
 */
export function buildProviderAttestation(
  userId: string,
  result: ScreeningResult,
  reviewerEmail?: string | null,
) {
  const cleared = result.decision === "cleared";
  const nowIso = new Date().toISOString();
  return {
    user_id: userId,
    provider_id: "complyadvantage",
    provider_name: result.provider,
    provider_type: "kyc_provider",
    verified_attributes: ["sanctions", "pep", "adverse_media"],
    verification_level: "enhanced",
    risk_band: result.riskBand,
    risk_score: cleared ? 10 : 70,
    status: cleared ? "active" : "suspended",
    sanctions_checked: result.sanctionsChecked,
    sanctions_clear: result.sanctionsClear,
    pep_checked: result.pepChecked,
    pep_status: result.pepStatus,
    aml_score: result.amlScore,
    verified_at: nowIso,
    expires_at: cleared ? new Date(Date.now() + YEAR_MS).toISOString() : null,
    risk_factors: {
      automated_screening: true,
      provider: result.provider,
      provider_ref: result.providerRef,
      match_count: result.matchCount,
      reviewer_email: reviewerEmail ?? null,
      details: result.details,
    },
  };
}

/**
 * Run automated sanctions/PEP/AML screening via the configured provider.
 * Dispatches on KYC_PROVIDER. FAIL-CLOSED: a provider error throws so the caller
 * surfaces it — the cockpit never writes a "cleared" attestation on an error or
 * an ambiguous response. Add a provider by adding a case + a ./kycProviders/ adapter.
 */
export async function runProviderScreening(identity: KycIdentity): Promise<ScreeningResult> {
  const provider = (Deno.env.get("KYC_PROVIDER") || "internal").toLowerCase();

  if (provider === "complyadvantage") {
    const apiKey = Deno.env.get("COMPLYADVANTAGE_API_KEY");
    if (!apiKey) {
      throw new Error("KYC_PROVIDER=complyadvantage but COMPLYADVANTAGE_API_KEY is not set.");
    }
    return await screenComplyAdvantage(identity, apiKey);
  }

  throw new Error(
    `Automated KYC screening is not configured (KYC_PROVIDER='${provider}'). ` +
      `Set KYC_PROVIDER=complyadvantage + COMPLYADVANTAGE_API_KEY (or add another adapter ` +
      `under _shared/kycProviders/). Until then, use a recorded manual review.`,
  );
}
