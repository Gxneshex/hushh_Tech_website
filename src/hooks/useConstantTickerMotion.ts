import { RefObject, useEffect } from "react";

interface ConstantTickerMotionOptions {
  enabled: boolean;
  loopRef: RefObject<HTMLElement>;
  trackRef: RefObject<HTMLElement>;
  pixelsPerSecond?: number;
}

const DEFAULT_TICKER_PIXELS_PER_SECOND = 60;

export const useConstantTickerMotion = ({
  enabled,
  loopRef,
  trackRef,
  pixelsPerSecond = DEFAULT_TICKER_PIXELS_PER_SECOND,
}: ConstantTickerMotionOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const loop = loopRef.current;
    const track = trackRef.current;
    if (!loop || !track) return;

    const requestFrame =
      window.requestAnimationFrame ??
      ((callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(performance.now()), 16));
    const cancelFrame =
      window.cancelAnimationFrame ??
      ((id: number) => window.clearTimeout(id));

    let tickerFrame = 0;
    let measureFrame = 0;
    let lastTime = performance.now();
    let distance = Math.max(1, loop.scrollWidth);
    let offset = 0;

    const measure = () => {
      measureFrame = 0;
      const nextDistance = loop.scrollWidth;
      if (nextDistance <= 0) return;

      distance = nextDistance;
      offset %= distance;
      track.style.setProperty("--ticker-distance-px", `${distance}px`);
    };

    const scheduleMeasure = () => {
      if (measureFrame) return;
      measureFrame = requestFrame(measure);
    };

    const tick = (time: number) => {
      const delta = Math.min(64, Math.max(0, time - lastTime));
      lastTime = time;

      offset = (offset + (delta / 1000) * pixelsPerSecond) % distance;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      tickerFrame = requestFrame(tick);
    };

    measure();
    tickerFrame = requestFrame((time) => {
      lastTime = time;
      tick(time);
    });

    window.addEventListener("resize", scheduleMeasure);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleMeasure)
        : null;
    resizeObserver?.observe(loop);

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      resizeObserver?.disconnect();
      if (measureFrame) cancelFrame(measureFrame);
      if (tickerFrame) cancelFrame(tickerFrame);
      track.style.transform = "";
    };
  }, [enabled, loopRef, pixelsPerSecond, trackRef]);
};
