/**
 * Step 2 — Account type ("Who is investing?").
 *
 * Individual: pick → continue to step-3. Non-individual (Joint/Retirement/Trust):
 * pick → conditional sub-steps 2a account-type details → 2b additional parties →
 * 2c authorised signatory → continue to step-3. No new top-level steps (still 9);
 * the account-type collection lives inside step-2 as sub-steps.
 */
import { useMemo, useState } from "react";
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENT_STEP,
  PROGRESS_PCT,
  TOTAL_STEPS,
  useStep2Logic,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import { OnboardingStepJumpNav } from "../../../components/onboarding/OnboardingStepJumpNav";
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
import AccountTypeSections, {
  type AccountTypeSectionPart,
} from "./sections/AccountTypeSections";
import { useStep3AccountTypeSections } from "./sections/logic";
import { getAccountTypeConfig } from "../../../services/onboarding/accountTypeConfig";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep2() {
  const s = useStep2Logic();
  const at = useStep3AccountTypeSections(s.selectedAccountType);
  const [subStep, setSubStep] = useState(0); // 0 = picker; 1..N = sub-steps
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cfg = getAccountTypeConfig(s.selectedAccountType);
  const isNonIndividual = !!s.selectedAccountType && s.selectedAccountType !== "individual";
  // Editing from Review keeps the simple picker (single save & return).
  const wizard = isNonIndividual && !s.returnToReview;

  const subSteps = useMemo<{ key: AccountTypeSectionPart; title: string }[]>(() => {
    if (!wizard) return [];
    const out: { key: AccountTypeSectionPart; title: string }[] = [];
    if (cfg.accountTypeFields.length) {
      out.push({
        key: "details",
        title: s.selectedAccountType === "trust" ? "Entity details" : "Retirement details",
      });
    }
    if (cfg.requiredParties.length) out.push({ key: "parties", title: "Additional parties" });
    out.push({ key: "signatory", title: "Authorised signatory" });
    return out;
  }, [wizard, cfg, s.selectedAccountType]);

  const onPicker = subStep === 0;
  const activeSub = onPicker ? null : subSteps[subStep - 1] ?? null;
  const isLastSub = subStep >= subSteps.length;
  const canAdvanceSub = !activeSub
    ? false
    : activeSub.key === "details"
    ? at.fieldsComplete
    : activeSub.key === "parties"
    ? true
    : at.signatoryConfirmed;

  const handlePickerContinue = async () => {
    if (!s.selectedAccountType) return;
    if (!wizard) {
      await s.handleContinue();
      return;
    }
    setAdvancing(true);
    setError(null);
    const ok = await s.persistAccountType();
    setAdvancing(false);
    if (!ok) {
      setError("Could not save. Please try again.");
      return;
    }
    setSubStep(1);
  };

  const handleSubContinue = async () => {
    if (!activeSub) return;
    if (!isLastSub) {
      if (!canAdvanceSub) {
        setError("Please complete the required fields.");
        return;
      }
      setError(null);
      setSubStep(subStep + 1);
      return;
    }
    // Last sub-step (signatory): persist the account-type sections, then continue.
    setAdvancing(true);
    setError(null);
    const res = await at.persist();
    if (res.error) {
      setAdvancing(false);
      return; // persist() flips showErrors so the unmet field is highlighted
    }
    await s.handleContinue(); // persists account_type + current_step:3 + navigates to step-3
    setAdvancing(false);
  };

  const goBack = onPicker ? s.handleBack : () => {
    setError(null);
    setSubStep(subStep - 1);
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={goBack} rightLabel="FAQ" />
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
          <OnboardingStepJumpNav currentStep={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Sub-step indicator (non-individual collection within step 2). */}
        {!onPicker && (
          <div className="mb-1 flex items-center justify-center gap-3 pt-1">
            <span className="text-[11px] font-medium uppercase tracking-[1.4px] text-[#1D1D1F]/45">
              {subStep} of {subSteps.length} · {activeSub?.title}
            </span>
            <span className="flex items-center gap-1.5">
              {subSteps.map((w, i) => (
                <span
                  key={w.key}
                  className={`h-1.5 w-1.5 rounded-full ${i < subStep ? "bg-[#0066CC]" : "bg-[#1D1D1F]/15"}`}
                />
              ))}
            </span>
          </div>
        )}

        {onPicker ? (
          <>
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
                const isSelected = s.selectedAccountType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => s.setSelectedAccountType(option.value)}
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

            {isNonIndividual && (
              <div className="mb-6 rounded-[18px] bg-[#0066CC]/8 px-4 py-4 text-[12px] font-normal leading-[1.45] text-[#1D1D1F]/62 shadow-[inset_0_0_0_0.5px_rgba(0,102,204,0.18)]">
                Next, we'll collect the {s.selectedAccountType === "trust" ? "entity" : s.selectedAccountType === "retirement" ? "retirement" : "joint-owner"} details, invite the other parties, and confirm the authorised signatory.
              </div>
            )}
          </>
        ) : (
          <section className="space-y-5 pt-4">
            {error && (
              <div className="rounded-[18px] bg-[#FF3B30]/10 px-4 py-3 text-[13px] font-medium text-[#B42318] shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
                {error}
              </div>
            )}
            {activeSub && <AccountTypeSections at={at} part={activeSub.key} />}
          </section>
        )}

        <section className="space-y-3 pb-12 pt-4">
          {onPicker ? (
            <HushhTechCta
              variant={HushhTechCtaVariant.BLACK}
              onClick={handlePickerContinue}
              disabled={!s.selectedAccountType || s.isLoading || advancing}
              className={primaryCtaClass}
            >
              {s.isLoading || advancing
                ? "Saving..."
                : s.returnToReview
                ? "Save & return to Review"
                : "Continue"}
            </HushhTechCta>
          ) : (
            <div className="flex items-center gap-3">
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={goBack}
                className={secondaryCtaClass}
              >
                Back
              </HushhTechCta>
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={handleSubContinue}
                disabled={advancing || s.isLoading || (!isLastSub && !canAdvanceSub)}
                className={`${primaryCtaClass} flex-1`}
              >
                {advancing || s.isLoading ? "Saving..." : isLastSub ? "Continue" : "Continue"}
              </HushhTechCta>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
