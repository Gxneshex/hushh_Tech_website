/**
 * onboarding-submit-application — primary investor submits for compliance review.
 * Server re-validates the account-type gate (never trust the client) and stamps
 * application_status='submitted' + submitted_at, then notifies the team.
 *
 * The per-type checks mirror src/services/onboarding/accountTypeConfig.ts; keep the
 * two aligned (a Deno import of the client config isn't possible).
 */
import {
  createAdminClient,
  FUND_TEAM_RECIPIENTS,
  getCorsHeaders,
  json,
  logAndSendFundEmail,
  requireAuthenticatedUser,
} from "../_shared/fundStripe.ts";
import { escapeHtml, fetchPrimaryDisplayName } from "../_shared/onboardingInvite.ts";

const nonEmpty = (v: unknown) => String(v ?? "").trim() !== "";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createAdminClient();
    const auth = await requireAuthenticatedUser(req, supabase);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    const { data: row } = await supabase
      .from("onboarding_data")
      .select(
        `account_type, authorised_signatory_confirmed_at, retirement_account_type,
         custodian_name, entity_type, entity_legal_name`,
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) return json({ error: "Onboarding record not found" }, 404, corsHeaders);

    const accountType = String(row.account_type || "individual");
    const reasons: string[] = [];

    if (accountType !== "individual" && !row.authorised_signatory_confirmed_at) {
      reasons.push("signatory_not_confirmed");
    }
    if (accountType === "retirement" && !(nonEmpty(row.retirement_account_type) && nonEmpty(row.custodian_name))) {
      reasons.push("account_type_fields_incomplete");
    }
    if (accountType === "trust" && !(nonEmpty(row.entity_type) && nonEmpty(row.entity_legal_name))) {
      reasons.push("account_type_fields_incomplete");
    }

    // Required parties: joint needs >=1 completed joint_owner; trust needs >=1
    // completed trustee (mirrors accountTypeConfig requiredParties).
    const requiredRole = accountType === "joint" ? "joint_owner" : accountType === "trust" ? "trustee" : null;
    if (requiredRole) {
      const { count } = await supabase
        .from("onboarding_parties")
        .select("id", { count: "exact", head: true })
        .eq("primary_user_id", userId)
        .eq("party_role", requiredRole)
        .eq("status", "completed");
      if (!count || count < 1) reasons.push("required_party_not_completed");
    }

    if (reasons.length > 0) {
      return json({ error: "Application is not ready to submit", reasons }, 409, corsHeaders);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from("onboarding_data")
      .update({ application_status: "submitted", submitted_at: nowIso, updated_at: nowIso })
      .eq("user_id", userId);

    const primaryName = await fetchPrimaryDisplayName(supabase, userId);
    await logAndSendFundEmail({
      supabase,
      userId,
      notificationType: "application_submitted",
      recipients: FUND_TEAM_RECIPIENTS,
      subject: `[Hushh Fund] Application submitted for review — ${primaryName} (${accountType})`,
      html: `<p>${escapeHtml(primaryName)} submitted their ${escapeHtml(
        accountType,
      )} application for compliance review.</p>`,
    });

    return json({ success: true, application_status: "submitted", submitted_at: nowIso }, 200, corsHeaders);
  } catch (error) {
    console.error("[onboarding-submit-application] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
      corsHeaders,
    );
  }
});
