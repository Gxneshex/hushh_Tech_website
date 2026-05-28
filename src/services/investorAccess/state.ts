/**
 * Investor access state machine.
 *
 * A single derived view of an `onboarding_data` row that decides whether the
 * user has cleared the Stripe payment gate for post-payment surfaces
 * (Meet CEO, Profile). The state is consumed by the route wrapper, by
 * step-9's polling UI, and by login resume routing — every consumer reads
 * from this util so the rules stay consistent.
 *
 * Conventions:
 * - `fund_payment_status` mirrors the values the Stripe webhook writes.
 * - `fund_investor_verification_status` reflects the manual admin decision.
 * - Access (Meet CEO + Profile) is granted as soon as Stripe webhook confirms
 *   payment (`paid` / `pending_manual_verification`). Verified investor unlocks
 *   the profile dashboard but is not required for Meet CEO welcome content.
 */

import {
  FINANCIAL_LINK_ROUTE,
  type CanonicalIncompleteOnboardingRoute,
} from "../onboarding/flow";

export type InvestorAccessState =
  | "needs_onboarding"
  | "needs_payment"
  | "payment_in_review"
  | "verified_investor"
  | "payment_reversed"
  | "rejected_investor";

export interface InvestorAccessInputs {
  is_completed: boolean | null | undefined;
  fund_payment_status: string | null | undefined;
  fund_investor_verification_status: string | null | undefined;
}

/**
 * Statuses that mean the Stripe webhook has confirmed money was collected. The
 * list mirrors `fund-payment-checkout`'s already_paid check so the gate and
 * the checkout endpoint agree on what "paid" means.
 */
export const FUND_PAYMENT_PAID_STATUSES: ReadonlyArray<string> = [
  "paid",
  "pending_manual_verification",
];

/**
 * Statuses that mean the payment was reversed after the fact. Users with these
 * states are evicted from post-payment surfaces and asked to request a new
 * payment link.
 */
export const FUND_PAYMENT_REVERSED_STATUSES: ReadonlyArray<string> = [
  "refunded",
  "disputed",
];

/**
 * Statuses that mean payment has not been completed yet (including never
 * started, link sent but unused, Checkout abandoned, expired). All redirect
 * the user back to step-9 to finish payment.
 */
export const FUND_PAYMENT_NOT_PAID_STATUSES: ReadonlyArray<string> = [
  "not_started",
  "payment_link_sent",
  "checkout_created",
  "expired",
  "cancelled",
  "failed",
];

const normalize = (value: string | null | undefined): string =>
  String(value ?? "").trim().toLowerCase();

export function getInvestorAccessState(
  onboarding: InvestorAccessInputs | null | undefined,
): InvestorAccessState {
  if (!onboarding) return "needs_onboarding";

  const verification = normalize(onboarding.fund_investor_verification_status);
  if (verification === "verified_investor") return "verified_investor";
  if (verification === "rejected") return "rejected_investor";

  const payment = normalize(onboarding.fund_payment_status);
  if (FUND_PAYMENT_REVERSED_STATUSES.includes(payment)) return "payment_reversed";
  if (FUND_PAYMENT_PAID_STATUSES.includes(payment)) return "payment_in_review";

  // From here on payment is not in a paid state. Onboarding has to be at least
  // through KYC (is_completed true) before we route the user to step-9 to
  // pay. Otherwise they are still mid-KYC and the onboarding flow should
  // catch them first.
  if (!onboarding.is_completed) return "needs_onboarding";
  return "needs_payment";
}

export function isInvestorAccessGranted(state: InvestorAccessState): boolean {
  return state === "payment_in_review" || state === "verified_investor";
}

export const STEP_9_ROUTE = "/onboarding/step-9";
export const MEET_CEO_ROUTE = "/onboarding/meet-ceo";
export const ACCESS_DENIED_ROUTE = "/onboarding/access-denied";
export const PROFILE_ROUTE = "/hushh-user-profile";

export type InvestorAccessRedirectReason =
  | "needs_onboarding"
  | "needs_payment"
  | "payment_reversed"
  | "rejected_investor";

export interface InvestorAccessRouteDecision {
  /** When set, the wrapper should redirect here instead of rendering children. */
  redirectTo?: CanonicalIncompleteOnboardingRoute | typeof STEP_9_ROUTE | typeof ACCESS_DENIED_ROUTE;
  /** Reason used by the redirected page to surface a banner. */
  reason?: InvestorAccessRedirectReason;
  /** True when the wrapper should render its children. */
  allow: boolean;
}

export function decideInvestorAccessRoute(
  state: InvestorAccessState,
): InvestorAccessRouteDecision {
  switch (state) {
    case "verified_investor":
    case "payment_in_review":
      return { allow: true };
    case "needs_onboarding":
      return { allow: false, redirectTo: FINANCIAL_LINK_ROUTE, reason: "needs_onboarding" };
    case "needs_payment":
      return { allow: false, redirectTo: STEP_9_ROUTE, reason: "needs_payment" };
    case "payment_reversed":
      return { allow: false, redirectTo: STEP_9_ROUTE, reason: "payment_reversed" };
    case "rejected_investor":
      return { allow: false, redirectTo: ACCESS_DENIED_ROUTE, reason: "rejected_investor" };
  }
}

/**
 * Resume routing after sign-in. Decides where to land an authenticated user
 * based on their access state and how far through onboarding they got.
 */
export function getResumeRouteForState(
  state: InvestorAccessState,
  currentStep: number | null | undefined,
): string {
  switch (state) {
    case "verified_investor":
      return PROFILE_ROUTE;
    case "payment_in_review":
      return MEET_CEO_ROUTE;
    case "rejected_investor":
      return ACCESS_DENIED_ROUTE;
    case "payment_reversed":
    case "needs_payment":
      return STEP_9_ROUTE;
    case "needs_onboarding":
    default: {
      const step = Number.isFinite(currentStep) ? Math.trunc(Number(currentStep)) : 0;
      // KYC nearly done — route to step-9 so they can pay.
      if (step >= 13) return STEP_9_ROUTE;
      // Otherwise let financial-link's own continuation logic handle it.
      return FINANCIAL_LINK_ROUTE;
    }
  }
}
