/**
 * Step 2 — Referral Source Selection
 * Clean card-based survey. Logic stays in logic.ts.
 * Uses HushhTechBackHeader + HushhTechCta reusable components.
 */
import {
  Cpu,
  Megaphone,
  MicVocal,
  MoreHorizontal,
  Newspaper,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  useStep2Logic,
  REFERRAL_OPTIONS,
  CURRENT_STEP,
  TOTAL_STEPS,
  PROGRESS_PCT,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  AppleLineIcon,
  AppIcon,
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

/** One neutral line-icon provider keeps the survey aligned with the refreshed UI. */
const ICON_MAP: Record<string, LucideIcon> = {
  social_media_ad: Megaphone,
  family_friend: UsersRound,
  podcast: MicVocal,
  website_blog_article: Newspaper,
  ai_tool: Cpu,
  other: MoreHorizontal,
};
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep2() {
  const {
    selectedSource,
    isLoading,
    setSelectedSource,
    handleContinue,
    handleSkip,
    handleBack,
  } = useStep2Logic();

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Header ═══ */}
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
        {/* ── Progress Bar ── */}
        <div className="pb-6 pt-5">
          <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            <span>
              Step {CURRENT_STEP}/{TOTAL_STEPS}
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

        {/* ── Title ── */}
        <section className="pb-8 pt-4 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="person" size={58} />
          </div>
          <Eyebrow>Step 02</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            How did you hear about Hushh Fund&nbsp;A?
          </Display>
          <Lede className="max-w-[460px]">
            A quick signal helps us personalize your investor onboarding.
          </Lede>
        </section>

        {/* ── Survey Cards ── */}
        <section className="mb-16 grid gap-3">
          {REFERRAL_OPTIONS.map((option) => {
            const isSelected = selectedSource === option.value;
            const IconComponent = ICON_MAP[option.value] || MoreHorizontal;

            return (
              <button
                key={option.value}
                onClick={() => setSelectedSource(option.value)}
                className={`flex w-full items-center gap-4 rounded-[20px] p-4 text-left transition-all duration-200 sm:rounded-[22px] ${
                  isSelected
                    ? "bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                    : "bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] hover:bg-[#F5F5F7]"
                }`}
                aria-label={option.label}
                tabIndex={0}
              >
                {/* Icon circle */}
                <AppleLineIcon
                  icon={IconComponent}
                  size={44}
                  className={isSelected ? "ring-1 ring-[#0066CC]/30" : ""}
                />

                {/* Label */}
                <span
                  className={`text-[16px] font-medium transition-colors ${
                    isSelected ? "text-[#1D1D1F]" : "text-[#1D1D1F]/72"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </section>

        {/* ── CTAs — Continue & Skip ── */}
        <section className="pb-12 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleContinue}
            disabled={!selectedSource || isLoading}
            className={primaryCtaClass}
          >
            {isLoading ? "Saving..." : "Continue"}
          </HushhTechCta>

          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleSkip}
            className={secondaryCtaClass}
          >
            Skip for now
          </HushhTechCta>
        </section>
      </main>
    </div>
  );
}
