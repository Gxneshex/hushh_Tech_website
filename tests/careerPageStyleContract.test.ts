import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Career page public styling", () => {
  it("keeps the careers index on the HushhTech Apple typography shell", () => {
    const career = read("src/pages/career/index.tsx");
    const css = read("src/pages/career/Career.css");

    expect(career).toContain("HushhTechHeader");
    expect(career).toContain("appleDisplayFont");
    expect(career).toContain("appleFont");
    expect(career).toContain('fontSize={{ base: "48px", md: "56px" }}');
    expect(career).toContain('fontWeight="500"');
    expect(career).toContain('letterSpacing="-0.028em"');
    expect(career).toContain("glassCardChrome");
    expect(career).not.toMatch(/gradient-text|bgGradient|colorScheme="cyan"|font-serif|Playfair/);
    expect(css).not.toMatch(/gradient-text|benefits-button|job-card|data-career-heading/);
  });

  it("keeps job details and application modal on the same visual system", () => {
    const details = read("src/pages/career/JobDetails.tsx");
    const form = read("src/pages/career/ApplicationForm.tsx");

    expect(details).toContain("HushhTechHeader");
    expect(details).toContain("appleDisplayFont");
    expect(details).toContain("glassCardChrome");
    expect(details).toContain('fontSize={{ base: "42px", md: "56px" }}');
    expect(details).not.toMatch(/colorScheme="cyan"|bg="white"\\s+borderRadius="lg"|font-serif|Playfair/);

    expect(form).toContain("appleDisplayFont");
    expect(form).toContain("fieldChrome");
    expect(form).toContain("brandBlue");
    expect(form).not.toMatch(/colorScheme="cyan"|borderRadius="lg"|cyan\\.400/);
  });

  it("hides the legacy navbar and footer on career routes", () => {
    const app = read("src/App.tsx");

    expect(app).toContain("const isCareer = location.pathname.startsWith('/career');");
    expect(app).toContain("isProfile || isCareer || isHushhHackathon");
    expect(app).toContain("isHushhUserProfile || isCareer || isLegalPublicPage");
  });
});
