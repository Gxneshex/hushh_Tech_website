/**
 * Step 7 — Enter Your Full Legal Name
 * UI follows the Step 1/2 + Home/Fund A Apple treatment.
 * Logic stays in logic.ts.
 */
import { AlertCircle, Badge, Check, LockKeyhole, UserRound } from "lucide-react";
import {
  useStep7Logic,
  DISPLAY_STEP,
  TOTAL_STEPS,
  PROGRESS_PCT,
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

export default function OnboardingStep7() {
  const {
    firstName,
    lastName,
    isLoading,
    error,
    isValid,
    isPreFilledFromBank,
    handleFirstNameChange,
    handleLastNameChange,
    handleContinue,
    handleBack,
    handleSkip,
  } = useStep7Logic();

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
        <section className="pb-8 pt-4 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="person" size={58} />
          </div>
          <Eyebrow>Identity Verification</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Enter your full legal name.
          </Display>
          <Lede className="max-w-[460px]">
            We are required to collect this info for verification purposes.
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
            <p className="text-[14px] font-medium text-[#B42318]">
              {error}
            </p>
          </div>
        )}

        {/* ── Name Fields ── */}
        <section className="mb-8 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            Legal Name
          </h3>

          {/* First Name */}
          <div className="border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={UserRound} size={40} />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  placeholder="Required"
                  className="w-full border-none bg-transparent p-0 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  autoComplete="given-name"
                />
              </div>
            </div>
          </div>

          {/* Last Name */}
          <div className="py-5">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={Badge} size={40} />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  placeholder="Required"
                  className="w-full border-none bg-transparent p-0 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pre-filled from bank badge */}
        {isPreFilledFromBank && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-[#34C759]">
            <Check size={13} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium">
              Pre-filled from your bank · tap to edit
            </span>
          </div>
        )}

        {/* Helper text */}
        <p className="mb-8 text-center text-[11px] font-light text-[#1D1D1F]/45">
          Make sure this matches your government ID.
        </p>

        {/* ── CTAs — Continue & Skip ── */}
        <section className="pb-12 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleContinue}
            disabled={!isValid || isLoading}
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
          <div className="sr-only">
            <LockKeyhole aria-hidden="true" />
          </div>
        </section>
      </main>
    </div>
  );
}
