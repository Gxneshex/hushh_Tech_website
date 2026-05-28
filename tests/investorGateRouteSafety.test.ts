import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Safety net contract: every route under a paid-only path prefix MUST be
 * wrapped in InvestorAccessRoute (or, for routes we explicitly want to be
 * public, allow-listed below). New `/hushh-user-profile/*` or
 * `/onboarding/meet-ceo/*` routes added without the wrapper would silently
 * bypass the Stripe payment gate.
 */

const APP_TSX = path.join(process.cwd(), "src/App.tsx");

const PAID_PATH_PREFIXES = ["/hushh-user-profile", "/onboarding/meet-ceo"];

/**
 * Routes that intentionally live under a paid-path prefix but are public
 * by design (e.g., the access-denied page is reachable post-rejection but
 * does not expose investor materials, so it sits behind ProtectedRoute
 * only). Keep this list deliberately small and review additions.
 */
const PUBLIC_PATH_ALLOWLIST: string[] = [
  // (no exceptions today — keep this empty until product requires one)
];

interface RouteDeclaration {
  path: string;
  wrapper: string;
  block: string;
}

function extractRoutes(source: string): RouteDeclaration[] {
  const routeRegex =
    /<Route\s+path=["']([^"']+)["']\s+element=\{([\s\S]*?)\}\s*\/>/g;
  const out: RouteDeclaration[] = [];
  let match: RegExpExecArray | null;
  while ((match = routeRegex.exec(source))) {
    const [, routePath, element] = match;
    // Walk through the JSX element block to find the outermost wrapper
    // component name. Tolerates whitespace and newlines.
    const wrapperMatch = element.match(/<\s*([A-Z][A-Za-z0-9_]+)/);
    out.push({
      path: routePath,
      wrapper: wrapperMatch?.[1] ?? "(none)",
      block: element,
    });
  }
  return out;
}

describe("Investor gate route-safety contract", () => {
  const source = readFileSync(APP_TSX, "utf8");
  const routes = extractRoutes(source);

  it("collected at least the known paid-only routes", () => {
    const meetCeo = routes.find((r) => r.path === "/onboarding/meet-ceo");
    const profile = routes.find((r) => r.path === "/hushh-user-profile");
    expect(meetCeo, "meet-ceo route missing").toBeDefined();
    expect(profile, "profile route missing").toBeDefined();
  });

  it.each(PAID_PATH_PREFIXES)(
    "every route under '%s' is wrapped in InvestorAccessRoute",
    (prefix) => {
      const offenders = routes
        .filter((r) => r.path === prefix || r.path.startsWith(`${prefix}/`))
        .filter((r) => !PUBLIC_PATH_ALLOWLIST.includes(r.path))
        .filter((r) => r.wrapper !== "InvestorAccessRoute");

      expect(
        offenders,
        `routes under ${prefix} bypassing the gate: ${offenders
          .map((r) => `${r.path} (wrapped in ${r.wrapper})`)
          .join(", ")}`,
      ).toEqual([]);
    },
  );

  it("documents the public allowlist so additions are deliberate", () => {
    // If anyone adds an exception to PUBLIC_PATH_ALLOWLIST, this test still
    // passes — but the diff makes the addition visible in code review.
    expect(Array.isArray(PUBLIC_PATH_ALLOWLIST)).toBe(true);
  });
});
