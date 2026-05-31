/**
 * Step 5 — A Few More Details (Account Type + Phone)
 * Premium Hushh design matching Step 1/2/4.
 * Logic stays in logic.ts — zero logic changes.
 * Uses HushhTechBackHeader + HushhTechCta reusable components.
 */
import { useRef } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  Building2,
  Check,
  CircleUserRound,
  Landmark,
  PiggyBank,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  useStep5Logic,
  DISPLAY_STEP,
  TOTAL_STEPS,
  PROGRESS_PCT,
  PHONE_DIAL_CODES,
  ACCOUNT_TYPE_OPTIONS,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import { useModalKeyboardNavigation } from "../../../hooks/useModalKeyboardNavigation";
import {
  AppleLineIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

/** Neutral account icons through the shared Apple-style provider. */
const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  individual: CircleUserRound,
  joint: UsersRound,
  trust: ShieldCheck,
  entity: Building2,
  ira: PiggyBank,
  sdira: Landmark,
};
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep5() {
  const {
    selectedAccountType,
    setSelectedAccountType,
    phoneNumber,
    countryCode,
    selectedDialCountryIso,
    isAutoDetectingDialCode,
    isLoading,
    showDialPicker,
    setShowDialPicker,
    canContinue,
    selectedDialOption,
    formatPhoneNumber,
    isPreFilledFromBank,
    handlePhoneChange,
    handleContinue,
    handleBack,
    handleSkip,
    handleSelectDialCode,
  } = useStep5Logic();
  const dialPickerRef = useRef<HTMLDivElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen: showDialPicker,
    containerRef: dialPickerRef,
    initialFocusRef: doneButtonRef,
    onClose: () => setShowDialPicker(false),
  });

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Background layer (blurs when dial picker is open) ═══ */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          showDialPicker
            ? "scale-[0.98] blur-[2px] opacity-40 pointer-events-none select-none"
            : ""
        }`}
      >
        {/* ═══ Header ═══ */}
        <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
        <OnboardingBankReviewChip />

        <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
          {/* ── Progress Bar ── */}
          <div className="pb-6 pt-5">
            <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              <span>
                Step {DISPLAY_STEP}/{TOTAL_STEPS}
              </span>
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
          <section className="pb-8 pt-8 text-center">
            <Eyebrow>Account Setup</Eyebrow>
            <Display as="h1" size="xs" maxWidth="max-w-[500px]">
              A few more details.
            </Display>
            <Lede className="max-w-[480px]">
              This helps us personalize your account and keep your profile
              secure.
            </Lede>
          </section>

          {/* ── Account Type Selection ── */}
          <section className="mb-10">
            <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Account Type
            </h3>
            <div className="grid gap-3">
              {ACCOUNT_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedAccountType === option.value;
                const IconComponent = ACCOUNT_ICONS[option.value] || CircleUserRound;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedAccountType(option.value)}
                    className={`group flex w-full items-center gap-4 rounded-[20px] p-4 text-left transition-all sm:rounded-[22px] ${
                      isSelected
                        ? "bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                        : "bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] hover:bg-[#F5F5F7]"
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Select ${option.label} account`}
                  >
                    {/* Icon circle */}
                    <AppleLineIcon
                      icon={IconComponent}
                      size={44}
                      className={isSelected ? "ring-1 ring-[#0066CC]/30" : ""}
                    />

                    {/* Label */}
                    <span
                      className={`flex-1 text-[15px] font-medium ${
                        isSelected ? "text-[#1D1D1F]" : "text-[#1D1D1F]/72"
                      }`}
                    >
                      {option.label}
                    </span>

                    {/* Checkmark */}
                    {isSelected && (
                      <Check
                        className="shrink-0 text-[#0066CC]"
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Phone Number ── */}
          <section className="mb-12 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Phone Number
              </h3>
              {isAutoDetectingDialCode && (
                <span className="text-[10px] font-medium text-[#1D1D1F]/45">
                  Detecting...
                </span>
              )}
            </div>
            <p className="mb-5 text-[12px] font-light text-[#1D1D1F]/50">
              We&apos;ll use this to verify your identity when needed.
            </p>

            {/* Phone input row */}
            <div className="border-b border-[#1D1D1F]/[0.08] py-5">
              <div className="flex items-center gap-4">
                {/* Dial code selector */}
                <button
                  onClick={() => setShowDialPicker(true)}
                  className="group flex shrink-0 items-center gap-2"
                  aria-label="Select country code"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white transition-colors group-hover:bg-white/75">
                    <ReactCountryFlag
                      countryCode={selectedDialOption.iso}
                      svg
                      style={{
                        width: "1.5em",
                        height: "1.5em",
                        borderRadius: 2,
                      }}
                      aria-label={selectedDialOption.country}
                    />
                  </div>
                  <span className="text-[14px] font-medium text-[#1D1D1F]">
                    {selectedDialOption.code}
                  </span>
                  <span className="text-[#1D1D1F]/35" aria-hidden="true">
                    {Icon.chevronDown("currentColor", 12)}
                  </span>
                </button>

                {/* Phone input */}
                <input
                  type="tel"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={handlePhoneChange}
                  placeholder="(000) 000-0000"
                  className="min-w-0 flex-1 border-none bg-transparent p-0 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  aria-label="Phone number"
                />
              </div>
            </div>

            {/* Pre-filled from bank badge */}
            {isPreFilledFromBank && (
              <div className="mt-3 flex items-center gap-1.5 text-[#34C759]">
                <Check size={13} strokeWidth={2} aria-hidden="true" />
                <span className="text-[10px] font-medium">
                  Pre-filled from your bank · tap to edit
                </span>
              </div>
            )}

            <p className="mt-2 text-[10px] font-light text-[#1D1D1F]/45">
              Standard message and data rates may apply.
            </p>
          </section>

          {/* ── CTAs — Continue & Skip ── */}
          <section className="pb-12 space-y-3">
            <HushhTechCta
              variant={HushhTechCtaVariant.BLACK}
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              className={primaryCtaClass}
            >
              {isLoading ? "Saving..." : "Continue"}
            </HushhTechCta>

            <HushhTechCta
              variant={HushhTechCtaVariant.WHITE}
              onClick={handleSkip}
              className={secondaryCtaClass}
            >
              Skip
            </HushhTechCta>
          </section>

          {/* ── Trust Badges ── */}
          <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
            <div className="flex items-center gap-1">
              {Icon.lock("#0066CC", 12)}
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                256 Bit Encryption
              </span>
            </div>
          </section>
        </main>
      </div>

      {/* ═══ Dial Code Picker Modal — Premium Design ═══ */}
      {showDialPicker && (
        <>
          {/* Glass overlay */}
          <div
            className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm"
            onClick={() => setShowDialPicker(false)}
          />

          {/* Modal card */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-0">
            <div
              ref={dialPickerRef}
              className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.04)] border border-gray-100/50 flex flex-col max-h-[70vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dial-picker-title"
              tabIndex={-1}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                <h2
                  id="dial-picker-title"
                  className="text-[18px] font-medium tracking-[-0.02em] text-[#1D1D1F]"
                  style={{ fontFamily: appleFont }}
                >
                  Select Country Code
                </h2>
                <button
                  ref={doneButtonRef}
                  onClick={() => setShowDialPicker(false)}
                  className="text-[12px] font-medium uppercase tracking-[1.6px] text-[#0066CC] hover:underline"
                >
                  Done
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto">
                {PHONE_DIAL_CODES.map((option) => {
                  const isActive =
                    option.code === countryCode &&
                    option.iso === selectedDialCountryIso;
                  return (
                    <button
                      key={option.iso}
                      onClick={() => handleSelectDialCode(option)}
                      className={`w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 transition-colors ${
                        isActive
                          ? "bg-gray-50"
                          : "hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ReactCountryFlag
                          countryCode={option.iso}
                          svg
                          style={{
                            width: "1.25em",
                            height: "1.25em",
                            borderRadius: 2,
                          }}
                          aria-label={option.country}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {option.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-gray-500">
                          {option.code}
                        </span>
                        {isActive && (
                          <Check size={18} strokeWidth={1.8} className="text-[#0066CC]" aria-hidden="true" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
