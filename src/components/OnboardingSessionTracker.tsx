import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  resolveOnboardingStep,
  trackSessionStart,
  trackStepViewed,
} from "../services/onboarding/onboardingAnalytics";

/**
 * Centralized onboarding step-view tracker. Mounted once (beside
 * GoogleAnalyticsRouteTracker) so every /onboarding/* route change emits a single
 * `onboarding_step_viewed` event — no per-step wiring needed. Anchors the session
 * with one `session_start` on the first onboarding view. Renders nothing.
 *
 * Page views themselves are already tracked app-wide (GA4 + trackPageViewEvent);
 * this adds the semantic onboarding-funnel layer.
 */
export default function OnboardingSessionTracker() {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const resolved = resolveOnboardingStep(location.pathname);
    if (!resolved) return;
    if (lastPathRef.current === location.pathname) return;
    lastPathRef.current = location.pathname;

    trackSessionStart();
    trackStepViewed(resolved.step, resolved.stepIndex);
  }, [location.pathname]);

  return null;
}
