// fund-payment-admin-overview-metrics — funnel KPIs for the /fund-admin cockpit.
// Team-gated (Supabase JWT + email allowlist). Read-only. Whole-population
// aggregate ONLY (no per-investor rows, no auth-email resolution) so it stays
// cheap and can be cached/refreshed independently of the paginated list.
import { createAdminClient, json } from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";
import { getAdminCorsHeaders } from "../_shared/fundAdminCors.ts";
import { computeOverview, loadOverview } from "../_shared/fundAdminOverview.ts";

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

    const supabase = createAdminClient();
    await logAdminAccess({
      supabase,
      actorUserId: teamAuth.user.id,
      actorEmail: teamAuth.user.email,
      action: "view_overview",
      req,
    });

    const loaded = await loadOverview(supabase);
    // Funnel needs no emails — inject a null resolver so we skip auth lookups.
    const { funnel } = computeOverview(loaded, () => null);

    return json({ success: true, funnel, sourceWarnings: loaded.sourceWarnings }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-overview-metrics] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
