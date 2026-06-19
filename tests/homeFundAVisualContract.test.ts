import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (filePath: string) =>
  fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

describe("Home Fund A visual contract", () => {
  it("keeps the Home exact-reference hero and Fund A performance section", () => {
    const home = read("src/pages/home/ui.tsx");

    expect(home).toContain("AI-Powered Investing");
    expect(home).toContain("The world&apos;s first AI-powered Berkshire Hathaway.");
    expect(home).toContain("Merging rigorous data science with human wisdom.");
    expect(home).toContain("max-width: 54ch;");
    expect(home).toContain("font-size: clamp(19px, 2.1vw, 25px);");
    expect(home).toContain("color: rgba(0,0,0,.6);");
    expect(home).toContain("function CountUp");
    expect(home).toContain("function FundStatsSection");
    expect(home).toContain("Fund A.");
    expect(home).toContain("High Growth");
    expect(home).toContain("data-count");
    expect(home).toContain("<CountUp value={21.4} active={visible} decimals={1} />");
    expect(home).toContain('data-count="18"');
    expect(home).toContain("&ndash;");
    expect(home).toContain("<CountUp value={23} active={visible} />");
    expect(home).toContain("FY 2025");
    expect(home).toContain("Target internal rate of return");
    expect(home).toContain("Quarterly");
    expect(home).toContain("Redemption liquidity windows");
    expect(home).not.toContain("PERFORMANCE_RANGES");
    expect(home).not.toContain("performanceRangeKeys");
    expect(home).not.toContain("Target Net IRR");
    expect(home).not.toContain("Annually \\u00B7 post fees & expenses");
    expect(home).not.toContain("homeStocksFundALine");
    expect(home).not.toContain("text-[#34C759]");
    expect(home).not.toContain("bg-[#34C759]");
  });

  it("keeps shared icon glass calmer and less gradient-heavy", () => {
    const ui = read("src/components/hushh-tech-ui/HushhAppleUI.tsx");

    expect(ui).toContain(
      'linear-gradient(160deg, #3A96E2 0%, #0E77D4 58%, #075EAD 100%)',
    );
    expect(ui).toContain('stroke="rgba(245,250,255,0.72)"');
    expect(ui).toContain('stroke="rgba(245,250,255,0.82)"');
    expect(ui).toContain('fill="rgba(245,250,255,0.66)"');
    expect(ui).toContain('filter: isIntelligence ? "none" : "blur(1px)"');
    expect(ui).toContain('backdropFilter: isIntelligence ? "none" : "blur(22px) saturate(1.32)"');
    expect(ui).toContain('backdropFilter: "blur(20px) saturate(1.35)"');
    expect(ui).not.toContain(
      'linear-gradient(160deg, #2997ff 0%, #0071e3 100%)',
    );
  });

  it("keeps Fund A page net IRR on the shared calmer blue gradient", () => {
    const fundA = read("src/pages/discover-fund-a/ui.tsx");

    expect(fundA).toContain("Flagship Fund");
    expect(fundA).toContain("Hushh Fund A.");
    expect(fundA).toContain("fontWeight: 400");
    expect(fundA).toContain('fontSize: "clamp(17px,1.6vw,20px)"');
    expect(fundA).toContain('color: "rgba(0,0,0,.62)"');
    expect(fundA).toContain('color: "#0071e3"');
    expect(fundA).toContain('{targetIRRValue.replace("-", "–")}');
    expect(fundA).not.toContain("Back to Home");
    expect(fundA).not.toContain("FUND_A_NET_IRR_GRADIENT");
    expect(fundA).not.toContain('WebkitBackgroundClip: "text"');
    expect(fundA).not.toContain("bg-gradient-to-br from-[#007AFF] to-[#5E5CE6]");
  });

  it("keeps home technology section on the supplied reference image treatment", () => {
    const home = read("src/pages/home/ui.tsx");

    expect(home).toContain("Fund Technology");
    expect(home).toContain("Designed like a technology product.");
    expect(home).toContain("Institutional analytics, human oversight, and modern fund operations");
    expect(home).toContain("tech-team-final.png");
    expect(home).toContain("AI-Powered");
    expect(home).toContain("Human-Led");
    expect(home).not.toContain('eyebrow="AI"');
    expect(home).not.toContain('eyebrow="Human"');
  });

  it("keeps profile hero icon on the enhanced profile variant", () => {
    const ui = read("src/components/hushh-tech-ui/HushhAppleUI.tsx");
    const profile = read("src/pages/profile/ui.tsx");

    expect(ui).toContain('kind?: "api" | "intelligence" | "person" | "profile"');
    expect(ui).toContain("profile: {");
    expect(ui).toContain('<circle cx="20.6" cy="6.8" r="2.5" fill="#0066CC" />');
    expect(profile).toContain('<AppIcon kind="profile" size={62} />');
  });

  it("keeps Fund A framework row icons on the liquid-glass black-white system", () => {
    const fundA = read("src/pages/discover-fund-a/ui.tsx");

    expect(fundA).toContain("The Sell the Wall framework.");
    expect(fundA).toContain("fa-framework-row");
    expect(fundA).toContain("fa-framework-num");
    expect(fundA).toContain('{String(index + 1).padStart(2, "0")}');
    expect(fundA).toContain("borderRadius: 28");
  });

  it("keeps Aloha 27 on the green sprout asset icon", () => {
    const fundA = read("src/pages/discover-fund-a/ui.tsx");

    expect(fundA).toContain("const SproutIcon = () =>");
    expect(fundA).toContain('tag: "Aloha 27"');
    expect(fundA).toContain('title: "Humanity-Driven Growth"');
    expect(fundA).toContain('color: "#1d8a4f"');
    expect(fundA).toContain('d="M12 21V10"');
    expect(fundA).toContain("icon: <SproutIcon />");
  });
});
