/**
 * Step 11 — Investment Summary
 * Premium Hushh design matching Step 1-9.
 * Share class cards, edit modal, recurring investment config.
 * Logic stays in logic.ts — zero logic changes.
 */
import { useRef } from 'react';
import { CheckCircle2, Info, Pencil, ScrollText, ShieldCheck } from 'lucide-react';
import {
  useStep11Logic,
  SHARE_CLASSES,
  FREQUENCY_OPTIONS,
  AMOUNT_PRESETS,
  DAY_OPTIONS,
  DISPLAY_STEP,
  PROG_TOTAL,
  PROG_PCT,
  formatCurrency,
  formatFullCurrency,
  parseFormattedNumber,
  type RecurringFrequency,
} from './logic';
import HushhTechBackHeader from '../../../components/hushh-tech-back-header/HushhTechBackHeader';
import OnboardingBankReviewChip from '../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip';
import HushhTechCta, {
  HushhTechCtaVariant,
} from '../../../components/hushh-tech-cta/HushhTechCta';
import { useModalKeyboardNavigation } from '../../../hooks/useModalKeyboardNavigation';
import {
  AppleLineIcon,
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from '../../../components/hushh-tech-ui/HushhAppleUI';

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";
const CLASS_MARKS: Record<string, string> = {
  class_a: "A",
  class_b: "B",
  class_c: "C",
};

function ClassMark({ id, active }: { id: string; active: boolean }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden text-[17px] font-medium tracking-[-0.02em] text-[#6E6E73]"
      style={{
        borderRadius: 14,
        background: active
          ? "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)"
          : "linear-gradient(180deg, #F9F9FA 0%, #F1F1F3 100%)",
        boxShadow:
          "inset 0 0 0 0.5px rgba(29,29,31,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
      aria-hidden="true"
    >
      {CLASS_MARKS[id] || "A"}
    </span>
  );
}

export default function OnboardingStep11() {
  const {
    loading,
    error,
    shareUnits,
    frequency,
    investmentDay,
    selectedAmount,
    customAmount,
    customAmountError,
    showRecurringEditor,
    isModalOpen,
    localShareUnits,
    savingModal,
    totalInvestment,
    modalTotalInvestment,
    hasModalChanges,
    hasAnyUnits,
    recurringAmount,
    isFormValid,
    recurringSummaryTitle,
    recurringSummarySubtitle,
    getUnits,
    getModalUnits,
    getUnitsSummary,
    handleBack,
    handleSkip,
    handleContinue,
    handleOpenModal,
    handleCloseModal,
    handleIncrement,
    handleDecrement,
    handleSaveChanges,
    handleAmountClick,
    handleCustomAmountChange,
    setFrequency,
    setInvestmentDay,
    setShowRecurringEditor,
  } = useStep11Logic();
  const allocationModalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen: isModalOpen,
    containerRef: allocationModalRef,
    initialFocusRef: cancelButtonRef,
    onClose: handleCloseModal,
  });

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Header ═══ */}
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
      <OnboardingBankReviewChip />

      <main className="mx-auto w-full max-w-[680px] flex-grow px-4 pb-48 sm:px-5">
        {/* ── Progress Bar ── */}
        <div className="pb-6 pt-5">
          <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            <span>Step {DISPLAY_STEP}/{PROG_TOTAL}</span>
            <span>{PROG_PCT}% Complete</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1D1D1F]/10">
            <div className="h-full rounded-full bg-[#0066CC] transition-all duration-500" style={{ width: `${PROG_PCT}%` }} />
          </div>
        </div>

        {/* ── Title Section ── */}
        <section className="pb-8 pt-4 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="chart" size={58} />
          </div>
          <Eyebrow>Investment</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Your investment summary.
          </Display>
          <Lede className="max-w-[480px]">
            Review your share class allocation and set up recurring investments.
          </Lede>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            <AppleLineIcon icon={Info} size={40} className="text-[#FF3B30]" />
            <p className="text-[14px] font-medium text-[#B42318]">{error}</p>
          </div>
        )}

        {/* ── Share Class Units Section ── */}
        <section className="mb-6">
          <div className="py-4">
            <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">Share Class Units</h3>
          </div>

          <div className="grid gap-3">
            {SHARE_CLASSES.map((shareClass) => {
              const units = getUnits(shareClass.id);
              const subtotal = units * shareClass.unitPrice;
              const hasUnits = units > 0;

              return (
                <div
                  key={shareClass.id}
                  className={`rounded-[20px] p-4 transition sm:rounded-[22px] ${
                    hasUnits
                      ? 'bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]'
                      : 'bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <ClassMark id={shareClass.id} active={hasUnits} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-medium text-[#1D1D1F]">{shareClass.name}</span>
                        {hasUnits && (
                          <span className="rounded-full bg-[#34C759]/10 px-2 py-0.5 text-[10px] font-medium text-[#188038] shadow-[inset_0_0_0_1px_rgba(52,199,89,0.18)]">Active</span>
                        )}
                      </div>
                      <span className="mt-1 block text-[12px] font-normal leading-relaxed text-[#1D1D1F]/55">
                        {formatCurrency(shareClass.unitPrice)}/unit · {units} {units === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                    {hasUnits && (
                      <span className="shrink-0 text-right text-[14px] font-medium text-[#1D1D1F]">{formatCurrency(subtotal)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit link */}
          <button
            onClick={handleOpenModal}
            className="mt-3 flex items-center gap-2 rounded-full px-1 py-3 text-[13px] font-medium text-[#1D1D1F] transition hover:text-[#0066CC]"
          >
            <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>Edit Share Allocation</span>
          </button>
        </section>

        {/* ── Total Investment Card ── */}
        <section className="mb-8">
          <div className="rounded-[28px] bg-[#000000] p-6 text-[#F5F5F7] shadow-[0_18px_44px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col items-center text-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#2997FF]/85">Total Investment</span>
              <span className="text-[34px] font-medium leading-[1.06] tracking-[-0.028em] sm:text-[40px]" style={{ fontFamily: appleFont }}>
                {hasAnyUnits ? formatFullCurrency(totalInvestment) : '$0'}
              </span>
              {hasAnyUnits && (
                <>
                  <div className="my-1 h-px w-12 bg-[#F5F5F7]/20" />
                  <span className="text-[12px] font-light text-[#F5F5F7]/60">{getUnitsSummary()}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Info Note ── */}
        <div className="mb-8 flex items-start gap-3 rounded-[18px] bg-[#F5F5F7] px-4 py-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <AppleLineIcon icon={Info} size={40} />
          <p className="pt-1 text-[12px] font-light leading-[1.45] text-[#1D1D1F]/60">
            We are currently accepting investments of $1 million or greater for Hushh Fund A.
          </p>
        </div>

        {/* ── Recurring Investment Section ── */}
        <section className="mb-6">
          <div className="py-4">
            <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">Recurring Investment</h3>
          </div>

          {/* Collapsed summary + edit */}
          <div className="rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={ScrollText} size={44} />
              <div className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium text-[#1D1D1F]">{recurringSummaryTitle}</span>
                <span className="text-[12px] font-normal text-[#1D1D1F]/55">{recurringSummarySubtitle}</span>
              </div>
              <button
                onClick={() => setShowRecurringEditor((prev) => !prev)}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#1D1D1F] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] transition hover:bg-[#FFFFFF]/80"
              >
                {showRecurringEditor ? 'Hide' : 'Edit'}
              </button>
            </div>
          </div>

          {showRecurringEditor && (
            <div className="mt-3 overflow-hidden rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              {/* Frequency */}
              <div className="border-b border-[#1D1D1F]/[0.08] py-5">
                <span className="mb-4 block text-[14px] font-medium text-[#1D1D1F]">Frequency</span>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {FREQUENCY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFrequency(option.value as RecurringFrequency)}
                      className={`h-11 rounded-full text-[12px] font-medium transition-all lowercase ${
                        frequency === option.value
                          ? 'bg-[#0066CC] text-white'
                          : 'border border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Investment Day — overlay select */}
                <div className="relative cursor-pointer rounded-[16px] border border-[#1D1D1F]/10 bg-white py-4">
                  <div className="flex items-center gap-3 px-4 pointer-events-none">
                    <div className="flex-1 min-w-0">
                      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">Investment Day</span>
                      <span className="text-[14px] font-medium text-[#1D1D1F]">
                        {DAY_OPTIONS.find(o => o.value === investmentDay)?.label || 'Select day'}
                      </span>
                    </div>
                    <span className="text-[#1D1D1F]/35">{Icon.chevronDown("currentColor", 12)}</span>
                  </div>
                  <select
                    value={investmentDay}
                    onChange={(e) => setInvestmentDay(e.target.value)}
                    aria-label="Investment day"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    {DAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recurring Amount */}
              <div className="py-5">
                <span className="mb-4 block text-[14px] font-medium text-[#1D1D1F]">Recurring Amount</span>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {AMOUNT_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountClick(amount)}
                      className={`relative rounded-full py-3 text-[13px] font-medium transition-all lowercase ${
                        selectedAmount === amount
                          ? 'bg-[#0066CC] text-white'
                          : 'border border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]'
                      }`}
                    >
                      ${amount.toLocaleString()}
                      {selectedAmount === amount && (
                        <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066CC] text-white">
                          <CheckCircle2 size={13} strokeWidth={2} aria-hidden="true" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <span className={`absolute inset-y-0 left-0 flex items-center pl-4 text-[16px] font-medium ${customAmountError ? 'text-[#FF3B30]' : 'text-[#1D1D1F]/40'}`}>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="other amount"
                      className={`h-12 w-full rounded-[16px] border bg-white pl-8 pr-4 text-[16px] font-medium lowercase text-[#1D1D1F] outline-none transition-all placeholder:text-[#1D1D1F]/30 ${
                        customAmountError
                          ? 'border-[#FF3B30]/40 focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30]'
                          : 'border-[#1D1D1F]/10 focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]'
                      }`}
                    />
                  </div>
                  {customAmountError && <p className="px-1 text-[12px] font-medium text-[#FF3B30]">{customAmountError}</p>}
                  {!customAmountError && customAmount && (
                    <p className="px-1 text-[12px] font-medium text-[#188038]">Amount: ${parseFormattedNumber(customAmount).toLocaleString()}</p>
                  )}
                  {!customAmount && selectedAmount === null && (
                    <p className="px-1 text-[12px] font-light text-[#1D1D1F]/45">Leave empty to set recurring later.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── CTAs ── */}
        <section className="pb-12 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleContinue}
            disabled={!isFormValid || loading}
            className={primaryCtaClass}
          >
            {loading ? 'Saving...' : 'Continue'}
          </HushhTechCta>
          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleSkip}
            className={secondaryCtaClass}
          >
            Skip for Now
          </HushhTechCta>
        </section>

        {/* ── Trust Badge ── */}
        <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} strokeWidth={1.8} className="text-[#0066CC]" aria-hidden="true" />
            <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">SEC Registered Fund</span>
          </div>
          <p className="max-w-xs text-[10px] font-light text-[#1D1D1F]/42">
            Hushh Fund A is a registered investment vehicle.
          </p>
        </section>
      </main>

      {/* ═══ Edit Share Class Modal ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/45 backdrop-blur-sm">
          <div
            ref={allocationModalRef}
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.18)] animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="allocation-modal-title"
            tabIndex={-1}
          >
            {/* Modal Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#1D1D1F]/10 bg-white px-6">
              <button ref={cancelButtonRef} onClick={handleCloseModal} className="text-[14px] font-medium text-[#1D1D1F]/55">Cancel</button>
              <h2 id="allocation-modal-title" className="text-[14px] font-medium text-[#1D1D1F]">Edit Allocation</h2>
              <button
                onClick={handleSaveChanges}
                disabled={!hasModalChanges || savingModal}
                className={`text-[14px] font-medium ${hasModalChanges ? 'text-[#0066CC]' : 'text-[#1D1D1F]/28'}`}
              >
                {savingModal ? '...' : 'Done'}
              </button>
            </header>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 pb-48">
              <div className="grid gap-3">
                {SHARE_CLASSES.map((shareClass) => {
                  const units = getModalUnits(shareClass.id);
                  const subtotal = units * shareClass.unitPrice;

                  return (
                    <div key={shareClass.id} className="rounded-[18px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <span className="block text-[14px] font-medium text-[#1D1D1F]">{shareClass.name}</span>
                          <span className="text-[12px] font-normal text-[#1D1D1F]/55">{formatCurrency(shareClass.unitPrice)}/unit</span>
                        </div>
                        {shareClass.badge && (
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[#1D1D1F]/55 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">{shareClass.badge}</span>
                        )}
                      </div>

                      {/* Unit controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-normal text-[#1D1D1F]/55">
                          {units > 0 ? formatCurrency(subtotal) : 'No units'}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDecrement(shareClass.id)}
                            disabled={units === 0}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                              units === 0 ? 'border-[#1D1D1F]/10 text-[#1D1D1F]/25' : 'border-[#1D1D1F]/15 text-[#1D1D1F]/60 hover:bg-white active:scale-95'
                            }`}
                            aria-label="Decrease units"
                          >
                            <span className="text-[18px] leading-none" aria-hidden="true">-</span>
                          </button>
                          <span className="min-w-[40px] text-center text-[20px] font-medium text-[#1D1D1F]">{units}</span>
                          <button
                            onClick={() => handleIncrement(shareClass.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1D1D1F]/20 text-[#1D1D1F] transition-all hover:bg-white active:scale-95"
                            aria-label="Increase units"
                          >
                            <span className="text-[18px] leading-none" aria-hidden="true">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Total */}
              <div className="mt-6 rounded-[22px] bg-[#000000] p-5 text-[#F5F5F7]">
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#2997FF]/85">Total Investment</span>
                  <span className="text-[24px] font-medium tracking-[-0.028em]">
                    {formatFullCurrency(modalTotalInvestment)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation */}
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
