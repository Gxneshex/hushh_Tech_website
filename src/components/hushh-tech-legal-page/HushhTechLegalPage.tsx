import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import HushhTechBackHeader from "../hushh-tech-back-header/HushhTechBackHeader";
import {
  Icon,
  SYS,
  appleDisplayFont,
  appleFont,
} from "../hushh-tech-ui/HushhAppleUI";

export interface LegalSection {
  title: string;
  eyebrow?: string;
  body?: ReactNode[];
  bullets?: ReactNode[];
}

interface LegalAction {
  label: string;
  href: string;
}

interface HushhTechLegalPageProps {
  eyebrow: string;
  title: string;
  lede: string;
  updated?: string;
  sections: LegalSection[];
  primaryAction?: LegalAction;
  secondaryAction?: LegalAction;
  children?: ReactNode;
}

export const LegalInlineLink = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => (
  <Link
    to={to}
    className="font-medium text-[#0066CC] underline decoration-[#0066CC]/25 underline-offset-4 transition hover:decoration-[#0066CC]"
  >
    {children}
  </Link>
);

const ActionLink = ({
  action,
  variant,
}: {
  action: LegalAction;
  variant: "primary" | "secondary";
}) => {
  const className = [
      "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium tracking-[-0.01em] transition active:scale-[0.98] sm:w-auto",
      variant === "primary"
        ? "bg-[#1D1D1F] text-white"
        : "bg-white text-[#0066CC] shadow-[inset_0_0_0_1px_rgba(0,102,204,0.24)]",
    ].join(" ");
  const content = (
    <>
      {action.label}
      {Icon.chevronRight(variant === "primary" ? "#FFFFFF" : SYS.blue, 13)}
    </>
  );

  if (action.href.startsWith("mailto:") || action.href.startsWith("tel:")) {
    return (
      <a href={action.href} className={className} style={{ fontFamily: appleFont }}>
        {content}
      </a>
    );
  }

  return (
    <Link to={action.href} className={className} style={{ fontFamily: appleFont }}>
      {content}
    </Link>
  );
};

export default function HushhTechLegalPage({
  eyebrow,
  title,
  sections,
  primaryAction,
  secondaryAction,
  children,
}: HushhTechLegalPageProps) {
  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechBackHeader rightLabel="FAQs" />

      <main
        id="main-content"
        className="px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10 sm:px-6 sm:pb-24"
      >
        <section className="mx-auto max-w-[760px] text-center">
          <p className="mb-[18px] text-[13px] font-bold uppercase leading-tight tracking-[0.14em] text-[#0066CC]/85">
            {eyebrow}
          </p>
          <h1
            className="mx-auto max-w-[680px] text-[clamp(32px,4.6vw,54px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#1D1D1F]"
            style={{ fontFamily: appleDisplayFont, textWrap: "balance" }}
          >
            {title}
          </h1>

          {primaryAction || secondaryAction ? (
            <div className="mx-auto mt-7 flex max-w-[360px] flex-wrap justify-center gap-3 sm:max-w-none">
              {primaryAction ? (
                <ActionLink action={primaryAction} variant="primary" />
              ) : null}
              {secondaryAction ? (
                <ActionLink action={secondaryAction} variant="secondary" />
              ) : null}
            </div>
          ) : null}
        </section>

        {children ? <div className="mx-auto mt-10 max-w-[900px]">{children}</div> : null}

        <section className="mx-auto mt-10 grid max-w-[900px] gap-3">
          {sections.map((section, sectionIndex) => (
            <article
              key={`${section.title}-${sectionIndex}`}
              className="relative overflow-hidden rounded-[22px] border border-[#1D1D1F]/[0.06] bg-white/75 p-5 shadow-[0_18px_50px_rgba(29,29,31,0.06)] backdrop-blur-xl sm:rounded-[24px] sm:p-6 md:p-8"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[24px]"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.38) 100%)",
                }}
              />
              <div className="relative z-[1]">
                {section.eyebrow ? (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#0066CC]/75">
                    {section.eyebrow}
                  </p>
                ) : null}
                <h2
                  className="text-[24px] font-semibold leading-[1.12] tracking-[-0.022em] text-[#1D1D1F] md:text-[30px]"
                  style={{ fontFamily: appleDisplayFont }}
                >
                  {section.title}
                </h2>

                {section.body?.length ? (
                  <div className="mt-4 space-y-4 text-[15px] leading-[1.65] tracking-normal text-[#1D1D1F]/68 md:text-[16px]">
                    {section.body.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="mt-5 space-y-3 text-[15px] leading-[1.55] text-[#1D1D1F]/68 md:text-[16px]">
                    {section.bullets.map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0066CC]/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
