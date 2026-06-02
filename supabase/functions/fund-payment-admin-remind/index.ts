// fund-payment-admin-remind — send an investor a friendly nudge from the
// /fund-admin cockpit. Team-gated. Logs to fund_payment_notifications.
import {
  createAdminClient,
  getCorsHeaders,
  getDisplayName,
  json,
  logAndSendFundEmail,
} from "../_shared/fundStripe.ts";
import { authenticateTeamMember, getPrimarySiteUrl } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { buildFundReminderHtml } from "./template.ts";

type ReminderBuilder = (
  site: string,
  paymentUrl: string | null,
) => { heading: string; subject: string; bodyText: string; ctaLabel?: string; ctaUrl?: string };

const REMINDERS: Record<string, ReminderBuilder> = {
  complete_payment: (_site, paymentUrl) => ({
    heading: "Complete your Hushh Fund payment",
    subject: "A quick nudge: complete your Hushh Fund payment",
    bodyText:
      "You're almost an investor — your secure payment link is ready. Tap below to complete your first payment and activate your commitment.",
    ctaLabel: paymentUrl ? "Open your payment link" : undefined,
    ctaUrl: paymentUrl || undefined,
  }),
  finish_onboarding: (site) => ({
    heading: "Finish your Hushh onboarding",
    subject: "A quick nudge: finish your Hushh onboarding",
    bodyText:
      "You're a few steps away from joining the fund. Pick up right where you left off to complete your onboarding.",
    ctaLabel: "Continue onboarding",
    ctaUrl: `${site}/onboarding`,
  }),
  link_bank: (site) => ({
    heading: "Link your bank to speed up review",
    subject: "A quick nudge: link your bank with Hushh",
    bodyText:
      "Linking your bank helps us verify and review your investment faster, and it only takes a minute.",
    ctaLabel: "Link your bank",
    ctaUrl: `${site}/onboarding`,
  }),
  sign_nda: (site) => ({
    heading: "Sign your Hushh NDA",
    subject: "A quick nudge: sign your Hushh NDA",
    bodyText:
      "Signing the NDA unlocks the confidential fund materials. It takes less than a minute.",
    ctaLabel: "Review & sign the NDA",
    ctaUrl: `${site}/sign-nda`,
  }),
};

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
    const reminderType = String(body.reminderType || body.reminder_type || "").trim();
    if (!userId) return json({ error: "userId is required" }, 400, corsHeaders);
    if (!REMINDERS[reminderType]) {
      return json({ error: "Unknown reminderType", allowed: Object.keys(REMINDERS) }, 400, corsHeaders);
    }

    const supabase = createAdminClient();
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || null;
    const { data: onboarding } = await supabase
      .from("onboarding_data")
      .select("legal_first_name, legal_last_name")
      .eq("user_id", userId)
      .maybeSingle();

    // For a payment nudge, attach the active payment link if one exists.
    let paymentUrl: string | null = null;
    let paymentRequestId: string | null = null;
    if (reminderType === "complete_payment") {
      const { data: prs } = await supabase
        .from("fund_stripe_payment_requests")
        .select("id, payment_url")
        .eq("user_id", userId)
        .in("status", ["payment_link_sent", "checkout_created"])
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);
      paymentUrl = (prs || [])[0]?.payment_url ?? null;
      paymentRequestId = (prs || [])[0]?.id ?? null;
    }

    if (!email) {
      await logAdminAccess({
        supabase,
        actorUserId: teamAuth.user.id,
        actorEmail: teamAuth.user.email,
        action: "reminder",
        targetUserId: userId,
        metadata: { reminderType, skipped: "no_email_on_account" },
        req,
      });
      return json({ success: false, email_sent: false, reason: "no_email_on_account" }, 200, corsHeaders);
    }

    const tpl = REMINDERS[reminderType](getPrimarySiteUrl(), paymentUrl);
    const html = buildFundReminderHtml({
      recipientName: getDisplayName(authUser?.user, onboarding),
      heading: tpl.heading,
      bodyText: tpl.bodyText,
      ctaLabel: tpl.ctaLabel,
      ctaUrl: tpl.ctaUrl,
    });

    const result = await logAndSendFundEmail({
      supabase,
      userId,
      paymentRequestId,
      notificationType: `reminder_${reminderType}`,
      recipients: [email],
      subject: tpl.subject,
      html,
    });

    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "reminder",
      targetUserId: userId,
      targetReference: paymentRequestId,
      metadata: { reminderType },
      req,
    });

    return json({
      success: true,
      email_sent: Boolean(result && (result as any).success),
      notification_type: `reminder_${reminderType}`,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-remind] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
