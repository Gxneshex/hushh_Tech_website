/**
 * Meet CEO / Fund Manager — Apple-style presentation.
 * Payment, coupon, calendar, and profile routing stay in logic.ts.
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { useMeetCeoLogic } from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
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

const unlockItems: Array<{
  icon: LucideIcon;
  label: string;
  desc: string;
  extra?: string;
}> = [
  {
    icon: CalendarDays,
    label: "1-Hour Private Consultation",
    desc: "With Manish Sainani",
    extra: "$3,000",
  },
  {
    icon: Coins,
    label: "300,000 Hushh Coins",
    desc: "Credited instantly",
  },
  {
    icon: BadgeCheck,
    label: "KYC Verified Badge",
    desc: "Identity verification complete",
  },
];

function StatusBanner({
  icon,
  children,
  tone = "neutral",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  tone?: "neutral" | "success" | "error";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[#34C759]/10 shadow-[inset_0_0_0_1px_rgba(52,199,89,0.20)]"
      : tone === "error"
        ? "bg-[#FF3B30]/10 shadow-[inset_0_0_0_1px_rgba(255,59,48,0.18)]"
        : "bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]";
  const iconClass =
    tone === "success"
      ? "!text-[#34C759]"
      : tone === "error"
        ? "!text-[#FF3B30]"
        : "";
  const textClass =
    tone === "error" ? "text-[#B42318]" : "text-[#1D1D1F]/70";

  return (
    <div className={`flex items-center gap-3 rounded-[18px] px-4 py-4 ${toneClass}`}>
      <AppleLineIcon icon={icon} size={40} className={iconClass} />
      <div className={`min-w-0 text-[14px] font-medium leading-[1.35] ${textClass}`}>
        {children}
      </div>
    </div>
  );
}

function TrustFooter({
  label,
  helper,
}: {
  label: string;
  helper?: string;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-1 pb-8 text-center">
      <div className="flex items-center gap-1">
        {Icon.lock("#0066CC", 12)}
        <span className="text-[10px] font-medium uppercase tracking-[1.6px] text-[#1D1D1F]/50">
          {label}
        </span>
      </div>
      {helper && (
        <p className="text-[10px] font-light text-[#1D1D1F]/45">{helper}</p>
      )}
    </section>
  );
}

function MeetCeoPage() {
  const {
    paymentState,
    loading,
    error,
    hushhCoins,
    showCoupon,
    setShowCoupon,
    couponCode,
    setCouponCode,
    couponError,
    setCouponError,
    couponLoading,
    calendarData,
    loadingSlots,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    bookingInProgress,
    handlePayment,
    handleCouponRedeem,
    handleBookMeeting,
    handleContinue,
    handleBack,
  } = useMeetCeoLogic();

  if (paymentState === "loading" || paymentState === "verifying") {
    return (
      <div
        className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <AppIcon kind="person" size={58} />
            </div>
            <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
            <p className="text-[14px] font-light text-[#1D1D1F]/55">
              {paymentState === "verifying" ? "Verifying payment..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQs" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
        <section className="pb-8 pt-10 text-center">
          <div className="mb-6 flex justify-center">
            <AppIcon kind="person" size={58} />
          </div>
          <Eyebrow>Investor Access</Eyebrow>
          <Display as="h1" size="xs" maxWidth="max-w-[500px]">
            Meet your fund manager.
          </Display>
          <Lede className="max-w-[500px]">
            Your opportunity to sit 1-on-1 with a fund manager for investment
            strategies, portfolio allocation, and personalized guidance.
          </Lede>
        </section>

        {error && (
          <div className="mb-6">
            <StatusBanner icon={AlertCircle} tone="error">
              {error}
            </StatusBanner>
          </div>
        )}

        {paymentState === "not_paid" && (
          <>
            <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Fund Manager
              </h3>
              <div className="py-5">
                <div className="flex items-center gap-4">
                  <AppleLineIcon icon={UserRound} size={52} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[16px] font-medium text-[#1D1D1F]">
                      Manish Sainani
                    </span>
                    <span className="text-[12px] font-normal text-[#1D1D1F]/55">
                      Hedge Fund Manager · 1-hour private session
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-[24px] bg-[#F5F5F7] p-5 text-center shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <p className="mx-auto max-w-[460px] text-[14px] font-light leading-[1.45] text-[#1D1D1F]/68">
                A personal consultation with Manish typically costs{" "}
                <span className="font-medium text-[#1D1D1F]">$3,000</span> per
                session. Because you&apos;ve completed the full Hushh KYC
                onboarding, you&apos;ve unlocked this exclusive benefit for just{" "}
                <span className="font-medium text-[#1D1D1F]">$1</span>.
              </p>
            </section>

            <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                What You Unlock
              </h3>
              {unlockItems.map((item, index) => (
                <div
                  key={item.label}
                  className={`py-5 ${
                    index < unlockItems.length - 1
                      ? "border-b border-[#1D1D1F]/[0.08]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <AppleLineIcon icon={item.icon} size={40} />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-[#1D1D1F]">
                        {item.label}
                      </span>
                      <span className="text-[12px] font-normal text-[#1D1D1F]/50">
                        {item.desc}
                      </span>
                    </div>
                    {item.extra && (
                      <span className="text-[12px] font-medium text-[#1D1D1F]/35 line-through">
                        {item.extra}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </section>

            <section className="mb-8 rounded-[24px] bg-[#F5F5F7] p-6 text-center shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <span className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Your Price Today
              </span>
              <div className="mt-3 flex items-baseline justify-center gap-3">
                <span className="text-[56px] font-bold leading-none tracking-[-0.06em] text-[#1D1D1F]">
                  $1
                </span>
                <span className="text-[16px] font-medium text-[#1D1D1F]/35 line-through">
                  $3,000
                </span>
              </div>
              <p className="mt-2 text-[11px] font-light text-[#1D1D1F]/45">
                Exclusive KYC onboarding benefit
              </p>
            </section>

            <section className="space-y-3 pb-6">
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={handlePayment}
                disabled={loading}
                className={primaryCtaClass}
              >
                {loading ? "Redirecting..." : "Verify & Unlock - $1"}
              </HushhTechCta>
            </section>

            <section className="mb-8 rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <button
                onClick={() => setShowCoupon(!showCoupon)}
                className="flex w-full items-center justify-center gap-2 py-2 text-[14px] font-medium text-[#1D1D1F]/70 transition hover:text-[#0066CC]"
              >
                <Ticket size={17} strokeWidth={1.7} aria-hidden="true" />
                {showCoupon ? "Hide coupon code" : "Have a coupon code?"}
              </button>
              {showCoupon && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      placeholder="Enter coupon code"
                      className="h-12 min-w-0 flex-1 rounded-full border border-[#1D1D1F]/10 bg-white px-4 font-mono text-[13px] font-medium uppercase tracking-[0.12em] text-[#1D1D1F] outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#1D1D1F]/35 focus:border-[#0066CC]/45 focus:ring-2 focus:ring-[#0066CC]/15"
                      autoCapitalize="characters"
                      autoComplete="off"
                    />
                    <button
                      onClick={handleCouponRedeem}
                      disabled={couponLoading || !couponCode.trim()}
                      className="flex h-12 shrink-0 items-center justify-center rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#1D1D1F]/20"
                    >
                      {couponLoading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-center text-[12px] font-medium text-[#B42318]">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </section>

            <TrustFooter label="Secure Payment" helper="Powered by Stripe" />
          </>
        )}

        {paymentState === "paid" && (
          <>
            <div className="mb-6">
              <StatusBanner icon={CheckCircle2} tone="success">
                <span className="block text-[#1D1D1F]">You&apos;re verified.</span>
                <span className="text-[12px] font-normal text-[#1D1D1F]/55">
                  {hushhCoins.toLocaleString()} Hushh Coins credited
                </span>
              </StatusBanner>
            </div>

            <section className="mb-6 rounded-[22px] bg-[#F5F5F7] p-5 text-center shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
              <AppleLineIcon icon={CalendarDays} size={44} className="mx-auto mb-4" />
              <span className="block text-[18px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]">
                Schedule your consultation
              </span>
              <span className="mt-2 block text-[13px] font-normal text-[#1D1D1F]/55">
                Book a 1-hour session with {calendarData?.ceo.name || "Manish Sainani"}
              </span>
              {calendarData?.timezone && (
                <p className="mt-1 text-[10px] font-light text-[#1D1D1F]/40">
                  {calendarData.timezone}
                </p>
              )}
            </section>

            {loadingSlots && (
              <div className="flex flex-col items-center py-12">
                <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
                <p className="text-[12px] font-light text-[#1D1D1F]/50">
                  Loading times...
                </p>
              </div>
            )}

            {!loadingSlots && calendarData && (
              <div className="mb-8 space-y-4">
                <div className="-mx-2 overflow-x-auto px-2 pb-2">
                  <div className="flex gap-2">
                    {calendarData.availability.map((day) => {
                      const d = new Date(day.date);
                      const selected = selectedDate === day.date;
                      const hasSlots = day.slots.some((slot) => slot.available);
                      return (
                        <button
                          key={day.date}
                          onClick={() => {
                            setSelectedDate(day.date);
                            setSelectedSlot(null);
                          }}
                          disabled={!hasSlots}
                          className={`flex min-w-[66px] shrink-0 flex-col items-center rounded-[18px] px-3 py-3 transition ${
                            selected
                              ? "bg-[#1D1D1F] text-white"
                              : hasSlots
                                ? "bg-[#F5F5F7] text-[#1D1D1F] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                                : "bg-[#F5F5F7] text-[#1D1D1F]/35 opacity-50"
                          }`}
                        >
                          <span className="text-[10px] font-medium uppercase tracking-[0.08em] opacity-70">
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="text-[20px] font-semibold leading-tight">
                            {d.getDate()}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <section className="rounded-[22px] bg-[#F5F5F7] p-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                    <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                      Available Times
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {calendarData.availability
                        .find((day) => day.date === selectedDate)
                        ?.slots.filter((slot) => slot.available)
                        .map((slot) => {
                          const time = new Date(slot.startTime);
                          const selected = selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={slot.startTime}
                              onClick={() => setSelectedSlot(slot)}
                              className={`rounded-full px-2 py-2 text-[12px] font-medium transition ${
                                selected
                                  ? "bg-[#0066CC] text-white"
                                  : "bg-white text-[#1D1D1F] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]"
                              }`}
                            >
                              {time.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </button>
                          );
                        })}
                    </div>
                    {calendarData.availability
                      .find((day) => day.date === selectedDate)
                      ?.slots.filter((slot) => slot.available).length === 0 && (
                      <p className="py-4 text-center text-[12px] font-light text-[#1D1D1F]/45">
                        No slots available
                      </p>
                    )}
                  </section>
                )}

                {selectedSlot && (
                  <StatusBanner icon={Clock}>
                    <span className="block text-[#1D1D1F]">
                      {new Date(selectedSlot.startTime).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[12px] font-normal text-[#1D1D1F]/55">
                      {new Date(selectedSlot.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}{" "}
                      -{" "}
                      {new Date(selectedSlot.endTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </StatusBanner>
                )}

                <section className="space-y-3 pt-4">
                  <HushhTechCta
                    variant={HushhTechCtaVariant.BLACK}
                    onClick={handleBookMeeting}
                    disabled={!selectedSlot || bookingInProgress}
                    className={primaryCtaClass}
                  >
                    {bookingInProgress
                      ? "Booking..."
                      : selectedSlot
                        ? "Confirm Booking"
                        : "Select a Time"}
                  </HushhTechCta>
                  <HushhTechCta
                    variant={HushhTechCtaVariant.WHITE}
                    onClick={handleContinue}
                    className={secondaryCtaClass}
                  >
                    I&apos;ll Book Later
                  </HushhTechCta>
                </section>
              </div>
            )}
          </>
        )}

        {paymentState === "booked" && (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <AppleLineIcon
              icon={ShieldCheck}
              size={76}
              className="mb-6 !text-[#34C759]"
            />
            <Eyebrow>Booked</Eyebrow>
            <Display as="h1" size="xs" maxWidth="max-w-[420px]">
              All set.
            </Display>
            <Lede className="max-w-[420px]">
              Your consultation is scheduled with Manish Sainani.
            </Lede>
            <p className="mt-3 text-[12px] font-medium text-[#1D1D1F]/55">
              {hushhCoins.toLocaleString()} Hushh Coins earned
            </p>
            <section className="mt-8 w-full space-y-3">
              <HushhTechCta
                variant={HushhTechCtaVariant.BLACK}
                onClick={handleContinue}
                className={primaryCtaClass}
              >
                Continue to Profile
              </HushhTechCta>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default MeetCeoPage;
