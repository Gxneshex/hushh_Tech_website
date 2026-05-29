# HushhTech CI/CD pipeline anatomy

Detailed reference for the deploy skill. Paths are repo-root-relative. Read this
when you need exact job names, step order, or the file/line to change for a
speedup lever.

## Table of contents
- [End-to-end flow](#end-to-end-flow)
- [PR validation (ci.yml)](#pr-validation-ciyml)
- [Post-merge gate](#post-merge-gate)
- [UAT deploy](#uat-deploy)
- [PROD deploy](#prod-deploy)
- [Build & container](#build--container)
- [Redundant pipelines](#redundant-pipelines)
- [Speedup anchors](#speedup-anchors)

## End-to-end flow
```
PR → ci.yml (9 parallel jobs, gated by "CI Status Gate")
   → merge to main
   → "Main Post-Merge Smoke" (main-post-merge-smoke.yml) → "Main Post-Merge Smoke Gate"
   → deploy-uat.yml fires automatically (workflow_run on success)
   → deploy-prod.yml dispatched MANUALLY with the green SHA
```

## PR validation (ci.yml)
`.github/workflows/ci.yml`, name **"PR Validation"**, runs on PRs to `main`/`develop`.
`concurrency: cancel-in-progress: true` (new push cancels the old run). Jobs:

| Job | id | Timeout | Notes |
|-----|----|---------| ------|
| DCO | `dco` | 10m | `npm run dco:check` |
| Secret Scan | `secret-scan` | 10m | installs gitleaks, `orchestrate.sh secret` |
| Env Contract Check | `env-contract` | 10m | `orchestrate.sh env` |
| Reviewer Context & Compliance | `reviewer-context` | 10m | asserts grounding files exist |
| PR Hygiene | `pr-hygiene` | 10m | `npm run pr:hygiene` |
| Phase 2 PR Policy | `phase2-pr-policy` | 10m | invite-only policy |
| Semantic PR Guard | `semantic-pr-guard` | 10m | advisory |
| **Web Validation** | `web-validation` | **35m** | `npm ci` + `orchestrate.sh web` (test + typecheck + build) — the slow one |
| Lint | `lint` | 25m | `npm ci` + `orchestrate.sh lint` |
| Security Audit | `security-audit` | 20m | `npm ci` + `npm audit` + regression budget |
| CI Status Gate | `ci-status` | 5m | `needs:` all above; final required check |

Every `npm ci` job re-installs from scratch (only `cache: npm` download cache,
not `node_modules`).

## Post-merge gate
`.github/workflows/main-post-merge-smoke.yml` produces the
**"Main Post-Merge Smoke Gate"** check. This is the check that
`scripts/ci/require-deploy-sha-on-main.sh` requires (`REQUIRED_CHECK_NAME`)
before any deploy is allowed. A SHA is "deployable" only once this is green.

## UAT deploy
`.github/workflows/deploy-uat.yml`, name **"Deploy to UAT"**.
- Triggers: `workflow_run` after "Main Post-Merge Smoke" completes
  successfully on `main` (`deploy-uat.yml:3-9`), **or** manual `workflow_dispatch`
  with optional `sha` (defaults to latest `origin/main`, `:59-73`).
- SHA validation: `deploy-uat.yml:75-81`.
- Build + deploy: `npm ci` (`:94`) → load secrets (`:117`) → `env:check` (`:219`)
  → `npm run build:web` (`:220`) → `gcloud run deploy --source . --project=hushh-tech-uat`
  (`:243-258`, `min-instances=0`, `max-instances=3`) → Playwright + smoke
  (`:260-272`).

## PROD deploy
`.github/workflows/deploy-prod.yml`, name **"Deploy to PROD"**.
- Trigger: `workflow_dispatch` only, **required** `sha` input (`:2-8`).
- Asserts dispatch is from `main` (`:37-44`).
- SHA validation against green main (`:51-57`).
- Build + deploy: `npm ci` (`:70`) → load + assert prod secrets (`:93-152`)
  → `env:check` (`:172`) → `npm run build:web` (`:173`)
  → `gcloud run deploy --source . --project=hushh-tech-prod` (`:198-213`,
  `min-instances=1`, `max-instances=10`) → Playwright + smoke (`:215-227`).

## Build & container
- `package.json` scripts: `build` = `vitest run && npm run build:web` (`:26`);
  `build:web` = `npm run build:assets && vite build` (`:25`);
  `build:assets` = community snapshot + sitemap + robots (`:22`).
- Runtime image: `Dockerfile` (root) — **runtime-only**, copies prebuilt `dist/`,
  installs server deps from `package-server.json`, runs a guard that fails the
  build if `dist/` lacks compiled Supabase auth config, then copies `server.js` +
  `api/`. Because the deploy uses `gcloud run deploy --source .`, Cloud Build
  builds *this* Dockerfile remotely on every deploy.

## Redundant pipelines
- `Dockerfile` (runtime-only, dist prebuilt in runner) — used by the GitHub
  Actions deploys via `--source .`.
- `Dockerfile.gcp` + `cloudbuild-uat.yaml` / `cloudbuild-prod.yaml` — a *separate*
  Cloud Build path that builds Vite **inside** the image with `--build-arg
  VITE_*`, pushes to GCR, and deploys. Comment says triggered by push to
  `develop`. This duplicates the build strategy.
- `vercel.json` — `@vercel/static-build` (distDir `dist`) + `@vercel/node` for
  `api/**`, i.e. Vercel can also build & host. Plus a large headers/CSP +
  SPA-rewrite config.
Three ways to ship the same app → triple the maintenance and drift surface.

## Speedup anchors
Quick map from lever (see SKILL.md) → where to change it:
1. Image deploy: `deploy-uat.yml:243`, `deploy-prod.yml:198` (`--source .` → build+push+`--image`).
2. Path-aware CI: `ci.yml` jobs `web-validation` (`:228`), `lint` (`:246`).
3. Caching: add `actions/cache` for `node_modules` in every `npm ci` job;
   Playwright install at `deploy-uat.yml:260`, `deploy-prod.yml:215`.
4. Tests vs build: `package.json:26` (`build`), add `build:check`.
5. Assets cache: `package.json:22` (`build:assets`).
6. Redundancy: `Dockerfile` vs `Dockerfile.gcp` + `cloudbuild-*.yaml` + `vercel.json`.
