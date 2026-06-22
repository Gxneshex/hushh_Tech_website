import HushhTechHeader from "./hushh-tech-header/HushhTechHeader";
import HushhTechFooter from "./hushh-tech-footer/HushhTechFooter";
import {
  AppleSection,
  Display,
  Eyebrow,
  Lede,
  appleDisplayFont,
  appleFont,
} from "./hushh-tech-ui/HushhAppleUI";

const philosophyPillars = [
  {
    icon: "database",
    title: "Data as an Asset",
    description:
      "We treat data as a disciplined input for investor outcomes, not as a product to be extracted.",
  },
  {
    icon: "show_chart",
    title: "Volatility With Rules",
    description:
      "Every strategy is filtered through liquidity, risk limits, and a clear view of downside exposure.",
  },
  {
    icon: "psychology",
    title: "Human-Led AI",
    description:
      "Models help us see faster, but human judgment sets the guardrails and owns the decision.",
  },
];

const operatingPrinciples = [
  "Prefer durable free-cash-flow businesses over narrative-driven trades.",
  "Use automation to remove emotional timing, not to remove accountability.",
  "Keep privacy, transparency, and investor trust as first-class design constraints.",
  "Build for compounding resilience across market cycles.",
];

export default function Philosophy() {
  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader showSearch={false} />

      <main id="main-content">
        <AppleSection tone="gray" pad="normal" overflow="visible">
          <Eyebrow>Investment Philosophy</Eyebrow>
          <Display as="h1" size="md" maxWidth="max-w-[620px]">
            Data. Volatility. Alpha.
          </Display>
          <Lede>
            Hushh Technologies blends rigorous research, risk-aware execution,
            and AI-assisted analysis to build strategies that can compound with
            patience.
          </Lede>

          <section
            className="mx-auto mt-10 grid max-w-[1060px] gap-4 px-5 md:grid-cols-3 md:px-6"
            aria-label="Philosophy pillars"
          >
            {philosophyPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="relative overflow-hidden rounded-[24px] border border-[#1D1D1F]/[0.06] bg-white/78 p-6 shadow-[0_18px_50px_rgba(29,29,31,0.06)] backdrop-blur-xl transition hover:border-[#0066CC]/25"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[24px]"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.36) 100%)",
                  }}
                />
                <div className="relative z-[1]">
                  <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-[#0066CC] shadow-[0_14px_36px_rgba(29,29,31,0.10),inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <span className="material-symbols-outlined thin-icon text-[22px]" aria-hidden="true">
                      {pillar.icon}
                    </span>
                  </span>
                  <h2
                    className="text-[24px] font-semibold leading-[1.12] tracking-[-0.022em] text-[#1D1D1F] md:text-[28px]"
                    style={{ fontFamily: appleDisplayFont }}
                  >
                    {pillar.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-[1.55] text-[#1D1D1F]/60">
                    {pillar.description}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <section className="mx-auto mt-6 max-w-[1060px] px-5 md:px-6">
            <div className="rounded-[24px] border border-[#1D1D1F]/[0.06] bg-white/78 p-6 shadow-[0_18px_50px_rgba(29,29,31,0.06)] backdrop-blur-xl md:p-8">
              <p className="mb-5 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Operating Principles
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {operatingPrinciples.map((principle) => (
                  <div
                    key={principle}
                    className="flex items-start gap-3 rounded-[18px] bg-[#F5F5F7]/80 px-4 py-4"
                  >
                    <span className="material-symbols-outlined thin-icon mt-0.5 text-[18px] text-[#34C759]" aria-hidden="true">
                      check_circle
                    </span>
                    <p className="text-[15px] leading-[1.55] text-[#1D1D1F]/64">
                      {principle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AppleSection>
      </main>

      <HushhTechFooter />
    </div>
  );
}
