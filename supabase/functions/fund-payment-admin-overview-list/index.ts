// fund-payment-admin-overview-list — paginated investor list for the
// /fund-admin cockpit. Team-gated (Supabase JWT + email allowlist). Read-only.
//
// Server owns tab filtering, free-text search, tab counts, and pagination, so
// the client receives one page instead of the whole population. Emails are
// resolved from public.users keyed by the funnel participants (one chunked
// query) plus a bounded getUserById fallback for the returned page — replacing
// the legacy endpoint's up-to-50k auth.admin.listUsers loop on every load.
import { createAdminClient, json } from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { getAdminCorsHeaders } from "../_shared/fundAdminCors.ts";
import {
  computeOverview,
  type FundAdminTab,
  loadOverview,
  matchesSearch,
  matchesTab,
  tabCounts,
} from "../_shared/fundAdminOverview.ts";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const VALID_TABS: FundAdminTab[] = [
  "needs_attention",
  "completed_onboarding",
  "bank_linked",
  "payment_review",
  "manually_approved",
  "all",
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Resolve emails for the funnel participants from public.users (chunked .in). */
async function resolveEmails(supabase: any, userIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  for (const ids of chunk(userIds, 500)) {
    const { data, error } = await supabase.from("users").select("id, email").in("id", ids);
    if (error) {
      console.warn("[overview-list] public.users email lookup failed:", error.message);
      break;
    }
    for (const row of data || []) {
      if (row?.id && row?.email) emails.set(row.id, row.email);
    }
  }
  return emails;
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
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(body.pageSize) || DEFAULT_PAGE_SIZE));
    const tab: FundAdminTab = VALID_TABS.includes(body.tab) ? body.tab : "all";
    const search = String(body.search || "").trim().toLowerCase();

    const supabase = createAdminClient();
    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "view_overview",
      targetReference: `list:${tab}`,
      req,
    });

    const loaded = await loadOverview(supabase);
    const emailByUser = await resolveEmails(supabase, loaded.allUserIds);
    const { investors } = computeOverview(loaded, (uid) => emailByUser.get(uid) ?? null);

    // Search first (so tab counts reflect the active search), then tab, then page.
    const searched = investors.filter((inv) => matchesSearch(inv, search));
    const counts = tabCounts(searched);
    const tabRows = searched.filter((inv) => matchesTab(inv, tab));
    const total = tabRows.length;
    const offset = (page - 1) * pageSize;
    const pageRows = tabRows.slice(offset, offset + pageSize);

    // Bounded fallback: recover email/name for the returned page only when
    // public.users had no row (e.g. email lives only in auth metadata).
    for (const row of pageRows) {
      if (row.userEmail) continue;
      try {
        const { data } = await supabase.auth.admin.getUserById(row.userId);
        const u = data?.user;
        if (u?.email) row.userEmail = u.email;
        if (row.recipientName === "Hushh investor" && u?.user_metadata?.full_name) {
          row.recipientName = String(u.user_metadata.full_name);
        }
      } catch (_err) {
        // best-effort; leave the row as-is
      }
    }

    return json({
      success: true,
      investors: pageRows,
      page,
      pageSize,
      total,
      counts,
      sourceWarnings: loaded.sourceWarnings,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-overview-list] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
