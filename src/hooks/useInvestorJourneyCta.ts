/**
 * useInvestorJourneyCta — single source of truth for "where should this
 * user go next" across every Hushh Fund entry point (home page, Hero,
 * Navbar, nav drawer, profile pages, AuthCallback resume).
 *
 * Replaces 4 duplicate copies of the same branching logic that previously
 * lived in:
 *   - src/hooks/useHushhProfileCta.ts
 *   - src/components/Hero.tsx (getPrimaryCTA)
 *   - src/components/profile/profilePage.tsx (getPrimaryCTAContent)
 *   - src/pages/profile/logic.ts (getPrimaryCTAContent)
 *
 * Each of those bypassed the InvestorAccessRoute state machine, which
 * caused users to land on misleading pages (e.g., "Invest with Hushh" →
 * /onboarding/step-1 despite never having seen the FL page in this
 * session). This hook consumes `getInvestorAccessState` so every CTA
 * agrees on the user's actual journey position.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useAuthSession } from "../auth/AuthSessionProvider";
import config from "../resources/config/config";
import {
  FINANCIAL_LINK_ROUTE,
  getCanonicalOnboardingRoute,
  getOnboardingDisplayMeta,
} from "../services/onboarding/flow";
import { fetchResolvedOnboardingProgress } from "../services/onboarding/progress";
import {
  ACCESS_DENIED_ROUTE,
  MEET_CEO_ROUTE,
  PROFILE_ROUTE,
  STEP_9_ROUTE,
  getInvestorAccessState,
  type InvestorAccessState,
} from "../services/investorAccess/state";

export interface InvestorJourneyCta {
  /** What the user sees on the button. Always honest about the action. */
  text: string;
  /** Where the click takes them. */
  action: () => void;
  /** True while the underlying state is still being fetched. */
  loading: boolean;
  /** The derived investor-access state (for callers that branch UI on this). */
  state: InvestorAccessState | "unauthenticated" | "loading";
  /** True when the user has cleared the Stripe payment gate. */
  isInvestor: boolean;
  /**
   * Subtle progress hint for mid-flow users, e.g. "Step 4 of 9". Null when
   * progress messaging would be misleading (loading, unauthenticated, or
   * users who are not mid-onboarding).
   */
  progressLabel: string | null;
}

export interface UseInvestorJourneyCtaOptions {
  /** Defer state fetch (e.g., drawer is closed). Defaults to true. */
  enabled?: boolean;
}

export interface InvestorJourneyResult {
  session: Session | null;
  primaryCTA: InvestorJourneyCta;
}

type JourneyState = "loading" | "unauthenticated" | InvestorAccessState;

/**
 * Canonical label + action map. PM decisions (PD-1, PD-6) live here so
 * every surface stays consistent.
 */
function ctaForState(
  state: JourneyState,
  currentStep: number,
  navigate: (to: string) => void,
): InvestorJourneyCta {
  const base = {
    loading: state === "loading",
    state,
    isInvestor: false,
    progressLabel: null as string | null,
  };
  switch (state) {
    case "loading":
      return { ...base, text: "Loading...", action: () => {} };
    case "unauthenticated":
      return {
        ...base,
        text: "Start investing",
        action: () => navigate(FINANCIAL_LINK_ROUTE),
      };
    case "needs_onboarding": {
      // PD-1 (fresh restart bias): if the user never made progress past
      // step-1, always send them through financial-link so the first
      // visible page is the canonical funnel entry, not a half-filled
      // form. This is the bug that the home page CTA exposed today.
      if (currentStep <= 1) {
        return {
          ...base,
          text: "Start investing",
          action: () => navigate(FINANCIAL_LINK_ROUTE),
        };
      }
      // Translate the raw `current_step` to the canonical display step (1-9)
      // before showing it in the label. Raw values can collide on the same
      // displayed step (e.g., raw 4 and raw 8 both display as step 3 after
      // the address-folding refactor).
      const stepRoute = getCanonicalOnboardingRoute(currentStep);
      const { displayStep, totalSteps } = getOnboardingDisplayMeta(stepRoute);
      return {
        ...base,
        text: `Continue from step ${displayStep}`,
        action: () => navigate(stepRoute),
        progressLabel: `Step ${displayStep} of ${totalSteps}`,
      };
    }
    case "needs_payment":
      return {
        ...base,
        text: "Complete your investment",
        action: () => navigate(STEP_9_ROUTE),
        progressLabel: "Final step",
      };
    case "payment_in_review":
      return {
        ...base,
        text: "Continue to Meet the CEO",
        action: () => navigate(MEET_CEO_ROUTE),
        isInvestor: true,
      };
    case "verified_investor":
      return {
        ...base,
        text: "View your portfolio",
        action: () => navigate(PROFILE_ROUTE),
        isInvestor: true,
      };
    case "payment_reversed":
      return {
        ...base,
        text: "Resume your investment",
        action: () => navigate(STEP_9_ROUTE),
      };
    case "rejected_investor":
      return {
        ...base,
        text: "Application status",
        action: () => navigate(ACCESS_DENIED_ROUTE),
      };
  }
}

/**
 * The hook itself. Drop-in replacement for `useHushhProfileCta`.
 */
export function useInvestorJourneyCta(
  options: UseInvestorJourneyCtaOptions = {},
): InvestorJourneyResult {
  const { enabled = true } = options;
  const navigate = useNavigate();
  const { session, status } = useAuthSession();

  const [state, setState] = useState<JourneyState>("loading");
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const resolve = async () => {
      if (status === "booting") return;
      if (!session?.user?.id) {
        if (!cancelled) {
          setState("unauthenticated");
          setCurrentStep(1);
        }
        return;
      }
      if (!config.supabaseClient) {
        if (!cancelled) setState("unauthenticated");
        return;
      }
      try {
        const onboarding = await fetchResolvedOnboardingProgress(
          config.supabaseClient,
          session.user.id,
        );
        if (cancelled) return;
        const derived = getInvestorAccessState(onboarding);
        setState(derived);
        setCurrentStep(onboarding?.current_step || 1);
      } catch (error) {
        if (cancelled) return;
        console.warn("[useInvestorJourneyCta] state fetch failed", error);
        // Fail soft: treat as needs_onboarding (FL is always safe).
        setState("needs_onboarding");
        setCurrentStep(1);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [enabled, session?.user?.id, status]);

  const navigateMemo = useCallback((to: string) => navigate(to), [navigate]);

  const primaryCTA = useMemo<InvestorJourneyCta>(
    () => ctaForState(state, currentStep, navigateMemo),
    [state, currentStep, navigateMemo],
  );

  return { session, primaryCTA };
}

/**
 * Pure helper exported so tests can table-drive the label/action matrix
 * without spinning up React.
 */
export const __testing__ = {
  ctaForState,
};
