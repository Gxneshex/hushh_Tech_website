// fund-payment-admin-kyc-review — record a manual KYC review outcome for an
// investor from the /fund-admin cockpit. Team-gated (Supabase JWT + email
// allowlist). Writes a real, dated attestation to kyc_attestations so the
// approval gate (fund-payment-admin-verify) is satisfied by an actual review.
//
// This is the vendor-independent path. Automated sanctions/PEP/AML screening
// plugs into _shared/kycScreening.ts#runProviderScreening once a provider is
// chosen (it currently throws a clear "not configured" error by design).
import { createAdminClient, json } from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { getAdminCorsHeaders } from "../_shared/fundAdminCors.ts";
import { buildManualReviewAttestation, type KycDecision } from "../_shared/kycScreening.ts";

const VALID_BANDS = ["LOW", "MEDIUM", "HIGH"];

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
    const decision = String(body.decision || "").trim().toLowerCase() as KycDecision;
    const riskBand = body.riskBand ? String(body.riskBand).toUpperCase() : null;

    if (!userId) {
      return json({ error: "userId is required" }, 400, corsHeaders);
    }
    if (decision !== "cleared" && decision !== "flagged") {
      return json({ error: "decision must be 'cleared' or 'flagged'" }, 400, corsHeaders);
    }
    if (riskBand && !VALID_BANDS.includes(riskBand)) {
      return json({ error: "riskBand must be LOW, MEDIUM or HIGH" }, 400, corsHeaders);
    }

    const supabase = createAdminClient();

    const attestation = buildManualReviewAttestation({
      userId,
      decision,
      riskBand,
      sanctionsChecked: body.sanctionsChecked !== false,
      pepChecked: body.pepChecked !== false,
      note: body.note ? String(body.note).slice(0, 2000) : null,
      reviewerEmail: teamAuth.user.email ?? null,
    });

    const { data: inserted, error: insertError } = await supabase
      .from("kyc_attestations")
      .insert(attestation)
      .select("status, risk_band, risk_score, provider_name, verified_at, expires_at, sanctions_checked, pep_checked, aml_score, verification_level")
      .single();

    if (insertError) {
      console.error("[fund-payment-admin-kyc-review] insert failed:", insertError);
      return json({ error: insertError.message || "Failed to record KYC review" }, 500, corsHeaders);
    }

    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "kyc_review",
      targetUserId: userId,
      metadata: { decision, riskBand: attestation.risk_band },
      req,
    });

    return json({
      success: true,
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
    console.error("[fund-payment-admin-kyc-review] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
