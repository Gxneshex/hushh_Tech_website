import React from "react";
import {
  BadgeDollarSign,
  Check,
  HeartPulse,
  Leaf,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";

const appleFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const appleDisplayFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
const featureRowClassName = "flex items-start gap-3.5";
const featureIconClassName = "mt-[3px] h-5 w-5 shrink-0 text-hushh-blue";
const benefitCardGridClassName =
  "grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6 xl:gap-8";
const benefitCardClassName =
  "h-full rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_24px_80px_rgba(29,29,31,0.08)] transition-colors hover:border-hushh-blue/25 sm:p-6";
const benefitFeatureGridClassName =
  "grid grid-cols-1 gap-x-6 gap-y-3 sm:gap-y-3.5 md:grid-cols-2 md:gap-y-4";

function BenefitIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-white/70 bg-white text-hushh-blue shadow-[0_14px_36px_rgba(29,29,31,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]">
      <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
    </span>
  );
}

const BenefitsPage: React.FC = () => {
  return (
    <div
      data-page="benefits"
      className="bg-[#F5F5F7] antialiased text-[#1D1D1F] selection:bg-hushh-blue selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-4 pt-28 pb-12 sm:px-6 md:pt-32 lg:px-8"
      >
        {/* Hero — compact; same copy as before */}
        <header className="mx-auto max-w-3xl py-6 text-center sm:py-8 md:py-10">
          <p className="mb-[18px] text-[13px] font-bold uppercase leading-tight tracking-[0.14em] text-[#0071E3]">
            Benefits
          </p>
          <h1
            className="mx-auto mb-5 max-w-[720px] text-[clamp(32px,4.6vw,54px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#1D1D1F]"
            style={{ fontFamily: appleDisplayFont, textWrap: "balance" }}
          >
            World-Class Benefits for World-Class Talent.
          </h1>
          <p className="mx-auto max-w-[46ch] text-[clamp(17px,1.6vw,20px)] font-normal leading-[1.5] tracking-[-0.01em] text-[rgba(0,0,0,0.62)]">
            We believe that exceptional people deserve exceptional benefits. Our comprehensive package is
            designed to support your professional growth, personal wellbeing, and financial future.
          </p>
        </header>

        <div className={benefitCardGridClassName} data-testid="benefits-card-grid">
          {/* Compensation & Investment Opportunities */}
          <section className={benefitCardClassName}>
            <div className="mb-5 flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <BenefitIcon icon={BadgeDollarSign} />
              <h2
                className="text-[25px] font-semibold leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[31px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                Compensation & Investment Opportunities
              </h2>
            </div>
            <ul className={benefitFeatureGridClassName}>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Competitive base salaries benchmarked to top-tier firms
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Access to proprietary investment strategies
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Performance-based bonuses tied to individual and company success
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  401(k) with generous company matching
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Equity participation in company growth
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Financial planning and investment advisory services
                </p>
              </li>
            </ul>
          </section>

          {/* Health, Wellness & Family Support */}
          <section className={benefitCardClassName}>
            <div className="mb-5 flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <BenefitIcon icon={HeartPulse} />
              <h2
                className="text-[25px] font-semibold leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[31px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                Health, Wellness & Family Support
              </h2>
            </div>
            <ul className={benefitFeatureGridClassName}>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Premium health, dental, and vision insurance (100% company paid)
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Generous parental leave policies
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Mental health and wellness programs
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Childcare assistance and family support services
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  On-site fitness facilities and wellness stipend
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Comprehensive life and disability insurance
                </p>
              </li>
            </ul>
          </section>

          {/* Work-Life, Growth & Giving Back */}
          <section className={benefitCardClassName}>
            <div className="mb-5 flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <BenefitIcon icon={Leaf} />
              <h2
                className="text-[25px] font-semibold leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[31px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                Work-Life, Growth & Giving Back
              </h2>
            </div>
            <ul className={benefitFeatureGridClassName}>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Flexible work arrangements and remote work options
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Conference attendance and continuing education support
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Unlimited PTO policy with minimum usage requirements
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Internal mentorship and leadership development programs
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Sabbatical opportunities for long-term employees
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Charitable giving matching program
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Professional development budget ($10,000+ annually)
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Volunteer time off for community service
                </p>
              </li>
            </ul>
          </section>

          {/* Perks, Culture & Quality of Life */}
          <section className={benefitCardClassName}>
            <div className="mb-5 flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <BenefitIcon icon={Sparkles} />
              <h2
                className="text-[25px] font-semibold leading-[1.05] tracking-[-0.028em] text-[#1D1D1F] sm:text-[31px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                Perks, Culture & Quality of Life
              </h2>
            </div>
            <ul className={benefitFeatureGridClassName}>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  State-of-the-art office spaces with premium amenities
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Team events, retreats, and cultural activities
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Catered meals and premium coffee/snacks
                </p>
              </li>
              <li className={featureRowClassName}>
                <Check className={featureIconClassName} aria-hidden />
                <p className="text-sm font-light leading-relaxed text-gray-500 sm:text-base">
                  Innovation time for personal projects
                </p>
              </li>
            </ul>
          </section>

          {/* Why Join Hushh Technologies? — home-style CTA card + primary black button */}
          <section className="mx-auto w-full max-w-3xl rounded-[28px] border border-black/[0.06] bg-white p-6 text-center shadow-[0_24px_80px_rgba(29,29,31,0.08)] transition-colors hover:border-hushh-blue/25 sm:p-8 lg:col-span-2">
            <h2
              className="mb-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#1D1D1F] sm:mb-4 sm:text-[40px]"
              style={{ fontFamily: appleDisplayFont }}
            >
              Why Join Hushh Technologies?
            </h2>
            <p className="mb-6 text-sm font-light leading-relaxed text-gray-500 sm:mb-8 sm:text-base md:text-lg">
              At Hushh Technologies, you'll be part of a team that's revolutionizing the investment industry
              through cutting-edge AI and quantitative methods. You'll work alongside brilliant minds, solve
              complex challenges, and directly impact the future of finance while enjoying unparalleled benefits
              and growth opportunities.
            </p>
            <a
              href="/career"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-black bg-black px-6 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-200 ease-out hover:-translate-y-px hover:bg-black/90 hover:shadow-xl active:translate-y-0 active:scale-[0.98] sm:w-auto sm:min-w-[200px]"
            >
              View Open Positions
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BenefitsPage;
