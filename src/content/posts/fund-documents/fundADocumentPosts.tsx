import { useEffect, useState } from "react";
import { strFromU8, unzipSync } from "fflate";
import { appleFont, SmallSpinner } from "../../../components/hushh-tech-ui/HushhAppleUI";

type DocumentBlock =
  | { type: "heading"; text: string }
  | { type: "list-item"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "table"; rows: string[][] };

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const fundDocuments = {
  investmentProspectus: {
    eyebrow: "Investor Overview",
    title: "Investment Prospectus",
    src: "/fund-documents/investment-prospectus.docx",
    detail:
      "Fund thesis, investment objective, Alpha Bets 27 portfolio design, and AI-first share accumulation strategy.",
  },
  ppm: {
    eyebrow: "Offering Terms",
    title: "Private Placement Memorandum",
    src: "/fund-documents/ppm.docx",
    detail:
      "Offering summary, eligibility, class structure, risk factors, disclosures, and subscription context.",
  },
  lpMaster: {
    eyebrow: "Master Fund",
    title: "LP Master LPA",
    src: "/fund-documents/lp-master-lpa.docx",
    detail:
      "Cayman master fund governance, partner rights, capital accounts, allocations, valuation, and withdrawal mechanics.",
  },
  delawareFeeder: {
    eyebrow: "US Feeder",
    title: "Delaware Feeder LPA",
    src: "/fund-documents/delaware-feeder-lpa.docx",
    detail:
      "Domestic feeder formation, tax treatment, admission requirements, and relationship to the master fund.",
  },
} as const;

type FundDocument = (typeof fundDocuments)[keyof typeof fundDocuments];

function getWordAttr(node: Element, localName: string): string {
  return (
    node.getAttributeNS(WORD_NS, localName) ||
    node.getAttribute(`w:${localName}`) ||
    node.getAttribute(localName) ||
    ""
  );
}

function extractParagraphText(node: Element): string {
  let text = "";

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const element = child as Element;

    if (element.localName === "t") {
      text += element.textContent || "";
      continue;
    }

    if (element.localName === "tab") {
      text += "\t";
      continue;
    }

    if (element.localName === "br" || element.localName === "cr") {
      text += "\n";
      continue;
    }

    text += extractParagraphText(element);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function parseDocxDocument(xml: string): DocumentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagNameNS(WORD_NS, "body")[0];

  if (!body) return [];

  const blocks: DocumentBlock[] = [];

  for (const child of Array.from(body.children)) {
    if (child.localName === "p") {
      const text = extractParagraphText(child);
      if (!text) continue;

      const paragraphStyle = child.getElementsByTagNameNS(WORD_NS, "pStyle")[0];
      const styleId = paragraphStyle ? getWordAttr(paragraphStyle, "val") : "";
      const isListItem = child.getElementsByTagNameNS(WORD_NS, "numPr").length > 0;
      const isHeading =
        /^Heading/i.test(styleId) ||
        /^Title/i.test(styleId) ||
        /^Subtitle/i.test(styleId);

      if (isHeading) {
        blocks.push({ type: "heading", text });
      } else if (isListItem) {
        blocks.push({ type: "list-item", text });
      } else {
        blocks.push({ type: "paragraph", text });
      }

      continue;
    }

    if (child.localName === "tbl") {
      const rows = Array.from(child.children)
        .filter((row) => row.localName === "tr")
        .map((row) =>
          Array.from(row.children)
            .filter((cell) => cell.localName === "tc")
            .map((cell) => {
              const parts = Array.from(cell.children)
                .filter((cellChild) => cellChild.localName === "p")
                .map((paragraph) => extractParagraphText(paragraph))
                .filter(Boolean);

              return parts.join("\n");
            })
        )
        .filter((row) => row.some(Boolean));

      if (rows.length > 0) blocks.push({ type: "table", rows });
    }
  }

  return blocks;
}

function useDocxBlocks(src: string) {
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load document: ${response.status}`);

        const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
        const documentFile = files["word/document.xml"];
        if (!documentFile) throw new Error("Unsupported document format.");

        const parsed = parseDocxDocument(strFromU8(documentFile));
        if (!cancelled) {
          setBlocks(parsed);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to open document.");
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { blocks, isLoading, error };
}

function FundADocumentPost({ document }: { document: FundDocument }) {
  const { blocks, isLoading, error } = useDocxBlocks(document.src);

  return (
    <article
      className="mx-auto w-full max-w-[900px] px-5 pb-16 text-[#1D1D1F]"
      style={{ fontFamily: appleFont }}
    >
      <div className="mb-5 rounded-[18px] bg-[#F5F5F7] px-4 py-3 text-[12.5px] leading-[1.5] text-[#1D1D1F]/58 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
        <span className="mr-2 font-semibold uppercase tracking-[1.2px] text-[#0066CC]">
          {document.eyebrow}
        </span>
        Confidential investor material. Availability here does not constitute an
        offer or solicitation.
      </div>

      <section className="overflow-hidden rounded-[18px] bg-[#FFFFFF] p-5 shadow-[0_0_0_0.5px_rgba(29,29,31,0.08),0_18px_44px_rgba(29,29,31,0.06)] sm:p-7">
        {isLoading ? (
          <div
            className="flex min-h-[240px] items-center justify-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <SmallSpinner label="Loading document..." />
          </div>
        ) : error ? (
          <div className="rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-[14px] font-light leading-[1.45] text-[#1D1D1F]/68 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
            {error}
          </div>
        ) : (
          <div className="space-y-5">
            {blocks.map((block, index) => {
              if (block.type === "heading") {
                return (
                  <h2
                    key={`${block.type}-${index}`}
                    className="pt-1 text-[22px] font-medium leading-[1.14] tracking-[-0.024em] text-[#1D1D1F] sm:text-[26px]"
                  >
                    {block.text}
                  </h2>
                );
              }

              if (block.type === "list-item") {
                return (
                  <p
                    key={`${block.type}-${index}`}
                    className="flex gap-2.5 text-[15px] font-light leading-[1.65] text-[#1D1D1F]/64"
                  >
                    <span
                      className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E6E73]/55"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 whitespace-pre-wrap">{block.text}</span>
                  </p>
                );
              }

              if (block.type === "table") {
                return (
                  <div
                    key={`${block.type}-${index}`}
                    className="overflow-hidden rounded-[14px] bg-[#F5F5F7] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[13px]">
                        <tbody className="divide-y divide-[#1D1D1F]/[0.08]">
                          {block.rows.map((row, rowIndex) => (
                            <tr key={`row-${rowIndex}`} className="align-top">
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={`cell-${rowIndex}-${cellIndex}`}
                                  className="whitespace-pre-wrap px-4 py-3 font-light leading-[1.5] text-[#1D1D1F]/66"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return (
                <p
                  key={`${block.type}-${index}`}
                  className="whitespace-pre-wrap text-[15px] font-light leading-[1.7] text-[#1D1D1F]/66"
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
}

export function FundAInvestmentProspectusPost() {
  return <FundADocumentPost document={fundDocuments.investmentProspectus} />;
}

export function FundAPrivatePlacementMemorandumPost() {
  return <FundADocumentPost document={fundDocuments.ppm} />;
}

export function FundALpMasterLpaPost() {
  return <FundADocumentPost document={fundDocuments.lpMaster} />;
}

export function FundADelawareFeederLpaPost() {
  return <FundADocumentPost document={fundDocuments.delawareFeeder} />;
}
