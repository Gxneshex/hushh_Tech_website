import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import HushhTechFooter from "../hushh-tech-footer/HushhTechFooter";
import HushhTechHeader from "../hushh-tech-header/HushhTechHeader";
import {
  Display,
  Eyebrow,
  Icon,
  Lede,
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
  lede,
  updated,
  sections,
  primaryAction,
  secondaryAction,
  children,
}: HushhTechLegalPageProps) {
  return (
    <div
      className="min-h-screen bg-white text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-white"
      style={{ fontFamily: appleFont }}
    >
      <HushhTechHeader showSearch={false} />

      <main
        id="main-content"
        className="px-5 pb-20 pt-12 sm:px-6 sm:pt-16"
      >
        {/* Light hero */}
        <section className="mx-auto max-w-[760px] text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[680px]">
            {title}
          </Display>
          {lede ? <Lede>{lede}</Lede> : null}
          {updated ? (
            <p className="mt-4 text-[13px] font-medium tracking-[-0.005em] text-[#1D1D1F]/45">
              {updated}
            </p>
          ) : null}

          {primaryAction || secondaryAction ? (
            <div className="mx-auto mt-8 flex max-w-[360px] flex-wrap justify-center gap-3 sm:max-w-none">
              {primaryAction ? (
                <ActionLink action={primaryAction} variant="primary" />
              ) : null}
              {secondaryAction ? (
                <ActionLink action={secondaryAction} variant="secondary" />
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Optional custom content (e.g. FAQ blocks) */}
        {children ? (
          <div className="mx-auto mt-14 max-w-[760px]">{children}</div>
        ) : null}

        {/* Legal body — clean, readable, centered single column on a light background */}
        <div className="mx-auto mt-14 max-w-[760px]">
          {sections.map((section, sectionIndex) => (
            <section
              key={`${section.title}-${sectionIndex}`}
              className={
                sectionIndex === 0
                  ? ""
                  : "mt-10 border-t border-[#1D1D1F]/[0.08] pt-10"
              }
            >
              {section.eyebrow ? (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#0066CC]/80">
                  {section.eyebrow}
                </p>
              ) : null}
              <h2
                className="text-[22px] font-semibold leading-[1.18] tracking-[-0.02em] text-[#1D1D1F] md:text-[26px]"
                style={{ fontFamily: appleDisplayFont }}
              >
                {section.title}
              </h2>

              {section.body?.length ? (
                <div className="mt-4 space-y-4 text-[16px] leading-[1.7] tracking-normal text-[#1D1D1F]/72 md:text-[17px]">
                  {section.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : null}

              {section.bullets?.length ? (
                <ul className="mt-5 space-y-3 text-[16px] leading-[1.6] text-[#1D1D1F]/72 md:text-[17px]">
                  {section.bullets.map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0066CC]/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </main>

      <HushhTechFooter />
    </div>
  );
}
