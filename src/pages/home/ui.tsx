import { useMemo, useState, type PointerEvent, type ReactNode } from "react";
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

const PERFORMANCE_RANGES = {
  "1M": { pct: "+3.2%", start: "Apr 2026", seed: 7, n: 24, from: 49, vol: 1.1 },
  "3M": { pct: "+7.8%", start: "Feb 2026", seed: 19, n: 32, from: 45, vol: 1.7 },
  "6M": { pct: "+12.5%", start: "Nov 2025", seed: 31, n: 38, from: 40, vol: 2.3 },
  "1Y": { pct: "+18.1%", start: "May 2025", seed: 53, n: 46, from: 30, vol: 2.8 },
  ALL: { pct: "+21.4%", start: "Jan 2024", seed: 88, n: 54, from: 18, vol: 3.1 },
} as const;

type PerformanceRangeKey = keyof typeof PERFORMANCE_RANGES;

const performanceRangeKeys = Object.keys(PERFORMANCE_RANGES) as PerformanceRangeKey[];

const PerformancePreview = () => {
  const [range, setRange] = useState<PerformanceRangeKey>("ALL");
  const active = PERFORMANCE_RANGES[range];
  const pts = useMemo(() => {
    const { seed, n, from, vol } = active;
    let state = seed;
    const rnd = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
    const end = 52;
    const out: number[] = [];

    for (let index = 0; index < n; index += 1) {
      const t = index / (n - 1);
      const trend = from + (end - from) * t;
      const noise = (rnd() - 0.5) * vol * 2 * (0.5 + 0.7 * t);
      out.push(trend + noise);
    }

    out[0] = from;
    out[n - 1] = end;
    return out;
  }, [active]);
  const width = 320;
  const height = 116;
  const padX = 3;
  const padTop = 12;
  const padBottom = 16;
  const maxY = Math.max(...pts);
  const minY = Math.min(...pts);
  const span = maxY - minY || 1;
  const coords = pts.map((point, index) => {
    const x = padX + (index / (pts.length - 1)) * (width - padX * 2);
    const y =
      padTop + (1 - (point - minY) / span) * (height - padTop - padBottom);
    return [x, y] as const;
  });
  let path = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;

  for (let index = 1; index < coords.length; index += 1) {
    path += ` L ${coords[index][0].toFixed(1)} ${coords[index][1].toFixed(1)}`;
  }

  const baseY = height - padBottom;
  const area = `${path} L ${coords[coords.length - 1][0].toFixed(1)} ${baseY} L ${coords[0][0].toFixed(1)} ${baseY} Z`;
  const [endX, endY] = coords[coords.length - 1];

  return (
    <div
      className="relative mx-auto max-w-[720px] overflow-hidden rounded-[18px] bg-[#1C1C1E] p-5 pb-4"
      aria-label="Fund A performance preview"
      style={{ fontFamily: appleFont }}
    >
      <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.4px] text-[rgba(235,235,245,0.6)]">
        Performance
      </div>

      <div className="mb-1 flex items-baseline text-[34px] font-semibold leading-none tracking-[-1.4px] text-white tabular-nums">
        <span className="mr-0.5 text-[#34C759]">{active.pct[0]}</span>
        {active.pct.slice(1).replace("%", "")}
        <span className="ml-px text-[20px] font-medium text-[rgba(235,235,245,0.55)]">
          %
        </span>
      </div>
      <div className="mb-4 text-[13px] font-normal tracking-[-0.08px] text-[rgba(235,235,245,0.5)]">
        Net of fees and expenses
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block overflow-visible"
      >
        <defs>
          <linearGradient id="homeStocksFundAArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34C759" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#34C759" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={padX}
          x2={width - padX}
          y1={baseY}
          y2={baseY}
          stroke="rgba(235,235,245,0.18)"
          strokeDasharray="1 3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill="url(#homeStocksFundAArea)" />
        <path
          d={path}
          fill="none"
          stroke="#34C759"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={endX} cy={endY} r="6" fill="#34C759" fillOpacity="0.20" />
        <circle
          cx={endX}
          cy={endY}
          r="3.2"
          fill="#34C759"
          stroke="#1C1C1E"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mb-3.5 mt-2 flex justify-between">
        <span className="text-[12px] font-normal text-[rgba(235,235,245,0.45)]">
          {active.start}
        </span>
        <span className="text-[12px] font-medium text-[rgba(235,235,245,0.7)]">
          Today
        </span>
      </div>

      <div className="flex rounded-[9px] bg-[rgba(118,118,128,0.24)] p-0.5">
        {performanceRangeKeys.map((key) => {
          const isActive = key === range;

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRange(key)}
              className="h-[30px] flex-1 rounded-[7px] border-0 text-[13px] tracking-[-0.1px] transition-colors"
              style={{
                cursor: "pointer",
                background: isActive ? "#636366" : "transparent",
                boxShadow: isActive
                  ? "0 1px 3px rgba(0,0,0,0.3), 0 1px 0.5px rgba(0,0,0,0.2)"
                  : "none",
                color: isActive ? "#FFFFFF" : "rgba(235,235,245,0.6)",
                fontFamily: appleFont,
                fontWeight: isActive ? 600 : 500,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {key}
            </button>
          );
        })}
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
      className="relative -m-[30px] p-[30px] [perspective-origin:50%_50%] [perspective:900px]"
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
        className="relative h-[136px] w-[220px] overflow-hidden rounded-[18px] md:h-[160px] md:w-[260px]"
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

        <AppleSection tone="dark" pad="normal" className="bg-[#0A0A0E]">
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
            <div className="mx-auto mb-7 flex w-full max-w-[1100px] items-center justify-between px-6 md:mb-11 md:px-12">
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

            <div className="mb-6 flex justify-center md:mb-7">
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
                <Display size="md" tone="dark" maxWidth="max-w-[520px]">
                  Fund A
                  <span
                    style={{
                      color: SYS.green,
                      filter: "drop-shadow(0 0 18px rgba(52,199,89,0.5))",
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

            <div className="mt-[18px] flex justify-center">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] py-2 pl-3.5 pr-4 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#34C759]"
                  style={{
                    boxShadow:
                      "0 0 8px rgba(52,199,89,0.6), 0 0 0 3px rgba(52,199,89,0.18)",
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

            <div className="mt-10 px-6 text-center md:mt-[52px]">
              <div
                className="mb-3.5 text-[11px] font-medium uppercase leading-tight tracking-[1.6px] text-[#2997FF]/85 md:mb-[18px]"
                style={{ fontFamily: appleFont }}
              >
                Target Net IRR
              </div>
              <div
                className="text-[47px] font-semibold leading-none tracking-normal text-[#F5F5F7] tabular-nums md:text-[65.5px]"
                style={{ fontFamily: appleFont }}
              >
                18
                <span className="font-light text-[rgba(234,230,220,0.45)]">
                  {"\u2013"}
                </span>
                23
                <span className="ml-1 text-[27.5px] font-medium text-[rgba(234,230,220,0.55)] md:text-[36.5px]">
                  %
                </span>
              </div>
              <div
                className="mt-3.5 text-[13px] tracking-normal text-[#F5F5F7]/55 md:mt-[18px] md:text-[14px]"
                style={{ fontFamily: appleFont }}
              >
                {"Annually \u00B7 post fees & expenses"}
              </div>
            </div>

            <div className="mx-auto mt-6 w-full max-w-[720px] px-5 md:mt-8 md:px-12">
              <PerformancePreview />
            </div>

            <div className="mt-7 flex justify-center px-6 md:mt-8">
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
