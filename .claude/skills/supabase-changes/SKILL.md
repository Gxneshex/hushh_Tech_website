---
name: supabase-changes
description: >-
  Use whenever a task involves Supabase for this repo — editing or deploying edge
  functions, changing edge-function secrets, running migrations, or auditing
  Supabase dashboard config. Prefer the Supabase CLI for writes when the user has
  explicitly asked for deployment and the target project/ref is confirmed. If
  CLI is blocked, fall back to the user's Chrome session on port 9223 where
  ankit@hushh.ai is logged in. Trigger on any mention of Supabase
  edge functions, secrets, migrations, or "deploy create-link-token / an edge
  function".
---

# Supabase changes — CLI-first, project-confirmed

For this repo the Supabase project is **production for a fund** (`ibsisfnjxeowvdtvgzff` / "hushh-ai"). Supabase writes are allowed through the CLI when the user explicitly asks for deployment or remote application, and the target project/ref has been checked.

## Do
- Prefer `npx supabase` CLI for migrations, Edge Function deploys, function logs, and secrets.
- If CLI cannot complete because of local auth, DB password, Docker, or another machine-level blocker, use `@chrome` / Chrome profile fallback on port `9223` where `ankit@hushh.ai` is logged in.
- Browser fallback is allowed for Supabase Dashboard SQL editor, function settings, logs, and other admin pages only after confirming the project ref is `ibsisfnjxeowvdtvgzff`.
- Before remote writes, check the linked project or pass `--project-ref ibsisfnjxeowvdtvgzff` explicitly.
- Run read-only preflight first when practical: `migration list`, function list/logs, or current secret names.
- Deploy only the intended Edge Functions unless the user asks for a broader rollout.
- For secrets, avoid printing secret values back to chat; confirm names and whether they were set.
- For migrations, inspect the pending list and call out any unrelated pending migrations before applying them.
- After applying, do read-only verification: migration list, function status/logs, and a safe HTTP/auth smoke.

## Do NOT
- Do not deploy to an unconfirmed project ref.
- Do not use the dashboard Monaco code editor as the first choice; use it only when the CLI path is blocked or slower and the user has asked for Chrome-based recovery.
- Do not run destructive SQL, reset commands, or broad schema rewrites without a separate explicit confirmation.
- Do not expose service-role keys, Stripe keys, Plaid secrets, or generated secret values in chat.
- Do not deploy unrelated dirty working-tree functions by accident.

## Why
CLI deploys are more reliable and auditable than browser-editor writes. The project is fund-production, so the safety bar is explicit target confirmation, narrow deploy scope, read-only preflight, and post-deploy verification. Deploy pipeline + infra details: see the `deploy` skill and `reference-plaid-supabase-ops`.
