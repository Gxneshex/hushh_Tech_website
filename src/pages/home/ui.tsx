import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHomeLogic } from "./logic";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
import SeoHead from "../../components/seo/SeoHead";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  Icon,
  PillButton,
  SYS,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import techTeamImage from "../../components/images/tech-team-final.png";

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function useInViewOnce<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || visible) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}

function CountUp({
  value,
  decimals = 0,
  active,
}: {
  value: number;
  decimals?: number;
  active: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value]);

  return <>{display.toFixed(decimals)}</>;
}

function Reveal({
  children,
  className = "",
  delay = 0,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();
  const shown = immediate || visible;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(28px)",
        transition:
          "opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function HomeStyles() {
  return (
    <style>{`
      @keyframes hh-home-glowdrift {
        0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
        50% { transform: translateX(-50%) translateY(-16px) scale(1.06); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-home-motion] {
          animation: none !important;
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      }
    `}</style>
  );
}

function Section({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "gray" | "dark";
  className?: string;
}) {
  const toneClass =
    tone === "dark"
      ? "bg-black text-white"
      : tone === "gray"
        ? "bg-[#F5F5F7] text-[#1D1D1F]"
        : "bg-white text-[#1D1D1F]";

  return (
    <section
      className={`relative overflow-hidden px-5 py-[96px] sm:px-10 lg:py-[150px] ${toneClass} ${className}`}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </section>
  );
}

function Eyebrow({
  children,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`text-[13px] font-bold uppercase tracking-[0.14em] ${dark ? "text-[#2997FF]" : "text-[#0071E3]"} ${className}`}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </div>
  );
}

function Heading({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={`m-0 text-balance text-[clamp(32px,4.6vw,54px)] font-semibold leading-[1.08] tracking-[-0.025em] ${className}`}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </Tag>
  );
}

function Lead({
  children,
  className = "",
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <p
      className={`m-0 text-pretty text-[clamp(17px,1.6vw,20px)] font-light leading-[1.5] ${dark ? "text-white/55" : "text-black/50"} ${className}`}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </p>
  );
}

