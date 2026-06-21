import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Community Fund A document presentation", () => {
  it("publishes each Fund A document as a categorized community article row", () => {
    const posts = read("src/data/posts.ts");
    const logic = read("src/pages/community/logic.ts");
    const ui = read("src/pages/community/ui.tsx");

    expect(posts).not.toContain("FundAOfferingDocuments");
    expect(posts).toContain("FundAInvestmentProspectusPost");
    expect(posts).toContain("FundAPrivatePlacementMemorandumPost");
    expect(posts).toContain("FundALpMasterLpaPost");
    expect(posts).toContain("FundADelawareFeederLpaPost");
    expect(posts).toContain("fund-documents/investment-prospectus");
    expect(posts).toContain("fund-documents/private-placement-memorandum");
    expect(posts).toContain("fund-documents/lp-master-lpa");
    expect(posts).toContain("fund-documents/delaware-feeder-lpa");
    expect(posts).toContain("category: 'fund documents'");
    expect(posts).toContain("accessLevel: 'Public'");

    expect(logic).toContain('export const FUND_DOCUMENTS_OPTION = "Fund Documents"');
    expect(logic).toContain('if (lower.includes("document")) return FUND_DOCUMENTS_OPTION;');
    expect(logic).toContain('post.accessLevel === "Public"');
    expect(logic).toContain("mergedBySlug.set(post.slug");
    expect(ui).toContain('documents: { label: "Fund Documents"');
    expect(ui).toContain('if (lower.includes("document")) return CATEGORY_META.documents;');
    expect(ui).toContain("ArticleCard");
    expect(ui).toContain("DocumentCard");
    expect(ui).not.toContain("FundAOfferingDocuments");
  });

  it("links every attached Fund A document from its community article page", () => {
    const component = read("src/content/posts/fund-documents/fundADocumentPosts.tsx");

    for (const src of [
      'src: "/fund-documents/investment-prospectus.docx"',
      'src: "/fund-documents/ppm.docx"',
      'src: "/fund-documents/lp-master-lpa.docx"',
      'src: "/fund-documents/delaware-feeder-lpa.docx"',
    ]) {
      expect(component).toContain(src);
    }

    expect(component).toContain("useDocxBlocks(document.src)");
    expect(component).toContain("parseDocxDocument");
    expect(component).toContain('files["word/document.xml"]');
    expect(component).toContain("blocks.map");
    expect(component).not.toContain("getDocumentReaderHref");
    expect(component).not.toContain("Open document");
    expect(component).not.toMatch(/download/);
  });

  it("keeps the contact page on the shared HushhTech typography", () => {
    const contact = read("src/pages/Contact.tsx");

    expect(contact).toContain(
      'import { appleDisplayFont, appleFont } from "../components/hushh-tech-ui/HushhAppleUI";',
    );
    expect(contact).toContain("Get in touch.");
    expect(contact).toContain('fontSize="clamp(32px, 4.6vw, 54px)"');
    expect(contact).toContain('fontWeight="600"');
    expect(contact).toContain('fontSize="clamp(17px, 1.6vw, 20px)"');
    expect(contact).toContain("style={{ fontFamily: appleDisplayFont");
    expect(contact).toContain('color={textPrimary}');
    expect(contact).not.toMatch(/Playfair Display|font-serif|fontStyle="italic"/);
  });
});
