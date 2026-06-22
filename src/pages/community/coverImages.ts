/**
 * coverImages.ts
 * ----------------------------------------------------------------------------
 * Real, topic-appropriate cover photos for community blog cards.
 *
 * The community grid previously rendered flat color gradients on every card.
 * This module maps each post — by its display category, and for a handful of
 * known articles by slug — to a tasteful, editorial stock photo served from
 * the Unsplash CDN (`images.unsplash.com`). The site CSP allows `img-src
 * https:`, and every photo id below has been verified to return HTTP 200.
 *
 * Selection is deterministic: a given (slug || title) always resolves to the
 * same image, so cards don't reshuffle between renders. Callers keep their own
 * gradient fallback for the (practically impossible) case where this returns
 * null.
 *
 * URL form (per image id):
 *   src    -> w=800
 *   srcSet -> w=480 480w, w=800 800w, w=1200 1200w
 *
 * Photos are chosen to suit a finance/AI fund: abstract markets, skylines,
 * technology/AI/chips, documents, devices, and muted professional scenes.
 *
 * IMPORTANT: only add ids that have been verified (curl -> 200) against the
 * Unsplash CDN.
 */

export interface CoverImage {
  src: string; // images.unsplash.com URL, w=800
  srcSet: string; // "<url w=480> 480w, <url w=800> 800w, <url w=1200> 1200w"
  alt: string; // short descriptive alt text, e.g. "Abstract financial market data"
}

/* ------------------------------------------------------------------------- */
/* URL helpers                                                               */
/* ------------------------------------------------------------------------- */

const UNSPLASH = "https://images.unsplash.com/photo-";

