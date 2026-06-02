// fund-payment-admin-resend — re-send an investor their existing, still-active
// Hushh Fund payment link from the /fund-admin cockpit. Team-gated. Self-
// contained (re-sends the active link; it does not mint a new request).
import {
  createAdminClient,
  formatDateTime,
  formatUsdCents,
  getCorsHeaders,
  getDisplayName,
  json,
  logAndSendFundEmail,
  normalizeRecurringSummary,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { buildFundPaymentRequestUserHtml } from "../fund-payment-request/template.ts";

const toCents = (a: unknown) => Math.round(Number(a || 0) * 100);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders();
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const teamAuth = await authenticateTeamMember(req);
    if (teamAuth.error || !teamAuth.user) {
      return json({ error: teamAuth.error || "Unauthorized" }, teamAuth.status || 401, corsHeaders);
    }

    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id;
    if (!userId) return json({ error: "userId is required" }, 400, corsHeaders);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: requests } = await supabase
      .from("fund_stripe_payment_requests")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["payment_link_sent", "checkout_created"])
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);
    const pr = (requests || [])[0];
    if (!pr) {
      return json(
        { error: "No active payment link to resend. The investor needs to (re)start the payment step." },
        404,
        corsHeaders,
      );
    }

    const { data: onboarding } = await supabase
      .from("onboarding_data")
      .select("legal_first_name, legal_last_name, recurring_amount, recurring_frequency, recurring_day_of_month, financial_link_status")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || null;
    if (!email) {
      return json({ error: "This investor has no email address on file." }, 400, corsHeaders);
    }

    const commitmentCents = toCents(pr.commitment_amount);
    const firstPaymentCents = toCents(pr.first_payment_amount);
    const emailData = {
      recipientName: getDisplayName(authUser?.user, onboarding),
      userEmail: email,
      userId,
      paymentUrl: pr.payment_url,
      requestReference: pr.request_reference,
      selectedFund: pr.selected_fund,
      classAUnits: Number(pr.class_a_units || 0),
      classBUnits: Number(pr.class_b_units || 0),
      classCUnits: Number(pr.class_c_units || 0),
      commitmentLabel: formatUsdCents(commitmentCents),
      firstPaymentLabel: formatUsdCents(firstPaymentCents),
      remainingCommitmentLabel: formatUsdCents(Math.max(0, commitmentCents - firstPaymentCents)),
      recurringSummary: normalizeRecurringSummary(onboarding || pr),
      plaidStatus: onboarding?.financial_link_status || "not available",
      kycStatus: "in review",
      expiresAtLabel: pr.expires_at ? formatDateTime(pr.expires_at) : null,
      paymentStatus: pr.status,
      reviewStatus: "not_started",
    };

    const result = await logAndSendFundEmail({
      supabase,
      userId,
      paymentRequestId: pr.id,
      notificationType: "payment_link_resend_admin",
      recipients: [email],
      subject: `Your Hushh Fund payment link ${pr.request_reference}`,
      html: buildFundPaymentRequestUserHtml(emailData),
    });
    const emailSent = Boolean(result && (result as any).success);

    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "resend_link",
      targetUserId: userId,
      targetReference: pr.id,
      metadata: { request_reference: pr.request_reference, email_sent: emailSent },
      req,
    });

    return json({
      success: true,
      reused: true,
      payment_request_id: pr.id,
      payment_url: pr.payment_url,
      request_reference: pr.request_reference,
      email_sent: emailSent,
      email_failure_reason: emailSent ? null : (result as any)?.error || "Email delivery failed",
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-resend] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
