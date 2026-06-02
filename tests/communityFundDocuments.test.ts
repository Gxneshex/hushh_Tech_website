import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Community Fund A document presentation", () => {
  it("publishes the Fund A document set as a categorized community article", () => {
    const posts = read("src/data/posts.ts");
    const logic = read("src/pages/community/logic.ts");
    const ui = read("src/pages/community/ui.tsx");

    expect(posts).toContain("FundAOfferingDocuments");
    expect(posts).toContain(
      "fund-documents/hushh-alpha-aloha-fund-a-offering-documents",
    );
    expect(posts).toContain("category: 'fund documents'");
    expect(posts).toContain("accessLevel: 'Public'");

    expect(logic).toContain('export const FUND_DOCUMENTS_OPTION = "Fund Documents"');
    expect(logic).toContain('if (lower.includes("document")) return FUND_DOCUMENTS_OPTION;');
    expect(logic).toContain('post.accessLevel === "Public"');
    expect(logic).toContain("mergedBySlug.set(post.slug");
    expect(ui).toContain('documents: { label: "Fund Documents"');
    expect(ui).toContain('if (lower.includes("document")) return CATEGORY_META.documents;');
  });

  it("links every attached Fund A document from the community article", () => {
    const component = read("src/content/posts/funds/fundAOfferingDocuments.tsx");

    for (const href of [
      "/fund-documents/investment-prospectus.docx",
      "/fund-documents/ppm.docx",
      "/fund-documents/lp-master-lpa.docx",
      "/fund-documents/delaware-feeder-lpa.docx",
    ]) {
      expect(component).toContain(`href: "${href}"`);
    }

    expect(component).toContain("getDocumentReaderHref");
    expect(component).toContain("href={getDocumentReaderHref(document)}");
    expect(component).toMatch(/href=\{document\.href\}\s+download/);
  });

  it("keeps the contact page on the shared HushhTech typography", () => {
    const contact = read("src/pages/Contact.tsx");

    expect(contact).toContain(
      'import { appleDisplayFont, appleFont } from "../components/hushh-tech-ui/HushhAppleUI";',
    );
    expect(contact).toContain("Get in touch.");
    expect(contact).toContain('fontSize={{ base: "48px", md: "56px" }}');
    expect(contact).toContain('fontWeight="500"');
    expect(contact).toContain("style={{ fontFamily: appleDisplayFont");
    expect(contact).toContain('color={textPrimary}');
    expect(contact).not.toMatch(/Playfair Display|font-serif|fontStyle="italic"/);
  });
});