/** Build an Unsplash CDN URL for a given photo id at a target width. */
function url(id: string, w: number): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&q=70`;
}

/** Build a full CoverImage (src + responsive srcSet) from a verified id. */
function cover(id: string, alt: string): CoverImage {
  return {
    src: url(id, 800),
    srcSet: `${url(id, 480)} 480w, ${url(id, 800)} 800w, ${url(id, 1200)} 1200w`,
    alt,
  };
}

/* ------------------------------------------------------------------------- */
/* Deterministic hash (FNV-1a)                                               */
/* ------------------------------------------------------------------------- */

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* ------------------------------------------------------------------------- */
/* Per-category pools (keys are lowercased category names)                   */
/* All photo ids verified -> HTTP 200 on images.unsplash.com.               */
/* ------------------------------------------------------------------------- */

const POOLS: Record<string, CoverImage[]> = {
  "market updates": [
    cover("1611974789855-9c2a0a7236a3", "Glowing stock market candlestick chart"),
    cover("1590283603385-17ffb3a7f29f", "Financial market data on a trading screen"),
    cover("1612178537253-bccd437b730e", "Abstract market price ticker display"),
    cover("1559526324-4b87b5e36e44", "Rising financial graph on a dark screen"),
  ],
  news: [
    cover("1551288049-bebda4e38f71", "Business analytics dashboard on a laptop"),
    cover("1504384308090-c894fdcc538d", "Modern corporate office and skyline"),
    cover("1518186285589-2f7649de83e0", "Newspaper financial pages close up"),
  ],
  technical: [
    cover("1526374965328-7f61d4dc18c5", "Lines of code on a dark monitor"),
    cover("1518770660439-4636190af475", "Macro shot of a circuit board"),
    cover("1526304640581-d334cdbbf45e", "Data center server racks with blue light"),
    cover("1677442136019-21780ecad995", "Abstract artificial intelligence visualization"),
  ],
  investment: [
    cover("1611605698335-8b1569810432", "Investment growth chart and coins"),
    cover("1543286386-2e659306cd6c", "Analyst reviewing financial charts"),
    cover("1488229297570-58520851e868", "Glass office towers from below"),
  ],
  "investor relations": [
    cover("1556761175-5973dc0f32e7", "Business team meeting in a boardroom"),
    cover("1573164713988-8665fc963095", "Professionals discussing reports at a desk"),
    cover("1454165804606-c3d57bc86b40", "Handshake over a business document"),
  ],
  "fund updates": [
    cover("1639762681485-074b7f938ba0", "Financial portfolio data visualization"),
    cover("1620712943543-bcc4688e7485", "Abstract data network and analytics"),
    cover("1554260570-9140fd3b7614", "Person analyzing performance graphs"),
  ],
  "fund documents": [
    cover("1450101499163-c8848c66ca85", "Signing a legal contract document"),
    cover("1554224155-6726b3ff858f", "Stacked paperwork and financial reports"),
    cover("1551836022-d5d88e9218df", "Pen resting on a printed agreement"),
  ],
  product: [
    cover("1517077304055-6e89abbf09b0", "Smartphone and laptop on a clean desk"),
    cover("1581091226825-a6a2a5aee158", "Person using a sleek mobile app"),
    cover("1531297484001-80022131f5a1", "Minimalist workspace with modern devices"),
  ],
  general: [
    cover("1460925895917-afdab827c52f", "Business analytics on a tablet and laptop"),
    cover("1517245386807-bb43f82c33c4", "Modern glass skyscraper facade"),
    cover("1454165205744-3b78555e5572", "Trading charts on multiple screens"),
  ],
};

/** Fallback pool used when a category has no dedicated entry. */
const DEFAULT_POOL: CoverImage[] = [
  cover("1460925895917-afdab827c52f", "Business analytics on a tablet and laptop"),
  cover("1611974789855-9c2a0a7236a3", "Glowing stock market candlestick chart"),
  cover("1517245386807-bb43f82c33c4", "Modern glass skyscraper facade"),
  cover("1504384308090-c894fdcc538d", "Modern corporate office and skyline"),
];

/* ------------------------------------------------------------------------- */
/* Per-slug overrides (matched via slug.includes(key))                       */
/* All photo ids verified -> HTTP 200 on images.unsplash.com.               */
/* ------------------------------------------------------------------------- */

const OVERRIDES: Record<string, CoverImage> = {
  // OpenAI / LLM / AI -> neural / data-center imagery
  openai: cover("1639322537228-f710d846310a", "Artificial intelligence neural network concept"),
  llm: cover("1639322537228-f710d846310a", "Artificial intelligence neural network concept"),

  // NVIDIA / chips / semiconductors -> chip imagery
  nvidia: cover("1591453089816-0fbb971b454c", "Close up of a computer processor chip"),
  chip: cover("1591453089816-0fbb971b454c", "Close up of a computer processor chip"),
  semiconductor: cover("1591453089816-0fbb971b454c", "Close up of a computer processor chip"),

  // UAE / Gulf -> Gulf skyline
  uae: cover("1512453979798-5ea266f8880c", "Dubai skyline at dusk in the United Arab Emirates"),
  "uae-minister": cover("1512453979798-5ea266f8880c", "Dubai skyline at dusk in the United Arab Emirates"),

  // Renaissance / quant -> mathematics / quantitative trading
  renaissance: cover("1635070041078-e363dbe005cb", "Quantitative trading and mathematics concept"),

  // Sell the wall -> options / trading
  "sell-the-wall": cover("1607082348824-0a96f2a4b9da", "Options and equity trading screen"),

  // Wise / payments / cross-border -> fintech money transfer
  wise: cover("1556155092-490a1ba16284", "Digital fintech payment on a smartphone"),
  payments: cover("1556155092-490a1ba16284", "Digital fintech payment on a smartphone"),
  "cross-border": cover("1556155092-490a1ba16284", "Digital fintech payment on a smartphone"),

  // Alphabet / earnings -> stock chart / earnings
  alphabet: cover("1611926653458-09294b3142bf", "Earnings stock chart trending upward"),
  earnings: cover("1611926653458-09294b3142bf", "Earnings stock chart trending upward"),

  // Slug-prefix style sections
  "fund-documents/": cover("1450101499163-c8848c66ca85", "Signing a legal contract document"),
  "product/": cover("1517077304055-6e89abbf09b0", "Smartphone and laptop on a clean desk"),
};

/* ------------------------------------------------------------------------- */
/* Public API                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Deterministic: same (slug) always returns the same image.
 * Returns null only if nothing matches (caller has a gradient fallback).
 */
export function getCoverImage(
  category: string,
  slug: string,
  title: string,
): CoverImage | null {
  const lowerSlug = (slug || "").toLowerCase();

  // 1) Per-slug overrides win.
  for (const key of Object.keys(OVERRIDES)) {
    if (lowerSlug.includes(key)) {
      return OVERRIDES[key];
    }
  }

  // 2) Category pool, chosen deterministically from the slug/title seed.
  const key = (category || "").trim().toLowerCase();
  const pool = POOLS[key] ?? DEFAULT_POOL;
  if (pool.length === 0) return null;

  const seed = hash(slug || title || key || "hushh");
  return pool[seed % pool.length];
}
