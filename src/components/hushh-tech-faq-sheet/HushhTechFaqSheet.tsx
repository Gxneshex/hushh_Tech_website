/**
 * HushhTechFaqSheet — Bottom sheet with accordion FAQs.
 * Follows the unified Hushh Tech Apple-style design language.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useModalKeyboardNavigation } from "../../hooks/useModalKeyboardNavigation";
import { Icon, appleFont } from "../hushh-tech-ui/HushhAppleUI";

/* ── FAQ Data ── */
interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    title: "Onboarding",
    items: [
      {
        q: "What information do I need?",
        a: "You will need your legal name, date of birth, residence details, tax information, contact number, and the investment amount you want reviewed.",
      },
      {
        q: "How long does onboarding take?",
        a: "Most investors can complete the flow in a few minutes. Additional review may be required after you submit your application.",
      },
      {
        q: "Can I skip steps and come back later?",
        a: "Yes. You can leave and return, but all required details must be complete before investor review can finish.",
      },
    ],
  },
  {
    title: "Investor Review",
    items: [
      {
        q: "What is the minimum investment?",
        a: "The minimum investment is $1 million. Final eligibility and allocation are reviewed during onboarding.",
      },
      {
        q: "Can I review before submitting?",
        a: "Yes. The review step shows your key responses so you can go back and correct anything before submission.",
      },
    ],
  },
  {
    title: "Verification",
    items: [
      {
        q: "Why do you ask for identity details?",
        a: "Identity and tax details help us complete KYC, eligibility, and compliance checks before accepting any investment.",
      },
      {
        q: "Why connect a bank account?",
        a: "Bank connection helps verify account, balance, identity, and investment data for review. You authorize this before Plaid opens.",
      },
      {
        q: "Is my data protected?",
        a: "Sensitive data is encrypted and used for verification, review, compliance, and account support.",
      },
    ],
  },
];

const getFaqItemKey = (categoryTitle: string, itemIndex: number) =>
  `${categoryTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${itemIndex}`;

/* ── Props ── */
interface HushhTechFaqSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Component ── */
const HushhTechFaqSheet: React.FC<HushhTechFaqSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Animate in/out */
  useEffect(() => {
    if (isOpen) {
      // Small delay so CSS transition fires after mount
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleToggle = useCallback((key: string) => {
    setExpandedIdx((prev) => (prev === key ? null : key));
  }, []);

  const handleBackdropClick = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useModalKeyboardNavigation({
    isOpen,
    containerRef: sheetRef,
    initialFocusRef: closeButtonRef,
    onClose: handleBackdropClick,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hushh-tech-faq-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        aria-labelledby="hushh-tech-faq-title"
        tabIndex={-1}
        style={{ fontFamily: appleFont }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-gray-100">
          <h2
            id="hushh-tech-faq-title"
            className="text-[24px] font-semibold leading-[1.05] tracking-[-0.035em] text-[#1D1D1F]"
          >
            FAQ
          </h2>
          <button
            ref={closeButtonRef}
            onClick={handleBackdropClick}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Close FAQ"
          >
            {Icon.close("#6E6E73", 14)}
          </button>
        </div>

        {/* Scrollable FAQ content */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-thin">
          {FAQ_DATA.map((category) => (
            <section key={category.title} className="mt-6">
              {/* Category header */}
              <h3 className="text-[10px] tracking-[0.18em] text-[#0066CC]/75 uppercase mb-3 font-semibold">
                {category.title}
              </h3>

              <div className="overflow-hidden rounded-[20px] border border-[#1D1D1F]/[0.08] bg-[#F5F5F7] divide-y divide-[#1D1D1F]/[0.08]">
                {category.items.map((item, idx) => {
                  const key = getFaqItemKey(category.title, idx);
                  const isExpanded = expandedIdx === key;

                  return (
                    <div key={key}>
                      {/* Question row */}
                      <button
                        id={`faq-btn-${key}`}
                        onClick={() => handleToggle(key)}
                        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hushh-blue"
                        aria-expanded={isExpanded}
                        aria-controls={`faq-panel-${key}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
                          {Icon.help("#6E6E73", 17)}
                        </div>
                        <span className="flex-1 text-[14px] font-medium text-[#1D1D1F]">
                          {item.q}
                        </span>
                        <span
                          className={`material-symbols-outlined text-gray-400 text-lg transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          style={{ fontVariationSettings: "'wght' 300" }}
                        >
                          expand_more
                        </span>
                      </button>

                      {/* Answer — animated */}
                      <div
                        id={`faq-panel-${key}`}
                        role="region"
                        aria-labelledby={`faq-btn-${key}`}
                        aria-hidden={!isExpanded}
                        className={`overflow-hidden transition-all duration-200 ease-out ${
                          isExpanded ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="px-4 pb-4 pl-[60px] text-[13px] text-[#1D1D1F]/60 font-light leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Help footer */}
          <div className="mt-8 mb-4 flex flex-col items-center text-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-hushh-blue text-sm"
                style={{ fontVariationSettings: "'wght' 400" }}
              >
                support_agent
              </span>
              <span className="text-[11px] text-[#1D1D1F]/55">
                Need more help?
              </span>
            </div>
            <a
              href="mailto:support@hushh.ai"
              className="text-xs font-semibold text-hushh-blue hover:underline"
            >
              support@hushh.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HushhTechFaqSheet;