function IconTile({ children, large = false }: { children: ReactNode; large?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-[#0071E3] ${large ? "h-[46px] w-[46px] rounded-[13px]" : "h-11 w-11 rounded-xl"}`}
    >
      {children}
    </span>
  );
}

const technologyFeatures = [
  {
    title: "AI-Powered",
    body: "Institutional analytics processing millions of signals.",
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="7" y="7" width="10" height="10" rx="2" stroke="#fff" strokeWidth="1.7" />
        <rect x="10" y="10" width="4" height="4" rx="1" fill="#fff" />
        <path
          d="M9.5 3v2.5M14.5 3v2.5M9.5 18.5V21M14.5 18.5V21M3 9.5h2.5M3 14.5h2.5M18.5 9.5H21M18.5 14.5H21"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Human-Led",
    body: "Seasoned oversight ensuring long-term, conviction-led decisions.",
    icon: (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="9" r="3.2" stroke="#fff" strokeWidth="1.7" />
        <path
          d="M5.5 20c0-3.4 2.9-5.4 6.5-5.4s6.5 2 6.5 5.4"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const principleCards = [
  {
    title: "Data Driven",
    body: "Decisions based on facts, not emotions.",
    icon: <path d="M5 20V11M12 20V5M19 20v-7" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />,
  },
  {
    title: "Low Fees",
    body: "More of your returns stay in your pocket.",
    icon: (
      <>
        <circle cx="8" cy="8" r="2.4" stroke="#fff" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="2.4" stroke="#fff" strokeWidth="1.6" />
        <path d="M17 7L7 17" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Expert Vetted",
    body: "Top-tier financial minds at work.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Automated",
    body: "Set it and forget it peace of mind.",
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />,
  },
];

const whatYouGetCards = [
  {
    title: "High Growth",
    body: "Accelerated returns strategy.",
    icon: (
      <>
        <path d="M4 17l6-6 4 3 6-8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 6h5v5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Diversified",
    body: "Multi-sector allocation.",
    icon: (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" stroke="#fff" strokeWidth="1.7" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" stroke="#fff" strokeWidth="1.7" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" stroke="#fff" strokeWidth="1.7" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" stroke="#fff" strokeWidth="1.7" />
      </>
    ),
  },
  {
    title: "Liquid",
    body: "Quarterly redemption windows.",
    icon: (
      <>
        <path d="M3 9h14M13.5 5L18 9l-4.5 4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 15H7m3.5-4L6 15l4.5 4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Secure",
    body: "Regulated custodian assets.",
    icon: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

function FundStatsSection({
  onInvest,
}: {
  onInvest: () => void;
}) {
  const { ref, visible } = useInViewOnce<HTMLDivElement>(0.35);

  return (
    <Section tone="dark" className="!py-[96px] lg:!py-[150px]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <div className="max-w-[760px]">
            <div className="mb-6 inline-flex items-center gap-[9px] rounded-full border border-white/20 px-4 py-2">
              <span className="h-[7px] w-[7px] rounded-full bg-[#2997FF]" />
              <span className="text-[12px] font-semibold tracking-[0.06em] text-white/80">
                High Growth
              </span>
            </div>
            <Heading className="text-white">Fund A.</Heading>
            <p className="mt-[22px] max-w-[42ch] text-[clamp(18px,1.6vw,24px)] font-light leading-[1.4] text-white/55">
              A high-growth strategy engineered to compound capital with discipline.
            </p>
          </div>
        </Reveal>

        <div
          ref={ref}
          className="mt-[clamp(56px,7vw,88px)] grid grid-cols-1 md:grid-cols-3"
        >
          <div className="border-white/15 px-0 py-8 md:border-r md:px-[clamp(20px,3vw,44px)] md:py-2">
            <div className="text-[clamp(52px,7vw,90px)] font-semibold leading-[0.95] tracking-[-0.03em] text-[#2997FF]">
              +<CountUp value={21.4} decimals={1} active={visible} />
              <small className="text-[0.5em]">%</small>
            </div>
            <div className="mt-[18px] text-[15px] leading-[1.45] text-white/60">
              Net of fees
            </div>
            <div className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-white/40">
              FY 2025
            </div>
          </div>

          <div className="border-t border-white/15 px-0 py-8 md:border-r md:border-t-0 md:px-[clamp(20px,3vw,44px)] md:py-2">
            <div className="text-[clamp(52px,7vw,90px)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
              <CountUp value={18} active={visible} />&ndash;
              <CountUp value={23} active={visible} />
              <small className="text-[0.5em]">%</small>
            </div>
            <div className="mt-[18px] text-[15px] leading-[1.45] text-white/60">
              Target internal rate of return
            </div>
          </div>

          <div className="border-t border-white/15 px-0 py-8 md:border-t-0 md:px-[clamp(20px,3vw,44px)] md:py-2">
            <div className="text-[clamp(40px,5vw,66px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
              Quarterly
            </div>
            <div className="mt-[18px] text-[15px] leading-[1.45] text-white/60">
              Redemption liquidity windows
            </div>
          </div>
        </div>

        <Reveal className="mt-[clamp(48px,6vw,72px)]">
          <button
            type="button"
            onClick={onInvest}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-[30px] text-[17px] font-semibold text-[#1D1D1F] transition hover:-translate-y-px hover:bg-[#F0F0F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF]/50"
          >
            Invest in Fund A
          </button>
        </Reveal>
      </div>
    </Section>
  );
}

function TechnologySection() {
  return (
    <Section>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-center gap-[clamp(40px,6vw,80px)] lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Fund Technology</Eyebrow>
            <Heading className="mt-[18px] max-w-[560px]">
              Designed like a technology product.
            </Heading>
            <p className="mt-6 max-w-[44ch] text-[clamp(18px,1.5vw,21px)] leading-[1.47] text-[#6E6E73]">
              Institutional analytics, human oversight, and modern fund operations
              &mdash; in one investment experience.
            </p>

            <div className="mb-[22px] mt-[clamp(40px,5vw,56px)] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868B]">
              Includes
            </div>
            <div className="grid gap-7 sm:grid-cols-2">
              {technologyFeatures.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-4">
                  <IconTile>{feature.icon}</IconTile>
                  <div>
                    <h3 className="text-[19px] font-semibold text-[#1D1D1F]">
                      {feature.title}
                    </h3>
                    <p className="mt-[7px] max-w-[280px] text-[15px] leading-[1.45] text-[#6E6E73]">
                      {feature.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-[clamp(40px,5vw,56px)] inline-flex items-center gap-1 text-[17px] font-medium text-[#0066CC] transition hover:underline"
            >
              Explore the technology
              <span className="text-[19px] leading-none">&rsaquo;</span>
            </button>
          </Reveal>

          <Reveal delay={120} className="flex justify-center">
            <img
              src={techTeamImage}
              alt="Hushh product team - AI-powered, +21.4% net"
              className="block w-full max-w-[720px] object-contain"
            />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function PrinciplesSection() {
  return (
    <Section tone="gray">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="mx-auto mb-[clamp(48px,6vw,64px)] max-w-[680px] text-center">
          <Eyebrow className="mb-4">Why Hushh</Eyebrow>
          <Heading>Built on principles you can trust.</Heading>
        </Reveal>

        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {principleCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 70}>
              <div className="flex min-h-[200px] flex-col rounded-[22px] bg-white p-[30px] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
                <IconTile>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {card.icon}
                  </svg>
                </IconTile>
                <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-[#1D1D1F]">
                  {card.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.5] text-[#6E6E73]">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

function WhatYouGetSection({
  onInvest,
  onProspectus,
}: {
  onInvest: () => void;
  onProspectus: () => void;
}) {
  return (
    <Section tone="dark" className="!pb-[150px] lg:!pb-[200px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[58%] w-[min(92vw,1040px)] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,113,227,0.18), rgba(0,113,227,0) 70%)",
        }}
      />
      <div className="relative z-[1] mx-auto max-w-[1100px]">
        <Reveal className="mx-auto mb-[clamp(48px,6vw,64px)] max-w-[680px] text-center">
          <Eyebrow dark className="mb-[18px]">
            What you get
          </Eyebrow>
          <Heading className="text-white">Everything for serious investing.</Heading>
          <Lead dark className="mx-auto mt-5 max-w-[46ch]">
            Start with Fund A, or read the full prospectus to understand the
            strategy, terms, and risk framework.
          </Lead>
        </Reveal>

        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {whatYouGetCards.map((card, index) => (
            <Reveal key={card.title} delay={index * 70}>
              <div className="flex min-h-[204px] flex-col rounded-[22px] border border-white/[0.08] bg-[#0E0E10] p-[30px] transition duration-300 hover:-translate-y-1.5 hover:border-[#2997FF]/45">
                <IconTile large>
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {card.icon}
                  </svg>
                </IconTile>
                <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.01em] text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.5] text-white/55">
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-[clamp(44px,6vw,62px)] flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onInvest}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-[30px] text-[17px] font-semibold text-[#1D1D1F] transition hover:-translate-y-px hover:bg-[#F0F0F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF]/50"
          >
            Invest in Fund A
          </button>
          <button
            type="button"
            onClick={onProspectus}
            className="inline-flex min-h-[52px] items-center justify-center gap-1 rounded-full border border-white/40 bg-transparent px-[30px] text-[17px] font-medium text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF]/50"
          >
            Read the prospectus
            <span className="text-[18px] leading-none">&rsaquo;</span>
          </button>
        </Reveal>
      </div>
    </Section>
  );
}

const footerLinks = [
  { label: "Disclosures", href: "/risk-disclosures" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/support" },
] as const;

function PageFooter() {
  return (
    <footer className="border-t border-[#1D1D1F]/[0.08] bg-[#F5F5F7] px-10 pb-36 pt-[clamp(48px,6vw,72px)] text-center">
      <p
        className="mx-auto max-w-[74ch] text-[13px] leading-[1.6] text-black/45"
        style={{ fontFamily: appleFont }}
      >
        Investing involves risk, including loss of principal. Past performance does
        not guarantee future results. Hushh Technologies, Inc. is an SEC-registered
        investment adviser.
      </p>
      <div className="my-6 flex flex-wrap justify-center gap-x-[30px] gap-y-2.5">
        {footerLinks.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-[14px] font-medium text-[#0066CC] transition hover:underline"
            style={{ fontFamily: appleFont }}
          >
            {label}
          </a>
        ))}
      </div>
      <p
        className="text-[12px] text-black/40"
        style={{ fontFamily: appleFont }}
      >
        © 2026 Hushh. All Rights Reserved.
      </p>
    </footer>
  );
}

export default function HomePage() {
  const { primaryCTA, onNavigate } = useHomeLogic();
  const primaryLabel = primaryCTA.text;

  return (
    <div
      data-page="hushh-home"
      className="min-h-screen overflow-x-hidden bg-white text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HomeStyles />
      <SeoHead
        path="/"
        description="Invest alongside HushhTech — an AI-driven, long-term value strategy modeled on Berkshire Hathaway. We combine AI and human expertise to back exceptional businesses."
      />
      <HushhTechHeader showSearch={false} />

      <main id="main-content">
        <section
          className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-white px-6 pb-[clamp(100px,13vh,140px)] pt-[clamp(118px,15vh,168px)] text-center text-[#1D1D1F]"
          style={{ fontFamily: appleFont }}
        >
          <div
            data-home-motion
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[6%] z-0 h-[min(70vw,760px)] w-[min(78vw,920px)] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(0,113,227,0.1), rgba(0,113,227,0) 62%)",
              animation: "hh-home-glowdrift 11s ease-in-out infinite",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-55"
            style={{
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              WebkitMaskImage:
                "radial-gradient(ellipse 56% 42% at 50% 28%, #000 0%, transparent 76%)",
              maskImage:
                "radial-gradient(ellipse 56% 42% at 50% 28%, #000 0%, transparent 76%)",
            }}
          />

          <div className="relative z-[2] mx-auto flex max-w-[980px] flex-col items-center">
            <Reveal immediate>
              <div className="mb-[26px] inline-flex items-center gap-2 rounded-full bg-[#0071E3]/[0.08] py-[7px] pl-[11px] pr-[15px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
                <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#0071E3]">
                  AI-Powered Investing
                </span>
              </div>
            </Reveal>

            <Reveal immediate delay={70}>
              <Heading
                as="h1"
                className="max-w-[980px] text-[clamp(38px,6.2vw,68px)]"
              >
                The world's first AI-powered Berkshire Hathaway.
              </Heading>
            </Reveal>

            <Reveal immediate delay={140}>
              <p className="mt-[26px] max-w-[36ch] text-[clamp(19px,2.1vw,25px)] font-light leading-[1.4] tracking-[-0.01em] text-black/50">
                Merging rigorous data science with human wisdom.
              </p>
            </Reveal>

            <Reveal immediate delay={210}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-[22px]">
                <PillButton
                  onClick={primaryCTA.action}
                  disabled={primaryCTA.loading}
                >
                  {primaryCTA.loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {primaryLabel}
                    </span>
                  ) : (
                    primaryLabel
                  )}
                </PillButton>
                <button
                  type="button"
                  onClick={() => onNavigate("/discover-fund-a")}
                  className="inline-flex min-h-[52px] items-center gap-1 text-[17px] font-medium text-[#0066CC] transition hover:underline"
                >
                  Discover Fund A
                  {Icon.chevronRight(SYS.blue, 14)}
                </button>
              </div>
            </Reveal>

            {primaryCTA.progressLabel && (
              <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/75">
                {primaryCTA.progressLabel}
              </p>
            )}

            <Reveal immediate delay={280}>
              <div className="mt-[22px] text-[13px] text-black/40">
                SEC Registered &nbsp;&middot;&nbsp; Bank-Level Security
              </div>
            </Reveal>
          </div>
        </section>

        <FundStatsSection onInvest={() => onNavigate("/discover-fund-a")} />
        <TechnologySection />
        <PrinciplesSection />
        <WhatYouGetSection
          onInvest={() => onNavigate("/discover-fund-a")}
          onProspectus={() =>
            onNavigate("/community/fund-documents/investment-prospectus")
          }
        />
      </main>

      <PageFooter />
      <HushhTechFooter activeTab={HushhFooterTab.HOME} />
    </div>
  );
}
