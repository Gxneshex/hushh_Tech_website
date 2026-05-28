/**
 * Step 9 - Hushh Fund payment request.
 */
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  SHARE_CLASSES,
  formatCurrency,
  useStep13Logic,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  FINANCIAL_LINK_REVIEW_ROUTE,
  getOnboardingDisplayMeta,
} from "../../../services/onboarding/flow";
import {
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const DISPLAY_META = getOnboardingDisplayMeta("/onboarding/step-9");
const PROGRESS_PCT = Math.round((DISPLAY_META.displayStep / DISPLAY_META.totalSteps) * 100);
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-normal !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-normal !shadow-none";

function SoftIcon({
  icon,
  active = false,
}: {
  icon: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
        active ? "bg-[#0066CC] text-white" : "bg-white text-[#1D1D1F]/55"
      }`}
    >
      <span
        className="material-symbols-outlined text-lg"
        style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'wght' 400" }}
      >
        {icon}
      </span>
    </div>
  );
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const toneClass = {
    success: "bg-[#34C759]/10 text-[#1D1D1F]/75",
    error: "bg-[#FF3B30]/10 text-[#B42318]",
    info: "bg-[#0066CC]/10 text-[#1D1D1F]/70",
  }[tone];
  const icon = tone === "success" ? "check_circle" : tone === "error" ? "error" : "info";

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-[18px] px-4 py-4 ${toneClass}`}>
      <SoftIcon icon={icon} active={tone === "success"} />
      <p className="text-[13px] font-medium leading-[1.45]">{children}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mb-6 overflow-hidden rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)] ${className}`}
    >
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldRow({
  icon,
  label,
  value,
  border = true,
  active = false,
}: {
  icon: string;
  label: string;
  value: ReactNode;
  border?: boolean;
  active?: boolean;
}) {
  return (
    <div className={`${border ? "border-b border-[#1D1D1F]/[0.08]" : ""} py-4`}>
      <div className="flex items-center gap-4">
        <SoftIcon icon={icon} active={active} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[13px] font-medium text-[#1D1D1F]">{label}</p>
          <div className="text-[13px] font-normal leading-[1.45] text-[#1D1D1F]/62">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatus(value?: string | null): string {
  if (!value) return "Not started";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function OnboardingStep9() {
  const navigate = useNavigate();
  const {
    loading,
    pageLoading,
    error,
    successMessage,
    plaidAccounts,
    plaidInstitutionName,
    hasPlaidVerificationData,
    financialLinkStatus,
    totalInvestment,
    hasAnyUnits,
    recurringEnabled,
    recurringSummary,
    firstPaymentAmount,
    firstPaymentError,
    remainingAfterFirstPayment,
    paymentRequest,
    latestPaymentStatus,
    latestReviewStatus,
    uxState,
    flashBanner,
    getUnits,
    setFirstPaymentAmount,
    handleBack,
    handleCreatePaymentLink,
    handleContinueToMeetCeo,
    openPaymentLink,
  } = useStep13Logic();

  const canReconnectPlaid =
    !hasPlaidVerificationData && financialLinkStatus === "skipped";

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
        <div className="pb-6 pt-5">
          <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            <span>Step {DISPLAY_META.displayStep}/{DISPLAY_META.totalSteps}</span>
            <span>{PROGRESS_PCT}% Complete</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1D1D1F]/10">
            <div
              className="h-full rounded-full bg-[#0066CC] transition-all duration-500"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
          </div>
        </div>

        <section className="pb-8 pt-4 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="dollar" size={58} />
          </div>
          <Eyebrow>Final Step</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Confirm your fund payment.
          </Display>
          <Lede className="max-w-[500px]">
            Stripe collects the first payment while Plaid continues to support
            verification, financial intelligence, and manual investor review.
          </Lede>
        </section>

        {pageLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-[18px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
              >
                <div className="h-10 w-10 rounded-[12px] bg-white" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded-full bg-[#1D1D1F]/10" />
                  <div className="h-3 w-2/3 rounded-full bg-[#1D1D1F]/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!pageLoading && (
          <>
            {flashBanner === "needs_payment" && (
              <StatusBanner tone="info">
                Complete your payment below to continue to Meet the CEO.
              </StatusBanner>
            )}
            {flashBanner === "payment_reversed" && (
              <StatusBanner tone="error">
                Your previous payment was reversed. Request a new payment link to continue.
              </StatusBanner>
            )}
            {uxState === "payment_in_review" && (
              <StatusBanner tone="success">
                Payment confirmed. Hushh team is reviewing your application.
              </StatusBanner>
            )}
            {uxState === "verified" && (
              <StatusBanner tone="success">
                Welcome to Hushh Fund — you are a verified investor.
              </StatusBanner>
            )}
            {error && <StatusBanner tone="error">{error}</StatusBanner>}
            {successMessage && <StatusBanner tone="success">{successMessage}</StatusBanner>}

            <StatusBanner tone="info">
              Plaid Transfer is under development. Your linked financial data is still used for verification and risk review; money collection now happens through Stripe.
            </StatusBanner>

            <SectionCard title="Fund Commitment">
              <FieldRow
                icon="savings"
                label="Total Commitment"
                value={hasAnyUnits ? formatCurrency(totalInvestment) : "No units selected"}
                active={hasAnyUnits}
              />
              <div className="grid grid-cols-3 gap-2 py-4">
                {SHARE_CLASSES.map((sc) => {
                  const units = getUnits(sc.id);
                  return (
                    <div key={sc.id} className="rounded-[14px] bg-white px-3 py-3 text-center">
                      <p className="text-[11px] font-medium text-[#1D1D1F]/50">{sc.name}</p>
                      <p className="mt-1 text-[17px] font-semibold text-[#1D1D1F]">{units}</p>
                    </div>
                  );
                })}
              </div>
              <FieldRow
                icon="repeat"
                label="Recurring Investment"
                value={recurringEnabled ? recurringSummary : "Not selected"}
                border={false}
              />
            </SectionCard>

            <SectionCard title="Plaid Verification">
              <FieldRow
                icon={hasPlaidVerificationData ? "verified" : "shield"}
                label={hasPlaidVerificationData ? "Financial Profile" : "Financial Profile"}
                value={hasPlaidVerificationData ? "Connected for verification review" : formatStatus(financialLinkStatus)}
                active={hasPlaidVerificationData}
              />
              {plaidAccounts.length > 0 ? (
                <div>
                  {plaidAccounts.map((account, idx) => (
                    <FieldRow
                      key={account.accountId}
                      icon="account_balance"
                      label={idx === 0 && plaidInstitutionName ? plaidInstitutionName : account.name}
                      value={`${account.subtype || account.type} / ****${account.mask}`}
                      border={idx !== plaidAccounts.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <FieldRow
                  icon="info"
                  label="Review Flag"
                  value="If Plaid was skipped or weak, payment can still be valid, but investor approval stays manual."
                  border={false}
                />
              )}
              {canReconnectPlaid && (
                <div className="mt-2 px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => navigate(FINANCIAL_LINK_REVIEW_ROUTE)}
                    className="w-full rounded-[14px] bg-white px-4 py-3 text-left text-[13px] font-medium text-[#0066CC] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.18)] transition hover:bg-[#0066CC]/[0.04]"
                  >
                    <span className="material-symbols-outlined align-middle text-[16px]">add_link</span>
                    <span className="ml-2 align-middle">Connect bank now to speed up review</span>
                  </button>
                </div>
              )}
            </SectionCard>

            <SectionCard title="First Payment">
              <label className="block rounded-[18px] bg-white px-4 py-4 shadow-[inset_0_0_0_1px_rgba(29,29,31,0.08)]">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                  Amount
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[28px] font-semibold text-[#1D1D1F]">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={firstPaymentAmount}
                    onChange={(event) => setFirstPaymentAmount(event.target.value)}
                    className="min-w-0 flex-1 border-none bg-transparent p-0 text-[36px] font-semibold leading-none text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/25 focus:ring-0"
                    placeholder="1"
                    aria-label="First payment amount"
                  />
                </div>
                <span className="mt-3 block text-[12px] font-light leading-[1.45] text-[#1D1D1F]/50">
                  Minimum $1. Remaining commitment after this payment: {formatCurrency(remainingAfterFirstPayment)}.
                </span>
              </label>
              {firstPaymentError && (
                <p className="mt-3 text-[12px] font-medium text-[#B42318]">{firstPaymentError}</p>
              )}
              <FieldRow
                icon="receipt_long"
                label="Payment Rule"
                value="The browser cannot mark payment as successful. Stripe webhook confirmation updates the Hushh ledger."
                border={false}
              />
            </SectionCard>

            {(latestPaymentStatus || paymentRequest) && (
              <SectionCard title="Payment Request">
                <FieldRow
                  icon="confirmation_number"
                  label="Reference"
                  value={paymentRequest?.request_reference || latestPaymentStatus?.request_reference || "Pending"}
                />
                <FieldRow
                  icon="payments"
                  label="Status"
                  value={formatStatus(paymentRequest?.status || latestPaymentStatus?.status)}
                />
                <FieldRow
                  icon="manage_accounts"
                  label="Investor Review"
                  value={formatStatus(latestReviewStatus)}
                  border={false}
                />
              </SectionCard>
            )}

            <section className="space-y-3 pb-12">
              {(uxState === "payment_in_review" || uxState === "verified") && (
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleContinueToMeetCeo}
                  className={primaryCtaClass}
                >
                  Continue to Meet the CEO
                </HushhTechCta>
              )}

              {uxState === "awaiting_request" && (
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleCreatePaymentLink}
                  disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits}
                  className={primaryCtaClass}
                >
                  {loading ? "Creating Payment Link..." : "Send Secure Payment Link"}
                </HushhTechCta>
              )}

              {uxState === "request_sent" && (
                <>
                  {paymentRequest?.payment_url && (
                    <HushhTechCta
                      variant={HushhTechCtaVariant.BLACK}
                      onClick={openPaymentLink}
                      className={primaryCtaClass}
                    >
                      Open Payment Link
                    </HushhTechCta>
                  )}
                  <HushhTechCta
                    variant={HushhTechCtaVariant.WHITE}
                    onClick={handleCreatePaymentLink}
                    disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits}
                    className={secondaryCtaClass}
                  >
                    {loading ? "Creating Payment Link..." : "Send a new link"}
                  </HushhTechCta>
                </>
              )}

              {uxState === "payment_reversed" && (
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleCreatePaymentLink}
                  disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits}
                  className={primaryCtaClass}
                >
                  {loading ? "Creating Payment Link..." : "Request new payment link"}
                </HushhTechCta>
              )}

              {uxState !== "payment_in_review" && uxState !== "verified" && (
                <p className="px-1 pt-3 text-center text-[12px] font-light leading-[1.5] text-[#1D1D1F]/55">
                  Your progress is saved. Close this page and return from your
                  email link, or sign back in to continue here.
                </p>
              )}
            </section>

            <section className="flex flex-col items-center justify-center gap-2 pb-8 text-center">
              <div className="flex items-center gap-1.5">
                {Icon.lock("#0066CC", 12)}
                <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                  Stripe Payment / Plaid Verification
                </span>
              </div>
              <p className="max-w-xs text-[10px] font-light leading-[1.4] text-[#1D1D1F]/40">
                No Stripe secret, Plaid token, raw ACH, or card data is exposed in the browser.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
