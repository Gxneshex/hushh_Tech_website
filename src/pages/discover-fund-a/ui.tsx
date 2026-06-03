import { useNavigate } from "react-router-dom";
import {
  CircleDollarSign,
  Clock3,
  Layers3,
  Scale,
  type LucideIcon,
} from "lucide-react";

import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  AppleButton,
  AppleSection,
  AppIcon,
  Display,
  Eyebrow,
  Icon,
  Lede,
  SYS,
  SectionLabel,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import { useDiscoverFundALogic } from "./logic";

const iconForTitle = (title: string) => {
  const lower = title.toLowerCase();

  if (lower.includes("data") || lower.includes("equity")) return "chart";
  if (lower.includes("equilibrium") || lower.includes("delta")) return "balance";
  if (/\bai\b/.test(lower)) return "intelligence";
  if (lower.includes("api")) return "api";
  if (lower.includes("premium") || lower.includes("income")) return "dollar";
  if (lower.includes("decay")) return "clock";
  if (lower.includes("accumulation") || lower.includes("strategic")) return "layers";
  if (lower.includes("risk") || lower.includes("framework")) return "shield";
  if (lower.includes("liquidity") || lower.includes("market")) return "liquidity";
  if (lower.includes("aloha") || lower.includes("esg")) return "leaf";
  if (lower.includes("ultra") || lower.includes("velocity")) return "bolt";
  if (lower.includes("alpha")) return "monoA";

  return "api";
};

type AppIconKind = Parameters<typeof AppIcon>[0]["kind"];

const frameworkIconForTitle = (title: string): LucideIcon => {
  const lower = title.toLowerCase();

  if (lower.includes("decay")) return Clock3;
  if (lower.includes("delta")) return Scale;
  if (lower.includes("accumulation") || lower.includes("strategic")) return Layers3;

  return CircleDollarSign;
};

const FrameworkRowIcon = ({ icon: IconComponent }: { icon: LucideIcon }) => (
  <span
    data-testid="framework-row-icon"
    aria-hidden="true"
    className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white text-[#1D1D1F] shadow-[0_10px_24px_rgba(29,29,31,0.08),0_3px_10px_rgba(29,29,31,0.05),inset_0_0_0_0.5px_rgba(29,29,31,0.08),inset_0_1px_0_rgba(255,255,255,0.88)]"
    style={{
      WebkitBackdropFilter: "blur(18px) saturate(1.3)",
      backdropFilter: "blur(18px) saturate(1.3)",
    }}
  >
    <span
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.16) 38%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.20) 100%)",
        mixBlendMode: "screen",
      }}
    />
    <span
      className="pointer-events-none absolute -left-2 -top-2 h-7 w-8 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.20) 48%, rgba(255,255,255,0) 72%)",
        filter: "blur(1px)",
      }}
    />
    <IconComponent className="relative z-[1]" size={18} strokeWidth={1.9} />
  </span>
);

const DarkFeatureCard = ({
  title,
  body,
  iconKind,
}: {
  title: string;
  body: string;
  iconKind: AppIconKind;
}) => (
  <div
    data-testid="feature-comparison-card"
    className="gap-3 rounded-[20px] bg-[#161617] p-4 shadow-[inset_0_0_0_0.5px_rgba(245,245,247,0.08)] sm:gap-4 sm:p-5 md:p-6"
  >
    <div className="mb-4" data-testid="feature-card-icon" aria-hidden="true">
      <AppIcon kind={iconKind} size={40} />
    </div>
    <h3
      className="mb-1.5 text-[20px] font-medium leading-[1.06] tracking-[-0.028em] text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {title}
    </h3>
    <p
      className="text-[14.5px] leading-[1.4] tracking-normal text-[#F5F5F7]/70"
      style={{ fontFamily: appleFont }}
    >
      {body}
    </p>
  </div>
);

const NumberedRow = ({
  title,
  body,
  icon,
  isLast,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  isLast: boolean;
}) => (
  <div className="relative grid grid-cols-[40px_1fr] gap-4 px-4 py-5 md:grid-cols-[44px_1fr] md:px-5">
    <div className="pt-0.5">
      <FrameworkRowIcon icon={icon} />
    </div>
    <div className="min-w-0 pt-0.5">
      <h3
        className="mb-1.5 text-[17px] font-medium leading-[1.08] tracking-[-0.028em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {title}
      </h3>
      <p
        className="text-[14px] leading-[1.4] tracking-normal text-[#1D1D1F]/60"
        style={{ fontFamily: appleFont }}
      >
        {body}
      </p>
    </div>
    {!isLast ? (
      <span className="absolute bottom-0 left-[76px] right-0 h-px bg-[#000000]/[0.08]" />
    ) : null}
  </div>
);

