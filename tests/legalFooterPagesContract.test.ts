import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("legal and support footer pages", () => {
  it("routes all four home footer links to modern public pages", () => {
    const footer = read("src/components/Footer.tsx");
    const app = read("src/App.tsx");

    expect(footer).toContain('href="/risk-disclosures"');
    expect(footer).toContain("Disclosures");
    expect(footer).toContain('href="/privacy-policy"');
    expect(footer).toContain("Privacy");
    expect(footer).toContain('href="/terms"');
    expect(footer).toContain("Terms");
    expect(footer).toContain('href="/support"');
    expect(footer).toContain("Support");

    expect(app).toContain("<Route path='/privacy-policy' element={<PrivacyPolicy />} />");
    expect(app).toContain("<Route path='/terms' element={<TermsOfService />} />");
    expect(app).toContain("<Route path='/risk-disclosures' element={<RiskDisclosuresPage />} />");
    expect(app).toContain("<Route path='/support' element={<SupportPage />} />");
  });

  it("hides the legacy navbar/footer shell on legal and support pages", () => {
    const app = read("src/App.tsx");

    for (const path of [
      "/privacy-policy",
      "/terms",
      "/terms-of-service",
      "/risk-disclosures",
      "/support",
    ]) {
      expect(app).toContain(`location.pathname === '${path}'`);
    }

    expect(app).toContain("isLegalPublicPage || isModernPublicPage");
    expect(app).toContain("isHushhUserProfile || isCareer || isBenefits || isLegalPublicPage || isModernPublicPage");
    expect(app).toContain("showPublicWebsiteFooter");
  });

  it("keeps legal pages on the shared HushhTech legal shell, not Chakra pages", () => {
    const shell = read("src/components/hushh-tech-legal-page/HushhTechLegalPage.tsx");

    // Legal shell now uses the home shell + design-system typography.
    expect(shell).toContain("appleDisplayFont");
    expect(shell).toContain("HushhTechHeader");
    expect(shell).toContain("Display");
    expect(shell).toContain("Eyebrow");
    expect(shell).not.toContain("text-[36px] font-medium leading-[1.06]");

    for (const path of [
      "src/pages/terms-of-service/index.tsx",
      "src/pages/privacy-policy/index.tsx",
      "src/pages/risk-disclosures/index.tsx",
      "src/pages/support/index.tsx",
    ]) {
      const source = read(path);

      expect(source).toContain("HushhTechLegalPage");
      expect(source).not.toMatch(/@chakra-ui\/react|blue-gradient-text|Container/);
    }
  });

  it("populates terms from the approved website terms of use document", () => {
    const terms = read("src/pages/terms-of-service/index.tsx");

    expect(terms).toContain("Website Terms of Use.");
    expect(terms).toContain("Ownership of Site; Agreement to Terms of Use");
    expect(terms).toContain("BY USING THE SITE, YOU AGREE TO THESE TERMS OF USE");
    expect(terms).toContain("Venue shall be in King County, Washington.");
    expect(terms).toContain("Contact: privacy@hushh.ai");
  });

  it("keeps standalone FAQ on the Apple font system", () => {
    const faq = read("src/pages/faq.tsx");

    expect(faq).toContain("HushhTechHeader");
    expect(faq).toContain("AppleSection");
    expect(faq).toContain("appleFont");
    expect(faq).not.toMatch(/Playfair|Manrope|font-serif/);
  });
});
