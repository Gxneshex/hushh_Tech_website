import ReactMarkdown from "react-markdown";

import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  AppleSection,
  Display,
  Eyebrow,
  Lede,
  SmallSpinner,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import type { CommunityMediaItem } from "../../services/communityContent";
import { useCommunityPostLogic } from "./post-logic";
import SeoHead, { SITE_URL, ORGANIZATION_SCHEMA } from "../../components/seo/SeoHead";

const richContentClassName = [
  "prose prose-neutral max-w-none prose-headings:font-medium prose-a:text-[#0066CC]",
  "min-w-0 overflow-x-hidden break-words",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-[16px]",
  "[&_video]:max-w-full [&_video]:h-auto",
  "[&_iframe]:block [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:min-w-0",
  "[&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto",
  "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
  "[&_code]:break-words [&_a]:break-words",
].join(" ");

function DocumentMediaPages({
  mediaItems,
  title,
}: {
  mediaItems: CommunityMediaItem[];
  title: string;
}) {
  return (
    <article className="mx-auto w-full max-w-[960px] min-w-0 space-y-4">
      {mediaItems.map((item, index) => (
        <figure
          key={`${item.url}-${index}`}
          className="w-full min-w-0 overflow-hidden rounded-[16px] border border-[#1D1D1F]/[0.08] bg-[#F5F5F7]"
        >
          {item.type === "video" ? (
            <video
              src={item.url}
              controls
              className="block h-auto w-full max-w-full bg-[#000000]"
              aria-label={item.alt || `${title} video ${index + 1}`}
            />
          ) : (
            <img
              src={item.url}
              alt={item.alt || `${title} page ${index + 1}`}
              className="block h-auto w-full max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </figure>
      ))}
    </article>
  );
}

export default function CommunityPostPage() {
  const { post, legacyPost, loading, handleBack } = useCommunityPostLogic();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        <AppleSection tone="light" pad="tight" fill>
          <Eyebrow>Community</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[420px]">
            Loading article.
          </Display>
          <SmallSpinner label="Loading article" />
        </AppleSection>
      </div>
    );
  }

  if (!post) return null;

  // Deep SEO inherited by EVERY community post (static + Firestore) — this is
  // the single shared detail renderer, so one <SeoHead> covers them all.
  const firstImage = post.mediaItems?.find((item) => item.type === "image")?.url;
  const ogImage = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${SITE_URL}${firstImage}`
    : undefined;
  const canonicalPath = `/community/${post.slug}`;
  const seoHead = (
    <SeoHead
      title={post.title}
      description={post.description}
      path={canonicalPath}
      image={ogImage}
      type="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt || post.date || undefined,
        articleSection: post.category || undefined,
        image: ogImage || undefined,
        mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
        author: {
          "@type": "Organization",
          name: "Hushh Technologies LLC",
          url: SITE_URL,
        },
        publisher: ORGANIZATION_SCHEMA,
      }}
    />
  );

  const LegacyPostComponent =
    legacyPost && typeof legacyPost.Component !== "string"
      ? legacyPost.Component
      : null;
  const legacyPostLayoutClassName =
    post.sourceKind === "deck"
      ? "flex-1 w-full pb-24"
      : "flex-1 max-w-[900px] mx-auto w-full px-4 md:px-8 py-6 md:py-10 pb-32";
  const documentMediaItems = post.mediaItems?.filter((item) => item.url) || [];

  if (post.sourceKind === "document" && post.assetUrl) {
    return (
      <div
        className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        {seoHead}
        <HushhTechBackHeader onBackClick={handleBack} rightType="hamburger" />

        <main>
          <AppleSection tone="light" pad="tight">
            <Eyebrow>{post.category || "Community"}</Eyebrow>
            <Display as="h1" size="sm" maxWidth="max-w-[760px]">
              {post.title}
            </Display>
            {post.description ? <Lede>{post.description}</Lede> : null}
          </AppleSection>
          <section className="flex-1 min-w-0 max-w-full overflow-x-hidden px-3 py-4 pb-32 sm:px-4 md:px-8">
          {documentMediaItems.length > 0 ? (
            <DocumentMediaPages
              mediaItems={documentMediaItems}
              title={post.title}
            />
          ) : null}
          <section className={documentMediaItems.length > 0 ? "mt-8" : ""}>
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[#1D1D1F]/[0.08] bg-[#FFFFFF]">
              <iframe
                src={`${post.assetUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="block h-[calc(100dvh-120px)] min-h-[70dvh] w-full min-w-0 max-w-full border-0 bg-[#FFFFFF]"
                title={post.title}
              />
            </div>
          </section>
          </section>
        </main>

        <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
      </div>
    );
  }

  if (
    LegacyPostComponent &&
    (post.sourceKind === "legacy" ||
      post.sourceKind === "deck" ||
      !post.bodyMarkdown)
  ) {
    return (
      <div
        className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
        style={{ fontFamily: appleFont }}
      >
        {seoHead}
        <HushhTechBackHeader onBackClick={handleBack} rightType="hamburger" />
        <main>
          <AppleSection tone="light" pad="tight">
            <Eyebrow>{post.category || "Community"}</Eyebrow>
            <Display as="h1" size="sm" maxWidth="max-w-[760px]">
              {post.title}
            </Display>
            {post.description ? <Lede>{post.description}</Lede> : null}
          </AppleSection>
          <section className={legacyPostLayoutClassName}>
            <LegacyPostComponent />
          </section>
        </main>
        <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
      </div>
    );
  }

  const articleBody = post.bodyHtml ? (
    <article
      className={richContentClassName}
      dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
    />
  ) : post.bodyMarkdown ? (
    <article className={richContentClassName}>
      <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
    </article>
  ) : (
    <article className={richContentClassName}>
      <p className="community-post-missing-content">
        {post.description || "Article details are currently unavailable."}
      </p>
    </article>
  );

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      {seoHead}
      <HushhTechBackHeader onBackClick={handleBack} rightType="hamburger" />

      <main id="main-content">
        <AppleSection tone="light" pad="tight">
          <Eyebrow>{post.category || "Community"}</Eyebrow>
          <Display as="h1" size="sm" maxWidth="max-w-[760px]">
            {post.title}
          </Display>
          {post.description ? <Lede>{post.description}</Lede> : null}
        </AppleSection>

        <section className="mx-auto max-w-[900px] px-5 pb-36 pt-4 md:px-8">
          {articleBody}
        </section>
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
    </div>
  );
}
