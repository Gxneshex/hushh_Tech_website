import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { strFromU8, unzipSync } from "fflate";
import {
  appleFont,
  HushhMark,
  Icon,
  SmallSpinner,
  SYS,
} from "../../../components/hushh-tech-ui/HushhAppleUI";

/**
 * Fund A document posts.
 *
 * Each of the four offering documents is published as its own community article
 * under the "Fund Documents" category. The legal content is authored by counsel
 * and is rendered VERBATIM from the source .docx — we never edit or paraphrase
 * it. What this module adds is presentation: a branded title page, a real
 * heading hierarchy, styled tables and legal notices, a Step 1-4 sequence across
 * the four documents, and a Hushh business identity footer. Business identity
 * (entity names, website, contact) is sourced from hushhtech.com — not invented.
 */

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

/* ───────────────────────── Business identity (hushhtech.com) ───────────────────────── */

const FUND = {
  org: "Hushh Technologies LLC",
  website: "hushhtech.com",
  websiteUrl: "https://hushhtech.com",
  email: "support@hushh.ai",
  phone: "+1-888-462-1726",
  gp: "Hushh Technologies Middle East LLC",
  gpJurisdiction: "ADGM, Abu Dhabi, UAE",
} as const;

const GP_META = {
  label: "General Partner",
  value: `${FUND.gp} · ${FUND.gpJurisdiction}`,
};
const FOUNDER_META = {
  label: "Founder / CIO",
  value: "Manish Sainani · Founder, CEO & Chief Investment Officer",
};
const COUNSEL_META = {
  label: "Legal Counsel",
  value: "McDermott Will & Emery LLP · Stephanie R. Breslow",
};

type DocMeta = { label: string; value: string };

type FundDocument = {
  step: number;
  slug: string;
  src: string;
  eyebrow: string;
  docType: string;
  title: string;
  fundName: string;
  structure: string;
  tagline: string;
  meta: DocMeta[];
};

const fundDocuments = {
  investmentProspectus: {
    step: 1,
    slug: "fund-documents/investment-prospectus",
    src: "/fund-documents/investment-prospectus.docx",
    eyebrow: "Investor Overview",
    docType: "Confidential Offering Document",
    title: "Investment Prospectus",
    fundName: "Hushh Alpha Aloha Fund A, LP",
    structure: "A Cayman Islands Exempted Limited Partnership",
    tagline:
      "An evergreen, AI-first, FCF-first, multi-asset permanent capital vehicle.",
    meta: [GP_META, FOUNDER_META, COUNSEL_META, { label: "Dated", value: "March 2026" }],
  },
  ppm: {
    step: 2,
    slug: "fund-documents/private-placement-memorandum",
    src: "/fund-documents/ppm.docx",
    eyebrow: "Offering Terms",
    docType: "Confidential Private Placement Memorandum",
    title: "Private Placement Memorandum",
    fundName: "Hushh Alpha Aloha Fund A, LP",
    structure: "Cayman Master Fund · Delaware, Singapore (VCC) & ADGM Feeders",
    tagline:
      "Employing the Alpha Bets 27 Portfolio, the DNSA Engine, and the DRIP-ON methodology.",
    meta: [
      GP_META,
      FOUNDER_META,
      COUNSEL_META,
      { label: "Interests Offered", value: "Classes A · B · C · I · S · F" },
      { label: "Minimum Investment", value: "$1,000,000 (Class A)" },
      { label: "Dated", value: "March 2026" },
    ],
  },
  lpMaster: {
    step: 3,
    slug: "fund-documents/lp-master-lpa",
    src: "/fund-documents/lp-master-lpa.docx",
    eyebrow: "Master Fund",
    docType: "Amended & Restated · Exempted Limited Partnership Agreement",
    title: "LP Master LPA",
    fundName: "Hushh Alpha Aloha Fund A, LP",
    structure: "A Cayman Islands Master Fund",
    tagline:
      "Master-fund governance: partner rights, capital accounts, allocations, valuation, and withdrawals.",
    meta: [GP_META, COUNSEL_META, { label: "Dated", value: "2026" }],
  },
  delawareFeeder: {
    step: 4,
    slug: "fund-documents/delaware-feeder-lpa",
    src: "/fund-documents/delaware-feeder-lpa.docx",
    eyebrow: "US Feeder",
    docType: "Amended & Restated · Limited Partnership Agreement",
    title: "Delaware Feeder LPA",
    fundName: "Hushh Alpha Aloha Fund A (Delaware), LP",
    structure: "A Delaware Feeder Fund",
    tagline:
      "The U.S. domestic feeder investing substantially all assets into the Cayman master fund.",
    meta: [GP_META, COUNSEL_META, { label: "Dated", value: "2026" }],
  },
} satisfies Record<string, FundDocument>;

