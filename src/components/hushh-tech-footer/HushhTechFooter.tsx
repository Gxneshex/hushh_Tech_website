import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SYS, TabIcon, appleFont } from "../hushh-tech-ui/HushhAppleUI";

export enum HushhFooterTab {
  HOME = "home",
  FUND_A = "fund_a",
  COMMUNITY = "community",
  PROFILE = "profile",
}

interface HushhTechFooterProps {
  activeTab?: HushhFooterTab;
  onTabChange?: (tab: HushhFooterTab) => void;
  className?: string;
}

type FooterTabConfig = {
  id: HushhFooterTab;
  label: string;
  path: string;
  icon: (filled: boolean, color: string) => React.ReactNode;
};

const HushhTechFooter: React.FC<HushhTechFooterProps> = ({
  activeTab,
  onTabChange,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs: FooterTabConfig[] = [
    {
      id: HushhFooterTab.HOME,
      label: "Home",
      path: "/",
      icon: TabIcon.home,
    },
    {
      id: HushhFooterTab.FUND_A,
      label: "Fund A",
      path: "/discover-fund-a",
      icon: TabIcon.fund,
    },
    {
      id: HushhFooterTab.COMMUNITY,
      label: "Comm",
      path: "/community",
      icon: TabIcon.community,
    },
    {
      id: HushhFooterTab.PROFILE,
      label: "Profile",
      path: "/profile",
      icon: TabIcon.account,
    },
  ];

  const resolvedActiveTab =
    activeTab ??
    (location.pathname.toLowerCase().startsWith("/profile")
      ? HushhFooterTab.PROFILE
      : undefined);

  const handleTabClick = (tab: FooterTabConfig) => {
    if (onTabChange) {
      onTabChange(tab.id);
      return;
    }

    navigate(tab.path);
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] pt-4 sm:px-5 ${className}`}
      >
        <div
          className="pointer-events-auto relative mx-auto w-full max-w-[26rem] overflow-hidden rounded-full"
          style={{
            boxShadow:
              "0 18px 36px rgba(29,29,31,0.16), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(29,29,31,0.04)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              backdropFilter: "blur(28px) saturate(180%)",
              background: "rgba(255,255,255,0.58)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full border border-[#1D1D1F]/[0.06]"
            style={{
              boxShadow:
                "inset 1.5px 1.5px 1px rgba(255,255,255,0.85), inset -1px -1px 1px rgba(255,255,255,0.4)",
            }}
          />

          <nav
            aria-label="Primary"
            className="relative z-[1] flex items-center justify-around gap-1 p-1.5"
          >
            {tabs.map((tab) => {
              const isActive = resolvedActiveTab === tab.id;
              const color = isActive ? SYS.blue : "rgba(29,29,31,0.55)";

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive ? (
                    <span
                      className="absolute inset-x-1.5 inset-y-0.5 rounded-full"
                      style={{
                        background: "rgba(255,255,255,0.68)",
                        boxShadow:
                          "inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(29,29,31,0.06), 0 1px 2px rgba(29,29,31,0.05)",
                      }}
                    />
                  ) : null}
                  <span className="relative z-[1]">{tab.icon(isActive, color)}</span>
                  <span
                    className={`relative z-[1] text-[10px] tracking-[-0.01em] ${isActive ? "font-semibold" : "font-medium"}`}
                    style={{ color, fontFamily: appleFont }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default HushhTechFooter;
