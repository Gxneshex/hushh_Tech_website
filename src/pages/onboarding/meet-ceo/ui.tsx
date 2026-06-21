/**
 * Meet CEO / Fund Manager — Apple-style presentation.
 * Payment, coupon, calendar, and profile routing stay in logic.ts.
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useMeetCeoLogic } from "./logic";
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  AppleLineIcon,
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-[-0.01em] !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-[-0.01em] !shadow-none";

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

function MeetCeoPage() {
  const {
    paymentState,
    error,
    hushhCoins,
    calendarData,
    loadingSlots,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    bookingInProgress,
    handleBookMeeting,
    handleContinue,
    handleBack,
  } = useMeetCeoLogic();

  if (paymentState === "loading") {
    return (
      <div
        className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQ" />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-[#1D1D1F]/10 border-t-[#0066CC]" />
            <p className="text-[14px] font-light text-[#1D1D1F]/55">
              Loading...
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
      <HushhTechBackHeader onBackClick={handleBack} rightLabel="FAQ" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-4 pb-48 sm:px-5">
        <section className="pb-8 pt-14 text-center">
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
          <section className="mb-6 rounded-[24px] bg-[#F5F5F7] p-6 text-center shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            <p className="mx-auto max-w-[440px] text-[14px] font-light leading-[1.45] text-[#1D1D1F]/68">
              Finishing setting up your investor access… your{" "}
              <span className="font-medium text-[#1D1D1F]">$1 fund payment</span>{" "}
              already covers this — there is nothing more to pay. If this doesn&apos;t
              resolve in a moment, please refresh.
            </p>
            <div className="mt-5">
              <HushhTechCta
                variant={HushhTechCtaVariant.WHITE}
                onClick={handleContinue}
                className={secondaryCtaClass}
              >
                Go to Profile
              </HushhTechCta>
            </div>
          </section>
        )}

        {paymentState === "paid" && (
          <>
            <div className="mb-6">
              <StatusBanner icon={CheckCircle2} tone="success">
                <span className="block text-[#1D1D1F]">You&apos;re all set — your $1 fund payment unlocked this.</span>
                <span className="text-[12px] font-normal text-[#1D1D1F]/55">
                  {hushhCoins.toLocaleString()} Hushh Coins credited · book your 1-on-1 below
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
