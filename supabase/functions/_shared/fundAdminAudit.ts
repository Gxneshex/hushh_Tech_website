// Best-effort compliance trail for the /fund-admin cockpit. Every team action
// (and profile view) records who did what, when. Writes are NON-BLOCKING and
// NEVER throw — a logging failure must not fail the operation it records.

export type AdminAction =
  | "view_overview"
  | "view_investor"
  | "approve"
  | "reject"
  | "resend_link"
  | "reminder"
  | "note_add"
  | "tag_set"
  | "export"
  | "kyc_review"
  | "kyc_rescreen";

export async function logAdminAccess(params: {
  supabase: any; // service-role client (createAdminClient())
  actorUserId: string;
  actorEmail: string | null;
  action: AdminAction;
  targetUserId?: string | null;
  targetReference?: string | null;
  metadata?: Record<string, unknown> | null;
  req?: Request;
}): Promise<void> {
  try {
    await params.supabase.from("fund_admin_access_log").insert({
      actor_user_id: params.actorUserId,
      actor_email: params.actorEmail ?? null,
      action: params.action,
      target_user_id: params.targetUserId ?? null,
      target_reference: params.targetReference ?? null,
      metadata: params.metadata ?? {},
      ip_address:
        params.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: params.req?.headers.get("user-agent") ?? null,
    });
  } catch (err) {
    console.warn("[fund-admin-audit] access-log write failed (non-blocking):", err);
  }
}
