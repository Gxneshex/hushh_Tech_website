/**
 * Step 3 — Confirm Your Residence & Address (Combined)
 *
 * Single page merging country/residence detection + full address entry.
 * GPS fires ONCE → auto-fills citizenship, residence, address, city, state, zip.
 */
import { useRef } from "react";
import {
  useCombinedLocationLogic,
  countries,
  TOTAL_STEPS,
  PROGRESS_PCT,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import PermissionHelpModal from "../../../components/PermissionHelpModal";
import { useModalKeyboardNavigation } from "../../../hooks/useModalKeyboardNavigation";
import {
  AppIcon,
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const DISPLAY_STEP = 3;
const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep3Combined() {
  const s = useCombinedLocationLogic();
  const locationModalRef = useRef<HTMLDivElement>(null);
  const allowLocationButtonRef = useRef<HTMLButtonElement>(null);

  useModalKeyboardNavigation({
    isOpen: s.showLocationModal,
    containerRef: locationModalRef,
    initialFocusRef: allowLocationButtonRef,
    onClose: s.handleDontAllow,
  });

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {/* ═══ Background layer (blurs when location modal is open) ═══ */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          s.showLocationModal
            ? "scale-[0.98] blur-[2px] opacity-40 pointer-events-none select-none"
            : ""
        }`}
      >
        {/* ═══ Header ═══ */}
        <HushhTechBackHeader onBackClick={s.handleBack} rightLabel="FAQs" />

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
              <AppIcon kind="shield" size={58} />
            </div>
            <Eyebrow>Verification</Eyebrow>
            <Display as="h1" size="xs" maxWidth="max-w-[500px]">
              Confirm your residence.
            </Display>
            <Lede className="max-w-[500px]">
              We need to know where you live and pay taxes to open your
              investment account. Your location auto-fills the details below.
            </Lede>
          </section>

          {/* ── Location Status Banners ── */}
          {s.locationStatus === "detecting" && (
            <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-[#F5F5F7] px-4 py-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0066CC]/25 border-t-[#0066CC]" />
              </div>
              <p className="text-[14px] font-medium text-[#1D1D1F]/70">
                Detecting your location...
              </p>
            </div>
          )}

          {s.isSuccessStatus && !s.isAutoFilling && !s.detectionStatus && (
            <div className="mb-6 flex items-center gap-4 rounded-[18px] bg-[#34C759]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(52,199,89,0.20)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                <span
                  className="material-symbols-outlined text-lg text-[#34C759]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                  check
                </span>
              </div>
              <div>
                <p className="text-[14px] font-medium text-[#1D1D1F]">
                  Location Detected
                </p>
                <p className="text-[12px] font-normal text-[#1D1D1F]/55">
                  {s.detectedLocation}
                </p>
              </div>
            </div>
          )}

          {/* Auto-fill status */}
          {s.detectionStatus && (
            <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-[#34C759]/10 px-4 py-4 transition-colors shadow-[inset_0_0_0_1px_rgba(52,199,89,0.20)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                <span
                  className="material-symbols-outlined text-lg text-[#34C759]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                  check
                </span>
              </div>
              <p className="text-[14px] font-medium text-[#1D1D1F]/70">
                {s.detectionStatus}
              </p>
            </div>
          )}

          {s.isErrorStatus && (
            <div className="mb-6">
              <div className="flex items-center justify-between rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                    <span
                      className="material-symbols-outlined text-lg text-[#FF3B30]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                    >
                      error
                    </span>
                  </div>
                  <p className="text-[14px] font-medium text-[#1D1D1F]/70">
                    {s.locationStatus === "denied"
                      ? "Location access denied"
                      : "Could not detect location"}
                  </p>
                </div>
                <button
                  onClick={s.handleRetry}
                  className="shrink-0 text-[12px] font-medium uppercase tracking-[1.2px] text-[#1D1D1F] hover:underline"
                >
                  Retry
                </button>
              </div>
              {s.locationStatus === "denied" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    s.setShowPermissionHelp(true);
                  }}
                  className="ml-14 mt-2 text-[11px] font-medium text-[#1D1D1F]/55 underline transition-colors hover:text-[#0066CC]"
                >
                  How to enable location
                </button>
              )}
            </div>
          )}

          {/* ── General Error ── */}
          {s.error && (
            <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-[#FF3B30]/10 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                <span
                  className="material-symbols-outlined text-lg text-[#FF3B30]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                >
                  error
                </span>
              </div>
              <p className="text-[14px] font-medium text-[#B42318]">{s.error}</p>
            </div>
          )}

          {/* ═══ SECTION 1: Country Selection ═══ */}
          <section className="mb-6 overflow-hidden rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Citizenship & Residence
            </h3>

            {/* Citizenship Country */}
            <div className="border-b border-[#1D1D1F]/[0.08] py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    flag
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-0.5 text-[14px] font-medium text-[#1D1D1F]">
                    Country of Citizenship
                  </p>
                  <div className="relative">
                    <select
                      value={s.citizenshipCountry}
                      onChange={(e) =>
                        s.handleCitizenshipChange(e.target.value)
                      }
                      disabled={s.isDetectingLocation}
                      className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-[13px] font-normal text-[#1D1D1F]/55 outline-none"
                      aria-label="Select citizenship country"
                    >
                      <option disabled value="">
                        Select Country
                      </option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-[#1D1D1F]/35">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Residence Country */}
            <div className="py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    home
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="mb-0.5 text-[14px] font-medium text-[#1D1D1F]">
                    Country of Residence
                  </p>
                  <div className="relative">
                    <select
                      value={s.residenceCountry}
                      onChange={(e) =>
                        s.handleResidenceChange(e.target.value)
                      }
                      disabled={s.isDetectingLocation}
                      className="w-full cursor-pointer appearance-none border-none bg-transparent p-0 pr-6 text-[13px] font-normal text-[#1D1D1F]/55 outline-none"
                      aria-label="Select residence country"
                    >
                      <option disabled value="">
                        Select Country
                      </option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-base text-[#1D1D1F]/35">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SECTION 2: Full Address ═══ */}
          <section className="mb-6 overflow-hidden rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Your Address
            </h3>

            {/* Use Current Location button */}
            <div className="mb-2 border-b border-[#1D1D1F]/[0.08] py-5">
              <button
                type="button"
                onClick={s.handleDetectClick}
                disabled={s.isDetectingLocation || s.isAutoFilling}
                className="group flex w-full items-center gap-4 text-left disabled:opacity-50"
                aria-label="Use my current location"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white transition-colors group-hover:bg-white/75">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    my_location
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#1D1D1F]">
                    Use My Current Location
                  </p>
                  <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                    Auto-fill address using GPS
                  </p>
                </div>
              </button>
            </div>

            {/* Address Line 1 */}
            <div className="border-b border-[#1D1D1F]/[0.08] py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    location_on
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="addressLine1"
                    className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                  >
                    Address Line 1
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    value={s.addressLine1}
                    onChange={(e) => s.handleAddressLine1Change(e.target.value)}
                    onBlur={() => s.handleBlur("addressLine1", s.addressLine1)}
                    placeholder="Street address"
                    className="w-full border-none bg-transparent p-0 text-[14px] font-normal text-[#1D1D1F]/70 outline-none placeholder:text-[#1D1D1F]/35 focus:ring-0"
                    autoComplete="address-line1"
                  />
                </div>
              </div>
            </div>
            {s.touched.addressLine1 && s.errors.addressLine1 && (
              <p className="py-1 pl-14 text-[12px] text-[#FF3B30]">
                {s.errors.addressLine1}
              </p>
            )}

            {/* Address Line 2 */}
            <div className="py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    apartment
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="addressLine2"
                    className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                  >
                    Address Line 2
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    value={s.addressLine2}
                    onChange={(e) => s.handleAddressLine2Change(e.target.value)}
                    placeholder="City, State"
                    className="w-full border-none bg-transparent p-0 text-[14px] font-normal text-[#1D1D1F]/70 outline-none placeholder:text-[#1D1D1F]/35 focus:ring-0"
                    autoComplete="address-line2"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SECTION 3: ZIP Code ═══ */}
          <section className="mb-6 overflow-hidden rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            {/* ZIP Code */}
            <div className="py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <span
                    className="material-symbols-outlined text-lg text-[#1D1D1F]/70"
                    style={{ fontVariationSettings: "'wght' 400" }}
                  >
                    pin
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="zipCode"
                    className="mb-1 block text-[14px] font-medium text-[#1D1D1F]"
                  >
                    ZIP / Postal Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    value={s.zipCode}
                    inputMode="text"
                    onChange={(e) => s.handleZipCodeChange(e.target.value)}
                    onBlur={() => s.handleBlur("zipCode", s.zipCode)}
                    placeholder="e.g. 10001"
                    className="w-full border-none bg-transparent p-0 text-[14px] font-normal text-[#1D1D1F]/70 outline-none placeholder:text-[#1D1D1F]/35 focus:ring-0"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>
            {s.touched.zipCode && s.errors.zipCode ? (
              <p className="py-1 pl-14 text-[12px] text-[#FF3B30]">
                {s.errors.zipCode}
              </p>
            ) : (
              <p className="pl-14 pt-1 text-[10px] font-light text-[#1D1D1F]/40">
                Supports numeric and alphanumeric codes based on region.
              </p>
            )}
          </section>

          {/* ── CTAs — Continue & Skip ── */}
          <section className="pb-12 space-y-3 mt-4">
            <HushhTechCta
              variant={HushhTechCtaVariant.BLACK}
              onClick={s.handleContinue}
              disabled={
                !s.canContinue || s.isLoading || s.isDetectingLocation || s.isAutoFilling
              }
              className={primaryCtaClass}
            >
              {s.isDetectingLocation
                ? "Detecting..."
                : s.isAutoFilling
                ? "Auto-filling..."
                : s.isLoading
                ? "Saving..."
                : "Continue"}
            </HushhTechCta>

            <HushhTechCta
              variant={HushhTechCtaVariant.WHITE}
              onClick={s.handleSkip}
              className={secondaryCtaClass}
            >
              Skip
            </HushhTechCta>
          </section>

          {/* ── Trust Badges ── */}
          <section className="flex flex-col items-center justify-center text-center gap-2 pb-8">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-[#0066CC]">
                lock
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
                256 Bit Encryption
              </span>
            </div>
          </section>
        </main>
      </div>

      {/* ═══ Location Permission Modal ═══ */}
      {s.showLocationModal && (
        <>
          <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            <div
              ref={locationModalRef}
              className="relative flex w-full max-w-sm flex-col items-center rounded-[28px] bg-white p-8 text-center shadow-[0_24px_60px_rgba(29,29,31,0.18),inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="step3-location-modal-title"
              tabIndex={-1}
            >
              <div className="mb-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                  <span
                    className="material-symbols-outlined text-[2rem] text-[#1D1D1F]"
                    style={{ fontVariationSettings: "'wght' 200" }}
                  >
                    location_on
                  </span>
                </div>
              </div>
              <div className="mb-10 space-y-4 px-2">
                <h2
                  id="step3-location-modal-title"
                  className="text-[28px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
                  style={{ fontFamily: appleFont }}
                >
                  Enable Location Access
                </h2>
                <p className="mx-auto max-w-[90%] text-[14px] font-light leading-[1.45] text-[#1D1D1F]/60">
                  Hushh uses your location to automatically fill your country,
                  address, and streamline the secure verification process.
                </p>
              </div>
              <div className="w-full space-y-4">
                <button
                  ref={allowLocationButtonRef}
                  onClick={s.handleAllowLocation}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-[#0066CC] bg-[#0066CC] text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.99]"
                >
                  Allow while using app
                </button>
                <button
                  onClick={s.handleAllowLocation}
                  className="h-12 w-full rounded-full border border-[#1D1D1F]/15 bg-white text-[14px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7] active:scale-[0.99]"
                >
                  Allow once
                </button>
                <div className="pt-2">
                  <button
                    onClick={s.handleDontAllow}
                    className="text-[12px] font-medium text-[#1D1D1F]/45 transition-colors hover:text-[#1D1D1F]"
                  >
                    Don&apos;t allow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ Permission Help Modal ═══ */}
      <PermissionHelpModal
        isOpen={s.showPermissionHelp}
        onClose={() => s.setShowPermissionHelp(false)}
      />
    </div>
  );
}
