import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import hushhLogo from "../images/Hushhogo.png";

export const SYS = {
  blue: "#0066CC",
  linkBlueDark: "#2997FF",
  text: "#1D1D1F",
  textOnDark: "#F5F5F7",
  surface: "#F5F5F7",
  paper: "#FFFFFF",
  dark: "#000000",
  darkCard: "#161617",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  purple: "#AF52DE",
};

export const appleFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
export const appleDisplayFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

type IconColor = string;

const strokeProps = (color: IconColor, width = 1.6) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Icon = {
  search: (color = "currentColor", size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" {...strokeProps(color, 1.8)} />
      <path d="M16.5 16.5l4 4" {...strokeProps(color, 1.8)} />
    </svg>
  ),
  menu: (color = "currentColor", size = 18) => (
    <svg width={size} height={size * 0.78} viewBox="0 0 24 16" fill="none" aria-hidden="true">
      <path d="M4 4h16M4 12h16" {...strokeProps(color, 1.8)} />
    </svg>
  ),
  close: (color = "currentColor", size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" {...strokeProps(color, 2.2)} />
    </svg>
  ),
  arrowRight: (color = "currentColor", size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" {...strokeProps(color, 2)} />
    </svg>
  ),
  chevronRight: (color = "currentColor", size = 13) => (
    <svg width={size * 0.62} height={size} viewBox="0 0 8 14" fill="none" aria-hidden="true">
      <path d="M1 1l6 6-6 6" {...strokeProps(color, 2)} />
    </svg>
  ),
  chevronDown: (color = "currentColor", size = 12) => (
    <svg width={size} height={size * 0.67} viewBox="0 0 12 8" fill="none" aria-hidden="true">
      <path d="M1 1l5 5 5-5" {...strokeProps(color, 1.8)} />
    </svg>
  ),
  back: (color = "currentColor", size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5l-7 7 7 7M9 12h11" {...strokeProps(color, 1.8)} />
    </svg>
  ),
  lock: (color = "currentColor", size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" {...strokeProps(color, 1.6)} />
      <path d="M8.5 11V8a3.5 3.5 0 017 0v3" {...strokeProps(color, 1.6)} />
    </svg>
  ),
  shield: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" {...strokeProps(color, 1.5)} />
      <path d="M9 12l2 2 4-4" {...strokeProps(color, 1.8)} />
    </svg>
  ),
  chart: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="13" width="3" height="7" rx="0.8" {...strokeProps(color, 1.4)} />
      <rect x="10.5" y="8" width="3" height="12" rx="0.8" {...strokeProps(color, 1.4)} />
      <rect x="17" y="4" width="3" height="16" rx="0.8" {...strokeProps(color, 1.4)} />
    </svg>
  ),
  chartFilled: (color = "currentColor", size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <rect x="3" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  home: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2v-9z" {...strokeProps(color, 1.6)} />
    </svg>
  ),
  community: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3.4" {...strokeProps(color, 1.6)} />
      <circle cx="17" cy="10" r="2.8" {...strokeProps(color, 1.6)} />
      <path d="M2.5 19c1-3 3.4-4.5 6.5-4.5s5.5 1.5 6.5 4.5" {...strokeProps(color, 1.6)} />
      <path d="M14.5 19c.8-2.2 2.5-3.5 4.5-3.5s3.2 1 4 3.5" {...strokeProps(color, 1.6)} />
    </svg>
  ),
  person: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" {...strokeProps(color, 1.4)} />
      <path d="M4.5 20c.7-3.8 3.7-5.5 7.5-5.5s6.8 1.7 7.5 5.5" {...strokeProps(color, 1.4)} />
    </svg>
  ),
  mail: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" {...strokeProps(color, 1.6)} />
      <path d="M3 8l9 6 9-6" {...strokeProps(color, 1.6)} />
    </svg>
  ),
  help: (color = "currentColor", size = 22) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...strokeProps(color, 1.6)} />
      <path d="M9.5 9.5C9.5 8 10.6 7 12 7s2.5 1 2.5 2.5c0 1.3-1 1.7-1.6 2.2-.7.5-.9 1-.9 1.8M12 17v.5" {...strokeProps(color, 1.6)} />
    </svg>
  ),
  triUp: (color = SYS.green) => (
    <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
      <path d="M4.5 0L9 8H0z" fill={color} />
    </svg>
  ),
  triDown: (color = SYS.red) => (
    <svg width="9" height="8" viewBox="0 0 9 8" aria-hidden="true">
      <path d="M4.5 8L0 0h9z" fill={color} />
    </svg>
  ),
  apple: (color = "currentColor", size = 15) => (
    <svg width={size} height={size * 1.2} viewBox="0 0 384 512" fill={color} aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  ),
  google: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.42-1.07 2.62-2.31 3.41v2.84h3.73c2.17-2 3.43-4.95 3.43-8.49z" fill="#4285F4" />
      <path d="M12 24c3.13 0 5.75-1.04 7.66-2.82l-3.73-2.84c-1.03.69-2.34 1.1-3.93 1.1-3.02 0-5.58-2.04-6.49-4.78H1.66v2.93C3.57 21.3 7.45 24 12 24z" fill="#34A853" />
      <path d="M5.51 14.66A7.2 7.2 0 015.13 12c0-.92.16-1.83.38-2.66V6.41H1.66A11.97 11.97 0 000 12c0 1.94.46 3.77 1.26 5.41l4.25-3.31.01.56z" fill="#FBBC05" />
      <path d="M12 4.75c1.7 0 3.23.59 4.43 1.74l3.31-3.31C17.74 1.19 15.13 0 12 0 7.45 0 3.57 2.7 1.66 6.41l3.85 2.93C6.42 6.79 8.98 4.75 12 4.75z" fill="#EA4335" />
    </svg>
  ),
};

