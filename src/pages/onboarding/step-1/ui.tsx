/**
 * Step 1 — Discovery source.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  CURRENT_STEP,
  PROGRESS_PCT,
  REFERRAL_OPTIONS,
  TOTAL_STEPS,
  useStep1Logic,
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
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep1() {
  const detailCardRef = useRef<HTMLDivElement | null>(null);
  const detailPopoverRef = useRef<HTMLDivElement | null>(null);
  const [detailPopoverStyle, setDetailPopoverStyle] =
    useState<CSSProperties | null>(null);
  const [detailPopoverOpen, setDetailPopoverOpen] = useState(false);
  const {
    selectedSource,
    detailValue,
    detailQuery,
    filteredDetailOptions,
    isDetailRequired,
    isLoading,
    canContinue,
    setSelectedSource,
    setDetailQuery,
    selectDetail,
    handleContinue,
    handleSkip,
    handleBack,
  } = useStep1Logic();

  const detailDisplay = detailValue.trim() || detailQuery.trim();
  const detailLabel =
    selectedSource === "social_media_ad"
      ? "Which platform?"
      : selectedSource === "website_blog_article"
      ? "Which publication?"
      : "Other source";
  const detailPlaceholder =
    selectedSource === "social_media_ad"
      ? "Search or type platform"
      : selectedSource === "website_blog_article"
      ? "Search or type publication"
      : "Type your source";

  useLayoutEffect(() => {
    if (!selectedSource || !isDetailRequired || !detailPopoverOpen) {
      setDetailPopoverStyle(null);
      return;
    }

    const updatePopover = () => {
      const anchor = detailCardRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const gutter = 16;
      const width = Math.min(rect.width, window.innerWidth - gutter * 2);
      const left = Math.min(
        Math.max(rect.left, gutter),
        window.innerWidth - width - gutter
      );
      const estimatedHeight = selectedSource === "other" ? 132 : 256;
      const spaceBelow = window.innerHeight - rect.bottom - gutter;
      const top =
        spaceBelow >= estimatedHeight
          ? rect.bottom + 8
          : Math.max(gutter, rect.top - estimatedHeight - 8);
      const maxHeight = Math.max(
        132,
        Math.min(256, window.innerHeight - top - gutter)
      );

      setDetailPopoverStyle({ left, top, width, maxHeight });
    };

    updatePopover();
    window.addEventListener("resize", updatePopover);
    window.addEventListener("scroll", updatePopover, true);
    return () => {
      window.removeEventListener("resize", updatePopover);
      window.removeEventListener("scroll", updatePopover, true);
    };
  }, [detailPopoverOpen, isDetailRequired, selectedSource]);

  useEffect(() => {
    if (!detailPopoverOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (detailCardRef.current?.contains(target)) return;
      if (detailPopoverRef.current?.contains(target)) return;
      setDetailPopoverOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailPopoverOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [detailPopoverOpen]);

  const handleSourceClick = (
    source: Parameters<typeof setSelectedSource>[0],
    trigger?: HTMLElement
  ) => {
    const sourceKey = String(source);
    const requiresDetail =
      sourceKey.includes("social") ||
      sourceKey.includes("website_blog_article") ||
      sourceKey.includes("other");

    setSelectedSource(source);
    if (requiresDetail) {
      setDetailQuery("");
      setDetailPopoverOpen(true);
      window.requestAnimationFrame(() => {
        trigger
          ?.closest("[data-referral-row]")
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    setDetailPopoverOpen(false);
  };

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
          <Eyebrow>Discovery</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            How did you hear about Hushh Fund&nbsp;A?
            <RequiredAsterisk />
          </Display>
          <Lede className="max-w-[460px]">
            This helps us understand which investor channels are working.
          </Lede>
        </section>

        <section className="relative z-10 mb-5 grid gap-3 overflow-visible">
          {REFERRAL_OPTIONS.map((option) => {
            const isSelected = selectedSource === option.value;
            const showDetail = isSelected && isDetailRequired && detailPopoverOpen;
            return (
              <div
                key={option.value}
                data-referral-row
                ref={isSelected ? detailCardRef : null}
                className={`relative overflow-visible rounded-[20px] transition-all duration-200 sm:rounded-[22px] ${
                  showDetail ? "z-50" : isSelected ? "z-20" : "z-0"
                } ${
                  isSelected
                    ? "bg-[#F5F5F7] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                    : "bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] hover:bg-[#F5F5F7]"
                }`}
              >
                <button
                  type="button"
                  onClick={(event) => handleSourceClick(option.value, event.currentTarget)}
                  className="flex w-full items-center gap-4 p-4 text-left"
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
                    {isSelected && detailDisplay && (
                      <span className="mt-0.5 block truncate text-[13px] font-normal text-[#1D1D1F]/48">
                        {detailDisplay}
                      </span>
                    )}
                  </span>
                  {isSelected && detailDisplay ? (
                    <span className="material-symbols-outlined text-[18px] text-[#0066CC]">
                      check
                    </span>
                  ) : isSelected && isDetailRequired ? (
                    <span className="material-symbols-outlined text-[20px] text-[#1D1D1F]/34">
                      expand_more
                    </span>
                  ) : isSelected && (
                    <span className="material-symbols-outlined text-[18px] text-[#0066CC]">
                      check
                    </span>
                  )}
                </button>

                {showDetail && detailPopoverStyle && (
                  <div
                    ref={detailPopoverRef}
                    className="fixed z-[100] overflow-y-auto overscroll-contain rounded-[22px] border border-white/75 bg-[#F5F5F7]/96 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.14),inset_0_0_0_0.5px_rgba(29,29,31,0.08)] backdrop-blur-2xl"
                    style={detailPopoverStyle}
                  >
                    <label htmlFor="referral-detail" className="mb-2 block px-1 text-[10px] font-medium uppercase tracking-[1.5px] text-[#0066CC]/82">
                      {detailLabel}
                      <RequiredAsterisk />
                    </label>
                    <input
                      id="referral-detail"
                      type="text"
                      required
                      aria-required="true"
                      value={detailQuery}
                      onChange={(event) => setDetailQuery(event.target.value)}
                      placeholder={detailPlaceholder}
                      className="h-11 w-full rounded-[15px] border-none bg-white px-4 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/30 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                    />
                    {filteredDetailOptions.length > 0 && (
                      <div className="mt-2 overflow-hidden rounded-[16px] bg-white shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                        {filteredDetailOptions.map((detailOption) => {
                          const activeDetail =
                            (detailQuery.trim() || detailValue.trim()) ===
                            detailOption;
                          return (
                            <button
                              key={detailOption}
                              type="button"
                              onClick={() => {
                                selectDetail(detailOption);
                                setDetailPopoverOpen(false);
                              }}
                              className={`flex h-11 w-full items-center justify-between border-b border-[#1D1D1F]/[0.06] px-4 text-left text-[14px] font-medium last:border-b-0 ${
                                activeDetail
                                  ? "bg-[#0066CC]/8 text-[#0066CC]"
                                  : "text-[#1D1D1F]/78"
                              }`}
                            >
                              <span>{detailOption}</span>
                              {activeDetail && (
                                <span className="material-symbols-outlined text-[16px]">
                                  check
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="space-y-3 pb-12">
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
            Skip for now
          </HushhTechCta>
        </section>
      </main>
    </div>
  );
}
