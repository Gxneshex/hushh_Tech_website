import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (filePath: string) =>
  fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

describe("Home Fund A visual contract", () => {
  it("keeps the Fund A performance visual as a single Activity-style return ring", () => {
    const home = read("src/pages/home/ui.tsx");

    expect(home).toContain("const PerformancePreview = () =>");
    expect(home).toContain("max-w-[360px] text-center md:max-w-[420px]");
    expect(home).toContain("h-[176px] w-[176px]");
    expect(home).toContain("min-[390px]:h-[184px] min-[390px]:w-[184px]");
    expect(home).toContain("strokeDashoffset={0}");
    expect(home).toContain('const FUND_A_APPLE_GREEN = "#30D158";');
    expect(home).toContain("const stroke = 14;");
    expect(home).toContain('stdDeviation="2.2"');
    expect(home).toContain("text-[46px] md:text-[64px]");
    expect(home).toContain('<Display size="sm" tone="dark" maxWidth="max-w-[520px]">');
    expect(home).toContain("!pt-20 !pb-[10rem] md:!pt-24 md:!pb-[6rem]");
    expect(home).toContain("h-[118px] w-[192px]");
    expect(home).toContain('id="homeFundARingGrad"');
    expect(home).toContain('id="homeFundARingGlow"');
    expect(home).toContain('strokeDasharray={`${dash} ${circumference}`}');
    expect(home).toContain("Net return &middot; inception to date");
    expect(home).toContain("18&ndash;23%");
    expect(home).toContain("Target IRR");
    expect(home).toContain("Jan 2024");
    expect(home).toContain("Inception");
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
    expect(ui).toContain('stroke="rgba(255,255,255,0.46)"');
    expect(ui).toContain('stroke="rgba(255,255,255,0.58)"');
    expect(ui).toContain('fill="rgba(255,255,255,0.46)"');
    expect(ui).toContain('filter: isIntelligence ? "none" : "blur(1px)"');
    expect(ui).toContain('backdropFilter: "blur(22px) saturate(1.32)"');
    expect(ui).toContain('backdropFilter: "blur(20px) saturate(1.35)"');
    expect(ui).not.toContain(
      'linear-gradient(160deg, #2997ff 0%, #0071e3 100%)',
    );
  });

  it("keeps Fund A framework row icons on the liquid-glass black-white system", () => {
    const fundA = read("src/pages/discover-fund-a/ui.tsx");

    expect(fundA).toContain('data-testid="framework-row-icon"');
    expect(fundA).toContain('backdropFilter: "blur(18px) saturate(1.3)"');
    expect(fundA).toContain("bg-white text-[#1D1D1F]");
  });
});
