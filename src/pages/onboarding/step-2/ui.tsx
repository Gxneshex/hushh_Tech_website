/**
 * Step 2 — Account type.
 */
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENT_STEP,
  PROGRESS_PCT,
  TOTAL_STEPS,
  useStep2Logic,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";
import { RequiredAsterisk } from "../../../components/onboarding-field-marker/FieldMarkers";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep2() {
  const {
    selectedAccountType,
    isLoading,
    setSelectedAccountType,
    handleContinue,
    handleBack,
  } = useStep2Logic();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
      <OnboardingBankReviewChip />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
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

        <section className="pb-8 pt-8 text-center">
          <Eyebrow>Account Setup</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Who is investing?
            <RequiredAsterisk />
          </Display>
          <Lede className="max-w-[470px]">
            Choose the ownership type for this application. We collect the primary investor first.
          </Lede>
        </section>

        <section className="mb-10 grid gap-3">
          {ACCOUNT_TYPE_OPTIONS.map((option) => {
            const isSelected = selectedAccountType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedAccountType(option.value)}
                className={`flex w-full items-center gap-4 rounded-[20px] p-4 text-left transition-all sm:rounded-[22px] ${
                  isSelected
                    ? "bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                    : "bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] hover:bg-[#F5F5F7]"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white text-[#1D1D1F]/70 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    {option.icon}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium text-[#1D1D1F]">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[12px] font-normal leading-[1.35] text-[#1D1D1F]/55">
                    {option.description}
                  </span>
                </span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[18px] text-[#0066CC]">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {selectedAccountType && selectedAccountType !== "individual" && (
          <div className="mb-6 rounded-[18px] bg-[#0066CC]/8 px-4 py-4 text-[12px] font-normal leading-[1.45] text-[#1D1D1F]/62 shadow-[inset_0_0_0_0.5px_rgba(0,102,204,0.18)]">
            We will collect the primary investor here. Additional owner, custodian, trust, or entity details can be requested during review.
          </div>
        )}

        <section className="space-y-3 pb-12">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleContinue}
            disabled={!selectedAccountType || isLoading}
            className={primaryCtaClass}
          >
            {isLoading ? "Saving..." : "Continue"}
          </HushhTechCta>
        </section>
      </main>
    </div>
  );
}
