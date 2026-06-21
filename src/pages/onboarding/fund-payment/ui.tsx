import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, { HushhTechCtaVariant } from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";
import {
  createFundCheckout,
  getFundPaymentTokenStatus,
} from "../../../services/fundPayment/fundPaymentService";

const MEET_CEO_ROUTE = "/onboarding/meet-ceo";
const STEP_9_ROUTE = "/onboarding/step-6";
const POST_PAYMENT_AUTO_REDIRECT_MS = 8000;
// Webhook-race tolerance: Stripe's browser redirect to ?payment=success can
// land before the checkout.session.completed webhook updates our local
// ledger. Poll the token-scoped status endpoint until either the gate would
// allow access (access_granted=true) or the budget is exhausted.
const WEBHOOK_CONFIRMATION_POLL_INTERVAL_MS = 2000;
const WEBHOOK_CONFIRMATION_BUDGET_MS = 30_000;

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-normal !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-normal !shadow-none";

export default function FundPaymentLinkPage() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [searchParams] = useSearchParams();
  const paymentState = searchParams.get("payment");
  const [loading, setLoading] = useState(paymentState !== "success");
  const [error, setError] = useState<string | null>(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(null);
  const [webhookConfirmed, setWebhookConfirmed] = useState(false);
  const [webhookTimedOut, setWebhookTimedOut] = useState(false);
  // Guard against re-firing checkout when the user comes back to this URL via
  // the browser back button after auto-redirect to Meet CEO. Without this,
  // each back navigation would mint a fresh Stripe Checkout session.
  const checkoutFiredRef = useRef(false);

  const goToMeetCeo = () => navigate(MEET_CEO_ROUTE);
  const goToStep9 = () => navigate(STEP_9_ROUTE);

  const isAwaitingWebhook = paymentState === "success" && !webhookConfirmed;
  const showForwardCta =
    (paymentState === "success" && webhookConfirmed) || alreadyPaid;

  const statusCopy = useMemo(() => {
    if (paymentState === "success") {
      if (webhookTimedOut) {
        return {
          eyebrow: "Still Confirming",
          title: "We're still confirming your payment.",
          body: "Stripe takes a moment to finalise some payments. You'll get an email once the Hushh ledger confirms it — feel free to leave this page.",
        };
      }
      if (!webhookConfirmed) {
        return {
          eyebrow: "Payment Submitted",
          title: "Stripe is confirming your payment.",
          body: "Hushh waits for Stripe webhook fulfillment before unlocking Meet the CEO. This usually takes a few seconds.",
        };
      }
      return {
        eyebrow: "Payment Confirmed",
        title: "You're in. Welcome to Hushh Fund.",
        body: "Stripe webhook confirmed your payment. Hushh team will review your application and reach out by email.",
      };
    }
    if (paymentState === "cancel") {
      return {
        eyebrow: "Payment Paused",
        title: "Your payment was not completed.",
        body: "You can reopen the secure link while it is still valid. The Hushh team will only treat payment as complete after Stripe confirms it.",
      };
    }
    if (alreadyPaid) {
      return {
        eyebrow: "Already Paid",
        title: "This payment request is already complete.",
        body: "Your investor profile is in manual review. Hushh will reach out after the review step is finished.",
      };
    }
    return {
      eyebrow: "Secure Payment",
      title: "Opening Stripe Checkout.",
      body: "This page creates a fresh Stripe Checkout session from your Hushh payment link. The link itself remains valid for seven days.",
    };
  }, [alreadyPaid, paymentState, webhookConfirmed, webhookTimedOut]);

  const openCheckout = async () => {
    if (!token) {
      setError("Payment link is missing.");
      setLoading(false);
      return;
    }
    checkoutFiredRef.current = true;
    setError(null);
    setLoading(true);
    try {
      const result = await createFundCheckout(token);
      if (result.already_paid) {
        setAlreadyPaid(true);
        setLoading(false);
        return;
      }
      if (!result.checkout_url) {
        throw new Error("Stripe Checkout URL was not returned");
      }
      window.location.assign(result.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open Stripe Checkout");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentState === "success") {
      setLoading(false);
      return;
    }
    if (checkoutFiredRef.current) {
      // User likely navigated back to this URL after a previous open. Do not
      // create another Stripe session — let them click "Open Secure Checkout"
      // explicitly if they really want a new one.
      setLoading(false);
      return;
    }
    checkoutFiredRef.current = true;
    void openCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentState, token]);

  // Webhook-race poll: only on ?payment=success. Stop as soon as the gate
  // would allow access, or after WEBHOOK_CONFIRMATION_BUDGET_MS.
  useEffect(() => {
    if (paymentState !== "success") return;
    if (webhookConfirmed) return;
    if (!token) return;

    let cancelled = false;
    const start = Date.now();

    const poll = async () => {
      try {
        const status = await getFundPaymentTokenStatus(token);
        if (cancelled) return;
        if (status.access_granted) {
          setWebhookConfirmed(true);
          return;
        }
        if (status.access_reversed) {
          // Refund / dispute came in before we could redirect — bounce the
          // user back to step-9 so they can request a new link.
          navigate(STEP_9_ROUTE, { replace: true });
          return;
        }
      } catch (err) {
        console.warn("[FundPaymentPage] Token status poll failed", err);
      }
      if (cancelled) return;
      if (Date.now() - start >= WEBHOOK_CONFIRMATION_BUDGET_MS) {
        setWebhookTimedOut(true);
        return;
      }
      setTimeout(poll, WEBHOOK_CONFIRMATION_POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, [paymentState, token, webhookConfirmed, navigate]);

  // Auto-redirect to Meet CEO after success / already-paid state so the user is
  // not stranded on the confirmation page.
  useEffect(() => {
    if (!showForwardCta) {
      setAutoRedirectSeconds(null);
      return;
    }
    const totalSeconds = Math.ceil(POST_PAYMENT_AUTO_REDIRECT_MS / 1000);
    setAutoRedirectSeconds(totalSeconds);
    const tickId = setInterval(() => {
      setAutoRedirectSeconds((current) => (current && current > 1 ? current - 1 : current));
    }, 1000);
    const redirectId = setTimeout(() => {
      goToMeetCeo();
    }, POST_PAYMENT_AUTO_REDIRECT_MS);
    return () => {
      clearInterval(tickId);
      clearTimeout(redirectId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForwardCta]);

  return (
    <div
      className="flex min-h-screen flex-col bg-white text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader
        onBackClick={showForwardCta ? goToMeetCeo : goToStep9}
        rightLabel="FAQ"
      />

      <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col px-5 pb-24 pt-20 text-center">
        <Eyebrow>{statusCopy.eyebrow}</Eyebrow>
        <Display as="h1" size="xs" maxWidth="max-w-[520px]">
          {statusCopy.title}
        </Display>
        <Lede className="mx-auto max-w-[480px]">{statusCopy.body}</Lede>

        {showForwardCta && autoRedirectSeconds !== null && (
          <p className="mt-4 text-[12px] font-medium uppercase tracking-[1.4px] text-[#0066CC]/80">
            Taking you to Meet the CEO in {autoRedirectSeconds}s
          </p>
        )}

        {isAwaitingWebhook && (
          <div className="mt-5 inline-flex items-center justify-center gap-2 self-center rounded-full bg-[#0066CC]/10 px-4 py-2 text-[12px] font-medium text-[#0066CC]">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0066CC] border-t-transparent" />
            Waiting for Stripe webhook confirmation…
          </div>
        )}

        <section className="mt-9 rounded-[24px] bg-[#F5F5F7] p-5 text-left shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#0066CC]">
              <span className="material-symbols-outlined text-[22px]">encrypted</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#1D1D1F]">
                Stripe is the payment record.
              </p>
              <p className="mt-1 text-[12px] font-light leading-[1.55] text-[#1D1D1F]/60">
                Browser redirects or screenshots do not mark a payment as paid.
                The backend updates the Hushh ledger only from Stripe webhooks.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 text-left text-[13px] font-medium leading-[1.45] text-[#B42318]">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {showForwardCta && (
            <>
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={goToMeetCeo}
                className={primaryCtaClass}
              >
                Continue to Meet the CEO
              </HushhTechCta>
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={goToStep9}
                className={secondaryCtaClass}
              >
                Back to Hushh Fund
              </HushhTechCta>
            </>
          )}

          {isAwaitingWebhook && !webhookTimedOut && (
            <HushhTechCta
              variant={HushhTechCtaVariant.WHITE}
              onClick={goToStep9}
              className={secondaryCtaClass}
            >
              Back to Hushh Fund
            </HushhTechCta>
          )}

          {webhookTimedOut && (
            <>
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={goToStep9}
                className={primaryCtaClass}
              >
                Back to Hushh Fund
              </HushhTechCta>
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={() => window.location.reload()}
                className={secondaryCtaClass}
              >
                Check again
              </HushhTechCta>
            </>
          )}

          {paymentState !== "success" && !alreadyPaid && (
            <>
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={openCheckout}
                disabled={loading}
                className={primaryCtaClass}
              >
                {loading ? "Opening Stripe..." : "Open Secure Checkout"}
              </HushhTechCta>
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={goToStep9}
                className={secondaryCtaClass}
              >
                Back to Hushh Fund
              </HushhTechCta>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
