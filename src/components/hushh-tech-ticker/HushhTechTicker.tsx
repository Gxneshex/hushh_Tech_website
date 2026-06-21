import { useRef } from "react";

import { useConstantTickerMotion } from "../../hooks/useConstantTickerMotion";
import { StockQuote, useStockQuotes } from "../../hooks/useStockQuotes";
import { Icon, appleFont } from "../hushh-tech-ui/HushhAppleUI";

const TICKER_SCROLL_PIXELS_PER_SECOND = 136;
const TICKER_UP = "#B3892E";
const TICKER_DOWN = "#B95C5C";

const TickerChip = ({
  quote,
  isLoading,
}: {
  quote: StockQuote;
  isLoading?: boolean;
}) => {
  const tint = quote.isUp ? TICKER_UP : TICKER_DOWN;

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#FFFFFF] py-2 pl-2.5 pr-3.5"
      style={{
        boxShadow:
          "0 0 0 0.5px rgba(60,60,67,0.08), 0 1px 2px rgba(0,0,0,0.03)",
        fontFamily: appleFont,
      }}
    >
      <div
        className="flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full bg-[#F5F5F7] px-1.5 text-[10px] font-semibold uppercase text-[#1D1D1F]/62 ring-1 ring-black/[0.04]"
        aria-hidden="true"
      >
        {quote.displaySymbol.slice(0, 2)}
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

export default function HushhTechTicker() {
  const tickerLoopRef = useRef<HTMLDivElement>(null);
  const tickerTrackRef = useRef<HTMLDivElement>(null);
  const { quotes, loading: quotesLoading, lastUpdated } = useStockQuotes(120000);

  useConstantTickerMotion({
    enabled: quotes.length > 0,
    loopRef: tickerLoopRef,
    trackRef: tickerTrackRef,
    pixelsPerSecond: TICKER_SCROLL_PIXELS_PER_SECOND,
  });

  return (
    <section
      className="mt-2 overflow-hidden border-y border-[#1D1D1F]/[0.06] bg-[#FFFFFF]/95 py-2 opacity-100 backdrop-blur-md"
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
                  isLoading={quotesLoading && quotes.length === 0}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

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
    </section>
  );
}
