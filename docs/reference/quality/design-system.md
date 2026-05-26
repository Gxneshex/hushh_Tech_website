# Design System Reference

This document is the tracked design-system pointer for the first-wave Hushhtech skill system.

## Shared ownership hints

`frontend-design-system` should own:

1. shared UI primitives
2. Hushhtech shell, header, footer, and nav treatment
3. reusable interaction patterns
4. theme-level rules that affect more than one route

`frontend` should still own route-local implementation unless the change modifies a reusable pattern or component contract.

## HushhTech Apple Reface Convention

The downloaded HushhTechnology JSX files are presentation references only. They define the target look for the first-wave public experience, but they are not runtime dependencies and they are not a replacement source for production content.

First-wave scoped routes:

1. `/`
2. `/discover-fund-a`
3. `/community`
4. `/community/:slug`
5. `/login` and the small auth-loading handoff screens used by login

For these routes, the UI layer may change header treatment, menu sheet, tabs, icon style, typography, spacing, card shapes, search/filter presentation, and loading/empty states. The existing hooks, route targets, backend calls, auth/session behavior, Supabase/GCP contracts, community collection data, post rendering sources, and quantitative/fund content modules remain the source of truth.

Do not hardcode community articles, fund metrics, production response data, or secrets into a refaced screen. A screen reface should pass through the current local or production data exactly as provided by the existing logic/module layer.

Reusable visual work should live in shared primitives such as `src/components/hushh-tech-ui/HushhAppleUI.tsx`, `src/components/hushh-tech-header`, `src/components/hushh-tech-footer`, and `src/components/hushh-tech-nav-drawer`. Route files should compose those primitives over their existing logic hooks.

## Review questions

Use this checklist before patch-and-merge on a shared UI PR:

1. Is the changed component reused across more than one route?
2. Does the fix change shell chrome, navigation language, or shared layout behavior?
3. Does the fix belong in `src/components/ui`, a `hushh-tech-*` shared component, or `src/theme`?
4. Can the change be validated with bounded checks without changing product intent?
