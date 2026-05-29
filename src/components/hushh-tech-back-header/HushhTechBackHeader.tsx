import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const useHomeBrandLayout = rightType === "hamburger";

  const handleRightClick =
    onRightClick ??
    (rightLabel?.toLowerCase() === "faqs" ? () => setIsFaqOpen(true) : undefined);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const handleBrandClick = () => navigate("/");
  const headerClassName = useHomeBrandLayout
    ? `fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between px-3 pb-3 pt-[max(env(safe-area-inset-top),0.85rem)] sm:px-5 ${className}`
    : `sticky top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-3 sm:px-5 ${className} relative`;

  const brandButton = (
    <button
      type="button"
      onClick={handleBrandClick}
      className="flex h-11 items-center gap-2 py-1 pl-1 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
      aria-label="Go to Hushh Technologies home"
    >
      <HushhMark size={36} />
      <span className="flex flex-col leading-none">
        <span
          className="text-[16px] font-semibold tracking-[-0.015em] text-[#1D1D1F]"
          style={{ fontFamily: appleFont }}
        >
          hushh
        </span>
        <span
          className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[#1D1D1F]/55"
          style={{ fontFamily: appleFont }}
        >
          Technologies
        </span>
      </span>
    </button>
  );

  return (
    <>
      <header
        className={headerClassName}
        data-hushh-back-header
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-white/75 via-white/45 to-white/10 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_72%,transparent)]" />

        {useHomeBrandLayout ? (
          <div className="relative flex min-w-0 items-center gap-2">
            <GlassPill className="relative shrink-0">
              <button
                type="button"
                onClick={handleBackClick}
                className="flex h-[42px] w-[42px] items-center justify-center text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                aria-label="Go back"
              >
                {Icon.back("currentColor", 18)}
              </button>
            </GlassPill>
            <GlassPill className="relative min-w-0 shrink">
              {brandButton}
            </GlassPill>
          </div>
        ) : (
          <GlassPill className="relative">
            <button
              type="button"
              onClick={handleBackClick}
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
        )}

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

      {useHomeBrandLayout ? <div className="h-[72px]" /> : null}

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
