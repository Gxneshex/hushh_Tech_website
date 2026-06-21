/**
 * Access denied surface for users whose Hushh Fund application was rejected
 * during manual investor verification. Reached via the InvestorAccessRoute
 * gate when fund_investor_verification_status === "rejected".
 */
import HushhTechBackHeader from "../../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../../components/hushh-tech-cta/HushhTechCta";
import {
  Display,
  Eyebrow,
  Lede,
  appleFont,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

const SUPPORT_EMAIL = "support@hushh.ai";

const primaryCtaClass =
  "!rounded-full !border-[#0066CC] !bg-[#0066CC] !text-white !font-medium !tracking-normal !shadow-none";
const secondaryCtaClass =
  "!rounded-full !border-[#1D1D1F]/15 !bg-white !text-[#1D1D1F] !font-medium !tracking-normal !shadow-none";

export default function OnboardingAccessDeniedPage() {
  return (
    <div
      className="flex min-h-screen flex-col bg-white text-[#1D1D1F] antialiased"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader
        onBackClick={() => window.location.assign("/")}
        rightLabel="FAQ"
      />

      <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col px-5 pb-24 pt-20 text-center">
        <Eyebrow>Application Status</Eyebrow>
        <Display as="h1" size="xs" maxWidth="max-w-[520px]">
          Your Hushh Fund application is not approved at this time.
        </Display>
        <Lede className="mx-auto max-w-[480px]">
          The Hushh investor review team was unable to approve your application
          based on the information provided. If you believe this was an error,
          or you have new information to share, please reach out to our team.
        </Lede>

        <section className="mt-9 rounded-[24px] bg-[#F5F5F7] p-5 text-left shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#0066CC]">
              <span className="material-symbols-outlined text-[22px]">forum</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#1D1D1F]">
                Talk to the Hushh team
              </p>
              <p className="mt-1 text-[12px] font-light leading-[1.55] text-[#1D1D1F]/60">
                Email{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-[#0066CC] underline"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                with your name and any context you would like the team to
                reconsider. If your application is reopened, you will receive
                an email with next steps.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-3">
          <HushhTechCta
            variant={HushhTechCtaVariant.BLACK}
            onClick={() => {
              window.location.assign(`mailto:${SUPPORT_EMAIL}`);
            }}
            className={primaryCtaClass}
          >
            Contact support
          </HushhTechCta>
          <HushhTechCta
            variant={HushhTechCtaVariant.WHITE}
            onClick={() => window.location.assign("/")}
            className={secondaryCtaClass}
          >
            Back to Hushh Tech
          </HushhTechCta>
        </div>
      </main>
    </div>
  );
}
