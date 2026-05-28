/**
 * Step 1 — Fund A Allocation Tier
 * Matches the refined HTML design. Logic stays in logic.ts.
 * Uses HushhTechBackHeader + HushhTechCta reusable components.
 */
import {
  useStep1Logic,
  SHARE_CLASSES,
  TOTAL_STEPS,
  FREQ_OPTIONS,
  AMOUNT_PRESETS,
  formatCurrency,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

/** Neutral class marks keep the allocation UI tied to the fund language. */
const CLASS_MARKS: Record<string, string> = {
  class_a: "A",
  class_b: "B",
  class_c: "C",
};

/** Tier descriptions */
const TIER_LABELS: Record<string, string> = {
  ultra: "ultra high net worth",
  premium: "high net worth",
  standard: "accredited investor",
};

/** Day options for investment */
const DAY_OPTIONS = [
  { value: "1st of the month", label: "1st of month" },
  { value: "15th of the month", label: "15th of month" },
  { value: "Last day of the month", label: "Last day" },
];

const CURRENT_STEP = 1;
const PROGRESS_PCT = Math.round((CURRENT_STEP / TOTAL_STEPS) * 100);
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

function ClassMark({ id, active }: { id: string; active: boolean }) {
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden text-[18px] font-medium tracking-[-0.02em] text-[#6E6E73]"
      style={{
        borderRadius: 15,
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

export default function OnboardingStep1() {
  const {
    units,
    frequency,
    investmentDay,
    selectedAmount,
    customAmount,
    customAmountError,
    error,
    isLoading,
    hasSelection,
    recurringEnabled,
    toggleRecurring,
    handleUnitChange,
    handleAmountClick,
    handleCustomAmountChange,
    setFrequency,
    setInvestmentDay,
    handleNext,
    handleBack,
  } = useStep1Logic();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Header ═══ */}
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
      <OnboardingBankReviewChip />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
        {/* ── Progress Bar ── */}
        <div className="pb-6 pt-5">
          <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            <span>Step {CURRENT_STEP}/{TOTAL_STEPS}</span>
            <span>{PROGRESS_PCT}% Complete</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#1D1D1F]/10">
            <div
              className="h-full rounded-full bg-[#0066CC] transition-all duration-500"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
          </div>
        </div>

        {/* ── Title Section ── */}
        <section className="pb-8 pt-4 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="monoA" size={58} />
          </div>
          <Eyebrow>Institutional Series</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Hushh Fund A multi-strategy alpha.
          </Display>
          <Lede className="max-w-[480px]">
            Choose the share class and optional recurring investment schedule
            that matches your allocation plan.
          </Lede>
        </section>

        {/* ── Share Class Rows ── */}
        <section className="mb-10 mt-2 grid gap-3">
          {SHARE_CLASSES.map((sc) => {
            const count = units[sc.id] || 0;
            const isActive = count > 0;
            return (
              <div
                key={sc.id}
                className={`group flex flex-col gap-4 rounded-[20px] p-4 transition sm:flex-row sm:items-center sm:justify-between sm:rounded-[22px] ${
                  isActive
                    ? "bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                    : "bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                }`}
              >
                {/* Left: icon + name + tier */}
                <div className="flex w-full items-start gap-4 sm:w-auto">
                  <ClassMark id={sc.id} active={isActive} />
                  <div className="min-w-0">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <h2 className="text-[16px] font-medium text-[#1D1D1F]">
                        {sc.name}
                      </h2>
                      {sc.id === "class_a" && (
                        <span className="rounded-full bg-[#0066CC]/10 px-2 py-0.5 text-[10px] font-medium text-[#0066CC]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-normal leading-relaxed text-[#1D1D1F]/55">
                      {TIER_LABELS[sc.tier] || sc.description}
                    </p>
                  </div>
                </div>

                {/* Right: price + stepper */}
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-left sm:mb-1 sm:text-right">
                    <span className="text-[14px] font-medium text-[#1D1D1F]">
                      {sc.displayPrice}
                    </span>{" "}
                    <span className="text-[10px] text-[#1D1D1F]/45">
                      /unit
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-full px-2 py-1 ${
                      isActive
                        ? "bg-white"
                        : "opacity-50 group-hover:opacity-100 transition-opacity"
                    }`}
                  >
                    <button
                      onClick={() => handleUnitChange(sc.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#1D1D1F]/60 transition hover:bg-[#1D1D1F]/10 hover:text-[#1D1D1F]"
                      aria-label={`Decrease ${sc.name}`}
                    >
                      <span className="text-[17px] leading-none" aria-hidden="true">-</span>
                    </button>
                    <span
                      className={`w-4 text-center font-mono text-[14px] font-medium ${
                        isActive ? "text-[#1D1D1F]" : "text-[#1D1D1F]/50"
                      }`}
                    >
                      {count}
                    </span>
                    <button
                      onClick={() => handleUnitChange(sc.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[#1D1D1F] transition hover:bg-[#1D1D1F]/10"
                      aria-label={`Increase ${sc.name}`}
                    >
                      <span className="text-[17px] leading-none" aria-hidden="true">+</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Recurring Investment ── */}
        <section className="mb-10 rounded-[24px] bg-[#F5F5F7] p-5 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="mb-8 flex items-center justify-between">
            <h3
              className="text-[22px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
              style={{ fontFamily: appleFont }}
            >
              Recurring investment
            </h3>
            {/* Toggle switch */}
            <button
              onClick={toggleRecurring}
              className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#0066CC]/35 focus:ring-offset-2"
              style={{ backgroundColor: recurringEnabled ? '#0066CC' : 'rgba(29,29,31,0.18)' }}
              role="switch"
              aria-checked={recurringEnabled}
              aria-label="Toggle recurring investment"
              tabIndex={0}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${
                  recurringEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show subtitle when toggle is OFF */}
          {!recurringEnabled && (
            <p className="-mt-4 mb-4 text-[13px] font-light text-[#1D1D1F]/50">
              Enable to set up automatic recurring investments
            </p>
          )}

          {/* Recurring options — only visible when toggle is ON */}
          {recurringEnabled && (
          <div className="space-y-0">
            {/* ── Frequency: selectable pills ── */}
            <div className="border-b border-[#1D1D1F]/[0.08] py-5">
              <div className="mb-4 flex items-center gap-4">
                <AppIcon kind="clock" size={40} />
                <div>
                  <p className="mb-0.5 text-[14px] font-medium text-[#1D1D1F]">
                    Frequency
                  </p>
                  <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                    Choose payment schedule
                  </p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:pl-14">
                {FREQ_OPTIONS.map((opt) => {
                  const isSelected = frequency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFrequency(opt.value)}
                      className={`flex-shrink-0 rounded-full border px-4 py-2.5 text-[12px] font-medium transition whitespace-nowrap ${
                        isSelected
                          ? "border-[#0066CC] bg-[#0066CC] text-white"
                          : "border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]"
                      }`}
                    >
                      {opt.label.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Day: selectable pills ── */}
            <div className="border-b border-[#1D1D1F]/[0.08] py-5">
              <div className="mb-4 flex items-center gap-4">
                <AppIcon kind="clock" size={40} />
                <div>
                  <p className="mb-0.5 text-[14px] font-medium text-[#1D1D1F]">
                    Day
                  </p>
                  <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                    Select debit date
                  </p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 sm:pl-14">
                {DAY_OPTIONS.map((opt) => {
                  const isSelected = investmentDay === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setInvestmentDay(opt.value)}
                      className={`flex-shrink-0 rounded-full border px-4 py-2.5 text-[12px] font-medium transition whitespace-nowrap ${
                        isSelected
                          ? "border-[#0066CC] bg-[#0066CC] text-white"
                          : "border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Amount: selectable pills ── */}
            <div className="py-5">
              <div className="mb-4 flex items-center gap-4">
                <AppIcon kind="dollar" size={40} />
                <div>
                  <p className="mb-0.5 text-[14px] font-medium text-[#1D1D1F]">
                    Amount
                  </p>
                  <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                    Investment per cycle
                  </p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pl-14">
                {AMOUNT_PRESETS.map((amt) => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => handleAmountClick(amt)}
                      className={`flex-shrink-0 rounded-full border px-5 py-2.5 font-mono text-[12px] font-medium transition whitespace-nowrap ${
                        isSelected
                          ? "border-[#0066CC] bg-[#0066CC] text-white"
                          : "border-[#1D1D1F]/10 bg-white text-[#1D1D1F]/70 hover:bg-[#F5F5F7]"
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount input */}
              <div className="mt-3 sm:pl-14">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#1D1D1F]/50">
                    $
                  </span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="Custom amount"
                    className="w-full rounded-[14px] border border-[#1D1D1F]/10 bg-white py-3 pl-7 pr-4 font-mono text-[14px] text-[#1D1D1F] outline-none transition placeholder:text-[#1D1D1F]/35 focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                  />
                </div>
                {customAmountError && (
                  <p className="mt-1 text-[12px] font-medium text-[#FF3B30]">{customAmountError}</p>
                )}
              </div>
            </div>
          </div>
          )}
        </section>

        {/* ── Error message ── */}
        {error && (
          <div className="mb-4 rounded-[16px] bg-[#FF3B30]/10 p-3 text-center text-[12px] font-medium text-[#B42318] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            {error}
          </div>
        )}

        {/* ── CTAs — Continue & Skip ── */}
        <section className="pb-12 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleNext}
            disabled={!hasSelection || isLoading}
            className={primaryCtaClass}
          >
            {isLoading ? "Saving..." : "Continue"}
          </HushhTechCta>

          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleBack}
            className={secondaryCtaClass}
          >
            Skip
          </HushhTechCta>
        </section>

        {/* ── Trust Badges ── */}
        <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Icon.lock("#0066CC", 12)}
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                256 Bit Encryption
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
