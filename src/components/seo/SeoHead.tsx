/**
 * SeoHead — one reusable per-page SEO head for the public site.
 *
 * The app previously shipped a single static `<title>` in index.html with no
 * description, canonical, or social tags, so every route looked identical to
 * crawlers and shared blank link previews. This component (built on the
 * already-installed react-helmet) gives every page an honest title +
 * description + canonical URL + Open Graph + Twitter card, plus optional
 * JSON-LD structured data.
 *
 * Pattern: a single `<SeoHead />` is rendered once at the app root to supply
 * sensible site-wide defaults (and the Organization schema). Individual pages
 * render their own `<SeoHead title=… description=… path=… />` to override the
 * defaults — react-helmet keeps the last-rendered title/description/canonical
 * and accumulates the JSON-LD scripts, so page tags win and the Organization
 * schema is always present.
 */
import { Helmet } from "react-helmet";

export const SITE_NAME = "HushhTech";
export const SITE_URL = "https://hushhtech.com";

const DEFAULT_TITLE = "HushhTech — The AI-powered Berkshire Hathaway";
const DEFAULT_DESCRIPTION =
  "HushhTech combines AI and human expertise to invest in exceptional " +
  "businesses for long-term value creation — the AI-powered Berkshire Hathaway.";
const DEFAULT_IMAGE = `${SITE_URL}/favicon.ico`;

/** Site-wide Organization schema — rendered once via the root SeoHead. */
export const ORGANIZATION_SCHEMA: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hushh Technologies LLC",
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description: DEFAULT_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    streetAddress: "1021 5th St W",
    addressLocality: "Kirkland",
    addressRegion: "WA",
    postalCode: "98033",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-888-462-1726",
    contactType: "customer support",
    email: "support@hushh.ai",
  },
  sameAs: ["https://www.hushh.ai"],
};

export interface SeoHeadProps {
  /** Page title (the " — HushhTech" suffix is appended automatically). */
  title?: string;
  /** Meta + OG + Twitter description. */
  description?: string;
  /** Canonical path, e.g. "/discover-fund-a". Defaults to "/". */
  path?: string;
  /** Absolute image URL for OG / Twitter cards. */
  image?: string;
  /** OG type. */
  type?: "website" | "article";
  /** Set true to keep a route out of the index (e.g. gated/utility pages). */
  noindex?: boolean;
  /** One or more JSON-LD blocks to embed as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export default function SeoHead({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const canonical = `${SITE_URL}${path ?? "/"}`;
  const ogImage = image ?? DEFAULT_IMAGE;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {blocks.map((block, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
