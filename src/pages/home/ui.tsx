import { useHomeLogic } from "./logic";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
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

const PerformancePreview = () => {
  const pts = [4, 8, 6, 12, 10, 18, 14, 22, 20, 28, 26, 34, 30, 42, 38, 50];
  const width = 320;
  const height = 80;
  const maxY = Math.max(...pts);
  const minY = Math.min(...pts);
  const path = pts
    .map((point, index) => {
      const x = (index / (pts.length - 1)) * width;
      const y = height - ((point - minY) / (maxY - minY)) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div
      className="mx-auto mt-9 max-w-[420px] px-6"
      aria-label="Inception to date performance preview"
    >
      <div className="rounded-[18px] p-5 shadow-[inset_0_0_0_0.5px_rgba(245,245,247,0.12)]">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[13px] text-[#F5F5F7]/60">Inception to date</span>
          <span className="text-[18px] font-semibold tabular-nums text-[#34C759]">
            +21.4%
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
          <defs>
            <linearGradient id="homeDarkSpark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34C759" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#34C759" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#homeDarkSpark)" />
          <path
            d={path}
            fill="none"
            stroke="#34C759"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
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
  iconKind: "api" | "person";
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
      {["Disclosures", "Privacy", "Terms", "Support"].map((label) => (
        <button
          key={label}
          type="button"
          className="text-[12px] text-[#0066CC] transition hover:opacity-80"
          style={{ fontFamily: appleFont }}
        >
          {label}
        </button>
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

          <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center opacity-50">
            {Icon.chevronDown("#1D1D1F", 20)}
          </div>
        </AppleSection>

        <AppleSection tone="dark" pad="normal">
          <Eyebrow tone="dark">Flagship Product</Eyebrow>
          <Display size="lg" tone="dark" maxWidth="max-w-[520px]">
            Fund A.
          </Display>
          <Lede tone="dark">
            A high-growth strategy engineered to compound capital with
            discipline.
          </Lede>

          <div className="mt-5 flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[1.6px] text-[#2997FF]/85"
              style={{
                boxShadow: "inset 0 0 0 1px rgba(245,245,247,0.25)",
                fontFamily: appleFont,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              High Growth
            </span>
          </div>

          <div className="mx-auto mt-8 flex max-w-[420px] justify-center px-6">
            <div className="flex-1 text-center">
              <div className="text-[32px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#F5F5F7]">
                18-23%
              </div>
              <div className="mt-2 text-[12px] text-[#F5F5F7]/60">Target Net IRR</div>
            </div>
            <div className="mx-3 w-px bg-[#FFFFFF]/20" />
            <div className="flex-1 text-center">
              <div className="text-[32px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#F5F5F7]">
                2024
              </div>
              <div className="mt-2 text-[12px] text-[#F5F5F7]/60">Inception</div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-6 px-6">
            <ChevLink tone="dark" onClick={() => onNavigate("/discover-fund-a")}>
              Performance details
            </ChevLink>
            <ChevLink tone="dark" onClick={() => onNavigate("/discover-fund-a")}>
              Holdings
            </ChevLink>
          </div>

          <PerformancePreview />
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
              iconKind="api"
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
