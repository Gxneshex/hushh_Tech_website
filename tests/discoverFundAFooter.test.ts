// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../src/pages/discover-fund-a/logic", () => ({
  useDiscoverFundALogic: () => ({
    heroTitle: "Hushh Fund A:",
    heroSubtitle: "AI-Powered Multi-Strategy Alpha.",
    heroDescription: "Fund description",
    targetIRRLabel: "Target Net IRR",
    targetIRRValue: "18-23%",
    targetIRRPeriod: "Annually",
    targetIRRDisclaimer: "Disclaimer",
    philosophySectionTitle: "Investment Philosophy",
    philosophyCards: [
      { title: "Risk-First Architecture", description: "Risk" },
      { title: "AI-Enhanced Research", description: "Research" },
    ],
    edgeSectionTitle: "Our Edge",
    sellTheWallHref: "/sell-the-wall",
    edgeCards: [
      { title: "Systematically Sell Premium", description: "Premium" },
      { title: "Maximize Decay", description: "Decay" },
      { title: "Maintain Delta-Neutrality", description: "Delta" },
      { title: "Strategic Accumulation & Income", description: "Income" },
    ],
    assetFocusSectionTitle: "Asset Focus",
    assetFocusDescription: "Assets",
    assetPillars: [
      { title: "Cash & Equivalents", description: "Cash" },
      { title: "Strategic Options Overlay", description: "Options" },
    ],
    alphaStackSectionTitle: "Alpha Stack",
    alphaStackSubtitle: "Breakdown",
    alphaStackRows: [
      { label: "Options Premium", value: "4-5%" },
      { label: "Target Net IRR", value: "18-23%", isTotalRow: true },
    ],
    riskSectionTitle: "Risk Management",
    riskCards: [
      { title: "Hedging Framework", description: "Hedge" },
      { title: "Liquidity Management", description: "Liquidity" },
    ],
    keyTermsSectionTitle: "Key Terms",
    keyTermsSubtitle: "Terms",
    keyTerms: [{ title: "Liquidity", content: "Quarterly" }],
    shareClasses: [
      {
        shareClass: "Class A",
        minInvestment: "$25M",
        managementFee: "1%",
        performanceFee: "15%",
        hurdleRate: "12%",
      },
      {
        shareClass: "Class B",
        minInvestment: "$5M",
        managementFee: "1.5%",
        performanceFee: "15%",
        hurdleRate: "10%",
      },
      {
        shareClass: "Class C",
        minInvestment: "$1M",
        managementFee: "1.5%",
        performanceFee: "25%",
        hurdleRate: "8%",
      },
    ],
    joinSectionTitle: "Join",
    joinSectionDescription: "Complete profile",
    joinButtonLabel: "Complete Profile",
    handleCompleteProfile: vi.fn(),
  }),
}));

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => null,
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  HushhFooterTab: { FUND_A: "fund-a" },
  default: ({ activeTab }: { activeTab: string }) => (
    React.createElement("nav", {
      "data-active-tab": activeTab,
      "data-testid": "fund-a-footer",
    })
  ),
}));

import FundA from "../src/pages/discover-fund-a/ui";

describe("FundA footer shell", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    navigateMock.mockClear();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("keeps the Fund A footer available across breakpoints", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const footer = container.querySelector('[data-testid="fund-a-footer"]');

    expect(footer?.getAttribute("data-active-tab")).toBe("fund-a");
    expect(footer?.parentElement?.className).not.toContain("lg:hidden");
  });

  it("renders the Flagship Fund section as a normal subpage section", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    expect(container.textContent).toContain("Flagship Fund");
    expect(container.textContent).toContain("Hushh Fund A.");
    expect(container.textContent).toContain("Target Net IRR");
    expect(container.textContent).toContain("18–23%");
    expect(container.textContent).toContain("Annually");
    expect(container.textContent).not.toContain("Back to Home");
  });

  it("keeps Sell the Wall framework rows in the supplied reference structure", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const frameworkRows = Array.from(
      container.querySelectorAll(".fa-framework-row"),
    );

    expect(container.textContent).toContain("The Sell the Wall framework.");
    expect(frameworkRows).toHaveLength(4);
    expect(frameworkRows[0]?.textContent).toContain("01");
    expect(frameworkRows[3]?.textContent).toContain("04");
  });

  it("keeps Aloha 27 on the green sprout asset visual", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const assetCards = Array.from(container.querySelectorAll(".fa-card.fa-lift"));
    const alohaCard = assetCards.find((card) =>
      card.textContent?.includes("Aloha 27"),
    );

    expect(alohaCard).toBeTruthy();
    expect(alohaCard?.textContent).toContain("Humanity-Driven Growth");
    expect(alohaCard?.innerHTML).toContain("M12 21V10");
  });

  it("keeps share class pricing on equal card treatment with full labels", async () => {
    await act(async () => {
      root.render(React.createElement(FundA));
    });

    const shareClassCards = Array.from(container.querySelectorAll(".fa-card.fa-lift")).filter(
      (card) => card.textContent?.includes("Management fee"),
    );

    expect(shareClassCards).toHaveLength(3);
    shareClassCards.forEach((card) => {
      expect(card.textContent).toContain("Management fee");
      expect(card.textContent).toContain("Performance fee");
      expect(card.textContent).toContain("Hurdle rate");
      expect(card.className).toContain("fa-lift");
    });
  });
});
