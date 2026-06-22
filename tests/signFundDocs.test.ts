import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";

import { buildSignedFundDocs } from "../supabase/functions/nda-signed-notification/signFundDocs";

// Guards that the fund documents are rendered SIGNED: General Partner =
// "Manish Sainani", Limited Partner = the signer, dated, with no leftover
// template tokens, across all four documents.
describe("signFundDocs", () => {
  const SIGNER = "Ankit Kumar Singh";
  const docs = buildSignedFundDocs({ signerName: SIGNER, signedAt: "2026-06-22T14:23:22Z" });

  const xmlOf = (base64: string): string => {
    const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
    const files = unzipSync(bytes);
    return strFromU8(files["word/document.xml"]);
  };

  it("produces all four signed fund documents", () => {
    expect(docs).toHaveLength(4);
    const names = docs.map((d) => d.filename).sort();
    expect(names).toEqual(
      [
        "Delaware-Feeder-LPA-Signed.docx",
        "Investment-Prospectus-Signed.docx",
        "LP-Master-LPA-Signed.docx",
        "Private-Placement-Memorandum-Signed.docx",
      ].sort(),
    );
    for (const d of docs) {
      expect(d.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      expect(d.base64Data.length).toBeGreaterThan(100);
    }
  });

  it("fills GP (Manish) and LP (signer) signatures + date, with no leftover tokens", () => {
    for (const d of docs) {
      const xml = xmlOf(d.base64Data);
      // GP signature line carries Manish; LP signature line carries the signer.
      expect(xml).toContain("By: Manish Sainani");
      expect(xml).toContain(`By: ${SIGNER}`);
      expect(xml).toContain("Name: Manish Sainani");
      expect(xml).toContain(`Name: ${SIGNER}`);
      // Date filled on both blocks.
      expect(xml).toContain("June 22, 2026");
      // No template tokens survive.
      expect(xml).not.toContain("{{");
      expect(xml).not.toContain("}}");
    }
  });

  it("escapes XML-special characters in the signer name", () => {
    const signed = buildSignedFundDocs({ signerName: "Tom & Jerry <LLC>", signedAt: "2026-06-22T00:00:00Z" });
    const xml = xmlOf(signed[0].base64Data);
    expect(xml).toContain("Tom &amp; Jerry &lt;LLC&gt;");
    expect(xml).not.toContain("Tom & Jerry <LLC>");
  });
});
