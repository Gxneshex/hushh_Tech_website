/**
 * Step 4 of the compressed onboarding experiment — tax reporting + contact verification.
 */
import {
  AlertCircle,
  Check,
  CircleUserRound,
  Info,
  Landmark,
  LockKeyhole,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  useStep9Logic,
  PROGRESS_PCT,
  DISPLAY_STEP,
  TOTAL_STEPS,
  ACCOUNT_TYPE_OPTIONS,
  PHONE_DIAL_CODES,
} from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import OnboardingBankReviewChip from "../../../components/onboarding-bank-review-chip/OnboardingBankReviewChip";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  AppleLineIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const ACCOUNT_ICONS = {
  individual: CircleUserRound,
  joint: UsersRound,
  retirement: Landmark,
  trust: ShieldCheck,
};

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

export default function OnboardingStep9() {
  const {
    ssn,
    selectedAccountType,
    setSelectedAccountType,
    phoneNumber,
    isAutoDetectingDialCode,
    isPreFilledFromBank,
    isUsInvestor,
    otpSent,
    otpCode,
    otpInput,
    setOtpInput,
    isPhoneVerified,
    loading,
    error,
    showInfo,
    canContinue,
    selectedDialOption,
    isValidPhone,
    canSendOtp,
    formatPhoneNumber,
    handleSSNChange,
    handlePhoneChange,
    handleSelectDialCode,
    handleSendOtp,
    handleVerifyOtp,
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
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
      <OnboardingBankReviewChip />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
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

        <section className="pb-8 pt-8 text-center">
          <Eyebrow>Tax & Contact</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Verify your tax and phone details.
          </Display>
          <Lede className="max-w-[500px]">
            US investors provide tax reporting details here. Everyone verifies
            a contact number for secure review updates.
          </Lede>
        </section>

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

        <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
            Account Type
          </h3>
          <div className="grid gap-3">
            {ACCOUNT_TYPE_OPTIONS.map((option) => {
              const isSelected = selectedAccountType === option.value;
              const AccountIcon = ACCOUNT_ICONS[option.value] || CircleUserRound;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedAccountType(option.value)}
                  className={`flex w-full items-center gap-4 rounded-[20px] p-4 text-left transition-all ${
                    isSelected
                      ? "bg-white shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]"
                      : "bg-white/70 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)] hover:bg-white"
                  }`}
                >
                  <AppleLineIcon
                    icon={AccountIcon}
                    size={42}
                    className={isSelected ? "ring-1 ring-[#0066CC]/30" : ""}
                  />
                  <span className="flex-1 text-[15px] font-medium text-[#1D1D1F]">
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check size={18} strokeWidth={2} className="text-[#0066CC]" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Tax Reporting
            </h3>
            <span className="text-[10px] font-medium uppercase tracking-[1.4px] text-[#1D1D1F]/40">
              {isUsInvestor ? "US investor" : "Non-US optional"}
            </span>
          </div>

          <div className="border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={LockKeyhole} size={40} />
              <div className="min-w-0 flex-1">
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
                  placeholder={isUsInvestor ? "000-00-0000" : "Optional for non-US investors"}
                  maxLength={11}
                  inputMode="numeric"
                  className="w-full border-none bg-transparent p-0 text-[15px] font-medium tracking-widest text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35"
                />
              </div>
            </div>
          </div>

          <details
            className="group"
            open={showInfo}
            onToggle={(e) =>
              handleShowInfoToggle((e.target as HTMLDetailsElement).open)
            }
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 py-5">
              <AppleLineIcon icon={Info} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#1D1D1F]">
                  Why do we ask for tax details?
                </p>
                <p className="text-[12px] font-normal text-[#1D1D1F]/50">
                  Required for US investor reporting and identity controls.
                </p>
              </div>
              <span className="text-[#1D1D1F]/35 transition-transform group-open:rotate-180">
                {Icon.chevronDown("currentColor", 12)}
              </span>
            </summary>
            <p className="pb-5 pl-14 pr-4 text-[12px] font-light leading-[1.45] text-[#1D1D1F]/60">
              This local experiment keeps SSN required only when the investor
              profile indicates United States citizenship or residence.
            </p>
          </details>
        </section>

        <section className="mb-8 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
              Contact Verification
            </h3>
            {isAutoDetectingDialCode && (
              <span className="text-[10px] font-medium text-[#1D1D1F]/45">
                Detecting...
              </span>
            )}
          </div>
          <p className="mb-5 text-[12px] font-light text-[#1D1D1F]/50">
            Verify the phone number used for investor review updates.
          </p>

          <div className="border-b border-[#1D1D1F]/[0.08] py-5">
            <div className="flex items-center gap-4">
              <AppleLineIcon icon={Phone} size={40} />
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[140px_1fr]">
                <label className="block">
                  <span className="sr-only">Country code</span>
                  <select
                    value={`${selectedDialOption.iso}|${selectedDialOption.code}`}
                    onChange={(e) => {
                      const [iso, code] = e.target.value.split("|");
                      const next = PHONE_DIAL_CODES.find(
                        (option) => option.iso === iso && option.code === code
                      );
                      if (next) handleSelectDialCode(next);
                    }}
                    className="w-full rounded-[14px] border-none bg-white px-3 py-3 text-[14px] font-medium text-[#1D1D1F] outline-none shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                  >
                    {PHONE_DIAL_CODES.map((option) => (
                      <option
                        key={`${option.iso}-${option.code}`}
                        value={`${option.iso}|${option.code}`}
                      >
                        {option.iso} {option.code}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="tel"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={handlePhoneChange}
                  placeholder="(000) 000-0000"
                  className="w-full rounded-[14px] border-none bg-white px-3 py-3 text-[15px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#1D1D1F]/35 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                  aria-label="Phone number"
                />
              </div>
            </div>
          </div>

          {isPreFilledFromBank && (
            <div className="mt-3 flex items-center gap-1.5 text-[#34C759]">
              <Check size={13} strokeWidth={2} />
              <span className="text-[10px] font-medium">
                Pre-filled from saved review data
              </span>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={otpSent ? "Enter 6-digit code" : "Send a code to verify"}
              disabled={!otpSent || isPhoneVerified}
              className="w-full rounded-[16px] border-none bg-white px-4 py-3 text-[15px] font-medium tracking-[0.18em] text-[#1D1D1F] outline-none placeholder:tracking-normal placeholder:text-[#1D1D1F]/35 disabled:opacity-55 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
              inputMode="numeric"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-none sm:grid-flow-col">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!canSendOtp}
                className="rounded-full bg-white px-4 py-3 text-[13px] font-medium text-[#0066CC] shadow-[inset_0_0_0_0.5px_rgba(0,102,204,0.24)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Send code
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!otpSent || isPhoneVerified}
                className="rounded-full bg-[#1D1D1F] px-4 py-3 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPhoneVerified ? "Verified" : "Verify"}
              </button>
            </div>
          </div>

          {otpSent && !isPhoneVerified && (
            <p className="mt-3 text-[11px] font-normal text-[#1D1D1F]/45">
              Local preview code: <span className="font-medium text-[#1D1D1F]/65">{otpCode}</span>
            </p>
          )}
          {isPhoneVerified && (
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#34C759]">
              <Check size={13} strokeWidth={2} />
              Contact number verified for this local run.
            </p>
          )}
          {!isValidPhone && phoneNumber && (
            <p className="mt-3 text-[11px] font-medium text-[#FF3B30]">
              Enter 8 to 15 digits before sending the code.
            </p>
          )}
        </section>

        <section className="space-y-3 pb-12">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={handleContinue}
            disabled={!canContinue || loading}
            className={primaryCtaClass}
          >
            {loading ? "Saving..." : "Continue"}
          </HushhTechCta>
          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={handleSkip}
            className={secondaryCtaClass}
          >
            Skip for now
          </HushhTechCta>
        </section>

        <section className="flex flex-col items-center justify-center gap-2 pb-8 text-center">
          <div className="flex items-center gap-1">
            {Icon.lock("#0066CC", 12)}
            <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
              256 Bit Encryption
            </span>
          </div>
          <p className="max-w-xs text-[10px] font-light text-[#1D1D1F]/45">
            OTP here is local-only for the compression experiment.
          </p>
        </section>
      </main>
    </div>
  );
}
