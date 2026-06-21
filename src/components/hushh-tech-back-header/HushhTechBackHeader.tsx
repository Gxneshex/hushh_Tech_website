import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import HushhTechFaqSheet from "../hushh-tech-faq-sheet/HushhTechFaqSheet";
import HushhTechNavDrawer from "../hushh-tech-nav-drawer/HushhTechNavDrawer";
import HushhTechTicker from "../hushh-tech-ticker/HushhTechTicker";
import { GlassPill, HushhMark, Icon, appleFont } from "../hushh-tech-ui/HushhAppleUI";

interface HushhTechBackHeaderProps {
  onBackClick?: () => void;
  rightType?: "label" | "hamburger";
  rightLabel?: string;
  onRightClick?: () => void;
  showRightButton?: boolean;
  showTicker?: boolean;
  className?: string;
}

const DESKTOP_NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Fund A", path: "/discover-fund-a" },
  { label: "Community", path: "/community" },
  { label: "Profile", path: "/profile" },
] as const;

const HushhTechBackHeader: React.FC<HushhTechBackHeaderProps> = ({
  onBackClick,
  rightType = "label",
  rightLabel = "FAQ",
  onRightClick,
  showRightButton = true,
  showTicker = false,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const isOnboarding = location.pathname.startsWith("/onboarding");

  const handleRightClick = () => {
    if (onRightClick) {
      onRightClick();
      return;
    }

    if (!["faq", "faqs"].includes(rightLabel?.toLowerCase() ?? "")) return;

    if (location.pathname.startsWith("/onboarding")) {
      setIsFaqOpen(true);
      return;
    }

    if (location.pathname !== "/faq") {
      navigate("/faq");
    }
  };

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
  const headerClassName = `fixed left-0 right-0 top-0 z-50 border-b border-[#1D1D1F]/[0.06] bg-white/88 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl ${className}`;

  const desktopNav = (
    <nav
      aria-label="Primary"
      className="hidden items-center gap-7 md:flex"
      style={{
        fontFamily: appleFont,
      }}
    >
      {DESKTOP_NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          type="button"
          onClick={() => navigate(item.path)}
          className="text-[14px] font-semibold tracking-[-0.01em] text-[#1D1D1F]/76 transition hover:text-[#0071E3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
        >
          {item.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="rounded-full bg-[#0071E3] px-5 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_22px_rgba(0,113,227,0.22)] transition hover:bg-[#0077ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
      >
        Start investing
      </button>
    </nav>
  );

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
        <div className="relative mx-auto flex w-full max-w-[1240px] items-center justify-between px-3 pb-3 pt-[max(env(safe-area-inset-top),0.85rem)] sm:px-5 md:h-[74px] md:px-8 md:py-0">
          <div className="relative flex min-w-0 items-center md:hidden">
            <GlassPill className="relative min-w-0 shrink">
              <div className="flex min-w-0 items-center">
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="flex h-[42px] w-[42px] items-center justify-center text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                  aria-label="Go back"
                >
                  {Icon.back("currentColor", 18)}
                </button>
                <span aria-hidden className="h-6 w-px bg-[#1D1D1F]/10" />
                {brandButton}
              </div>
            </GlassPill>
          </div>

          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <button
              type="button"
              onClick={handleBackClick}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#1D1D1F]/78 transition hover:bg-[#1D1D1F]/[0.06] hover:text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
              aria-label="Go back"
            >
              {Icon.back("currentColor", 18)}
            </button>
            <span aria-hidden className="h-7 w-px bg-[#1D1D1F]/10" />
            {brandButton}
          </div>

          {showRightButton && rightType === "hamburger" ? (
            <div className="flex items-center gap-1.5 md:hidden">
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
            <GlassPill className={isOnboarding ? "relative" : "relative md:hidden"}>
              <button
                type="button"
                onClick={handleRightClick}
                className="flex h-[42px] items-center justify-center px-5 text-[12px] font-medium tracking-[0.08em] text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                aria-label={rightLabel}
                style={{ fontFamily: appleFont }}
              >
                {rightLabel}
              </button>
            </GlassPill>
          ) : null}

          {!isOnboarding ? desktopNav : null}
        </div>

        {showTicker ? <HushhTechTicker /> : null}
      </header>

      <div className={showTicker ? "h-[146px] md:h-[148px]" : "h-[72px] md:h-[74px]"} />

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
