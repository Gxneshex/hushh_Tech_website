import { Link } from "react-router-dom";
import img from "../../files/img.png";
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

const approachCards = [
  {
    title: "Disciplined Ownership",
    body: "We prioritize high-quality businesses, resilient free cash flow, and long-term compounding over market noise.",
  },
  {
    title: "Math-Driven Decisions",
    body: "Every strategy is shaped by quantitative analysis, risk controls, and repeatable operating discipline.",
  },
  {
    title: "AI With Human Judgment",
    body: "AI expands our speed and signal coverage while human oversight sets the final guardrails.",
  },
  {
    title: "Investor Trust",
    body: "Clear communication, privacy, and transparent operations are first-class design constraints.",
  },
];

const leaders = [
  {
    name: "Manish Sainani",
    role: "Founder & CEO",
    image: img,
    body:
      "With leadership experience across Google, Microsoft, and Splunk, Manish brings AI, machine learning, and data-driven operating expertise to Hushh's long-term investment vision.",
  },
];

export default function Leadership() {
  return (
    <div
      className="min-h-screen bg-white text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader showSearch={false} />

      <main id="main-content">
        {/* Intro + Mission — light */}
        <AppleSection tone="light" pad="normal" overflow="visible">
          <Eyebrow>About Hushh</Eyebrow>
          <Display as="h1" size="md" maxWidth="max-w-[720px]">
            Investing with integrity and intelligent systems.
          </Display>
          <Lede className="max-w-[680px] md:max-w-[720px]">
            We combine quantitative expertise, AI-assisted research, and human
            judgment to build durable investment experiences.
          </Lede>

          <section
            data-testid="leadership-mission-block"
            className="mx-auto mt-12 max-w-[1060px] px-5 md:px-6"
          >
            <article className="rounded-[22px] bg-white p-6 ring-1 ring-[#1D1D1F]/[0.08] shadow-[0_18px_50px_rgba(29,29,31,0.06)] md:p-8 lg:p-10">
              <p className="text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85">
                Mission
              </p>
              <h2
                className="mt-3 max-w-[820px] text-[24px] font-semibold leading-[1.12] tracking-[-0.022em] text-[#1D1D1F] md:text-[30px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                Make sophisticated strategy feel clear, disciplined, and useful.
              </h2>
              <p className="mt-4 max-w-[880px] text-[15px] leading-[1.65] text-[#1D1D1F]/68 md:text-[16px]">
                Hushh Technologies uses data science, AI, and structured risk
                management to make institutional-style investment thinking more
                transparent and accessible.
              </p>
            </article>
          </section>
        </AppleSection>

        {/* Approach — dark */}
        <AppleSection tone="dark" pad="normal">
          <Eyebrow tone="dark">How We Operate</Eyebrow>
          <Display tone="dark" size="sm" maxWidth="max-w-[620px]">
            A disciplined approach, built to compound.
          </Display>

          <section
            data-testid="leadership-approach-grid"
            className="mx-auto mt-10 grid max-w-[1060px] auto-rows-fr gap-4 px-5 md:grid-cols-2 md:px-6"
          >
            {approachCards.map((card) => (
              <article
                key={card.title}
                className="flex h-full rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl transition duration-300 hover:border-[#2997FF]/40 md:p-7"
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <h3
                      className="text-[22px] font-semibold leading-[1.14] tracking-[-0.022em] text-[#F5F5F7]"
                      style={{ fontFamily: appleDisplayFont }}
                    >
                      {card.title}
                    </h3>
                    <p className="mt-3 max-w-[460px] text-[15px] leading-[1.58] text-[#F5F5F7]/60">
                      {card.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </AppleSection>

        {/* Leadership — light */}
        <AppleSection tone="light" pad="normal">
          <Eyebrow>Leadership</Eyebrow>
          <Display size="sm" maxWidth="max-w-[560px]">
            People behind the strategy.
          </Display>

          <div className="mx-auto mt-10 max-w-[640px] px-5 md:px-6">
            {leaders.map((leader) => (
              <article
                key={leader.name}
                className="rounded-[22px] bg-white p-6 text-left ring-1 ring-[#1D1D1F]/[0.08] shadow-[0_18px_50px_rgba(29,29,31,0.06)] md:p-8"
              >
                <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="h-24 w-24 shrink-0 rounded-[22px] object-cover object-top shadow-[0_16px_36px_rgba(29,29,31,0.12)]"
                  />
                  <div>
                    <h3
                      className="text-[22px] font-semibold leading-[1.14] tracking-[-0.022em] text-[#1D1D1F]"
                      style={{ fontFamily: appleDisplayFont }}
                    >
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-[13px] font-medium uppercase tracking-[1.2px] text-[#0066CC]/80">
                      {leader.role}
                    </p>
                    <p className="mt-3 text-[15px] leading-[1.58] text-[#1D1D1F]/62">
                      {leader.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AppleSection>

        {/* CTA — dark, last */}
        <AppleSection tone="dark" pad="normal" last>
          <Eyebrow tone="dark">Get Started</Eyebrow>
          <Display tone="dark" size="sm" maxWidth="max-w-[560px]">
            Talk with us or explore Fund A.
          </Display>

          <div className="mt-10 flex flex-wrap justify-center gap-3 px-5">
            <Link
              to="/contact"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-[17px] font-medium tracking-[-0.01em] text-[#1D1D1F] transition hover:opacity-90 active:scale-[0.98]"
              style={{ fontFamily: appleFont }}
            >
              Contact Us
            </Link>
            <Link
              to="/discover-fund-a"
              className="inline-flex h-11 items-center justify-center rounded-full bg-transparent px-6 text-[17px] font-medium tracking-[-0.01em] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.40)] transition hover:opacity-90 active:scale-[0.98]"
              style={{ fontFamily: appleFont }}
            >
              Discover Fund A
            </Link>
          </div>
        </AppleSection>
      </main>

      <HushhTechFooter />
    </div>
  );
}
