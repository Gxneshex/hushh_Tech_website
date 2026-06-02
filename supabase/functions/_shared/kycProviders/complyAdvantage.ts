// ComplyAdvantage sanctions / PEP / adverse-media screening adapter.
//
// ⚠️ NOT YET VERIFIED AGAINST A LIVE ACCOUNT. This is a careful, fail-closed
// implementation against ComplyAdvantage's documented /searches API, but field
// names + auth can vary by API version. BEFORE trusting it in production:
//   1. Create a ComplyAdvantage account; get an API key.
//   2. Set KYC_PROVIDER=complyadvantage + COMPLYADVANTAGE_API_KEY (edge secrets).
//   3. Run it against the SANDBOX and confirm a known-sanctioned test name flags
//      and a clean name clears — verify the response field mapping below matches
//      your API version, then adjust if needed.
//
// FAIL-CLOSED by design: we only return decision='cleared' when the provider
// explicitly reports ZERO hits. Any HTTP error, missing name, unparseable
// response, or ambiguous count throws — the caller then surfaces the error and
// NO "cleared" attestation is written. A false "flag" costs a human review; a
// false "clear" could let a sanctioned investor through, so we never guess clear.
import type { KycIdentity, ScreeningResult } from "../kycScreening.ts";

const API_BASE = "https://api.complyadvantage.com";
const REQUEST_TIMEOUT_MS = 15_000;
// Screen against sanctions, warnings, fitness-probity, PEP and adverse media.
const SEARCH_TYPES = ["sanction", "warning", "fitness-probity", "pep", "adverse-media"];

function fullNameOf(identity: KycIdentity): string {
  const name = (identity.fullName || [identity.firstName, identity.lastName].filter(Boolean).join(" ")).trim();
  return name;
}

function toNonNegativeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : -1;
}

export async function screenComplyAdvantage(identity: KycIdentity, apiKey: string): Promise<ScreeningResult> {
  const searchTerm = fullNameOf(identity);
  if (!searchTerm) {
    // No name to screen — fail closed rather than "clear" an unscreenable record.
    throw new Error("Cannot run automated screening: investor has no legal name on file.");
  }

  const body: Record<string, unknown> = {
    search_term: searchTerm,
    client_ref: identity.userId,
    fuzziness: 0.6,
    share_url: 1,
    filters: {
      types: SEARCH_TYPES,
      ...(identity.birthYear ? { birth_year: identity.birthYear } : {}),
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/searches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ComplyAdvantage accepts a token header; some versions use ?api_key=.
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ComplyAdvantage error (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  const json = await res.json().catch(() => null);
  const data = json?.content?.data ?? json?.data ?? null;
  if (!data || typeof data !== "object") {
    throw new Error("ComplyAdvantage returned an unparseable response — refusing to auto-clear.");
  }

  // Determine the hit count from whichever field the API version exposes.
  let matchCount = toNonNegativeInt((data as any).total_hits);
  if (matchCount < 0) matchCount = toNonNegativeInt((data as any).total_matches);
  if (matchCount < 0 && Array.isArray((data as any).hits)) matchCount = (data as any).hits.length;
  if (matchCount < 0) {
    throw new Error("ComplyAdvantage response had no recognizable hit count — refusing to auto-clear.");
  }

  const matchStatus = String((data as any).match_status ?? "").toLowerCase();
  const riskLevel = String((data as any).risk_level ?? "").toLowerCase();

  // Cleared ONLY on an explicit zero-hit, no-match result.
  const cleared = matchCount === 0 && (matchStatus === "" || matchStatus === "no_match");

  let riskBand: ScreeningResult["riskBand"];
  if (cleared) riskBand = "LOW";
  else if (riskLevel === "medium") riskBand = "MEDIUM";
  else riskBand = "HIGH"; // matches present + unknown/high risk → HIGH (fail closed)

  return {
    decision: cleared ? "cleared" : "flagged",
    riskBand,
    sanctionsChecked: true,
    pepChecked: true,
    sanctionsClear: cleared,
    pepStatus: cleared ? "clear" : "review",
    amlScore: matchCount,
    matchCount,
    provider: "ComplyAdvantage",
    providerRef: (data as any).id != null ? String((data as any).id) : (data as any).ref ?? null,
    details: {
      match_status: matchStatus || null,
      risk_level: riskLevel || null,
      total_hits: (data as any).total_hits ?? null,
      total_matches: (data as any).total_matches ?? null,
    },
  };
}
