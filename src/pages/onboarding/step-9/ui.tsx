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
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";
import ConsentCheckbox from "../../../components/consent/ConsentCheckbox";
import { CONSENT_COPY, CONSENT_LINKS } from "../../../services/consent/consentConfig";

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
    canStartOver,
    isStartOverConfirmOpen,
    isStartingOver,
    startOverError,
    openStartOverConfirm,
    closeStartOverConfirm,
    handleConfirmStartOver,
    commitmentAcknowledged,
    commitmentAckError,
    handleCommitmentAckChange,
    getUnits,
    setFirstPaymentAmount,
    handleBack,
    handleCreatePaymentLink,
    handleContinueToMeetCeo,
    openPaymentLink,
  } = useStep13Logic();

  // P0.A — Universal "manage bank" affordance. Earlier this only surfaced
  // for users who explicitly skipped Plaid; now we show it for connected
  // users too (worded as "Change linked bank"), so any user can jump into
  // FL review mode without having to back-chain through every KYC step.
  // Hidden once payment is paid+/verified because investor access locks
  // the bank anyway.
  const isInvestorActive =
    uxState === "payment_in_review" || uxState === "verified";
  const canManageBank = !isInvestorActive;
  const manageBankCopy = hasPlaidVerificationData
    ? "Change your linked bank"
    : financialLinkStatus === "skipped"
      ? "Connect a bank to speed up review"
      : "Connect a bank";

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

        <section className="pb-8 pt-8 text-center">
          <Eyebrow>Final Step</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Confirm your fund payment.
          </Display>
          <Lede className="max-w-[500px]">
            Stripe collects the first payment while Plaid continues to support
            verification, financial intelligence, and manual investor review. This
            single $1 also unlocks your 1-on-1 with the fund manager and credits
            300,000 Hushh Coins — no further charge.
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
              {canManageBank && (
                <div className="mt-2 px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => navigate(FINANCIAL_LINK_REVIEW_ROUTE)}
                    className="w-full rounded-[14px] bg-white px-4 py-3 text-left text-[13px] font-medium text-[#0066CC] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.18)] transition hover:bg-[#0066CC]/[0.04]"
                  >
                    <span className="material-symbols-outlined align-middle text-[16px]">
                      {hasPlaidVerificationData ? "swap_horiz" : "add_link"}
                    </span>
                    <span className="ml-2 align-middle">{manageBankCopy}</span>
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

              {/* Single combined acknowledgment — the only gate before the
                  money commitment. Risk + eligibility + Subscription in one
                  short line, with the long docs linked out. */}
              {(uxState === "awaiting_request" || uxState === "payment_reversed") && (
                <ConsentCheckbox
                  id="commitment-ack"
                  checked={commitmentAcknowledged}
                  onChange={handleCommitmentAckChange}
                  error={commitmentAckError}
                >
                  {CONSENT_COPY.fundCommitment}{" "}
                  <a
                    href={CONSENT_LINKS.riskDisclosures}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-[#0066CC] underline"
                  >
                    Risk Disclosures
                  </a>
                  {" · "}
                  <a
                    href={CONSENT_LINKS.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-[#0066CC] underline"
                  >
                    Terms
                  </a>
                  .
                </ConsentCheckbox>
              )}

              {uxState === "awaiting_request" && (
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleCreatePaymentLink}
                  disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits || !commitmentAcknowledged}
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
                    {loading ? "Resending…" : "Resend payment link"}
                  </HushhTechCta>
                </>
              )}

              {uxState === "payment_reversed" && (
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleCreatePaymentLink}
                  disabled={loading || Boolean(firstPaymentError) || !hasAnyUnits || !commitmentAcknowledged}
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

              {canStartOver && (
                <p className="pt-3 text-center text-[12px] text-[#1D1D1F]/45">
                  Changed your mind about Hushh Fund?{" "}
                  <button
                    type="button"
                    onClick={openStartOverConfirm}
                    className="font-medium text-[#0066CC] underline hover:opacity-80"
                  >
                    Start over
                  </button>
                  .
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

      {isStartOverConfirmOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-[#000000]/35 backdrop-blur-[14px]" />
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="start-over-title"
              className="w-full max-w-[390px] rounded-[24px] bg-white p-5 text-[#1D1D1F] shadow-[0_24px_72px_rgba(0,0,0,0.22)]"
            >
              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF9500]/12">
                  <span
                    className="material-symbols-outlined text-[22px] text-[#B45309]"
                    style={{ fontVariationSettings: "'wght' 300" }}
                  >
                    refresh
                  </span>
                </div>
                <h2 id="start-over-title" className="text-[19px] font-semibold text-[#1D1D1F]">
                  Start over?
                </h2>
                <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-5 text-[#1D1D1F]/65">
                  This clears your fund commitment selections, KYC details, and
                  bank link. Payment receipts on Stripe are preserved. You'll
                  begin at the financial-link step.
                </p>
              </div>

              {startOverError && (
                <div className="mb-4 rounded-[16px] bg-[#FF3B30]/10 p-3 text-center shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
                  <p className="text-[12px] font-medium text-[#B42318]">{startOverError}</p>
                </div>
              )}

              <div className="space-y-3">
                <HushhTechCta
                  variant={HushhTechCtaVariant.BLACK}
                  onClick={handleConfirmStartOver}
                  disabled={isStartingOver}
                  className={primaryCtaClass}
                >
                  {isStartingOver && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Start over
                </HushhTechCta>
                <HushhTechCta
                  variant={HushhTechCtaVariant.WHITE}
                  onClick={closeStartOverConfirm}
                  disabled={isStartingOver}
                  className={secondaryCtaClass}
                >
                  Cancel
                </HushhTechCta>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