const DOC_SEQUENCE: FundDocument[] = [
  fundDocuments.investmentProspectus,
  fundDocuments.ppm,
  fundDocuments.lpMaster,
  fundDocuments.delawareFeeder,
];
const TOTAL_STEPS = DOC_SEQUENCE.length;

/* ───────────────────────── .docx parsing ───────────────────────── */

type Run = { text: string; bold: boolean; italic: boolean };

type DocumentBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; runs: Run[] }
  | { type: "legal"; text: string }
  | { type: "table"; rows: string[][] };

function getWordAttr(node: Element, localName: string): string {
  return (
    node.getAttributeNS(WORD_NS, localName) ||
    node.getAttribute(`w:${localName}`) ||
    node.getAttribute(localName) ||
    ""
  );
}

function isEnabled(node: Element): boolean {
  const val = getWordAttr(node, "val");
  return val !== "false" && val !== "0" && val !== "none";
}

function readEmphasis(rPr: Element | null): { bold: boolean; italic: boolean } {
  let bold = false;
  let italic = false;
  if (!rPr) return { bold, italic };
  for (const child of Array.from(rPr.children)) {
    if (child.localName === "b") bold = isEnabled(child);
    else if (child.localName === "i") italic = isEnabled(child);
  }
  return { bold, italic };
}

/** Collapse a paragraph into formatting-aware runs so inline bold/italic survive. */
function extractRuns(node: Element): Run[] {
  const runs: Run[] = [];

  const push = (text: string, bold: boolean, italic: boolean) => {
    if (!text) return;
    const last = runs[runs.length - 1];
    if (last && last.bold === bold && last.italic === italic) last.text += text;
    else runs.push({ text, bold, italic });
  };

  const visit = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      const name = child.localName;

      if (name === "r") {
        const rPr =
          Array.from(child.children).find((c) => c.localName === "rPr") ?? null;
        const { bold, italic } = readEmphasis(rPr as Element | null);

        let text = "";
        for (const runChild of Array.from(child.childNodes)) {
          if (runChild.nodeType !== Node.ELEMENT_NODE) continue;
          const element = runChild as Element;
          if (element.localName === "t") text += element.textContent || "";
          else if (element.localName === "tab") text += " ";
          else if (element.localName === "br" || element.localName === "cr")
            text += "\n";
        }
        push(text, bold, italic);
        continue;
      }

      // Containers that wrap runs (hyperlinks, smart tags, tracked changes…)
      if (
        name === "hyperlink" ||
        name === "smartTag" ||
        name === "ins" ||
        name === "sdt" ||
        name === "sdtContent"
      ) {
        visit(child);
      }
    }
  };

  visit(node);
  return runs;
}

/** All-caps, multi-word paragraphs are legal disclaimers — render them as notices. */
function isLegalText(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 8) return false;
  const upper = text.replace(/[^A-Z]/g, "").length;
  const ratio = upper / letters.length;
  const words = text.trim().split(/\s+/).length;
  return ratio > 0.9 && words >= 6;
}

/** A short, fully-bold paragraph is an inline section label (e.g. "Section 1.1."). */
function isSectionLabel(runs: Run[], text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 140) return false;
  return runs.length > 0 && runs.every((run) => run.bold || !run.text.trim());
}

