# Step-3 Plaid Legal Residence Cleanup

Use this after deploying the Step-3 Fund KYC address separation fix.

## Rule

- Plaid owner address is the only source for legal residence.
- GPS/IP current location stays in `gps_*` columns only.
- If Plaid has no complete owner address, legal residence fields are cleared.

## Dry Run

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the confirmed fund
production project (`ibsisfnjxeowvdtvgzff`). Do not print the secret value.

```bash
node scripts/backfill-onboarding-addresses.mjs --limit=200
```

For one user:

```bash
node scripts/backfill-onboarding-addresses.mjs --user-id=<uuid> --limit=1
```

Review:

- `plaid_rebuild` rows rebuild legal residence from complete Plaid identity data.
- `clear_no_plaid_address` rows clear stale legal residence because Plaid did not
  provide a complete address.
- `gps_context` is printed only as evidence; it is never copied into legal fields.

## Apply

```bash
node scripts/backfill-onboarding-addresses.mjs --limit=200 --apply
```

Re-run dry-run after apply. Candidate count should drop or show only rows outside
the processed limit.

## Verification

Check a few updated rows:

```sql
select
  user_id,
  residence_country,
  address_line_1,
  address_line_2,
  city,
  state,
  zip_code,
  address_country,
  gps_city,
  gps_state,
  gps_country,
  field_provenance
from public.onboarding_data
where user_id = '<uuid>';
```

Expected:

- Legal residence matches Plaid exactly, or is null when Plaid has no complete
  address.
- `gps_*` values remain available separately for AML/current-location review.
