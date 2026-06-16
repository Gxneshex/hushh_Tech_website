#!/usr/bin/env node
/**
 * Consent legal sign-off gate (GAP-07).
 *
 * Investor-facing consent / disclosure copy for a regulated fund must be legally
 * reviewed before it ships. `src/services/consent/consentConfig.ts` carries a
 * developer-facing placeholder marker until legal signs off. This check fails
 * while that marker is still present.
 *
 * It is wired (via .github/workflows/consent-signoff.yml) to run ONLY on pull
 * requests that actually modify the consent config — so it does NOT block
 * unrelated PRs, the security fixes, prod deploys, or the Plaid flow. It simply
 * forces whoever changes consent wording to also record legal sign-off by
 * removing the marker.
 *
 * To clear the gate: get legal/compliance sign-off on the copy, then delete the
 * "placeholder pending legal sign-off … Do not ship to PROD without review" note
 * from the consentConfig.ts header (and bump CONSENT_VERSION if wording changed).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CONSENT_CONFIG = "src/services/consent/consentConfig.ts";

// Stable phrases from the placeholder marker. Either one present => not signed off.
const MARKERS = [
  "pending legal sign-off",
  "Do not ship to PROD without review",
];

function main() {
  let source;
  try {
    source = readFileSync(join(process.cwd(), CONSENT_CONFIG), "utf8");
  } catch (err) {
    console.error(`[consent-signoff] Could not read ${CONSENT_CONFIG}: ${err.message}`);
    process.exit(1);
  }

  const hits = MARKERS.filter((marker) => source.includes(marker));
  if (hits.length > 0) {
    console.error(
      "[consent-signoff] ❌ Consent copy is not legally signed off.\n" +
        `  ${CONSENT_CONFIG} still contains the placeholder marker: "${hits[0]}".\n` +
        "  Investor consent/disclosure copy for the fund must be reviewed by legal/compliance\n" +
        "  before it ships. Once signed off, remove the placeholder note from the file header\n" +
        "  (and bump CONSENT_VERSION if the wording changed) to clear this gate.",
    );
    process.exit(1);
  }

  console.log("[consent-signoff] ✅ No placeholder marker — consent copy is signed off.");
}

main();
