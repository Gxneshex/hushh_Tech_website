# Automated KYC screening providers

The `/fund-admin` cockpit can run automated sanctions / PEP / adverse-media
screening through a provider adapter. **ComplyAdvantage** is implemented
(`complyAdvantage.ts`). The system is **inert until you configure it** and is
**fail-closed** — it only writes a `cleared` attestation when the provider
explicitly returns zero hits; any error or ambiguous response surfaces to the
operator and writes nothing.

## Turn it on

1. Create a **ComplyAdvantage** account and generate an API key.
2. Set the edge-function secrets:
   ```bash
   supabase secrets set KYC_PROVIDER=complyadvantage \
     COMPLYADVANTAGE_API_KEY=<your_key> --project-ref ibsisfnjxeowvdtvgzff
   ```
3. Deploy `fund-payment-admin-kyc-screen`.
4. In an investor's profile, click **Run automated screen**.

With no `KYC_PROVIDER` / key set, that button returns a clear "not configured"
message and the team uses **Record KYC review** (manual diligence) instead.

## ⚠️ Verify against the live API before trusting it

`complyAdvantage.ts` is written against ComplyAdvantage's documented `/searches`
API, but **field names + auth can vary by API version and it has not been run
against a live account.** Before relying on it in production:

- Run it against the **sandbox** with a known-sanctioned test name → it must
  **flag** (status `suspended`); a clean name → **clears** (status `active`).
- Confirm the response mapping in `screenComplyAdvantage` (`content.data`,
  `total_hits` / `total_matches` / `hits`, `match_status`, `risk_level`) matches
  your API version; adjust if your payload differs.
- Confirm auth: the adapter sends `Authorization: Token <key>`; some accounts
  use `?api_key=` instead.

## How a result maps to `kyc_attestations`

`buildProviderAttestation` (in `../kycScreening.ts`) writes:
`provider_type='kyc_provider'`, `status` = `active` (cleared) or `suspended`
(flagged), `risk_band` from the provider, `sanctions_checked`/`pep_checked`
true, plus the raw match metadata in `risk_factors`. The approval gate in
`fund-payment-admin-verify` reads the latest row, so a `flagged` (suspended)
result keeps the gate engaged until a human resolves it.

## Adding another provider (Persona / Sumsub / Onfido)

Add `kycProviders/<name>.ts` exporting `screen<Name>(identity, apiKey)` that
returns a `ScreeningResult`, then add a `case` in `runProviderScreening`
(`../kycScreening.ts`). Keep it **fail-closed**.