export const TabIcon = {
  home: (filled: boolean, color: string) =>
    filled ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2v-9z" fill={color} />
      </svg>
    ) : (
      Icon.home(color, 22)
    ),
  fund: (filled: boolean, color: string) =>
    filled ? Icon.chartFilled(color, 22) : Icon.chart(color, 22),
  community: (filled: boolean, color: string) =>
    filled ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="3.4" fill={color} />
        <circle cx="17" cy="10" r="2.8" fill={color} />
        <path d="M2.5 20c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5z" fill={color} />
        <path d="M14.5 20c.8-2.6 2.5-4 4.5-4s3.2 1 4 4z" fill={color} />
      </svg>
    ) : (
      Icon.community(color, 22)
    ),
  account: (filled: boolean, color: string) =>
    filled ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="9" r="4" fill={color} />
        <path d="M4 21c.8-4.5 4.5-6.5 8-6.5s7.2 2 8 6.5z" fill={color} />
      </svg>
    ) : (
      Icon.person(color, 22)
    ),
};

export function HushhMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src={hushhLogo}
        alt="Hushh"
        className="h-full w-full object-contain"
        width={size}
        height={size}
      />
    </div>
  );
}

export function GlassPill({
  children,
  className = "",
  dark = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        boxShadow: dark
          ? "0 6px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)"
          : "0 8px 24px rgba(29,29,31,0.10), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(29,29,31,0.04)",
        ...style,
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: dark ? "rgba(31,28,24,0.58)" : "rgba(255,255,255,0.68)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          backdropFilter: "blur(20px) saturate(180%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          border: dark ? "0.5px solid rgba(245,245,247,0.12)" : "0.5px solid rgba(29,29,31,0.06)",
          boxShadow: dark
            ? "inset 1.5px 1.5px 1px rgba(245,245,247,0.14), inset -1px -1px 1px rgba(245,245,247,0.05)"
            : "inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.4)",
        }}
      />
      <div className="relative z-[1] flex items-center">{children}</div>
    </div>
  );
}