const AlphaRow = ({
  label,
  value,
  isTotal,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) => (
  <div
    className={`relative flex items-center gap-4 px-5 py-4 ${isTotal ? "bg-[#FFFFFF]/[0.04]" : ""}`}
  >
    <div className="min-w-0 flex-1">
      <h3
        className="text-[15px] font-medium tracking-[-0.028em] text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        {label}
      </h3>
      <p
        className="mt-0.5 text-[12px] tracking-normal text-[#F5F5F7]/55"
        style={{ fontFamily: appleFont }}
      >
        Illustrative annual contribution
      </p>
    </div>
    <p
      className={`shrink-0 tabular-nums tracking-[-0.02em] ${isTotal ? "text-[24px] text-[#34C759]" : "text-[18px] text-[#F5F5F7]"} font-bold`}
      style={{ fontFamily: appleFont }}
    >
      {value}
    </p>
  </div>
);

const PillarTile = ({
  tag,
  title,
  body,
  index,
}: {
  tag: string;
  title: string;
  body: string;
  index: number;
}) => {
  const tints = [SYS.blue, SYS.green, SYS.purple];
  const tint = tints[index % tints.length];
  const iconKinds: AppIconKind[] = ["monoA", "leaf", "bolt"];

  return (
    <div
      data-testid="feature-comparison-card"
      className="gap-3 rounded-[18px] bg-[#FFFFFF] p-4 sm:gap-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span data-testid="feature-card-icon" aria-hidden="true">
          <AppIcon kind={iconKinds[index % iconKinds.length]} size={38} />
        </span>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: `${tint}14` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
          <span
            className="text-[11px] font-normal uppercase tracking-[0.04em]"
            style={{ color: tint, fontFamily: appleFont }}
          >
            {tag}
          </span>
        </div>
      </div>
      <h3
        className="mb-1.5 text-[20px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {title}
      </h3>
      <p
        className="text-[14.5px] leading-[1.4] tracking-normal text-[#1D1D1F]/65"
        style={{ fontFamily: appleFont }}
      >
        {body}
      </p>
    </div>
  );
};

const ClassCard = ({
  name,
  min,
  managementFee,
  performanceFee,
  hurdleRate,
  highlight,
}: {
  name: string;
  min: string;
  managementFee: string;
  performanceFee: string;
  hurdleRate: string;
  highlight: boolean;
}) => {
  const dark = highlight;

  return (
    <div
      data-testid="share-class-pricing-card"
      className={`flex flex-col gap-3 rounded-[16px] p-4 sm:flex-row sm:items-center ${dark ? "bg-[#1D1D1F] text-[#F5F5F7]" : "bg-[#FFFFFF] text-[#1D1D1F]"}`}
    >
      <div
        data-testid="share-class-pricing-header"
        className="flex flex-col gap-1 sm:w-24 sm:shrink-0 sm:flex-row sm:items-end sm:justify-between"
      >
        <h3
          className="text-[17px] font-medium tracking-[-0.028em]"
          style={{ fontFamily: appleFont }}
        >
          {name}
        </h3>
        <p
          className={`mt-0.5 text-[12px] font-normal ${dark ? "text-[#F5F5F7]/55" : "text-[#1D1D1F]/55"}`}
          style={{ fontFamily: appleFont }}
        >
          Min {min}
        </p>
      </div>
      <div data-testid="share-class-pricing-metrics" className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {[
          ["Mgmt", managementFee],
          ["Perf", performanceFee],
          ["Hurdle", hurdleRate],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 text-left sm:text-center">
            <p
              className="text-[17px] font-medium tracking-[-0.028em] tabular-nums"
              style={{ fontFamily: appleFont }}
            >
              {value}
            </p>
            <p
              className={`mt-0.5 text-[11px] font-medium uppercase tracking-[1.6px] ${dark ? "text-[#2997FF]/85" : "text-[#0066CC]/85"}`}
              style={{ fontFamily: appleFont }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TermRow = ({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast: boolean;
}) => (
  <div className="relative flex items-center gap-4 px-5 py-4">
    <p
      className="min-w-0 flex-1 text-[13px] font-medium tracking-[-0.01em] text-[#1D1D1F]/60"
      style={{ fontFamily: appleFont }}
    >
      {label}
    </p>
    <p
      className="min-w-0 max-w-[60%] text-right text-[15px] font-normal leading-snug tracking-normal text-[#1D1D1F]"
      style={{ fontFamily: appleFont }}
    >
      {value}
    </p>
    {!isLast ? (
      <span className="absolute bottom-0 left-5 right-5 h-px bg-[#000000]/[0.10]" />
    ) : null}
  </div>
);

const FundA = () => {
  const navigate = useNavigate();
  const {
    heroTitle,
    heroSubtitle,
    heroDescription,
    targetIRRLabel,
    targetIRRValue,
    targetIRRPeriod,
    targetIRRDisclaimer,
    philosophySectionTitle,
    philosophyCards,
    edgeCards,
    sellTheWallHref,
    assetFocusDescription,
    assetPillars,
    alphaStackSubtitle,
    alphaStackRows,
    riskCards,
    keyTermsSubtitle,
    keyTerms,
    shareClasses,
    joinSectionTitle,
    joinSectionDescription,
    joinButtonLabel,
    handleCompleteProfile,
  } = useDiscoverFundALogic();

  const assetTags = ["Alpha 27", "Aloha 27", "Ultra 27"];
  const totalRow = alphaStackRows.find((row) => row.isTotalRow);

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader
        onBackClick={() => navigate("/")}
        rightType="hamburger"
      />

      <main id="main-content">
        <AppleSection tone="light" pad="tight" fill>
          <Eyebrow>Flagship Fund</Eyebrow>
          <Display as="h1" size="md" maxWidth="max-w-[640px]">
            {heroTitle.replace(/:\s*$/, "")}.
          </Display>
          <Lede>
            {heroSubtitle} {heroDescription}
          </Lede>

          <div className="mt-10 px-6 text-center">
            <p
              className="mb-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#0066CC]/85"
              style={{ fontFamily: appleFont }}
            >
              {targetIRRLabel}
            </p>
            <div
              className="text-[72px] font-bold leading-[0.96] tracking-[-0.06em] md:text-[96px]"
              style={{ color: "rgba(0,102,204,0.85)", fontFamily: appleFont }}
            >
              {targetIRRValue}
            </div>
            <p
              className="mt-3 text-[13px] font-normal text-[#1D1D1F]/55"
              style={{ fontFamily: appleFont }}
            >
              {targetIRRPeriod}
            </p>
            <p
              className="mx-auto mt-3 max-w-[320px] text-[11px] leading-[1.4] text-[#1D1D1F]/45"
              style={{ fontFamily: appleFont }}
            >
              {targetIRRDisclaimer}
            </p>
          </div>
        </AppleSection>

        <AppleSection tone="dark" pad="normal">
          <Eyebrow tone="dark">Investment Philosophy</Eyebrow>
          <Display size="md" tone="dark" maxWidth="max-w-[500px]">
            {philosophySectionTitle.replace(/^Investment Philosophy:\s*/i, "")}
          </Display>

          <div className="mx-auto mt-9 grid max-w-5xl gap-3 px-5 md:grid-cols-3">
            {philosophyCards.map((card) => (
              <DarkFeatureCard
                key={card.title}
                title={card.title}
                body={card.description}
                iconKind={iconForTitle(card.title) as AppIconKind}
              />
            ))}
          </div>
        </AppleSection>

        <AppleSection tone="light" pad="normal">
          <Eyebrow>Our Edge</Eyebrow>
          <Display size="sm" maxWidth="max-w-[520px]">
            The Sell the Wall framework.
          </Display>

          <div className="mx-auto mt-9 max-w-4xl px-5">
            <div className="overflow-hidden rounded-[16px] bg-[#FFFFFF] shadow-[0_0_0_0.5px_rgba(29,29,31,0.06)]">
              {edgeCards.map((card, index) => (
                <NumberedRow
                  key={card.title}
                  title={card.title}
                  body={card.description}
                  icon={frameworkIconForTitle(card.title)}
                  isLast={index === edgeCards.length - 1}
                />
              ))}
            </div>
            <div className="mt-5 text-center">
              <a
                href={sellTheWallHref}
                className="inline-flex items-center gap-1 text-[15px] font-semibold text-[#0066CC]"
                style={{ fontFamily: appleFont }}
              >
                Sell the Wall details {Icon.chevronRight(SYS.blue, 13)}
              </a>
            </div>
          </div>
        </AppleSection>

        <AppleSection tone="gray" pad="normal">
          <Eyebrow>Asset Focus</Eyebrow>
          <Display size="sm" maxWidth="max-w-[520px]">
            Three pillars. 81 global enterprises.
          </Display>
          <Lede>{assetFocusDescription}</Lede>

          <div className="mx-auto mt-9 grid max-w-5xl gap-3 px-5 md:grid-cols-3">
            {assetPillars.map((pillar, index) => (
              <PillarTile
                key={pillar.title}
                tag={assetTags[index] ?? `Pillar ${index + 1}`}
                title={pillar.title}
                body={pillar.description}
                index={index}
              />
            ))}
          </div>
        </AppleSection>

        <AppleSection tone="dark" pad="normal">
          <Eyebrow tone="dark">Alpha Stack</Eyebrow>
          <Display size="sm" tone="dark" maxWidth="max-w-[520px]">
            Targeted returns, broken down.
          </Display>
          <Lede tone="dark">{alphaStackSubtitle}</Lede>

          <div className="mx-auto mt-9 max-w-4xl px-5">
            <div className="overflow-hidden rounded-[16px] bg-[#161617] shadow-[inset_0_0_0_0.5px_rgba(245,245,247,0.08)]">
              {alphaStackRows
                .filter((row) => !row.isTotalRow)
                .map((row) => (
                  <AlphaRow key={row.label} label={row.label} value={row.value} />
                ))}
              <AlphaRow
                label="Total Gross"
                value={alphaStackRows.find((row) => row.label.toLowerCase().includes("gross"))?.value ?? targetIRRValue}
                isTotal
              />
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[16px] bg-gradient-to-br from-[#007AFF] to-[#5E5CE6] px-5 py-5">
              <div className="min-w-0">
                <p
                  className="mb-0.5 text-[11px] font-medium uppercase tracking-[1.6px] text-[#2997FF]/85"
                  style={{ fontFamily: appleFont }}
                >
                  {totalRow?.label ?? "Target Net IRR"}
                </p>
                <p
                  className="text-[13px] text-[#F5F5F7]/85"
                  style={{ fontFamily: appleFont }}
                >
                  Post-fees and expenses
                </p>
              </div>
              <p
                className="shrink-0 text-[32px] font-bold leading-none tracking-[-0.03em] text-[#F5F5F7]"
                style={{ fontFamily: appleFont }}
              >
                {totalRow?.value ?? targetIRRValue}
              </p>
            </div>
          </div>
        </AppleSection>

        <AppleSection tone="light" pad="normal">
          <Eyebrow>Risk & Liquidity</Eyebrow>
          <Display size="sm" maxWidth="max-w-[520px]">
            Disciplined risk. Assured liquidity.
          </Display>

          <div className="mx-auto mt-9 grid max-w-5xl gap-3 px-5 md:grid-cols-2">
            {riskCards.map((card) => (
              <div
                key={card.title}
                data-testid="feature-comparison-card"
                className="gap-3 rounded-[20px] bg-[#F5F5F7] p-4 sm:gap-4 sm:p-5 md:p-6"
              >
                <div className="mb-4" data-testid="feature-card-icon" aria-hidden="true">
                  <AppIcon
                    kind={iconForTitle(card.title) as AppIconKind}
                    size={40}
                  />
                </div>
                <h3
                  className="mb-1.5 text-[20px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
                  style={{ fontFamily: appleFont }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-[14.5px] leading-[1.4] tracking-normal text-[#1D1D1F]/70"
                  style={{ fontFamily: appleFont }}
                >
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </AppleSection>

        <AppleSection tone="gray" pad="normal">
          <Eyebrow>Key Terms</Eyebrow>
          <Display size="sm" maxWidth="max-w-[520px]">
            How the fund is structured.
          </Display>
          <Lede>{keyTermsSubtitle}</Lede>

          <div className="mx-auto mt-9 max-w-4xl px-5">
            <SectionLabel className="mb-2 px-1">Share Classes</SectionLabel>
            <div className="grid gap-2">
              {shareClasses.map((shareClass, index) => (
                <ClassCard
                  key={shareClass.shareClass}
                  name={shareClass.shareClass}
                  min={shareClass.minInvestment}
                  managementFee={shareClass.managementFee}
                  performanceFee={shareClass.performanceFee}
                  hurdleRate={shareClass.hurdleRate}
                  highlight={index === shareClasses.length - 1}
                />
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[14px] bg-[#FFFFFF]">
              {keyTerms.map((term, index) => (
                <TermRow
                  key={term.title}
                  label={term.title}
                  value={term.content}
                  isLast={index === keyTerms.length - 1}
                />
              ))}
            </div>
          </div>
        </AppleSection>

        <AppleSection tone="dark" pad="loose" last>
          <Eyebrow tone="dark">
            {joinSectionTitle.replace(/\.+$/, "")}
          </Eyebrow>
          <Display size="sm" tone="dark" maxWidth="max-w-[520px]">
            The AI-powered Berkshire Hathaway.
          </Display>
          <Lede tone="dark">{joinSectionDescription}</Lede>

          <div className="mx-auto mt-8 flex max-w-[360px] flex-col gap-3 px-6">
            <AppleButton kind="bordered" onClick={handleCompleteProfile}>
              {joinButtonLabel}
            </AppleButton>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="h-12 text-[15px] font-medium tracking-[-0.01em] text-[#2997FF] transition hover:opacity-80"
              style={{ fontFamily: appleFont }}
            >
              Back to Home
            </button>
          </div>
        </AppleSection>
      </main>

      <div>
        <HushhTechFooter activeTab={HushhFooterTab.FUND_A} />
      </div>
    </div>
  );
};

export default FundA;
