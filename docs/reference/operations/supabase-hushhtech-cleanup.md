# Supabase HushhTech Cleanup Inventory

Last checked: 2026-05-26 UTC
Project ref: `ibsisfnjxeowvdtvgzff`

This file is the non-destructive cleanup map for keeping the live Supabase
project focused on HushhTech. Do not delete live functions, tables, buckets, or
secrets from the dashboard until the item is listed here and approved for
removal.

## Current Live Shape

- Live Edge Functions: 78 active functions after removing `setup-nda-table`.
- Local HushhTech Edge Function folders: 47 function folders plus `_shared`.
- Public tables: 34.
- Storage buckets: 5.
- `nda-admin-fetch` has been deployed from this repo and now reads
  `nda_signatures`.
- Removed from live cleanup pass: `setup-nda-table`.

## Keep: Referenced By Current HushhTech Runtime

These are referenced from `src/`, `api/`, `cloud-run/`, or the current web
runtime, so keep them unless the owning feature is removed:

- `asset-report-create`
- `ceo-calendar-booking`
- `chat-check-access`
- `chat-create-checkout`
- `chat-verify-payment`
- `coins-credit-notification`
- `coins-deduction-notification`
- `create-link-token`
- `create-verification-session`
- `delete-user-account`
- `exchange-public-token`
- `generate-investor-profile`
- `get-auth-numbers`
- `get-balance`
- `get-identity`
- `get-locations`
- `hushh-ai-chat`
- `hushh-location-geocode`
- `identity-match`
- `investments-holdings`
- `investor-agent-mcp`
- `investor-chat`
- `investor-og-image`
- `kyc-agent-a2a`
- `kyc-agent-a2a-protocol`
- `nda-admin-fetch`
- `nda-signed-notification`
- `nws-score-notification`
- `onboarding-create-checkout`
- `onboarding-verify-payment`
- `sandbox-create-test-item`
- `send-email-notification`
- `signal-decision-report`
- `signal-evaluate`
- `signal-prepare`
- `signal-return-report`
- `stock-quotes`
- `veo-generate-video`

## Keep: External Webhook Or Operational Ownership

These may not have a frontend call site, but are documented as webhook,
notification, or operational integrations. Keep until the external integration
owner confirms otherwise:

- `github-devops-notify`
- `identity-verification-webhook`
- `vault-access-notification`

## Review Before Keeping

These exist locally and are live, but no current runtime call site was found in
`src/`, `api/`, or `cloud-run/`. They should either be connected to an owning
feature or moved to delete candidates:

- `claude-code-gen`
- `gemini-voice-token`
- `hushh-address-inference`
- `hushh-dob-inference`
- `ios-build-tracker`
- `kyc-agent-agentic`

## Delete Candidates: Live Only, Not In This Repo

These are active in the live Supabase project but do not exist in this
HushhTech repo. Treat them as candidates for quarantine or deletion after
checking external ownership, logs, and webhooks:

- `activate-agent`
- `agent-onboard-notify`
- `asset-report-get`
- `bank-income`
- `bot_event`
- `bot_start`
- `get-secrets`
- `hushh-profile-search`
- `investments-transactions`
- `kyc-orchestrator`
- `lead_create`
- `liabilities`
- `mcp-agent-card`
- `portfolio-deploy`
- `portfolio-generate`
- `portfolio-photo-enhance`
- `portfolio-slug-check`
- `public-signup-metrics`
- `send-kyc-email`
- `shadow-investigator`
- `site-analyze`
- `site-edit`
- `site-extract`
- `site-generate`
- `site-orchestrator`
- `site-publish`
- `stripe-identity-session`
- `stripe-identity-webhook`
- `ticket_create`
- `transactions-sync`
- `voice-agent-turn`

## Database: Keep For Now

Do not drop public tables as part of a dashboard cleanup pass. Several tables
have live or historical data, and table deletion is harder to recover than
function deletion. Keep at minimum:

- Auth/profile/core: `users`, `consumer_profiles`, `user_product_usage`
- NDA/legal: `nda_signatures`, `onboarding_data`
- Investor/community: `investor_profiles`, `community_registrations`
- Plaid/financial: `plaid_items`, `plaid_accounts`, `plaid_transactions`,
  `plaid_sync_cursors`, `user_financial_data`
- Identity/delete: `identity_verifications`, `delete_requests`,
  `deleted_account_payment_audits`
- Agent/chat: `agent_profiles`, `kirkland_agents`, `conversations`, `messages`,
  `notifications`, `user_agent_selections`, `blocked_agents`

## Storage Buckets

Keep until feature ownership is confirmed:

- `assets`
- `community-uploads`
- `hushh-agent-profile-images`
- `hushh-ai-media`
- `hushh-gamma-pdf`

## Security Cleanup To Schedule

The live advisor check found the following non-destructive cleanup priorities:

- Enable or intentionally lock down RLS for `analytics_events` and
  `deleted_account_payment_audits`.
- Remove duplicate permissive policies on `nda_signatures` and `users`.
- Set explicit `search_path` on public RPC functions, especially
  `sign_global_nda` and `check_user_nda_status`.
- Review public execution grants on SECURITY DEFINER RPCs before removing any
  table or function.
- After delete candidates are removed, prune Supabase secrets that were only
  needed by those removed functions.

## Safe Cleanup Order

1. Export a function list and save a dashboard screenshot or CLI output.
2. Confirm external owners for every delete candidate.
3. Delete one small batch of confirmed unused functions.
4. Re-run website smoke tests: login, signup, sign NDA, NDA admin, onboarding,
   Plaid link, investor profile, chat widget.
5. Re-run `supabase functions list` and update this file.
6. Only after function cleanup, review and prune unused secrets by name.

## Removed

- `setup-nda-table`: live-only function. Its deployed source said "Deploy, call
  once, then delete", and it was publicly callable (`verify_jwt=false`).
  Deleted on 2026-05-26 UTC. No database tables or rows were changed.

## Urgent Review

- `get-secrets`: live-only function, publicly callable (`verify_jwt=false`),
  and the server-side bundle could not be retrieved with the Supabase CLI. Do
  not keep this in the HushhTech project unless an owner proves it is required.

## Deletion Commands

Use these only after explicit approval. Start with one batch.

```bash
npx supabase@2.84.2 functions delete <function-name> --project-ref ibsisfnjxeowvdtvgzff
```
