// Origin-locked CORS for the /fund-admin endpoints.
//
// The admin endpoints are already JWT + email-allowlist gated, so this is
// defense-in-depth: instead of `Access-Control-Allow-Origin: *`, we echo the
// request origin only when it is a known Hushh surface (prod, www, UAT, local
// dev, or anything in SECURITY_ALLOWED_ORIGINS). Unknown origins get the
// primary site origin, so a browser on a rogue site can't read admin responses.
import { getAllowedOrigins, getPrimarySiteUrl } from "./security.ts";

// Dev + UAT surfaces that should keep working without an env change. These are
// origins we control; production lockdown still comes from getAllowedOrigins().
const BUILT_IN_ADMIN_ORIGINS = [
  "https://uat.hushhtech.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

function allowedAdminOrigins(): Set<string> {
  return new Set<string>([...getAllowedOrigins(), ...BUILT_IN_ADMIN_ORIGINS]);
}

export function getAdminCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowOrigin = origin && allowedAdminOrigins().has(origin) ? origin : getPrimarySiteUrl();
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
