import React, { useEffect, useRef, useState } from "react";
import { useInRouterContext, useNavigate } from "react-router-dom";

import HushhTechNavDrawer from "../hushh-tech-nav-drawer/HushhTechNavDrawer";
import { useStockQuotes, StockQuote } from "../../hooks/useStockQuotes";
import { useConstantTickerMotion } from "../../hooks/useConstantTickerMotion";
import { SkipToContentLink } from "../ui/SkipToContentLink";
import { GlassPill, HushhMark, Icon, SYS, appleFont } from "../hushh-tech-ui/HushhAppleUI";

const logoTint = [
  "#EAF3FF",
  "#EEFBEF",
  "#FFF4E6",
  "#F4ECFF",
];

const TICKER_SCROLL_PIXELS_PER_SECOND = 60;

const BrandButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
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

const RoutedBrandButton = () => {
  const navigate = useNavigate();
  return <BrandButton onClick={() => navigate("/")} />;
};

const TickerChip = ({
  quote,
  isLoading,
  index,
}: {
  quote: StockQuote;
  isLoading?: boolean;
  index: number;
}) => {
  const tint = quote.isUp ? SYS.green : SYS.red;

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#FFFFFF] py-2 pl-2 pr-3"
      style={{
        boxShadow:
          "0 0 0 0.5px rgba(60,60,67,0.08), 0 1px 2px rgba(0,0,0,0.03)",
        fontFamily: appleFont,
      }}
    >
      <div
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[10.5px] font-medium text-[#1D1D1F]"
        style={{ background: logoTint[index % logoTint.length] }}
      >
        {quote.logo ? (
          <img
            src={quote.logo}
            alt={`${quote.displaySymbol} logo`}
            width="14"
            height="14"
            className="h-3.5 w-3.5 object-contain mix-blend-multiply"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          quote.displaySymbol.charAt(0)
        )}
      </div>
      <span className="text-[13.5px] font-medium leading-none tracking-[-0.01em] text-[#1D1D1F]">
        {quote.displaySymbol}
      </span>
      <span className="flex items-center gap-1">
        {quote.isUp ? Icon.triUp(tint) : Icon.triDown(tint)}
        <span
          className={`text-[12.5px] font-semibold tabular-nums tracking-[-0.01em] ${isLoading ? "animate-pulse" : ""}`}
          style={{ color: tint }}
        >
          {Math.abs(quote.percentChange).toFixed(1)}%
        </span>
      </span>
    </div>
  );
};

interface HushhTechHeaderProps {
  showTicker?: boolean;
  className?: string;
}

const HushhTechHeader: React.FC<HushhTechHeaderProps> = ({
  showTicker = true,
  className = "",
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTickerCollapsed, setIsTickerCollapsed] = useState(false);
  const tickerLoopRef = useRef<HTMLDivElement>(null);
  const tickerTrackRef = useRef<HTMLDivElement>(null);
  const hasRouter = useInRouterContext();
  const { quotes, loading: quotesLoading, lastUpdated } = useStockQuotes(120000);

  useEffect(() => {
    if (!showTicker) {
      setIsTickerCollapsed(false);
      return;
    }

    let animationFrame = 0;

    const updateTickerState = () => {
      animationFrame = 0;
      setIsTickerCollapsed(window.scrollY > 24);
    };

    const handleScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateTickerState);
    };

    updateTickerState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [showTicker]);

  useConstantTickerMotion({
    enabled: showTicker && quotes.length > 0,
    loopRef: tickerLoopRef,
    trackRef: tickerTrackRef,
    pixelsPerSecond: TICKER_SCROLL_PIXELS_PER_SECOND,
  });

  return (
    <>
      <SkipToContentLink />

      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-transform duration-300 ${className}`}
        data-hushh-header
      >
        <div className="pointer-events-none px-3 pt-[max(env(safe-area-inset-top),0.85rem)] sm:px-5">
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <GlassPill>
              {hasRouter ? (
                <RoutedBrandButton />
              ) : (
                <BrandButton onClick={() => window.location.assign("/")} />
              )}
            </GlassPill>

            <div className="flex shrink-0 items-center gap-1.5">
              <GlassPill>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex h-[38px] w-[38px] items-center justify-center text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 focus-visible:ring-offset-2"
                  aria-label="Open site search"
                >
                  {Icon.search("currentColor", 18)}
                </button>
              </GlassPill>
              <GlassPill>
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
          </div>
        </div>

        {showTicker && (
          <section
            aria-hidden={isTickerCollapsed}
            className={[
              "overflow-hidden border-y bg-[#FFFFFF]/95 backdrop-blur-md",
              "transition-[max-height,margin,padding,opacity,border-color,transform] duration-300 ease-out",
              isTickerCollapsed
                ? "pointer-events-none mt-0 max-h-0 -translate-y-2 border-transparent py-0 opacity-0"
                : "mt-2 max-h-24 translate-y-0 border-[#1D1D1F]/[0.06] py-2 opacity-100",
            ].join(" ")}
            data-hushh-ticker
          >
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1D1D1F]/55"
                style={{ fontFamily: appleFont }}
              >
                Markets Live
              </span>
              {lastUpdated ? (
                <span
                  className="hidden text-[11px] font-normal text-[#1D1D1F]/35 sm:inline"
                  style={{ fontFamily: appleFont }}
                >
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
            <div className="hushh-ticker-mask relative flex w-full overflow-hidden">
              <div
                ref={tickerTrackRef}
                className="hushh-ticker-track flex w-max items-center"
                data-ticker-motion="constant-raf"
              >
                {[0, 1].map((loopIndex) => (
                  <div
                    key={loopIndex}
                    ref={loopIndex === 0 ? tickerLoopRef : undefined}
                    aria-hidden={loopIndex === 1}
                    className="hushh-ticker-loop flex shrink-0 items-center gap-2 px-5"
                  >
                    {quotes.map((quote, idx) => (
                      <TickerChip
                        key={`${loopIndex}-${quote.symbol}-${idx}`}
                        quote={quote}
                        index={idx}
                        isLoading={quotesLoading && quotes.length === 0}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </header>

      <div className={showTicker ? "h-[146px]" : "h-[72px]"} />

      <HushhTechNavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <style>{`
        .hushh-ticker-mask {
          mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
        }
        .hushh-ticker-track {
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .hushh-ticker-loop {
          min-width: max-content;
        }
      `}</style>
    </>
  );
};

export default HushhTechHeader;
