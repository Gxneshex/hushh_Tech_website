import { useHomeLogic } from "./logic";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import HushhTechCta, {
  HushhTechCtaVariant,
} from "../../components/hushh-tech-cta/HushhTechCta";

const playfair = { fontFamily: "'Playfair Display', serif" };

export default function HomePage() {
  const { primaryCTA, onNavigate } = useHomeLogic();

  return (
    <div
      data-page="home"
      className="bg-white antialiased text-gray-900 min-h-screen flex flex-col relative selection:bg-hushh-blue selection:text-white overflow-x-hidden"
    >
      <HushhTechHeader />

      <main
        id="main-content"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 lg:pb-12 pt-4"
      >
        <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-12 lg:gap-16">
          <section
            className="grid grid-cols-1 gap-8 lg:min-h-[70vh] lg:grid-cols-2 lg:items-center lg:gap-12"
            aria-labelledby="home-hero-heading"
          >
            <div className="flex min-w-0 flex-col justify-center py-4 lg:min-h-[58vh]">
              <h1
                id="home-hero-heading"
                className="text-[2.75rem] leading-[1.1] font-normal text-black tracking-tight font-serif sm:text-[3.25rem] lg:text-[4rem]"
                style={playfair}
              >
                Investing in <br /> the{" "}
                <span className="text-gray-400 italic font-light">Future.</span>
              </h1>
              <p className="text-gray-500 text-sm font-light mt-3 leading-relaxed max-w-sm sm:text-base lg:max-w-md">
                The world's first AI-powered Berkshire Hathaway. Merging rigorous
                data science with human wisdom.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-md">
                <HushhTechCta
                  onClick={primaryCTA.action}
                  disabled={primaryCTA.loading}
                  variant={HushhTechCtaVariant.BLACK}
                  aria-busy={primaryCTA.loading}
                >
                  {primaryCTA.loading ? (
                    <>
                      <span
                        className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      {primaryCTA.text}
                    </>
                  ) : (
                    <>
                      {primaryCTA.text}
                      <span className="material-symbols-outlined thin-icon text-lg" aria-hidden="true">
                        arrow_forward
                      </span>
                    </>
                  )}
                </HushhTechCta>
                <HushhTechCta
                  onClick={() => onNavigate("/discover-fund-a")}
                  variant={HushhTechCtaVariant.WHITE}
                  aria-label="Discover Fund A — learn about our flagship product"
                >
                  Discover Fund A
                </HushhTechCta>
              </div>
              <div className="mt-6 border-t border-b border-gray-100 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start sm:gap-8">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined thin-icon text-lg text-ios-green" aria-hidden="true">
                    verified_user
                  </span>
                  <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400">
                    SEC Registered
                  </span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined thin-icon text-lg text-hushh-blue" aria-hidden="true">
                    lock
                  </span>
                  <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400">
                    Bank Level Security
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-2 min-w-0 lg:mt-0">
              <div className="group bg-gradient-to-br from-[#293241] via-[#232b38] to-[#182233] hover:bg-none hover:bg-gray-100 text-white hover:text-gray-900 border border-white/20 hover:border-gray-300 p-8 sm:p-10 lg:p-12 rounded-2xl relative overflow-hidden shadow-[0_28px_80px_-34px_rgba(15,23,42,0.7)] w-full lg:max-w-[520px] lg:ml-auto transition-all duration-700 ease-out hover:-rotate-[8deg]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-hushh-blue/20 rounded-full blur-3xl" aria-hidden="true" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/10 to-transparent" aria-hidden="true" />

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="text-[10px] font-medium tracking-widest uppercase text-white/70 group-hover:text-gray-700 mb-1 block transition-colors duration-700">
                        Flagship Product
                      </span>
                      <h2
                        className="text-3xl font-medium font-serif sm:text-4xl transition-colors duration-700"
                        style={playfair}
                      >
                        Fund A
                      </h2>
                    </div>
                    <span className="self-start bg-hushh-blue/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border border-hushh-blue/30 text-hushh-blue">
                      High Growth
                    </span>
                  </div>

                  <div className="space-y-4 my-2 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
                    <div>
                      <span className="text-xs text-white/70 group-hover:text-gray-700 block mb-1 transition-colors duration-700">
                        Target Net IRR
                      </span>
                      <span
                        className="text-[40px] font-serif font-light tracking-tighter text-ios-green leading-none sm:text-[48px] lg:text-[56px]"
                        style={playfair}
                      >
                        18-23%
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-white/70 group-hover:text-gray-700 block mb-1 transition-colors duration-700">
                        Inception Year
                      </span>
                      <span
                        className="font-serif text-[36px] leading-none sm:text-[44px] transition-colors duration-700"
                        style={playfair}
                      >
                        2024
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full min-h-[44px] pt-4 border-t border-white/10 group-hover:border-gray-300 flex items-center justify-between cursor-pointer bg-transparent text-left transition-colors duration-700 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-hushh-blue focus-visible:ring-offset-2"
                    onClick={() => onNavigate("/discover-fund-a")}
                    aria-label="View performance details"
                  >
                    <span className="text-xs font-medium tracking-wide uppercase text-hushh-blue">
                      Performance Details
                    </span>
                    <span className="material-symbols-outlined thin-icon text-sm text-hushh-blue group-hover:translate-x-1 transition-transform" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-auto space-y-12 lg:space-y-16" aria-labelledby="home-advantage-heading">
            <div className="inline-block px-3 py-1 border border-hushh-blue/20 rounded-full bg-hushh-blue/5">
              <span className="text-[10px] tracking-widest uppercase font-medium text-hushh-blue flex items-center gap-1">
                <span
                  className="relative flex items-center justify-center w-1.5 h-1.5"
                  aria-hidden="true"
                >
                  <span className="absolute inline-flex w-full h-full bg-hushh-blue rounded-full opacity-75 animate-ping" />
                  <span className="relative w-1.5 h-1.5 bg-hushh-blue rounded-full" />
                </span>
                AI-Powered Investing
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6" role="list">
              <div className="bg-ios-gray-bg p-5 rounded-2xl border border-gray-200/60 flex flex-col justify-between min-h-[180px] sm:min-h-[220px] hover:border-hushh-blue/30 transition-colors" role="listitem">
                <span className="material-symbols-outlined thin-icon text-3xl mb-4 text-hushh-blue" aria-hidden="true">
                  neurology
                </span>
                <div>
                  <h2
                    className="text-lg font-medium mb-1 font-serif"
                    style={playfair}
                  >
                    AI-Powered
                  </h2>
                  <p className="text-xs text-gray-500 font-light leading-relaxed sm:text-sm">
                    Institutional analytics processing millions of signals.
                  </p>
                </div>
              </div>
              <div className="bg-ios-gray-bg p-5 rounded-2xl border border-gray-200/60 flex flex-col justify-between min-h-[180px] sm:min-h-[220px] hover:border-hushh-blue/30 transition-colors" role="listitem">
                <span className="material-symbols-outlined thin-icon text-3xl mb-4 text-ios-dark" aria-hidden="true">
                  supervised_user_circle
                </span>
                <div>
                  <h2
                    className="text-lg font-medium mb-1 font-serif"
                    style={playfair}
                  >
                    Human-Led
                  </h2>
                  <p className="text-xs text-gray-500 font-light leading-relaxed sm:text-sm">
                    Seasoned oversight ensuring long-term strategic vision.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-10 lg:space-y-12">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2 font-medium">
                  Why Hushh
                </p>
                <h2
                  id="home-advantage-heading"
                  className="text-2xl font-medium mb-8 tracking-tight font-serif sm:text-3xl"
                  style={playfair}
                >
                  The Hushh Advantage
                </h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4" role="list">
                  {[
                    {
                      icon: "analytics",
                      color: "text-hushh-blue",
                      bg: "bg-hushh-blue/10",
                      title: "Data Driven",
                      desc: "Decisions based on facts, not emotions.",
                    },
                    {
                      icon: "savings",
                      color: "text-ios-green",
                      bg: "bg-ios-green/10",
                      title: "Low Fees",
                      desc: "More of your returns stay in your pocket.",
                    },
                    {
                      icon: "workspace_premium",
                      color: "text-ios-yellow",
                      bg: "bg-ios-yellow/10",
                      title: "Expert Vetted",
                      desc: "Top-tier financial minds at work.",
                    },
                    {
                      icon: "autorenew",
                      color: "text-hushh-blue",
                      bg: "bg-hushh-blue/10",
                      title: "Automated",
                      desc: "Set it and forget it peace of mind.",
                    },
                  ].map((item) => (
                    <div
                      key={item.icon}
                      className="flex flex-col items-center text-center gap-3"
                      role="listitem"
                    >
                      <div
                        className={`w-12 h-12 rounded-full border border-gray-200/60 flex items-center justify-center ${item.bg}`}
                      >
                        <span
                          className={`material-symbols-outlined thin-icon ${item.color}`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 font-light max-w-[180px] mx-auto">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
                {[
                  {
                    icon: "rocket_launch",
                    color: "text-hushh-blue",
                    title: "High Growth",
                    desc: "Accelerated returns strategy",
                  },
                  {
                    icon: "pie_chart",
                    color: "text-ios-yellow",
                    title: "Diversified",
                    desc: "Multi-sector allocation",
                  },
                  {
                    icon: "trending_up",
                    color: "text-ios-green",
                    title: "Liquid",
                    desc: "Quarterly redemption windows",
                  },
                  {
                    icon: "security",
                    color: "text-hushh-blue",
                    title: "Secure",
                    desc: "Regulated custodian assets",
                  },
                ].map((item) => (
                  <div
                    key={item.icon}
                    className="bg-ios-gray-bg border border-gray-200/60 p-4 rounded-2xl hover:border-hushh-blue/30 transition-colors"
                    role="listitem"
                  >
                    <span
                      className={`material-symbols-outlined thin-icon ${item.color} mb-2`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 font-light">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <HushhTechCta
                  onClick={() => onNavigate("/discover-fund-a")}
                  variant={HushhTechCtaVariant.BLACK}
                >
                  Explore Our Approach
                  <span className="material-symbols-outlined thin-icon text-lg" aria-hidden="true">
                    arrow_right_alt
                  </span>
                </HushhTechCta>
                <HushhTechCta
                  onClick={() => onNavigate("/community")}
                  variant={HushhTechCtaVariant.WHITE}
                >
                  Learn More
                </HushhTechCta>
              </div>
            </div>
          </section>

          <footer className="pb-8">
            <p
              className="text-[10px] text-gray-400 text-center leading-relaxed italic max-w-xs sm:max-w-lg lg:max-w-3xl mx-auto font-serif"
              style={playfair}
            >
              Investing involves risk, including possible loss of principal. Past
              performance does not guarantee future results. Hushh Technologies is
              an SEC registered investment advisor.
            </p>
          </footer>
        </div>
      </main>

      <div className="lg:hidden">
        <HushhTechFooter activeTab={HushhFooterTab.HOME} />
      </div>
    </div>
  );
}