export function AppleSection({
  tone = "light",
  pad = "normal",
  fill = false,
  overflow = "hidden",
  last = false,
  children,
  className = "",
}: {
  tone?: "light" | "gray" | "dark";
  pad?: "tight" | "normal" | "loose";
  fill?: boolean;
  overflow?: "hidden" | "visible";
  last?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const dark = tone === "dark";
  const padding = pad === "tight" ? "py-12" : pad === "loose" ? "py-20 md:py-24" : "py-16 md:py-20";
  const lastPadding = last ? "pb-36 md:pb-40" : "";

  return (
    <section
      className={[
        dark ? "bg-[#000000] text-[#F5F5F7]" : tone === "gray" ? "bg-[#F5F5F7] text-[#1D1D1F]" : "bg-[#FFFFFF] text-[#1D1D1F]",
        padding,
        lastPadding,
        fill ? "flex min-h-[640px] flex-col justify-center md:min-h-[700px]" : "",
        `relative ${overflow === "visible" ? "overflow-visible" : "overflow-hidden"}`,
        className,
      ].join(" ")}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={`mb-3 text-center text-[11px] font-medium uppercase leading-tight tracking-[1.6px] ${className}`}
      style={{
        color: tone === "dark" ? "rgba(41,151,255,0.85)" : "rgba(0,102,204,0.85)",
        fontFamily: appleFont,
      }}
    >
      {children}
    </div>
  );
}

export function Display({
  children,
  size = "md",
  tone = "light",
  maxWidth = "max-w-[520px]",
  className = "",
  as = "h2",
}: {
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  tone?: "light" | "dark";
  maxWidth?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const Tag = as;
  const sizeClass = {
    xs: "text-[28px] sm:text-[32px] md:text-[40px]",
    sm: "text-[32px] md:text-[44px]",
    md: "text-[36px] md:text-[56px]",
    lg: "text-[44px] md:text-[72px]",
    xl: "text-[56px] md:text-[88px]",
  }[size];

  return (
    <Tag
      className={`mx-auto px-6 text-center font-medium leading-[1.06] tracking-[-0.028em] ${sizeClass} ${maxWidth} ${className}`}
      style={{
        color: tone === "dark" ? SYS.textOnDark : SYS.text,
        fontFamily: appleDisplayFont,
        textWrap: "balance",
      }}
    >
      {children}
    </Tag>
  );
}

export function Lede({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={`mx-auto mt-[18px] max-w-[420px] px-5 text-center text-[16px] font-light leading-[1.45] tracking-normal sm:text-[17px] md:text-[20px] ${className}`}
      style={{
        color: tone === "dark" ? "rgba(245,245,247,0.60)" : "rgba(29,29,31,0.60)",
        fontFamily: appleFont,
        textWrap: "pretty",
      }}
    >
      {children}
    </p>
  );
}

export function PillButton({
  children,
  kind = "filled",
  tone = "light",
  onClick,
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  kind?: "filled" | "ghost" | "white";
  tone?: "light" | "dark";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const dark = tone === "dark";
  const style =
    kind === "filled"
      ? dark
        ? "bg-[#FFFFFF] text-[#1D1D1F]"
        : "bg-[#0066CC] text-[#FFFFFF]"
      : kind === "white"
        ? "bg-[#FFFFFF] text-[#1D1D1F] shadow-[inset_0_0_0_1px_rgba(29,29,31,0.18)]"
        : "bg-transparent text-[#0066CC] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.30)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[17px] font-medium tracking-[-0.01em]",
        "transition duration-150 hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/40 focus-visible:ring-offset-2",
        style,
        className,
      ].join(" ")}
      style={{ fontFamily: appleFont }}
    >
      {children}
    </button>
  );
}

