import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

/**
 * SEC-01: the shared Plaid edge-auth helper must be secure-by-default.
 * authenticateEdgeRequest gates every Plaid edge function; if the default mode
 * is 'observe' (log-only) and the SECURITY_PLAID_EDGE_AUTH_MODE env var is unset,
 * IDOR / missing-token checks become no-ops. This contract pins the default to
 * 'enforce'. (Edge functions are Deno runtime; this source-contract test is the
 * unit-test surface vitest can assert.)
 */
describe("edge auth security contract (SEC-01)", () => {
  it("authenticateEdgeRequest defaults to 'enforce', not 'observe'", () => {
    const security = read("supabase/functions/_shared/security.ts");

    // The authenticateEdgeRequest mode resolution must default to enforce.
    expect(security).toContain('getSecurityMode(modeEnv, "enforce")');
    // The insecure log-only default must be gone from the auth path.
    expect(security).not.toContain('getSecurityMode(modeEnv, "observe")');
    // Enforcement branches (401 missing token, 403 user mismatch) still exist.
    expect(security).toContain('return unauthorizedResponse("Missing authorization header")');
    expect(security).toContain('return unauthorizedResponse("Authenticated user mismatch", 403)');
  });
});
