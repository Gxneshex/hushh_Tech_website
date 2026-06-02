// fund-payment-admin-kyc-screen — run AUTOMATED sanctions/PEP/AML screening for
// an investor via the configured provider (ComplyAdvantage). Team-gated
// (Supabase JWT + email allowlist). Writes the result to kyc_attestations.
//
// Inert until KYC_PROVIDER + provider API key are set: with no provider, the
// screening call throws and we return a clear "not configured" message — the
// cockpit then falls back to the manual-review path. FAIL-CLOSED: a provider
// error never produces a "cleared" attestation.
import { createAdminClient, json } from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { getAdminCorsHeaders } from "../_shared/fundAdminCors.ts";
import { buildProviderAttestation, type KycIdentity, runProviderScreening } from "../_shared/kycScreening.ts";

function parseBirthYear(dob: unknown): number | null {
  if (!dob) return null;
  const str = String(dob);
  const parsed = new Date(str);
  let year = Number.isNaN(parsed.getTime()) ? NaN : parsed.getUTCFullYear();
  if (Number.isNaN(year)) {
    const m = str.match(/\b(19|20)\d{2}\b/);
    year = m ? Number(m[0]) : NaN;
  }
  return year >= 1900 && year <= 2100 ? year : null;
}

Deno.serve(async (req) => {
  const corsHeaders = getAdminCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const teamAuth = await authenticateTeamMember(req);
    if (teamAuth.error || !teamAuth.user) {
      return json({ error: teamAuth.error || "Unauthorized" }, teamAuth.status || 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId || body.user_id || "").trim();
    if (!userId) {
      return json({ error: "userId is required" }, 400, corsHeaders);
    }

    const supabase = createAdminClient();

    const { data: ob } = await supabase
      .from("onboarding_data")
      .select("legal_first_name, legal_last_name, date_of_birth")
      .eq("user_id", userId)
      .maybeSingle();

    const identity: KycIdentity = {
      userId,
      firstName: ob?.legal_first_name ?? null,
      lastName: ob?.legal_last_name ?? null,
      birthYear: parseBirthYear(ob?.date_of_birth),
    };

    // Run the provider. Any failure (incl. "not configured") is surfaced; we
    // never write a cleared attestation on error.
    let result;
    try {
      result = await runProviderScreening(identity);
    } catch (screenErr) {
      const message = screenErr instanceof Error ? screenErr.message : "Automated screening failed";
      return json({ error: message, code: "SCREENING_UNAVAILABLE" }, 400, corsHeaders);
    }

    const attestation = buildProviderAttestation(userId, result, teamAuth.user.email ?? null);
    const { data: inserted, error: insertError } = await supabase
      .from("kyc_attestations")
      .insert(attestation)
      .select("status, risk_band, risk_score, provider_name, verified_at, expires_at, sanctions_checked, pep_checked, aml_score, verification_level")
      .single();

    if (insertError) {
      console.error("[fund-payment-admin-kyc-screen] insert failed:", insertError);
      return json({ error: insertError.message || "Failed to save screening result" }, 500, corsHeaders);
    }

    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "kyc_rescreen",
      targetUserId: userId,
      metadata: { provider: result.provider, decision: result.decision, matchCount: result.matchCount },
      req,
    });

    return json({
      success: true,
      decision: result.decision,
      matchCount: result.matchCount,
      kyc: {
        status: inserted.status,
        riskBand: inserted.risk_band,
        riskScore: inserted.risk_score,
        provider: inserted.provider_name,
        verifiedAt: inserted.verified_at,
        expiresAt: inserted.expires_at,
        sanctionsChecked: inserted.sanctions_checked,
        pepChecked: inserted.pep_checked,
        amlScore: inserted.aml_score,
        verificationLevel: inserted.verification_level,
      },
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-kyc-screen] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
