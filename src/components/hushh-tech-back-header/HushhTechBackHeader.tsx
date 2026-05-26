import React, { useState } from "react";

import HushhTechFaqSheet from "../hushh-tech-faq-sheet/HushhTechFaqSheet";
import HushhTechNavDrawer from "../hushh-tech-nav-drawer/HushhTechNavDrawer";
import { GlassPill, HushhMark, Icon, appleFont } from "../hushh-tech-ui/HushhAppleUI";

interface HushhTechBackHeaderProps {
  onBackClick?: () => void;
  rightType?: "label" | "hamburger";
  rightLabel?: string;
  onRightClick?: () => void;
  showRightButton?: boolean;
  className?: string;
}

const HushhTechBackHeader: React.FC<HushhTechBackHeaderProps> = ({
  onBackClick,
  rightType = "label",
  rightLabel = "FAQs",
  onRightClick,
  showRightButton = true,
  className = "",
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const handleRightClick =
    onRightClick ??
    (rightLabel?.toLowerCase() === "faqs" ? () => setIsFaqOpen(true) : undefined);

  return (
    <>
      <header
        className={`sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-3 sm:px-5 ${className} relative`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/75 via-white/45 to-white/10 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_72%,transparent)]" />
        <GlassPill className="relative">
          <button
            type="button"
            onClick={onBackClick}
            className="flex h-[42px] items-center gap-2 py-1 pl-2 pr-3 text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
            aria-label="Go back"
          >
            {Icon.back("currentColor", 18)}
            <HushhMark size={34} />
            <span
              className="hidden text-[14px] font-normal tracking-normal sm:inline"
              style={{ fontFamily: appleFont }}
            >
              hushh
            </span>
          </button>
        </GlassPill>

        {showRightButton && rightType === "hamburger" ? (
          <div className="flex items-center gap-1.5">
            <GlassPill className="relative">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex h-[38px] w-[38px] items-center justify-center text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                aria-label="Open site search"
              >
                {Icon.search("currentColor", 18)}
              </button>
            </GlassPill>
            <GlassPill className="relative">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex h-[38px] w-[38px] items-center justify-center text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                aria-label="Open menu"
              >
                {Icon.menu("currentColor", 18)}
              </button>
            </GlassPill>
          </div>
        ) : null}

        {showRightButton && rightType === "label" ? (
          <GlassPill className="relative">
            <button
              type="button"
              onClick={handleRightClick}
              className="flex h-[38px] items-center justify-center px-5 text-[12px] font-normal uppercase tracking-[0.08em] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
              aria-label={rightLabel}
              style={{ fontFamily: appleFont }}
            >
              {rightLabel}
            </button>
          </GlassPill>
        ) : null}
      </header>

      {rightType === "hamburger" ? (
        <HushhTechNavDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      ) : null}

      <HushhTechFaqSheet
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
      />
    </>
  );
};

export default HushhTechBackHeader;
