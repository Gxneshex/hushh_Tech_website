import { useState, type PointerEvent, type ReactNode } from "react";
import { useHomeLogic } from "./logic";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
import SeoHead from "../../components/seo/SeoHead";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  AppIcon,
  AppleSection,
  ChevLink,
  Display,
  Eyebrow,
  Icon,
  Lede,
  PillButton,
  SYS,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";

const FUND_A_APPLE_GREEN = "#30D158";

const PerformancePreview = () => {
  const pct = "+21.4%";
  const progress = 0.86;
  const size = 220;
  const stroke = 14;
  const radius = (size - stroke) / 2 - 6;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;
  const pctValue = pct.slice(1).replace("%", "");

  return (
    <div
      className="relative mx-auto max-w-[360px] text-center md:max-w-[420px]"
      aria-label="Fund A performance preview"
      style={{ fontFamily: appleFont }}
    >
      <div className="relative mx-auto h-[176px] w-[176px] min-[390px]:h-[184px] min-[390px]:w-[184px] md:h-[252px] md:w-[252px]">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block h-full w-full -rotate-90"
        >
          <defs>
            <linearGradient id="homeFundARingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={FUND_A_APPLE_GREEN} />
              <stop offset="100%" stopColor={FUND_A_APPLE_GREEN} />
            </linearGradient>
            <filter id="homeFundARingGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(235,235,245,0.065)"
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#homeFundARingGrad)"
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset={0}
            filter="url(#homeFundARingGlow)"
            style={{
              transition:
                "stroke-dashoffset 1.3s cubic-bezier(0.34,0.85,0.3,1)",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline font-semibold leading-none tracking-[-1.2px] text-white tabular-nums md:tracking-[-1.7px]">
            <span className="mr-1 text-[25px] md:text-[34px]" style={{ color: FUND_A_APPLE_GREEN }}>
              {pct[0]}
            </span>
            <span className="text-[46px] md:text-[64px]">{pctValue}</span>
            <span className="ml-px text-[18px] font-medium text-[rgba(235,235,245,0.50)] md:text-[24px]">
              %
            </span>
          </div>
          <div className="mt-1.5 text-[12px] font-normal tracking-[-0.08px] text-[rgba(235,235,245,0.5)] md:mt-2 md:text-[13px]">
            Net of fees
          </div>
        </div>
      </div>

      <div className="mt-3.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-[rgba(235,235,245,0.48)] md:mt-6 md:text-[12px] md:tracking-[1.4px]">
        Net return &middot; inception to date
      </div>

      <div className="mx-auto mt-4 grid max-w-[310px] grid-cols-[1fr_1px_1fr] items-start border-t border-[rgba(235,235,245,0.13)] pt-4 md:mt-8 md:max-w-[400px] md:pt-7">
        <div>
          <div className="text-[19px] font-semibold leading-none tracking-[-0.35px] text-white tabular-nums md:text-[22px] md:tracking-[-0.5px]">
            18&ndash;23%
          </div>
          <div className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[rgba(235,235,245,0.43)] md:mt-3 md:text-[11px] md:tracking-[0.6px]">
            Target IRR
          </div>
        </div>
        <div className="h-[38px] bg-[rgba(235,235,245,0.13)] md:h-[44px]" />
        <div>
          <div className="text-[19px] font-semibold leading-none tracking-[-0.35px] text-white tabular-nums md:text-[22px] md:tracking-[-0.5px]">
            Jan 2024
          </div>
          <div className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.5px] text-[rgba(235,235,245,0.43)] md:mt-3 md:text-[11px] md:tracking-[0.6px]">
            Inception
          </div>
        </div>
      </div>
    </div>
  );
};

const FundACard = () => {
  const restTilt = { rx: 6, ry: -10 };
  const [tilt, setTilt] = useState(restTilt);
  const shineX = 50 + tilt.ry * 1.4;
  const shineY = 50 - tilt.rx * 1.4;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setTilt({ rx: -dy * 14, ry: dx * 18 });
  };

  const handlePointerLeave = () => setTilt(restTilt);

  return (
    <div
      className="relative -m-5 p-5 [perspective-origin:50%_50%] [perspective:900px] md:-m-[30px] md:p-[30px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      style={{
        touchAction: "pan-y",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label="Hushh Fund A card visual"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2.5 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(94,92,230,0.35) 0%, rgba(0,122,255,0.2) 30%, rgba(0,0,0,0) 65%)",
        }}
      />
      <div
        className="relative h-[118px] w-[192px] overflow-hidden rounded-[16px] min-[390px]:h-[126px] min-[390px]:w-[204px] md:h-[160px] md:w-[260px] md:rounded-[18px]"
        style={{
          background:
            "linear-gradient(135deg, #1a1a24 0%, #0e0e14 50%, #1a1620 100%)",
          boxShadow:
            "0 30px 60px rgba(0,0,0,0.5), 0 12px 32px rgba(94,92,230,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.35s cubic-bezier(0.2,0.7,0.2,1)",
          willChange: "transform",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[18px] mix-blend-screen"
          style={{
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)`,
            transition: "background 0.15s linear",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[18px] p-px"
          style={{
            background:
              "linear-gradient(135deg, rgba(94,92,230,0.6) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, rgba(0,122,255,0.5) 100%)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[18px]"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -left-[30px] -top-[30px] h-40 w-40"
          style={{
            background:
              "radial-gradient(circle, rgba(94,92,230,0.35) 0%, rgba(94,92,230,0) 70%)",
          }}
        />

        <div
          className="absolute inset-0 flex flex-col justify-between p-3.5 md:p-[18px]"
          style={{ fontFamily: appleFont }}
        >
          <div className="flex items-start justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-[2.4px] text-white/65">
              Hushh Capital
            </span>
            <div className="h-4 w-[22px] rounded-[3px] bg-gradient-to-br from-[#5e5ce6] to-[#007aff] shadow-[0_0_8px_rgba(94,92,230,0.4)]" />
          </div>
          <div
            className="text-[48px] font-bold leading-[0.9] tracking-[-2px] md:text-[56px]"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #d0d0d8 60%, #a0a0b0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              fontFamily: appleFont,
            }}
          >
            A.
          </div>
          <div className="flex items-end justify-between gap-3 font-mono text-[8.5px] tracking-[1.8px] text-white/50">
            <span>FLAGSHIP / FUND A</span>
            <span>MMXXIV</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PremiumCTA = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className="h-12 rounded-full border-0 px-[26px] text-[17px] font-medium tracking-[-0.01em] text-[#0A0A0E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2997FF]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0E]"
      style={{
        WebkitAppearance: "none",
        cursor: "pointer",
        background: "linear-gradient(180deg, #ffffff 0%, #e8e8ee 100%)",
        WebkitBackdropFilter: "blur(16px)",
        backdropFilter: "blur(16px)",
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        opacity: pressed ? 0.92 : 1,
        transition:
          "transform 0.12s cubic-bezier(0.2,0.7,0.2,1), opacity 0.12s linear",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: appleFont,
      }}
    >
      {children}
    </button>
  );
};

const SpecCard = ({
  title,
  body,
  dark = false,
}: {
  title: string;
  body: string;
  dark?: boolean;
}) => (
  <div
    className={`rounded-[18px] p-5 ${dark ? "bg-[#161617] shadow-[inset_0_0_0_0.5px_rgba(245,245,247,0.08)]" : "bg-[#FFFFFF]"}`}
  >
    <h3
      className={`mb-1.5 text-[18px] font-medium leading-[1.06] tracking-[-0.028em] ${dark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
      style={{ fontFamily: appleFont }}
    >
      {title}
    </h3>
    <p
      className={`text-[13px] leading-[1.35] tracking-normal ${dark ? "text-[#F5F5F7]/60" : "text-[#1D1D1F]/60"}`}
      style={{ fontFamily: appleFont }}
    >
      {body}
    </p>
  </div>
);

const BigCard = ({
  tone = "light",
  eyebrow,
  title,
  body,
  iconKind,
}: {
  tone?: "light" | "dark";
  eyebrow: string;
  title: string;
  body: string;
  iconKind: "api" | "intelligence" | "person";
}) => {
  const dark = tone === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] px-6 py-8 ${dark ? "bg-[#161617] text-[#F5F5F7]" : "bg-[#F5F5F7] text-[#1D1D1F]"}`}
    >
      <div className="mb-6">
        <AppIcon kind={iconKind} size={56} />
      </div>
      <p
        className={`mb-2 text-[11px] font-medium uppercase tracking-[1.6px] ${dark ? "text-[#2997FF]/85" : "text-[#0066CC]/85"}`}
        style={{ fontFamily: appleFont }}
      >
        {eyebrow}
      </p>
      <h3
        className="mb-2 text-[28px] font-medium leading-[1.06] tracking-[-0.028em]"
        style={{ fontFamily: appleFont }}
      >
        {title}
      </h3>
      <p
        className={`max-w-[320px] text-[15px] leading-[1.4] tracking-normal ${dark ? "text-[#F5F5F7]/70" : "text-[#1D1D1F]/70"}`}
        style={{ fontFamily: appleFont }}
      >
        {body}
      </p>
    </div>
  );
};

const footerLinks = [
  { label: "Disclosures", href: "/risk-disclosures" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/support" },
] as const;

const PageFooter = () => (
  <footer className="border-t border-[#1D1D1F]/[0.08] bg-[#F5F5F7] px-6 pb-36 pt-9 text-center">
    <p
      className="mx-auto max-w-[520px] text-[12px] leading-[1.5] tracking-normal text-[#1D1D1F]/60"
      style={{ fontFamily: appleFont }}
    >
      Investing involves risk, including loss of principal. Past performance does
      not guarantee future results. Hushh Technologies, Inc. is an
      SEC-registered investment adviser.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-4">
      {footerLinks.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          className="text-[12px] text-[#0066CC] transition hover:opacity-80"
          style={{ fontFamily: appleFont }}
        >
          {label}
        </a>
      ))}
    </div>
  </footer>
);

export default function HomePage() {
  const { primaryCTA, onNavigate } = useHomeLogic();
  // PD-6 (honest labels): show whatever the journey CTA hook decided —
  // never override here. Past bugs (cleared FL → "Invest with Hushh"
  // taking the user to step-1 mid-flow) came from overriding the label
  // while keeping the action.
  const primaryLabel = primaryCTA.text;

  return (
    <div
      data-page="hushh-home"
      className="min-h-screen overflow-x-hidden bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <SeoHead
        path="/"
        description="Invest alongside HushhTech — an AI-driven, long-term value strategy modeled on Berkshire Hathaway. We combine AI and human expertise to back exceptional businesses."
      />
      <HushhTechHeader />

      <main id="main-content">
        <AppleSection tone="light" pad="tight" fill>
          <div className="relative z-[1]">
            <Eyebrow>AI-powered investing</Eyebrow>
            <Display as="h1" size="md" maxWidth="max-w-[620px]">
              The world's first AI-powered Berkshire Hathaway.
            </Display>
            <Lede>Merging rigorous data science with human wisdom.</Lede>

            <div className="mt-7 flex flex-wrap justify-center gap-3 px-6">
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
              <PillButton
                kind="ghost"
                onClick={() => onNavigate("/discover-fund-a")}
              >
                Discover Fund A
                {Icon.chevronRight(SYS.blue, 14)}
              </PillButton>
            </div>

            {primaryCTA.progressLabel && (
              <p
                className="mt-3 text-center text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/75"
                style={{ fontFamily: appleFont }}
              >
                {primaryCTA.progressLabel}
              </p>
            )}

            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-center text-[12px] text-[#1D1D1F]/55"
              style={{ fontFamily: appleFont }}
            >
              <span>SEC Registered</span>
              <span className="h-1 w-1 rounded-full bg-[#1D1D1F]/30" />
              <span>Bank-Level Security</span>
            </div>
          </div>

        </AppleSection>

        <AppleSection
          tone="dark"
          pad="normal"
          className="bg-[#0A0A0E] !pt-20 !pb-[10rem] md:!pt-24 md:!pb-[6rem]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0E]"
          >
            <div
              className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] blur-[40px] md:h-[900px] md:w-[900px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(94,92,230,0.20) 0%, rgba(94,92,230,0) 60%)",
              }}
            />
            <div
              className="absolute -right-[15%] top-[15%] h-[480px] w-[480px] blur-[50px] md:h-[800px] md:w-[800px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,159,90,0.10) 0%, rgba(255,159,90,0) 60%)",
              }}
            />
            <div
              className="absolute left-1/2 top-[40%] h-[360px] w-[600px] -translate-x-1/2 blur-[40px] md:h-[500px] md:w-[1000px]"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(0,122,255,0.14) 0%, rgba(0,122,255,0) 65%)",
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 20%, rgba(94,92,230,0.4) 50%, rgba(255,255,255,0.10) 80%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27 /%3E%3C/filter%3E%3Crect width=%27200%27 height=%27200%27 filter=%27url(%23n)%27 opacity=%270.6%27/%3E%3C/svg%3E")',
              }}
            />
          </div>

          <div className="relative z-[1]">
            <div className="mx-auto mb-5 flex w-full max-w-[1100px] items-center justify-between px-6 md:mb-11 md:px-12">
              <span
                className="text-[11px] font-medium uppercase leading-tight tracking-[1.6px] text-[#2997FF]/85"
                style={{ fontFamily: appleFont }}
              >
                {"Flagship \u00B7 01"}
              </span>
              <span className="text-right font-mono text-[9px] font-medium tracking-[0.8px] text-[#F5F5F7]/55 sm:text-[10px] sm:tracking-[1.4px]">
                <span className="sm:hidden">2024</span>
                <span className="hidden sm:inline">{"Inception \u00B7 2024"}</span>
              </span>
            </div>

            <div className="mb-5 flex justify-center md:mb-7">
              <FundACard />
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[15%] z-0 h-[140px] w-[380px] -translate-x-1/2 blur-[20px] md:h-[200px] md:w-[600px]"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 65%)",
                }}
              />
              <div className="relative z-[1]">
                <Display size="sm" tone="dark" maxWidth="max-w-[520px]">
                  Fund A
                  <span
                    style={{
                      color: FUND_A_APPLE_GREEN,
                      filter: "drop-shadow(0 0 12px rgba(48,209,88,0.34))",
                    }}
                  >
                    .
                  </span>
                </Display>
              </div>
            </div>

            <Lede tone="dark">
              A high-growth strategy engineered to compound capital with discipline.
            </Lede>

            <div className="mt-4 flex justify-center md:mt-[18px]">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] py-2 pl-3.5 pr-4 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-white/55"
                  style={{
                    boxShadow:
                      "0 0 0 3px rgba(255,255,255,0.08)",
                  }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[2px] text-white"
                  style={{ fontFamily: appleFont }}
                >
                  High Growth
                </span>
              </div>
            </div>

            <div className="mx-auto mt-3 w-full max-w-[420px] px-5 md:mt-[52px] md:px-12">
              <PerformancePreview />
            </div>

            <div className="mt-14 flex justify-center px-6 md:mt-8">
              <PremiumCTA onClick={() => onNavigate("/discover-fund-a")}>
                Invest in Fund A
              </PremiumCTA>
            </div>
          </div>
        </AppleSection>

        <AppleSection tone="light" pad="normal">
          <Eyebrow>Fund Technology</Eyebrow>
          <Display size="md" maxWidth="max-w-[500px]">
            Designed like a technology product.
          </Display>
          <Lede>
            Institutional analytics, human oversight, and modern fund
            operations in one investment experience.
          </Lede>

          <div className="mx-auto mt-9 grid max-w-5xl gap-3 px-5 md:grid-cols-2">
            <BigCard
              tone="dark"
              eyebrow="AI"
              title="AI-Powered"
              body="Institutional analytics processing millions of signals."
              iconKind="intelligence"
            />
            <BigCard
              eyebrow="Human"
              title="Human-Led"
              body="Seasoned oversight ensuring long-term, conviction-led decisions."
              iconKind="person"
            />
          </div>
        </AppleSection>

        <AppleSection tone="gray" pad="normal">
          <Eyebrow>Why Hushh</Eyebrow>
          <Display size="sm" maxWidth="max-w-[460px]">
            Built on principles you can trust.
          </Display>

          <div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 gap-3 px-5 md:grid-cols-4">
            <SpecCard title="Data Driven" body="Decisions based on facts, not emotions." />
            <SpecCard title="Low Fees" body="More of your returns stay in your pocket." />
            <SpecCard title="Expert Vetted" body="Top-tier financial minds at work." />
            <SpecCard title="Automated" body="Set it and forget it peace of mind." />
          </div>
        </AppleSection>

        <AppleSection tone="dark" pad="normal">
          <Eyebrow tone="dark">What you get</Eyebrow>
          <Display size="sm" tone="dark" maxWidth="max-w-[480px]">
            Everything for serious investing.
          </Display>

          <div className="mx-auto mt-9 grid max-w-5xl grid-cols-2 gap-3 px-5 md:grid-cols-4">
            <SpecCard dark title="High Growth" body="Accelerated returns strategy." />
            <SpecCard dark title="Diversified" body="Multi-sector allocation." />
            <SpecCard dark title="Liquid" body="Quarterly redemption windows." />
            <SpecCard dark title="Secure" body="Regulated custodian assets." />
          </div>

          <div className="mt-9 text-center">
            <ChevLink tone="dark" onClick={() => onNavigate("/discover-fund-a")}>
              Read the fund prospectus
            </ChevLink>
          </div>
        </AppleSection>
      </main>

      <PageFooter />
      <HushhTechFooter activeTab={HushhFooterTab.HOME} />
    </div>
  );
}
