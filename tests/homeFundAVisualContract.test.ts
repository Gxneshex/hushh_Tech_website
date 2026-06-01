import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (filePath: string) =>
  fs.readFileSync(path.join(process.cwd(), filePath), "utf8");

describe("Home Fund A visual contract", () => {
  it("keeps the performance chart as a straight system-green line without neon glow", () => {
    const home = read("src/pages/home/ui.tsx");

    expect(home).toContain("const createLinearPath");
    expect(home).toContain("createLinearPath(coords)");
    expect(home).toContain("stroke={SYS.green}");
    expect(home).toContain('strokeWidth="2.5"');
    expect(home).toContain("`${index === 0 ? \"M\" : \"L\"}");
    expect(home).not.toContain("homeStocksFundALine");
    expect(home).not.toContain("createMonotonePath");
    expect(home).not.toMatch(/path \+= ` C|` C \$\{/);
    expect(home).not.toContain('strokeOpacity="0.18"');
    expect(home).not.toContain('strokeWidth="7"');
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