function parseDocxDocument(xml: string): DocumentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagNameNS(WORD_NS, "body")[0];
  if (!body) return [];

  const blocks: DocumentBlock[] = [];

  for (const child of Array.from(body.children)) {
    if (child.localName === "p") {
      const runs = extractRuns(child);
      const text = runs.map((run) => run.text).join("");
      if (!text.trim()) continue;

      const pStyle = child.getElementsByTagNameNS(WORD_NS, "pStyle")[0];
      const styleId = pStyle ? getWordAttr(pStyle, "val") : "";
      const headingMatch = /^Heading([1-3])/i.exec(styleId);
      const isTitle = /^(Title|Subtitle)/i.test(styleId);

      if (headingMatch || isTitle) {
        const level = (headingMatch ? Number(headingMatch[1]) : 1) as 1 | 2 | 3;
        blocks.push({ type: "heading", level, text: text.trim() });
      } else if (isLegalText(text)) {
        blocks.push({ type: "legal", text: text.trim() });
      } else if (isSectionLabel(runs, text)) {
        blocks.push({ type: "subheading", text: text.trim() });
      } else {
        blocks.push({ type: "paragraph", runs });
      }
      continue;
    }

    if (child.localName === "tbl") {
      const rows = Array.from(child.children)
        .filter((row) => row.localName === "tr")
        .map((row) =>
          Array.from(row.children)
            .filter((cell) => cell.localName === "tc")
            .map((cell) =>
              Array.from(cell.children)
                .filter((cellChild) => cellChild.localName === "p")
                .map((paragraph) =>
                  extractRuns(paragraph)
                    .map((run) => run.text)
                    .join("")
                    .trim()
                )
                .filter(Boolean)
                .join("\n")
            )
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
        if (!response.ok)
          throw new Error(`Failed to load document: ${response.status}`);

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

/* ───────────────────────── Presentation ───────────────────────── */

function renderRuns(runs: Run[]): ReactNode {
  return runs.map((run, index) => {
    if (run.bold) {
      return (
        <strong
          key={index}
          className={`font-semibold text-[#1D1D1F]/90 ${run.italic ? "italic" : ""}`}
        >
          {run.text}
        </strong>
      );
    }
    if (run.italic) {
      return (
        <em key={index} className="italic">
          {run.text}
        </em>
      );
    }
    return <span key={index}>{run.text}</span>;
  });
}

function renderBlock(block: DocumentBlock, index: number, isFirst: boolean): ReactNode {
  const key = `${block.type}-${index}`;

  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h2
            key={key}
            className={`${isFirst ? "" : "mt-11 border-t border-[#1D1D1F]/[0.08] pt-7"} text-[21px] font-semibold leading-[1.14] tracking-[-0.024em] text-[#1D1D1F] sm:text-[24px]`}
          >
            {block.text}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3
            key={key}
            className={`${isFirst ? "" : "mt-7"} text-[17.5px] font-semibold leading-[1.22] tracking-[-0.018em] text-[#1D1D1F]`}
          >
            {block.text}
          </h3>
        );
      }
      return (
        <h4
          key={key}
          className={`${isFirst ? "" : "mt-6"} text-[12.5px] font-semibold uppercase tracking-[1.4px] text-[#1D1D1F]/55`}
        >
          {block.text}
        </h4>
      );
    }

    case "subheading":
      return (
        <p
          key={key}
          className={`${isFirst ? "" : "mt-5"} whitespace-pre-wrap text-[15px] font-semibold leading-[1.4] text-[#1D1D1F]`}
        >
          {block.text}
        </p>
      );

    case "legal":
      return (
        <p
          key={key}
          className={`${isFirst ? "" : "mt-4"} rounded-[12px] bg-[#F5F5F7] px-4 py-3 text-[11.5px] leading-[1.55] tracking-[0.01em] text-[#1D1D1F]/55 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]`}
        >
          {block.text}
        </p>
      );

    case "table":
      return (
        <div
          key={key}
          className={`${isFirst ? "" : "mt-5"} overflow-hidden rounded-[14px] shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.10)]`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {block.rows[0].map((cell, cellIndex) => (
                    <th
                      key={`h-${cellIndex}`}
                      className="whitespace-pre-wrap bg-[#1D1D1F] px-4 py-2.5 text-left align-top text-[11px] font-semibold uppercase tracking-[0.6px] text-white"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D1F]/[0.08]">
                {block.rows.slice(1).map((row, rowIndex) => (
                  <tr
                    key={`r-${rowIndex}`}
                    className={rowIndex % 2 === 1 ? "bg-[#F5F5F7]" : "bg-white"}
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`c-${rowIndex}-${cellIndex}`}
                        className="whitespace-pre-wrap px-4 py-2.5 align-top font-light leading-[1.5] text-[#1D1D1F]/72"
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

    case "paragraph":
    default:
      return (
        <p
          key={key}
          className={`${isFirst ? "" : "mt-4"} whitespace-pre-wrap text-[15px] font-light leading-[1.72] text-[#1D1D1F]/72`}
        >
          {renderRuns(block.runs)}
        </p>
      );
  }
}

function StepIndex({ current }: { current: number }) {
  return (
    <nav aria-label="Fund document steps" className="mb-6">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[1.6px] text-[#0066CC]/85">
        Fund Documents · Step {current} of {TOTAL_STEPS}
      </p>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DOC_SEQUENCE.map((doc) => {
          const isCurrent = doc.step === current;
          return (
            <li key={doc.slug}>
              <Link
                to={`/community/${doc.slug}`}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex h-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 transition ${
                  isCurrent
                    ? "bg-[#0066CC] shadow-[0_8px_20px_rgba(0,102,204,0.22)]"
                    : "bg-[#F5F5F7] hover:bg-[#ECECEF]"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums ${
                    isCurrent
                      ? "bg-white/20 text-white"
                      : "bg-white text-[#1D1D1F]/70 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.12)]"
                  }`}
                >
                  {doc.step}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[9.5px] font-semibold uppercase tracking-[0.8px] ${
                      isCurrent ? "text-white/70" : "text-[#1D1D1F]/40"
                    }`}
                  >
                    Step {doc.step}
                  </span>
                  <span
                    className={`block truncate text-[12.5px] font-medium leading-tight ${
                      isCurrent ? "text-white" : "text-[#1D1D1F]/75"
                    }`}
                  >
                    {doc.title}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function DocumentCover({ document }: { document: FundDocument }) {
  return (
    <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_0.5px_rgba(29,29,31,0.08),0_18px_44px_rgba(29,29,31,0.06)]">
      <div className="flex items-center gap-2 bg-[#0A0A0E] px-5 py-2.5">
        {Icon.lock("#F5F5F7", 13)}
        <span className="text-[10.5px] font-semibold uppercase tracking-[1.6px] text-[#F5F5F7]/80">
          Confidential · {document.docType}
        </span>
      </div>

      <div className="px-6 py-9 text-center sm:px-10 sm:py-11">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#0066CC]/85">
          {document.eyebrow}
        </p>
        <h2 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1D1D1F] sm:text-[32px]">
          {document.fundName}
        </h2>
        <p className="mt-2 text-[13.5px] font-light italic text-[#1D1D1F]/55">
          {document.structure}
        </p>
        <p className="mx-auto mt-4 max-w-[440px] text-[14px] font-light leading-[1.5] text-[#1D1D1F]/65">
          {document.tagline}
        </p>

        <dl className="mx-auto mt-7 grid max-w-[560px] gap-px overflow-hidden rounded-[14px] bg-[#1D1D1F]/[0.08] text-left shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)] sm:grid-cols-2">
          {document.meta.map((meta) => (
            <div key={meta.label} className="bg-white px-4 py-3">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1D1D1F]/45">
                {meta.label}
              </dt>
              <dd className="mt-1 text-[13.5px] font-normal leading-[1.4] text-[#1D1D1F]/80">
                {meta.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function StepNav({ current }: { current: number }) {
  const prev = DOC_SEQUENCE.find((doc) => doc.step === current - 1);
  const next = DOC_SEQUENCE.find((doc) => doc.step === current + 1);

  if (!prev && !next) return null;

  return (
    <nav className="mt-8 grid gap-2 sm:grid-cols-2" aria-label="Document navigation">
      {prev ? (
        <Link
          to={`/community/${prev.slug}`}
          className="flex items-center gap-3 rounded-[14px] bg-[#F5F5F7] px-4 py-3 transition hover:bg-[#ECECEF]"
        >
          <span className="rotate-180">{Icon.chevronRight(SYS.blue, 14)}</span>
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[1px] text-[#1D1D1F]/40">
              Previous · Step {prev.step}
            </span>
            <span className="block truncate text-[14px] font-medium text-[#1D1D1F]">
              {prev.title}
            </span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? (
        <Link
          to={`/community/${next.slug}`}
          className="flex items-center justify-end gap-3 rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-right transition hover:bg-[#ECECEF]"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[1px] text-[#1D1D1F]/40">
              Next · Step {next.step}
            </span>
            <span className="block truncate text-[14px] font-medium text-[#1D1D1F]">
              {next.title}
            </span>
          </span>
          {Icon.chevronRight(SYS.blue, 14)}
        </Link>
      ) : null}
    </nav>
  );
}

function DocumentFooter() {
  return (
    <footer className="mt-10 rounded-[18px] bg-[#F5F5F7] px-5 py-6 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
      <div className="flex items-center gap-2.5">
        <HushhMark size={26} />
        <div>
          <p className="text-[13px] font-semibold text-[#1D1D1F]">Hushh Technologies</p>
          <a
            href={FUND.websiteUrl}
            className="text-[12px] text-[#0066CC]"
            target="_blank"
            rel="noreferrer"
          >
            {FUND.website}
          </a>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-[12px] sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.6px] text-[#1D1D1F]/45">
            General Partner
          </dt>
          <dd className="mt-0.5 text-[#1D1D1F]/70">
            {FUND.gp} · {FUND.gpJurisdiction}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.6px] text-[#1D1D1F]/45">
            Investor Relations
          </dt>
          <dd className="mt-0.5 text-[#1D1D1F]/70">
            <a href={`mailto:${FUND.email}`} className="text-[#0066CC]">
              {FUND.email}
            </a>{" "}
            · {FUND.phone}
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-[#1D1D1F]/[0.08] pt-3 text-[11px] leading-[1.5] text-[#1D1D1F]/45">
        Confidential investor material. Availability here does not constitute an
        offer to sell or a solicitation of an offer to buy any securities.
        Interests are offered solely to qualified purchasers pursuant to the
        definitive offering documents. © 2026 Hushh Technologies. All rights
        reserved.
      </p>
    </footer>
  );
}

function FundADocumentPost({ document }: { document: FundDocument }) {
  const { blocks, isLoading, error } = useDocxBlocks(document.src);

  // Cover = everything before the first Heading 1 (consistent across all four
  // docs). We re-present the cover with our own branded title page, surface the
  // verbatim legal disclaimers as notices, and skip the empty "Table of
  // Contents" field heading — the Step 1-4 nav replaces it.
  const firstHeadingIndex = blocks.findIndex(
    (block) => block.type === "heading" && block.level === 1
  );
  const coverEnd = firstHeadingIndex > 0 ? firstHeadingIndex : 0;

  const legalNotices = blocks
    .slice(0, coverEnd)
    .filter((block): block is Extract<DocumentBlock, { type: "legal" }> =>
      block.type === "legal"
    )
    .map((block) => block.text);

  const isSkippable = (block: DocumentBlock) =>
    block.type === "heading" &&
    block.text.trim().toUpperCase() === "TABLE OF CONTENTS";

  const firstBodyIndex = blocks.findIndex(
    (block, index) => index >= coverEnd && !isSkippable(block)
  );

  return (
    <article
      className="mx-auto w-full max-w-[860px] text-[#1D1D1F]"
      style={{ fontFamily: appleFont }}
    >
      <StepIndex current={document.step} />
      <DocumentCover document={document} />

      {isLoading ? (
        <div
          className="mt-6 flex min-h-[240px] items-center justify-center rounded-[18px] bg-[#F5F5F7]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <SmallSpinner label="Loading document…" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-[14px] font-light leading-[1.45] text-[#1D1D1F]/68 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
          {error}
        </div>
      ) : (
        <>
          {legalNotices.length > 0 ? (
            <section className="mt-6 space-y-2" aria-label="Legal notices">
              {legalNotices.map((text, index) => (
                <p
                  key={`notice-${index}`}
                  className="rounded-[12px] bg-[#F5F5F7] px-4 py-3 text-[11.5px] leading-[1.55] tracking-[0.01em] text-[#1D1D1F]/55 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]"
                >
                  {text}
                </p>
              ))}
            </section>
          ) : null}

          <section className="mt-7 overflow-hidden rounded-[18px] bg-white px-5 py-7 shadow-[0_0_0_0.5px_rgba(29,29,31,0.08),0_18px_44px_rgba(29,29,31,0.05)] sm:px-8 sm:py-9">
            {blocks.map((block, index) => {
              if (index < coverEnd) return null;
              if (isSkippable(block)) return null;
              return renderBlock(block, index, index === firstBodyIndex);
            })}
          </section>
        </>
      )}

      <StepNav current={document.step} />
      <DocumentFooter />
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
