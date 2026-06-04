import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("public HushhTech UI cleanup", () => {
  it("removes KYC Studio Alpha and Our Philosophy from public navigation surfaces", () => {
    const navigationSources = [
      "src/components/hushh-tech-nav-drawer/HushhTechNavDrawer.tsx",
      "src/components/Navbar.tsx",
      "src/components/Footer.tsx",
      "src/i18n/locales/en.json",
      "src/i18n/locales/fr.json",
      "src/i18n/locales/ar.json",
      "src/i18n/locales/zh.json",
    ].map(read).join("\n");

    expect(navigationSources).not.toMatch(/KYC Studio Alpha|kycStudio|KYC Verification/);
    expect(navigationSources).not.toMatch(/Our Philosophy|ourPhilosophy/);
  });

  it("keeps old KYC and A2A URLs as home redirects instead of public pages", () => {
    const app = read("src/App.tsx");

    for (const path of [
      "/kyc",
      "/kyc-verification",
      "/kyc-form",
      "/kyc-demo",
      "/kyc-flow",
      "/a2a-playground",
    ]) {
      expect(app).toContain(`path='${path}' element={<Navigate to='/' replace />}`);
    }

    expect(app).not.toMatch(/element=\{<KYCVerificationPage|element=\{<KYCFormPage|element=\{<KYCDemoPage|element=\{<KycFlowPage|element=\{<A2APlaygroundPage/);
  });

  it("treats contact faq philosophy and investor guide as modern public pages without the legacy shell", () => {
    const app = read("src/App.tsx");

    expect(app).toContain("location.pathname === '/contact'");
    expect(app).toContain("location.pathname === '/faq'");
    expect(app).toContain("location.pathname === '/philosophy'");
    expect(app).toContain("location.pathname === '/about/philosophy'");
    expect(app).toContain("location.pathname === '/investor-guide'");
    expect(app).toContain("isInvestorGuide || isProfile");
    expect(app).toContain("<Route path=\"/philosophy\" element={<Philosophy />} />");
  });

  it("serves the profile tab as the public profile surface instead of a login redirect", () => {
    const app = read("src/App.tsx");

    expect(app).toContain("<Route path='/profile' element={<Profile />} />");
    expect(app).not.toMatch(
      /<Route path='\/profile' element=\{\s*<AuthRequiredRoute>/,
    );
  });

  it("keeps the HushhTech back header fixed for home-style secondary pages", () => {
    const backHeader = read(
      "src/components/hushh-tech-back-header/HushhTechBackHeader.tsx",
    );

    expect(backHeader).toContain("fixed left-0 right-0 top-0 z-50");
    expect(backHeader).toContain('data-hushh-back-header');
    expect(backHeader).toContain('<div className="h-[72px]" />');
  });

  it("keeps FAQs copy consistent and scopes the FAQ sheet to onboarding", () => {
    const backHeader = read(
      "src/components/hushh-tech-back-header/HushhTechBackHeader.tsx",
    );
    const faqPage = read("src/pages/faq.tsx");
    const navDrawer = read("src/components/hushh-tech-nav-drawer/HushhTechNavDrawer.tsx");
    const footer = read("src/components/Footer.tsx");
    const enLocale = read("src/i18n/locales/en.json");

    expect(backHeader).toContain('rightLabel = "FAQs"');
    expect(backHeader).toContain('location.pathname.startsWith("/onboarding")');
    expect(backHeader).toContain('navigate("/faq")');
    expect(backHeader).not.toContain("px-5 text-[12px] font-medium uppercase");
    expect(faqPage).toContain("<HushhTechBackHeader showRightButton={false} />");
    expect(navDrawer).toContain('label: "FAQs", path: "/faq"');
    expect(footer).toContain("FAQs");
    expect(enLocale).toContain('"faq": "FAQs"');
  });
});
