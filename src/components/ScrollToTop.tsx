import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Automatically scrolls to the top of the page when the route changes.
 * Uses `prefers-reduced-motion` so scroll behavior stays non-animated when requested.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.scrollTo({
      top: 0,
      left: 0,
      // Respect vestibular / motion settings; keep non-animated scroll otherwise.
      behavior: prefersReducedMotion ? 'instant' : 'auto',
    });
  }, [pathname]);

  return null; // This component doesn't render anything
}
