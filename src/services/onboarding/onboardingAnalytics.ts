/**
 * Onboarding session tracking — thin, fire-and-forget wrappers over the existing
 * first-party analytics pipeline (siteAnalytics.trackSiteEvent → /api/analytics/collect
 * → site_analytics_events). Centralizes the onboarding event taxonomy so call sites stay
 * one line and consistent.
 *
 * Privacy: only event names + safe metadata (step slug, action, status, result,
 * errorCategory). NEVER pass raw KYC/PII — the collector also strips non-allowlisted
 * property keys and hashes identifiers server-side.
 */
import { trackSiteEvent } from "../analytics/siteAnalytics";
import {
  getOnboardingDisplayMeta,
  isCurrentLocalOnboardingPreview,
  type CanonicalOnboardingRoute,
} from "./flow";

const SESSION_START_KEY = "hushh_onboarding_session_started";

const CANONICAL_STEP_PATHS = new Set<string>([
  "/onboarding/step-1",
  "/onboarding/step-2",
  "/onboarding/step-3",
  "/onboarding/step-4",
  "/onboarding/step-5",
  "/onboarding/step-6",
  "/onboarding/step-7",
  "/onboarding/step-8",
  "/onboarding/step-9",
]);

/**
 * Map an /onboarding/* pathname to a stable step slug (+ display index for the
 * numbered steps). Returns null for non-onboarding paths.
 */
export function resolveOnboardingStep(
  pathname: string,
): { step: string; stepIndex?: number } | null {
  if (!pathname || !pathname.startsWith("/onboarding/")) return null;
  const path = pathname.replace(/\/+$/, "");
  if (CANONICAL_STEP_PATHS.has(path)) {
    const meta = getOnboardingDisplayMeta(path as CanonicalOnboardingRoute);
    return { step: path.slice("/onboarding/".length), stepIndex: meta.displayStep };
  }
  const slug = path.slice("/onboarding/".length).split("/")[0];
  return slug ? { step: slug } : null;
}

// Analytics must never run on the synthetic local preview walkthrough.
const enabled = () => !isCurrentLocalOnboardingPreview();

export function trackSessionStart(): void {
  if (!enabled()) return;
  try {
    if (sessionStorage.getItem(SESSION_START_KEY)) return;
    sessionStorage.setItem(SESSION_START_KEY, "1");
  } catch {
    return;
  }
  void trackSiteEvent("session_start", { properties: { surface: "onboarding" } });
}

export function trackStepViewed(step: string, stepIndex?: number): void {
  if (!enabled()) return;
  void trackSiteEvent("onboarding_step_viewed", { properties: { step, stepIndex } });
}

export function trackStepCompleted(step: string, stepIndex?: number, result?: string): void {
  if (!enabled()) return;
  void trackSiteEvent("onboarding_step_completed", { properties: { step, stepIndex, result } });
}

export function trackStepSkipped(step: string): void {
  if (!enabled()) return;
  void trackSiteEvent("onboarding_step_skipped", { properties: { step } });
}

export function trackStepError(step: string, errorCategory: string): void {
  if (!enabled()) return;
  void trackSiteEvent("onboarding_step_error", { properties: { step, errorCategory } });
}

export function trackCta(action: string, step?: string): void {
  if (!enabled()) return;
  void trackSiteEvent("cta_click", { properties: { action, step } });
}

type FinancialLinkPhase = "started" | "completed" | "skipped" | "failed";

export function trackFinancialLink(
  phase: FinancialLinkPhase,
  props?: { errorCategory?: string; status?: string },
): void {
  if (!enabled()) return;
  void trackSiteEvent(`financial_link_${phase}`, {
    properties: { step: "financial-link", ...props },
  });
}
