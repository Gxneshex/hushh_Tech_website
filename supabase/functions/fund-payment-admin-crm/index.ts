// fund-payment-admin-crm — persistent investor CRM notes + tags for the
// /fund-admin cockpit. Team-gated (Supabase JWT + email allowlist). This fn
// handles WRITES; the read is folded into fund-payment-admin-detail.
import { createAdminClient, getCorsHeaders, json } from "../_shared/fundStripe.ts";
import { authenticateTeamMember } from "../_shared/security.ts";
import { logAdminAccess } from "../_shared/fundAdminAudit.ts";

async function loadCrm(supabase: any, userId: string) {
  const [notesRes, tagsRes] = await Promise.all([
    supabase
      .from("fund_investor_notes")
      .select("id, body, author_email, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("fund_investor_tags")
      .select("tag")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
  ]);
  return {
    notes: (notesRes.data || []).map((n: any) => ({
      id: n.id,
      body: n.body,
      authorEmail: n.author_email ?? null,
      createdAt: n.created_at,
    })),
    tags: (tagsRes.data || []).map((t: any) => t.tag),
  };
}

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
    const actor = teamAuth.user;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const userId = body.userId || body.user_id;
    if (!userId) return json({ error: "userId is required" }, 400, corsHeaders);

    const supabase = createAdminClient();

    if (action === "add_note") {
      const text = String(body.body || "").trim();
      if (!text) return json({ error: "Note body is required" }, 400, corsHeaders);
      if (text.length > 5000) return json({ error: "Note is too long (max 5000 chars)" }, 400, corsHeaders);
      const { error } = await supabase.from("fund_investor_notes").insert({
        user_id: userId,
        author_user_id: actor.id,
        author_email: actor.email,
        body: text,
      });
      if (error) throw error;
      await logAdminAccess({
        supabase,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "note_add",
        targetUserId: userId,
        req,
      });
    } else if (action === "add_tag") {
      const tag = String(body.tag || "").trim().toLowerCase();
      if (!tag) return json({ error: "Tag is required" }, 400, corsHeaders);
      if (tag.length > 40) return json({ error: "Tag is too long (max 40 chars)" }, 400, corsHeaders);
      // Idempotent: unique (user_id, tag); ignore duplicates.
      const { error } = await supabase
        .from("fund_investor_tags")
        .upsert(
          { user_id: userId, tag, created_by_user_id: actor.id, created_by_email: actor.email },
          { onConflict: "user_id,tag", ignoreDuplicates: true },
        );
      if (error) throw error;
      await logAdminAccess({
        supabase,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "tag_set",
        targetUserId: userId,
        metadata: { tag, op: "add" },
        req,
      });
    } else if (action === "remove_tag") {
      const tag = String(body.tag || "").trim().toLowerCase();
      if (!tag) return json({ error: "Tag is required" }, 400, corsHeaders);
      const { error } = await supabase
        .from("fund_investor_tags")
        .delete()
        .eq("user_id", userId)
        .eq("tag", tag);
      if (error) throw error;
      await logAdminAccess({
        supabase,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "tag_set",
        targetUserId: userId,
        metadata: { tag, op: "remove" },
        req,
      });
    } else {
      return json({ error: "action must be add_note, add_tag, or remove_tag" }, 400, corsHeaders);
    }

    const crm = await loadCrm(supabase, userId);
    return json({ success: true, ...crm }, 200, corsHeaders);
  } catch (error) {
    console.error("[fund-payment-admin-crm] Error:", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
