import React from "react";
import { Icon, appleFont } from "../../../components/hushh-tech-ui/HushhAppleUI";

const documents = [
  {
    label: "Investor Overview",
    title: "Investment Prospectus",
    href: "/fund-documents/investment-prospectus.docx",
    detail:
      "Fund thesis, investment objective, Alpha Bets 27 portfolio design, and AI-first share accumulation strategy.",
  },
  {
    label: "Offering Terms",
    title: "Private Placement Memorandum",
    href: "/fund-documents/ppm.docx",
    detail:
      "Offering summary, eligibility, class structure, risk factors, disclosures, and subscription context.",
  },
  {
    label: "Master Fund",
    title: "LP Master LPA",
    href: "/fund-documents/lp-master-lpa.docx",
    detail:
      "Cayman master fund governance, partner rights, capital accounts, allocations, valuation, and withdrawal mechanics.",
  },
  {
    label: "US Feeder",
    title: "Delaware Feeder LPA",
    href: "/fund-documents/delaware-feeder-lpa.docx",
    detail:
      "Domestic feeder formation, tax treatment, admission requirements, and relationship to the master fund.",
  },
] as const;

const getDocumentReaderHref = (document: (typeof documents)[number]) => {
  const params = new URLSearchParams({
    src: document.href,
    title: document.title,
  });

  return `/document-viewer?${params.toString()}`;
};

const FundAOfferingDocuments = () => {
  return (
    <article
      className="mx-auto max-w-[920px] px-1 pb-12 text-[#1D1D1F]"
      style={{ fontFamily: appleFont }}
    >
      <div className="mb-5 rounded-[22px] border border-[#1D1D1F]/[0.08] bg-[#F5F5F7] p-5 sm:p-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#0066CC]">
          Fund Documents
        </p>
        <h2 className="m-0 max-w-[680px] text-[28px] font-semibold leading-[1.05] tracking-[-0.028em] sm:text-[36px]">
          Hushh Alpha Aloha Fund A offering document set.
        </h2>
        <p className="mt-3 max-w-[760px] text-[15px] leading-[1.55] text-[#1D1D1F]/62 sm:text-[16px]">
          Prospectus, private placement memorandum, master fund agreement, and
          Delaware feeder agreement organized for investor review.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {documents.map((document) => (
          <section
            key={document.href}
            className="rounded-[20px] border border-[#1D1D1F]/[0.08] bg-white p-5 shadow-[0_14px_34px_rgba(29,29,31,0.06)]"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#0066CC]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.1px] text-[#0066CC]">
                {document.label}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#F5F5F7] text-[#1D1D1F]">
                {Icon.lock("#1D1D1F", 17)}
              </span>
            </div>
            <h3 className="m-0 text-[20px] font-semibold leading-[1.12] tracking-[-0.02em]">
              {document.title}
            </h3>
            <p className="mt-2 min-h-[72px] text-[14px] leading-[1.45] text-[#1D1D1F]/62">
              {document.detail}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={getDocumentReaderHref(document)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#1D1D1F] px-4 text-[14px] font-medium text-white transition hover:opacity-90"
              >
                Open document
              </a>
              <a
                href={document.href}
                download
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#F5F5F7] px-4 text-[14px] font-medium text-[#0066CC] transition hover:bg-[#E8E8ED]"
              >
                Download {Icon.arrowRight("#0066CC", 13)}
              </a>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-5 rounded-[16px] bg-[#0066CC]/[0.08] px-4 py-3 text-[12px] leading-[1.5] text-[#1D1D1F]/62">
        Confidential investor materials. Availability here does not constitute
        an offer or solicitation. Review eligibility, risk disclosures, and final
        subscription materials before committing capital.
      </p>
    </article>
  );
};

export default FundAOfferingDocuments;
