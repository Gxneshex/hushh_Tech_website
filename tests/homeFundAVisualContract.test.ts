import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (filePath: string) =>
  fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

describe("Home Fund A visual contract", () => {
  it("keeps the Fund A performance visual as a single Activity-style return ring", () => {
    const home = read("src/pages/home/ui.tsx");

    expect(home).toContain("const PerformancePreview = () =>");
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
  });

  it("keeps shared icon glass calmer and less gradient-heavy", () => {
    const ui = read("src/components/hushh-tech-ui/HushhAppleUI.tsx");

    expect(ui).toContain(
      'linear-gradient(160deg, #2997FF 0%, #248FEF 56%, #1D82DE 100%)',
    );
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
