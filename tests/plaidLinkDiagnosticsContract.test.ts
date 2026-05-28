import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) =>
  readFileSync(path.join(root, relativePath), "utf8");

describe("Plaid Link diagnostics — capture trail", () => {
  it("ships the migration with the diagnostics table + RLS", () => {
    const migration = read(
      "supabase/migrations/20260530100000_add_plaid_link_diagnostics.sql",
    );
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.plaid_link_diagnostics");
    expect(migration).toContain("event_type text NOT NULL");
    expect(migration).toContain("plaid_metadata jsonb");
    expect(migration).toContain("error_details jsonb");
    expect(migration).toContain("ALTER TABLE public.plaid_link_diagnostics ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("Users read own Plaid diagnostics");
    expect(migration).toContain("Service role full access Plaid diagnostics");
  });

  it("ships the public log endpoint with JWT-bound user attribution", () => {
    const fn = read("supabase/functions/plaid-diagnostics-log/index.ts");
    expect(fn).toContain("plaid_link_diagnostics");
    expect(fn).toContain("deriveUserId");
    expect(fn).toContain("supabase.auth.getUser(token)");
    expect(fn).not.toContain("bodyUserId");
    expect(fn).toContain("session_id");
    // We must never throw the infra error back to the client — diagnostics
    // are lossy-OK by contract.
    expect(fn).toMatch(/return json\(\{[\s\S]*?accepted: false[\s\S]*?\}, 200\)/);
  });

  it("deploys the diagnostics endpoint as public while deriving user id from JWT only", () => {
    const config = read("supabase/config.toml");
    expect(config).toContain("[functions.plaid-diagnostics-log]");
    expect(config).toContain("verify_jwt = false");
  });

  it("frontend service exposes fire-and-forget logger + global error listener", () => {
    const svc = read("src/services/plaid/plaidDiagnostics.ts");
    expect(svc).toContain("export function logPlaidEvent");
    expect(svc).toContain("export function beginPlaidSession");
    expect(svc).toContain("export function endPlaidSession");
    expect(svc).toContain("export function installGlobalPlaidErrorListener");
    // Never block on the network — diagnostics must use queueMicrotask.
    expect(svc).toContain("queueMicrotask");
    // Errors from Plaid CDN must be caught by the global listener.
    expect(svc).toContain("cdn.plaid.com");
    expect(svc).toContain("uncaught_plaid_error");
  });

  it("usePlaidLink hook emits diagnostics at every notable step", () => {
    const hook = read("src/services/plaid/usePlaidLink.ts");
    expect(hook).toContain("logPlaidEvent('plaid_link_success'");
    expect(hook).toContain("logPlaidEvent('exchange_token_succeeded'");
    expect(hook).toContain("logPlaidEvent('plaid_link_done'");
    expect(hook).toContain("logPlaidEvent('plaid_link_exit'");
    expect(hook).toContain("logPlaidEvent('plaid_sdk_event'");
    expect(hook).toContain("logPlaidEvent('exchange_or_sync_failed'");
    expect(hook).toContain("logPlaidEvent('create_link_token_failed'");
    expect(hook).toContain("logPlaidEvent('oauth_resume_session_missing'");
    expect(hook).toContain("logPlaidEvent('oauth_resume_recovered'");
  });

  it("financial-link page logs mount, redirect, and suppressed-redirect events", () => {
    const logic = read("src/pages/onboarding/financial-link/logic.ts");
    expect(logic).toContain("installGlobalPlaidErrorListener()");
    expect(logic).toContain("logPlaidEvent('financial_link_mount'");
    expect(logic).toContain("logPlaidEvent('financial_link_unmount'");
    expect(logic).toContain("logPlaidEvent('financial_link_resume_redirect'");
    expect(logic).toContain("logPlaidEvent('financial_link_completed_redirect'");
    // The recent review-mode bug specifically needs the suppress trail
    // so future regressions show up in the table.
    expect(logic).toContain("logPlaidEvent('financial_link_redirect_suppressed'");
  });
});
