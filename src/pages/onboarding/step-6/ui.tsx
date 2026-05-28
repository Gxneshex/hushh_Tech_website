/**
 * Step 9 — SSN + Date of Birth
 * UI follows the Step 1/2 + Home/Fund A Apple treatment.
 */
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Info,
  LockKeyhole,
} from "lucide-react";
import {
  useStep9Logic,
  PROGRESS_PCT,
  DISPLAY_STEP,
  TOTAL_STEPS,
  MONTH_NAMES,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  AppleLineIcon,
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep9() {
  const {
    ssn,
    dobMonth,
    setDobMonth,
    dobDay,
    setDobDay,
    dobYear,
    setDobYear,
    loading,
    error,
    showInfo,
    isFormValid,
    isUnder18,
    ageError,
    yearOptions,
    dayOptions,
    handleSSNChange,
    handleContinue,
    handleSkip,
    handleBack,
    handleShowInfoToggle,
  } = useStep9Logic();

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
            <span>Step {DISPLAY_STEP}/{TOTAL_STEPS}</span>
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
            <AppIcon kind="shield" size={58} />
          </div>
          <Eyebrow>Verification</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            A few more details.
          </Display>
          <Lede className="max-w-[480px]">
            Federal law requires us to collect this info for tax reporting.
          </Lede>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
            <AppleLineIcon
              icon={AlertCircle}
              size={40}
              className="!text-[#FF3B30]"
            />
            <p className="text-[14px] font-medium text-[#B42318]">{error}</p>
          </div>
        )}

        {/* ── SSN Section ── */}
        <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            Tax Reporting
          </h3>

          <div className="border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={LockKeyhole} size={40} />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="ssn"
                  className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                >
                  Social Security Number
                </label>
                <input
                  id="ssn"
                  type="text"
                  value={ssn}
                  onChange={handleSSNChange}
                  placeholder="000-00-0000"
                  maxLength={11}
                  inputMode="numeric"
                  className="w-full border-none bg-transparent p-0 text-[15px] font-medium tracking-widest text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                />
              </div>
            </div>
          </div>

          {/* Why SSN Info */}
          <details
            className="group"
            open={showInfo}
            onToggle={(e) =>
              handleShowInfoToggle((e.target as HTMLDetailsElement).open)
            }
          >
            <summary className="py-5 flex items-center gap-4 cursor-pointer list-none">
              <AppleLineIcon
                icon={Info}
                size={40}
                className="transition group-hover:scale-[1.02]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#1D1D1F]">
                  Why do we need your SSN?
                </p>
                <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                  Tap to learn more
                </p>
              </div>
              <span className="text-[#1D1D1F]/35 transition-transform group-open:rotate-180">
                {Icon.chevronDown("currentColor", 12)}
              </span>
            </summary>
            <div className="pl-14 pb-5 pr-4">
              <p className="text-[12px] font-light leading-[1.45] text-[#1D1D1F]/60">
                We are required by federal law to collect this information to prevent fraud and verify your identity before opening an investment account.
              </p>
            </div>
          </details>
        </section>

        {/* ── Date of Birth Section ── */}
        <section className="mb-8 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            Date of Birth
          </h3>

          {/* Month — overlay select */}
          <div className="relative cursor-pointer border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4 pointer-events-none">
              <AppleLineIcon icon={CalendarDays} size={40} />
              <div className="flex-1 min-w-0">
                <span className="mb-1 block text-[14px] font-medium text-[#1D1D1F]">
                  Month
                </span>
                <span className="text-[15px] font-medium text-[#1D1D1F]/70">
                  {dobMonth ? MONTH_NAMES[parseInt(dobMonth) - 1] : 'Select month'}
                </span>
              </div>
              <span className="text-[#1D1D1F]/35">
                {Icon.chevronDown("currentColor", 12)}
              </span>
            </div>
            <select
              value={dobMonth}
              onChange={(e) => setDobMonth(e.target.value)}
              aria-label="Birth month"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="" disabled>Select month</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={String(idx + 1).padStart(2, "0")}>{name}</option>
              ))}
            </select>
          </div>

          {/* Day — overlay select */}
          <div className="relative cursor-pointer border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4 pointer-events-none">
              <AppleLineIcon icon={Calendar} size={40} />
              <div className="flex-1 min-w-0">
                <span className="mb-1 block text-[14px] font-medium text-[#1D1D1F]">
                  Day
                </span>
                <span className="text-[15px] font-medium text-[#1D1D1F]/70">
                  {dobDay ? parseInt(dobDay) : 'Select day'}
                </span>
              </div>
              <span className="text-[#1D1D1F]/35">
                {Icon.chevronDown("currentColor", 12)}
              </span>
            </div>
            <select
              value={dobDay}
              onChange={(e) => setDobDay(e.target.value)}
              aria-label="Birth day"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="" disabled>Select day</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>{parseInt(d)}</option>
              ))}
            </select>
          </div>

          {/* Year — overlay select */}
          <div className="relative cursor-pointer py-5">
            <div className="flex items-center gap-4 pointer-events-none">
              <AppleLineIcon icon={CalendarDays} size={40} />
              <div className="flex-1 min-w-0">
                <span className="mb-1 block text-[14px] font-medium text-[#1D1D1F]">
                  Year
                </span>
                <span className="text-[15px] font-medium text-[#1D1D1F]/70">
                  {dobYear || 'Select year'}
                </span>
              </div>
              <span className="text-[#1D1D1F]/35">
                {Icon.chevronDown("currentColor", 12)}
              </span>
            </div>
            <select
              value={dobYear}
              onChange={(e) => setDobYear(e.target.value)}
              aria-label="Birth year"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="" disabled>Select year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* 18+ age warning */}
          {isUnder18 && ageError && (
            <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
              <AppleLineIcon
                icon={AlertCircle}
                size={40}
                className="!text-[#FF3B30]"
              />
              <p className="text-[14px] font-medium text-[#B42318]">
                {ageError}
              </p>
            </div>
          )}

          {/* Confirmation when all selected and 18+ */}
          {isFormValid && (
            <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-[#34C759]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(52,199,89,0.20)]">
              <AppleLineIcon
                icon={CheckCircle2}
                size={40}
                className="!text-[#34C759]"
              />
              <p className="text-[14px] font-medium text-[#1D1D1F]/70">
                {MONTH_NAMES[parseInt(dobMonth) - 1]} {parseInt(dobDay)}, {dobYear}
              </p>
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
            {loading ? "Saving..." : "Continue"}
          </HushhTechCta>
          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleSkip}
            disabled={!isFormValid || loading}
            className={secondaryCtaClass}
          >
            Skip SSN
          </HushhTechCta>
        </section>

        {/* ── Trust Badges ── */}
        <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
          <div className="flex items-center gap-1">
            {Icon.lock("#0066CC", 12)}
            <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">256 Bit Encryption</span>
          </div>
          <p className="max-w-xs text-[10px] font-light text-[#1D1D1F]/45">
            Your SSN is encrypted end-to-end and never stored in plain text.
          </p>
        </section>
      </main>
    </div>
  );
}
