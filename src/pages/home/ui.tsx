import { useState, type ComponentProps, type PointerEvent, type ReactNode } from "react";
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
type AppIconKind = ComponentProps<typeof AppIcon>["kind"];

const PerformancePreview = () => {
  const pct = "+21.4%";
  const pctValue = pct.slice(1).replace("%", "");

  return (
    <div
      className="mx-auto grid w-full max-w-6xl gap-y-8 text-left sm:grid-cols-3"
      aria-label="Fund A performance preview"
      style={{ fontFamily: appleFont }}
    >
      <div className="px-0 sm:pr-8 md:pr-11">
        <div className="flex items-baseline font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums">
          <span
            className="text-[52px] sm:text-[58px] md:text-[76px] lg:text-[90px]"
            style={{ color: FUND_A_APPLE_GREEN }}
          >
            {pct[0]}
            {pctValue}
          </span>
          <span
            className="ml-1 text-[26px] font-semibold sm:text-[29px] md:text-[38px] lg:text-[45px]"
            style={{ color: FUND_A_APPLE_GREEN }}
          >
            %
          </span>
        </div>
        <div className="mt-4 text-[15px] font-normal text-white/60 md:mt-[18px]">
          Net of fees
        </div>
        <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          FY 2025
        </div>
      </div>

      <div className="border-t border-white/15 pt-7 sm:border-l sm:border-t-0 sm:py-2 sm:pl-8 md:pl-11">
        <div className="text-[52px] font-semibold leading-[0.95] tracking-[-0.03em] text-white tabular-nums sm:text-[58px] md:text-[76px] lg:text-[90px]">
          18&ndash;23<span className="text-[0.5em]">%</span>
        </div>
        <div className="mt-4 text-[15px] font-normal text-white/60 md:mt-[18px]">
          Target IRR
        </div>
      </div>

      <div className="border-t border-white/15 pt-7 sm:border-l sm:border-t-0 sm:py-2 sm:pl-8 md:pl-11">
        <div className="text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[46px] md:text-[58px] lg:text-[66px]">
          Quarterly
        </div>
        <div className="mt-4 text-[15px] font-normal text-white/60 md:mt-[18px]">
          Liquidity
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
  iconKind,
}: {
  title: string;
  body: string;
  dark?: boolean;
  iconKind?: AppIconKind;
}) => (
  <div
    className={`group relative flex min-h-[200px] flex-col overflow-hidden rounded-[22px] p-[clamp(22px,2.6vw,30px)] transition duration-300 ${
      dark
        ? "border border-white/[0.08] bg-[#0E0E10] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] hover:-translate-y-1 hover:border-[#2997FF]/45"
        : "border border-black/[0.04] bg-[#FFFFFF] shadow-[0_18px_42px_rgba(29,29,31,0.045),inset_0_1px_0_rgba(255,255,255,0.80)] hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(29,29,31,0.075),inset_0_1px_0_rgba(255,255,255,0.90)]"
    }`}
  >
    {iconKind && <AppIcon kind={iconKind} size={dark ? 46 : 44} />}
    <h3
      className={`mb-2 ${iconKind ? "mt-[22px]" : ""} text-[20px] font-semibold leading-[1.08] tracking-[-0.018em] ${dark ? "text-[#F5F5F7]" : "text-[#1D1D1F]"}`}
      style={{ fontFamily: appleFont }}
    >
      {title}
    </h3>
    <p
      className={`max-w-[28ch] text-[15px] leading-[1.5] tracking-normal ${dark ? "text-[#F5F5F7]/56" : "text-[#1D1D1F]/62"}`}
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
  eyebrow?: string;
  title: string;
  body: string;
  iconKind: AppIconKind;
}) => {
  const dark = tone === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] px-6 py-8 transition duration-300 hover:-translate-y-1 ${dark ? "bg-[#161617] text-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(245,245,247,0.08),0_22px_54px_rgba(0,0,0,0.18)]" : "bg-[#F5F5F7] text-[#1D1D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.76),0_18px_44px_rgba(29,29,31,0.05)]"}`}
    >
      <div className="mb-6">
        <AppIcon kind={iconKind} size={56} />
      </div>
      {eyebrow && (
        <p
          className={`mb-2 text-[11px] font-medium uppercase tracking-[1.6px] ${dark ? "text-[#2997FF]/85" : "text-[#0066CC]/85"}`}
          style={{ fontFamily: appleFont }}
        >
          {eyebrow}
        </p>
      )}
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
    <p
      className="mt-5 text-[11px] leading-[1.5] tracking-normal text-[#1D1D1F]/45"
      style={{ fontFamily: appleFont }}
    >
      © 2026 Hushh All Rights Reserved.
    </p>
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
      <HushhTechHeader showSearch={false} />

      <main id="main-content">
        <AppleSection
          tone="light"
          pad="tight"
          fill
          className="min-h-[100svh] justify-center px-6 !py-[clamp(118px,15vh,168px)] text-center"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[6%] z-0 h-[min(70vw,760px)] w-[min(78vw,920px)] -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(0,113,227,0.10), rgba(0,113,227,0) 62%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.55]"
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
          <div className="relative z-[1] mx-auto flex max-w-[980px] flex-col items-center">
            <div className="mb-[26px] inline-flex items-center gap-2 rounded-full bg-[#0071E3]/[0.08] py-[7px] pl-[11px] pr-[15px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
              <span
                className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#0071E3]"
                style={{ fontFamily: appleFont }}
              >
                AI-powered investing
              </span>
            </div>
            <Display
              as="h1"
              size="md"
              maxWidth="max-w-[760px]"
              className="text-[clamp(38px,6.2vw,68px)] leading-[1.08] tracking-[-0.025em]"
            >
              The world's first AI-powered Berkshire Hathaway.
            </Display>
            <Lede className="mt-[26px] max-w-[36ch] text-[clamp(19px,2.1vw,25px)] leading-[1.4] text-black/50">
              Merging rigorous data science with human wisdom.
            </Lede>

            <div className="mt-9 flex flex-wrap justify-center gap-3 px-6 sm:gap-[22px]">
              <PillButton
                onClick={primaryCTA.action}
                disabled={primaryCTA.loading}
                className="h-[52px] px-[30px]"
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
                className="h-[52px] px-[30px]"
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
              className="mt-[22px] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-center text-[13px] text-black/40"
              style={{ fontFamily: appleFont }}
            >
              <span>SEC Registered</span>
              <span className="h-1 w-1 rounded-full bg-[#1D1D1F]/30" />
              <span>Bank-Level Security</span>
            </div>
          </div>

        </AppleSection>

        <AppleSection tone="dark" pad="loose" className="bg-black px-6 md:px-10">
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

          <div className="relative z-[1] mx-auto max-w-7xl">
            <div className="max-w-[760px]">
              <div className="mb-6 inline-flex items-center gap-[9px] rounded-full border border-white/20 px-4 py-2">
                <span className="h-[7px] w-[7px] rounded-full bg-[#2997FF]" />
                <span
                  className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/80"
                  style={{ fontFamily: appleFont }}
                >
                  High Growth
                </span>
              </div>

              <div className="relative">
                <Display
                  size="sm"
                  tone="dark"
                  maxWidth="max-w-[520px]"
                  className="mx-0 px-0 text-left text-[clamp(32px,4.6vw,54px)] leading-[1.08] tracking-[-0.025em]"
                >
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

              <Lede
                tone="dark"
                className="mx-0 mt-[22px] max-w-[42ch] px-0 text-left text-[clamp(18px,1.6vw,24px)] leading-[1.4] text-white/55"
              >
                A high-growth strategy engineered to compound capital with discipline.
              </Lede>
            </div>

            <div className="mt-[clamp(56px,7vw,88px)] w-full">
              <PerformancePreview />
            </div>

            <div className="mt-[clamp(48px,6vw,72px)] flex justify-start">
              <PremiumCTA onClick={() => onNavigate("/discover-fund-a")}>
                Invest in Fund A
              </PremiumCTA>
            </div>
          </div>
        </AppleSection>

        <AppleSection
          tone="light"
          pad="normal"
          className="px-6 !py-[clamp(96px,11vw,150px)] md:px-10"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-[clamp(40px,6vw,80px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <div className="text-left">
              <Eyebrow className="mx-0 text-left">Fund Technology</Eyebrow>
              <Display
                size="md"
                maxWidth="max-w-[540px]"
                className="mx-0 px-0 text-left text-[clamp(32px,4.6vw,54px)] leading-[1.08] tracking-[-0.025em]"
              >
                Designed like a technology product.
              </Display>
              <Lede className="mx-0 mt-6 max-w-[44ch] px-0 text-left text-[clamp(18px,1.5vw,21px)] leading-[1.47]">
                Institutional analytics, human oversight, and modern fund
                operations in one investment experience.
              </Lede>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BigCard
                tone="dark"
                title="AI-Powered"
                body="Institutional analytics processing millions of signals."
                iconKind="intelligence"
              />
              <BigCard
                title="Human-Led"
                body="Seasoned oversight ensuring long-term, conviction-led decisions."
                iconKind="person"
              />
            </div>
          </div>
        </AppleSection>

        <AppleSection
          tone="gray"
          pad="normal"
          className="px-6 !py-[clamp(96px,11vw,150px)] md:px-10"
        >
          <div className="mx-auto mb-[clamp(48px,6vw,64px)] max-w-[720px] text-center">
            <Eyebrow>Why Hushh</Eyebrow>
            <Display
              size="sm"
              maxWidth="max-w-[540px]"
              className="text-[clamp(32px,4.6vw,54px)] leading-[1.08] tracking-[-0.025em]"
            >
              Built on principles you can trust.
            </Display>
          </div>

          <div className="mx-auto grid max-w-7xl gap-[18px] px-0 sm:grid-cols-2 lg:grid-cols-4">
            <SpecCard
              title="Data Driven"
              body="Decisions based on facts, not emotions."
              iconKind="chart"
            />
            <SpecCard
              title="Low Fees"
              body="More of your returns stay in your pocket."
              iconKind="dollar"
            />
            <SpecCard
              title="Expert Vetted"
              body="Top-tier financial minds at work."
              iconKind="shield"
            />
            <SpecCard
              title="Automated"
              body="Set it and forget it peace of mind."
              iconKind="bolt"
            />
          </div>
        </AppleSection>

        <AppleSection
          tone="dark"
          pad="normal"
          className="overflow-hidden bg-black px-6 !py-[clamp(96px,11vw,150px)] md:px-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[58%] w-[min(92vw,1040px)] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(0,113,227,0.18), rgba(0,113,227,0) 70%)",
            }}
          />
          <div className="relative z-[1] mx-auto max-w-[1100px]">
            <div className="mx-auto mb-[clamp(48px,6vw,64px)] max-w-[680px] text-center">
              <Eyebrow tone="dark">What you get</Eyebrow>
              <Display
                size="sm"
                tone="dark"
                maxWidth="max-w-[540px]"
                className="text-[clamp(32px,4.6vw,54px)] leading-[1.08] tracking-[-0.025em]"
              >
                Everything for serious investing.
              </Display>
            </div>

            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              <SpecCard
                dark
                title="High Growth"
                body="Accelerated returns strategy."
                iconKind="chart"
              />
              <SpecCard
                dark
                title="Diversified"
                body="Multi-sector allocation."
                iconKind="layers"
              />
              <SpecCard
                dark
                title="Liquid"
                body="Quarterly redemption windows."
                iconKind="liquidity"
              />
              <SpecCard
                dark
                title="Secure"
                body="Regulated custodian assets."
                iconKind="shield"
              />
            </div>
          </div>

          <div className="relative z-[1] mt-[clamp(44px,6vw,62px)] text-center">
            <ChevLink
              tone="dark"
              onClick={() =>
                onNavigate("/community/fund-documents/investment-prospectus")
              }
            >
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