export function AppleButton({
  children,
  kind = "filled",
  onClick,
  disabled,
  icon,
  className = "",
}: {
  children: ReactNode;
  kind?: "filled" | "bordered" | "tinted";
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const variant =
    kind === "filled"
      ? "bg-[#000000] text-[#F5F5F7]"
      : kind === "tinted"
        ? "bg-[#0066CC] text-[#FFFFFF]"
        : "bg-[#FFFFFF] text-[#1D1D1F] shadow-[inset_0_0_0_1px_rgba(29,29,31,0.18)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border-0 px-5 text-[17px] font-semibold tracking-[-0.01em]",
        "transition duration-150 hover:opacity-90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2",
        variant,
        className,
      ].join(" ")}
      style={{ fontFamily: appleFont }}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function ChevLink({
  children,
  tone = "light",
  onClick,
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  onClick?: () => void;
  className?: string;
}) {
  const color = tone === "dark" ? SYS.linkBlueDark : SYS.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[17px] font-medium tracking-[-0.01em] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2 ${className}`}
      style={{ color, fontFamily: appleFont }}
    >
      {children}
      {Icon.chevronRight(color, 14)}
    </button>
  );
}

export function SectionLabel({
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
      className={`px-5 text-[11px] font-medium uppercase tracking-[1.6px] ${className}`}
      style={{
        color: dark ? "rgba(41,151,255,0.85)" : "rgba(0,102,204,0.85)",
        fontFamily: appleFont,
      }}
    >
      {children}
    </div>
  );
}

export function AppIcon({
  kind = "api",
  size = 56,
}: {
  kind?: "api" | "intelligence" | "person" | "chart" | "balance" | "dollar" | "clock" | "layers" | "shield" | "liquidity" | "leaf" | "bolt" | "monoA";
  size?: number;
}) {
  const radius = size * 0.235;
  const iconSize = size * 0.58;
  const ink = "#1D1D1F";
  const softInk = "#6E6E73";
  const knockOut = "#F5F5F7";

  const variants: Record<string, { bg: string; glyph: ReactNode }> = {
    api: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="6" y="6" width="16" height="16" rx="3.4" fill={ink} />
          <rect x="2.5" y="8.5" width="4.5" height="3.2" rx="1.2" fill={ink} />
          <rect x="2.5" y="16.3" width="4.5" height="3.2" rx="1.2" fill={ink} />
          <rect x="21" y="8.5" width="4.5" height="3.2" rx="1.2" fill={ink} />
          <rect x="21" y="16.3" width="4.5" height="3.2" rx="1.2" fill={ink} />
          <rect x="12.4" y="2.5" width="3.2" height="4.5" rx="1.2" fill={ink} />
          <rect x="12.4" y="21" width="3.2" height="4.5" rx="1.2" fill={ink} />
          <path d="M11.9 10.5l-3 3.5 3 3.5h2.2L11.2 14l2.9-3.5h-2.2z" fill={knockOut} />
          <path d="M16.1 10.5L19 14l-2.9 3.5h2.2l3-3.5-3-3.5h-2.2z" fill={knockOut} />
        </svg>
      ),
    },
    intelligence: {
      bg: "linear-gradient(160deg, #2997FF 0%, #248FEF 56%, #1D82DE 100%)",
      glyph: (
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <g stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.92">
            <path d="M9 3.5v2.5M12 3.5v2.5M15 3.5v2.5" />
            <path d="M9 18v2.5M12 18v2.5M15 18v2.5" />
            <path d="M3.5 9h2.5M3.5 12h2.5M3.5 15h2.5" />
            <path d="M18 9h2.5M18 12h2.5M18 15h2.5" />
          </g>
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            rx="3"
            stroke="#fff"
            strokeWidth="1.6"
            fill="none"
          />
          <rect x="9.4" y="9.4" width="5.2" height="5.2" rx="1.6" fill="#fff" />
        </svg>
      ),
    },
    person: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="10.2" r="4.4" fill={ink} />
          <path d="M6.2 23c1-5 4.2-7.6 7.8-7.6s6.8 2.6 7.8 7.6H6.2z" fill={ink} />
        </svg>
      ),
    },
    chart: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="5" y="15" width="4.5" height="8" rx="1.4" fill={ink} />
          <rect x="11.8" y="10.5" width="4.5" height="12.5" rx="1.4" fill={ink} />
          <rect x="18.5" y="6" width="4.5" height="17" rx="1.4" fill={ink} />
        </svg>
      ),
    },
    balance: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="12.5" y="5" width="3" height="18" rx="1.5" fill={ink} />
          <rect x="7" y="8" width="14" height="2.5" rx="1.25" fill={ink} />
          <path d="M6.2 19.2h7.2c-.4 2-1.8 3.4-3.6 3.4s-3.2-1.4-3.6-3.4z" fill={ink} />
          <path d="M14.6 19.2h7.2c-.4 2-1.8 3.4-3.6 3.4s-3.2-1.4-3.6-3.4z" fill={ink} />
          <path d="M8.6 10.2l-2.4 9h7.2l-2.4-9H8.6zM17 10.2l-2.4 9h7.2l-2.4-9H17z" fill={ink} />
        </svg>
      ),
    },
    dollar: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: <span className="font-medium leading-none text-[#1D1D1F]" style={{ fontSize: size * 0.46 }}>$</span>,
    },
    clock: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 3.5a10.5 10.5 0 1010.5 10.5A10.5 10.5 0 0014 3.5zm1.5 11.2l4 2.9-1.7 2.1-5.3-3.9V8h3v6.7z" fill={ink} />
        </svg>
      ),
    },
    layers: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 3.8l10 5.4-10 5.4-10-5.4 10-5.4z" fill={ink} />
          <path d="M4 13.4l10 5.4 10-5.4v3.4l-10 5.4-10-5.4v-3.4z" fill={softInk} />
        </svg>
      ),
    },
    shield: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M14 3l9 3.5v6.1c0 5.8-3.8 10-9 12.4-5.2-2.4-9-6.6-9-12.4V6.5L14 3z" fill={ink} />
          <path d="M10.2 14l2.2 2.2 5.4-5.6 1.7 1.8-7.1 7.2-3.9-3.9 1.7-1.7z" fill={knockOut} />
        </svg>
      ),
    },
    liquidity: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M5 8h13.2l-3.4-3.4h4.5L25 10.3 19.3 16h-4.5l3.4-3.4H5V8z" fill={ink} />
          <path d="M23 20H9.8l3.4 3.4H8.7L3 17.7 8.7 12h4.5l-3.4 3.4H23V20z" fill={softInk} />
        </svg>
      ),
    },
    leaf: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M23 5.2c-.2 9.5-5 16.5-13.5 16.5-3.8 0-6.4-2.3-6.4-5.9 0-7.7 7.7-10.4 19.9-10.6z" fill={ink} />
          <path d="M5 23c4.6-6.7 9.4-10.3 16.6-14l1 2.1C15.8 14.3 11 18 6.9 24.1L5 23z" fill={softInk} />
        </svg>
      ),
    },
    bolt: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: (
        <svg width={size * 0.5} height={size * 0.6} viewBox="0 0 16 24" fill="none" aria-hidden="true">
          <path d="M10.4 1L1.8 13.5h5.1L5.8 23l8.6-12.6H9.3L10.4 1z" fill={ink} />
        </svg>
      ),
    },
    monoA: {
      bg: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F7 100%)",
      glyph: <span className="font-medium leading-none text-[#1D1D1F]" style={{ fontSize: size * 0.5 }}>A</span>,
    },
  };
  const variant = variants[kind] ?? variants.api;

  return (
    <div
      aria-hidden="true"
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: variant.bg,
        backdropFilter: "blur(22px) saturate(1.32)",
        WebkitBackdropFilter: "blur(22px) saturate(1.32)",
        boxShadow:
          "0 18px 34px rgba(29,29,31,0.16), 0 6px 14px rgba(29,29,31,0.08), inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(29,29,31,0.07)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.16) 34%, rgba(255,255,255,0.02) 58%, rgba(255,255,255,0.18) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="pointer-events-none absolute -left-[18%] -top-[22%] h-[62%] w-[72%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.20) 42%, rgba(255,255,255,0) 70%)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow:
            "inset 0 0 0 0.5px rgba(29,29,31,0.10), inset 0 0 0 1px rgba(255,255,255,0.62), inset 0 -10px 18px rgba(255,255,255,0.12)",
        }}
      />
      <div className="relative z-[1] flex items-center justify-center">{variant.glyph}</div>
    </div>
  );
}

export function AppleLineIcon({
  icon: IconComponent,
  size = 56,
  iconSize,
  className = "",
}: {
  icon: LucideIcon;
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  const radius = size * 0.235;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-[#6E6E73] ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px) saturate(1.35)",
        WebkitBackdropFilter: "blur(20px) saturate(1.35)",
        boxShadow:
          "0 14px 30px rgba(29,29,31,0.11), 0 4px 12px rgba(29,29,31,0.06), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 0 rgba(29,29,31,0.05)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.18) 38%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.20) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <span
        className="pointer-events-none absolute -left-[18%] -top-[22%] h-[62%] w-[72%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.56) 0%, rgba(255,255,255,0.20) 44%, rgba(255,255,255,0) 72%)",
          filter: "blur(1px)",
        }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow:
            "inset 0 0 0 0.5px rgba(29,29,31,0.08), inset 0 0 0 1px rgba(255,255,255,0.62), inset 0 -8px 16px rgba(255,255,255,0.12)",
        }}
      />
      <IconComponent
        aria-hidden="true"
        className="relative z-[1]"
        size={iconSize || Math.round(size * 0.46)}
        strokeWidth={1.75}
      />
    </span>
  );
}

export function SmallSpinner({
  label = "Loading",
  dark = false,
}: {
  label?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <span
        className={`h-5 w-5 animate-spin rounded-full border-2 ${dark ? "border-[#F5F5F7]/25 border-t-[#F5F5F7]" : "border-[#1D1D1F]/10 border-t-[#0066CC]"}`}
        aria-hidden="true"
      />
      <span className={`text-[12px] font-normal tracking-[0.04em] ${dark ? "text-[#F5F5F7]/60" : "text-[#1D1D1F]/45"}`}>
        {label}
      </span>
    </div>
  );
}
