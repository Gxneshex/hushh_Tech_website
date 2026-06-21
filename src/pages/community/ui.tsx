import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";

import NDADocumentModal from "../../components/NDADocumentModal";
import NDARequestModal from "../../components/NDARequestModal";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  AppleSection,
  Icon,
  SmallSpinner,
  appleFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import { useCommunityListLogic } from "./logic";
import SeoHead from "../../components/seo/SeoHead";

const CATEGORY_META = {
  all: { label: "All", tint: "#1D1D1F" },
  investment: { label: "Investment", tint: "#007AFF" },
  documents: { label: "Fund Documents", tint: "#5E5CE6" },
  fund: { label: "Fund Updates", tint: "#5E5CE6" },
  market: { label: "Market", tint: "#FF9500" },
  general: { label: "General", tint: "#34C759" },
  investor: { label: "Investor Relations", tint: "#AF52DE" },
  product: { label: "Product", tint: "#5AC8FA" },
  sensitive: { label: "Sensitive Documents", tint: "#1D1D1F" },
};

const getCategoryMeta = (value: string) => {
  const lower = value.toLowerCase();

  if (lower === "all") return CATEGORY_META.all;
  if (lower.includes("nda") || lower.includes("sensitive")) return CATEGORY_META.sensitive;
  if (lower.includes("investment")) return CATEGORY_META.investment;
  if (lower.includes("document")) return CATEGORY_META.documents;
  if (lower.includes("fund")) return CATEGORY_META.fund;
  if (lower.includes("market")) return CATEGORY_META.market;
  if (lower.includes("investor")) return CATEGORY_META.investor;
  if (lower.includes("product")) return CATEGORY_META.product;
  if (lower.includes("general")) return CATEGORY_META.general;

  return CATEGORY_META.general;
};

const getTint = (value: string) => {
  return getCategoryMeta(value).tint;
};

const CATEGORY_VISUAL_THEME = {
  investment: { from: "#0066CC", via: "#5E5CE6", to: "#0A0A0E" },
  documents: { from: "#007AFF", via: "#5E5CE6", to: "#111827" },
  fund: { from: "#5E5CE6", via: "#007AFF", to: "#0A0A0E" },
  market: { from: "#FF9500", via: "#007AFF", to: "#141414" },
  general: { from: "#34C759", via: "#007AFF", to: "#121212" },
  investor: { from: "#AF52DE", via: "#007AFF", to: "#111827" },
  product: { from: "#5AC8FA", via: "#007AFF", to: "#141414" },
  sensitive: { from: "#1D1D1F", via: "#5E5CE6", to: "#000000" },
};

const getVisualTheme = (value: string) => {
  const lower = value.toLowerCase();

  if (lower.includes("nda") || lower.includes("sensitive")) return CATEGORY_VISUAL_THEME.sensitive;
  if (lower.includes("investment")) return CATEGORY_VISUAL_THEME.investment;
  if (lower.includes("document")) return CATEGORY_VISUAL_THEME.documents;
  if (lower.includes("fund")) return CATEGORY_VISUAL_THEME.fund;
  if (lower.includes("market")) return CATEGORY_VISUAL_THEME.market;
  if (lower.includes("investor")) return CATEGORY_VISUAL_THEME.investor;
  if (lower.includes("product")) return CATEGORY_VISUAL_THEME.product;

  return CATEGORY_VISUAL_THEME.general;
};

const isGenericHushhImage = (image?: string) => {
  if (!image) return false;
  const lower = image.toLowerCase();
  return lower.includes("blog2o") || lower.includes("hushh-logo");
};

const CommunityVisual = ({
  image,
  category,
  categoryLabel,
  compact = false,
}: {
  image?: string;
  category: string;
  categoryLabel: string;
  compact?: boolean;
}) => {
  const shouldUseImage = image && !isGenericHushhImage(image);
  const theme = getVisualTheme(category);

  return (
    <div
      className={`relative overflow-hidden bg-[#111111] ${compact ? "h-[168px]" : "h-full min-h-[230px] md:min-h-[320px]"}`}
      style={{
        background: shouldUseImage
          ? undefined
          : `radial-gradient(circle at 18% 22%, ${theme.via}b8 0%, transparent 28%), linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 48%, ${theme.to} 100%)`,
      }}
    >
      {shouldUseImage ? (
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.28),transparent_24%),radial-gradient(circle_at_28%_82%,rgba(255,255,255,0.18),transparent_28%)]" />
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-[54px] font-light tracking-[-0.08em] text-white/90 md:text-[72px]" style={{ fontFamily: appleFont }}>
            hushh
          </div>
          <div className="absolute bottom-5 right-6 h-16 w-24 rounded-[18px] border border-white/24 bg-white/14 shadow-[0_16px_40px_rgba(0,0,0,0.20)] backdrop-blur-xl" />
          <div className="absolute bottom-10 right-12 h-[2px] w-28 rotate-[-18deg] rounded-full bg-white/75" />
          <div className="absolute bottom-8 left-6 h-12 w-12 rounded-[14px] border border-white/20 bg-white/12 backdrop-blur-xl" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.22),transparent_34%)]" />
      <div
        className="absolute left-5 top-5 rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase text-[#1D1D1F]"
        style={{
          background: "rgba(255,255,255,0.90)",
          color: getTint(category),
          fontFamily: appleFont,
          letterSpacing: 0.6,
        }}
      >
        {categoryLabel}
      </div>
    </div>
  );
};

const SearchBar = ({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
}) => (
  <div className="flex h-[58px] min-w-0 flex-1 items-center gap-3 rounded-[20px] bg-[#FFFFFF] px-5 shadow-[inset_0_0_0_1px_rgba(29,29,31,0.14)]">
    {Icon.search("rgba(60,60,67,0.58)", 20)}
    <label htmlFor="community-search" className="sr-only">
      Search articles
    </label>
    <input
      id="community-search"
      ref={inputRef}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search articles, documents, and updates"
      className="h-full min-w-0 flex-1 border-0 bg-transparent text-[17px] tracking-[-0.01em] text-[#1D1D1F] outline-none placeholder:text-[#3C3C43]/45"
      style={{ fontFamily: appleFont }}
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange("")}
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3C3C43]/35"
        aria-label="Clear search"
      >
        {Icon.close("#FFFFFF", 9)}
      </button>
    ) : null}
  </div>
);

const CategoryChips = ({
  value,
  options,
  onChange,
  labelFor,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labelFor: (value: string) => string;
}) => (
  <div
    className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    role="listbox"
    aria-label="Community categories"
  >
    {options.map((option) => {
      const selected = option === value;
      const label = option === "All" ? "All" : labelFor(option);

      return (
        <button
          key={option}
          type="button"
          role="option"
          aria-selected={selected}
          onClick={() => onChange(option)}
          className="h-11 shrink-0 rounded-full px-5 text-[16px] font-semibold tracking-[-0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
          style={{
            fontFamily: appleFont,
            color: selected ? "#FFFFFF" : "rgba(29,29,31,0.68)",
            background: selected ? "#1D1D1F" : "#FFFFFF",
            boxShadow: selected
              ? "0 10px 24px rgba(29,29,31,0.18)"
              : "inset 0 0 0 1px rgba(29,29,31,0.16)",
          }}
        >
          {label}
        </button>
      );
    })}
  </div>
);

type CommunityPost = ReturnType<typeof useCommunityListLogic>["filteredContent"][number];

const FeaturedArticle = ({
  image,
  date,
  category,
  categoryLabel,
  title,
  description,
}: {
  image?: string;
  date: string;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
}) => (
  <article className="grid cursor-pointer overflow-hidden rounded-[28px] bg-[#FFFFFF] shadow-[0_24px_70px_rgba(29,29,31,0.08),inset_0_0_0_1px_rgba(29,29,31,0.08)] md:grid-cols-[1.05fr_0.95fr]">
    <CommunityVisual image={image} category={category} categoryLabel={categoryLabel} />
    <div className="flex flex-col justify-center p-7 md:p-10">
      <p
        className="mb-5 text-[13px] font-semibold uppercase text-[#1D1D1F]/45"
        style={{ fontFamily: appleFont, letterSpacing: 2.6 }}
      >
        Featured
      </p>
      <h2
        className="mb-5 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1D1D1F] md:text-[44px]"
        style={{ fontFamily: appleFont }}
      >
        {title}
      </h2>
      <p
        className="mb-7 text-[18px] font-normal leading-[1.55] text-[#1D1D1F]/62"
        style={{ fontFamily: appleFont, letterSpacing: -0.2 }}
      >
        {description}
      </p>
      <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#1D1D1F]/45">
        <span>{date}</span>
        <span className="h-1 w-1 rounded-full bg-[#1D1D1F]/25" />
        <span>{categoryLabel}</span>
      </div>
    </div>
  </article>
);

const ArticleCard = ({
  post,
  image,
  date,
  categoryLabel,
  description,
}: {
  post: CommunityPost;
  image?: string;
  date: string;
  categoryLabel: string;
  description: string;
}) => (
  <article className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[18px] bg-[#FFFFFF] shadow-[0_0_0_1px_rgba(29,29,31,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(29,29,31,0.10),0_0_0_1px_rgba(29,29,31,0.12)]">
    <CommunityVisual image={image} category={post.category || categoryLabel} categoryLabel={categoryLabel} compact />
    <div className="flex flex-1 flex-col p-6">
      <p
        className="mb-5 text-[13px] text-[#1D1D1F]/45"
        style={{ fontFamily: appleFont }}
      >
        {date}
      </p>
      <h3
        className="mb-4 text-[21px] font-semibold leading-[1.16] tracking-[-0.025em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {post.title}
      </h3>
      <p
        className="mb-6 line-clamp-3 text-[16px] font-normal leading-[1.5] text-[#1D1D1F]/62"
        style={{ fontFamily: appleFont, letterSpacing: -0.12 }}
      >
        {description}
      </p>
      <span
        className="mt-auto inline-flex items-center gap-2 text-[15px] font-semibold text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        Read article {Icon.arrowRight("#1D1D1F", 14)}
      </span>
    </div>
  </article>
);

const DocumentCard = ({
  post,
  date,
  categoryLabel,
  tint,
  description,
}: {
  post: CommunityPost;
  date: string;
  categoryLabel: string;
  tint: string;
  description: string;
}) => (
  <article className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[24px] bg-[#FFFFFF] shadow-[0_18px_48px_rgba(29,29,31,0.07),inset_0_0_0_1px_rgba(29,29,31,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(29,29,31,0.10),inset_0_0_0_1px_rgba(0,102,204,0.22)]">
    <CommunityVisual category={post.category || categoryLabel} categoryLabel={categoryLabel} compact />
    <div className="flex flex-1 flex-col p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <span
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold uppercase"
          style={{ color: "#0066CC", background: "rgba(0,102,204,0.10)", fontFamily: appleFont, letterSpacing: 1.5 }}
        >
          {categoryLabel}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F5F5F7]">
          {Icon.lock("#1D1D1F", 17)}
        </span>
      </div>
      <h3
        className="mb-3 text-[24px] font-semibold leading-[1.12] tracking-[-0.025em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {post.title}
      </h3>
      <p
        className="mb-7 text-[17px] font-normal leading-[1.45] text-[#1D1D1F]/68"
        style={{ fontFamily: appleFont }}
      >
        {description}
      </p>
      <div className="mt-auto flex items-center justify-between gap-4">
        <span className="text-[13px] text-[#1D1D1F]/42" style={{ fontFamily: appleFont }}>
          {date}
        </span>
        <span
          className="inline-flex items-center gap-2 text-[15px] font-semibold"
          style={{ color: tint, fontFamily: appleFont }}
        >
          Open document {Icon.arrowRight(tint, 14)}
        </span>
      </div>
    </div>
  </article>
);

const groupPostsByCategory = (
  posts: CommunityPost[],
  labelFor: (value: string) => string
) => {
  const groups = new Map<string, CommunityPost[]>();

  posts.forEach((post) => {
    const label = labelFor(post.category || "general");
    groups.set(label, [...(groups.get(label) || []), post]);
  });

  const preferredOrder = [
    "Market",
    "Investment",
    "Fund Updates",
    "Investor Relations",
    "Product",
    "General",
  ];

  return Array.from(groups.entries()).sort(([a], [b]) => {
    const ai = preferredOrder.indexOf(a);
    const bi = preferredOrder.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
    }
    return a.localeCompare(b);
  });
};

export default function CommunityPage() {
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    filteredContent,
    dropdownOptions,
    apiLoading,
    selectedCategory,
    searchQuery,
    setSearchQuery,
    ndaApproved,
    showNdaModal,
    setShowNdaModal,
    showNdaDocModal,
    setShowNdaDocModal,
    ndaMetadata,
    session,
    onCategoryChange,
    handleBackClick,
    handlePostClick,
    setNdaApproved,
    getPostDescription,
    formatDisplayDate,
    getPostUrl,
    toTitleCase,
    NDA_OPTION,
  } = useCommunityListLogic();

  const documentPosts = filteredContent.filter((post) =>
    (post.category || "").toLowerCase().includes("document")
  );
  const nonDocumentPosts = filteredContent.filter(
    (post) => !(post.category || "").toLowerCase().includes("document")
  );
  const [featured, ...newsroomPosts] = nonDocumentPosts;
  const labelFor = (value: string) => {
    const variant = getCategoryMeta(value);
    if (value === "All") return "All";
    if (variant !== CATEGORY_META.general || value.toLowerCase().includes("general")) {
      return variant.label;
    }
    return toTitleCase(value);
  };
  const newsroomGroups = groupPostsByCategory(newsroomPosts, labelFor);

  useEffect(() => {
    if (searchParams.get("focus") !== "search") return;

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInputRef.current?.focus({ preventScroll: true });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  const renderPostLink = (
    post: CommunityPost,
    content: ReactNode,
    className = "block"
  ) => (
    <Link
      key={post.id}
      to={getPostUrl(post)}
      className={`${className} rounded-[18px] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35`}
      onClick={() => handlePostClick(post)}
    >
      {content}
    </Link>
  );

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] text-[#1D1D1F] antialiased selection:bg-[#0066CC] selection:text-[#F5F5F7]"
      style={{ fontFamily: appleFont }}
    >
      <SeoHead
        title="Community"
        description="Fund updates, market notes, and source-backed research from HushhTech — the AI-powered Berkshire Hathaway."
        path="/community"
      />
      <HushhTechBackHeader
        onBackClick={handleBackClick}
        rightType="hamburger"
        showTicker
      />

      <main id="main-content" aria-busy={apiLoading}>
        <AppleSection tone="light" pad="tight" overflow="visible" className="z-30">
          <div className="mx-auto text-center" style={{ maxWidth: 720 }}>
            <div
              style={{
                color: "#0071e3",
                fontFamily: appleFont,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.14em",
                lineHeight: 1.1,
                marginBottom: 18,
                textTransform: "uppercase",
              }}
            >
              Community
            </div>
            <h1
              style={{
                color: "#1d1d1f",
                fontFamily: appleFont,
                fontSize: "clamp(32px,4.6vw,54px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              Latest updates.
            </h1>
            <p
              style={{
                color: "rgba(0,0,0,.62)",
                fontFamily: appleFont,
                fontSize: "clamp(17px,1.6vw,20px)",
                fontWeight: 400,
                lineHeight: 1.5,
                margin: "20px auto 0",
                maxWidth: "46ch",
              }}
            >
              Insights, news, and privacy technology updates from Hushh Technologies.
            </p>
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-5xl flex-col gap-7 px-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                inputRef={searchInputRef}
              />
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="h-[58px] rounded-full bg-[#1D1D1F] px-8 text-[17px] font-semibold text-white shadow-[0_16px_38px_rgba(29,29,31,0.18)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
                style={{ fontFamily: appleFont }}
              >
                Search
              </button>
            </div>
            <CategoryChips
              value={selectedCategory}
              options={dropdownOptions}
              onChange={onCategoryChange}
              labelFor={labelFor}
            />
          </div>
        </AppleSection>

        {apiLoading ? (
          <AppleSection tone="gray" pad="tight" last>
            <SmallSpinner label="Loading articles" />
          </AppleSection>
        ) : filteredContent.length > 0 ? (
          <>
            {featured ? (
              <AppleSection tone="gray" pad="tight">
                <div className="mx-auto max-w-7xl px-5">
                  {renderPostLink(
                    featured,
                    <FeaturedArticle
                      image={featured.image}
                      date={formatDisplayDate(featured.date)}
                      category={featured.category || "general"}
                      categoryLabel={labelFor(featured.category || "general")}
                      title={featured.title}
                      description={getPostDescription(featured)}
                    />
                  )}
                </div>
              </AppleSection>
            ) : null}

            {documentPosts.length ? (
              <AppleSection tone="light" pad="tight">
                <div className="mx-auto max-w-7xl px-5">
                  <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p
                        className="mb-3 text-[13px] font-semibold uppercase text-[#0066CC]"
                        style={{ fontFamily: appleFont, letterSpacing: 2.6 }}
                      >
                        Fund documents
                      </p>
                      <h2
                        className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1D1D1F] md:text-[48px]"
                        style={{ fontFamily: appleFont }}
                      >
                        Organized for investor review.
                      </h2>
                    </div>
                    <p
                      className="max-w-md text-[17px] leading-[1.5] text-[#1D1D1F]/58"
                      style={{ fontFamily: appleFont }}
                    >
                      Prospectus, offering terms, and partnership agreements stay together, searchable, and easy to open.
                    </p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {documentPosts.map((post) =>
                      renderPostLink(
                        post,
                        <DocumentCard
                          post={post}
                          date={formatDisplayDate(post.date)}
                          categoryLabel={labelFor(post.category || "documents")}
                          tint={getTint(post.category || "documents")}
                          description={getPostDescription(post)}
                        />
                      )
                    )}
                  </div>
                </div>
              </AppleSection>
            ) : null}

            {newsroomPosts.length ? (
              <AppleSection tone="gray" pad="tight" last>
                <div className="mx-auto max-w-7xl px-5">
                  <div className="mb-8">
                    <p
                      className="mb-3 text-[13px] font-semibold uppercase text-[#1D1D1F]/45"
                      style={{ fontFamily: appleFont, letterSpacing: 2.6 }}
                    >
                      Newsroom
                    </p>
                    <h2
                      className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1D1D1F] md:text-[48px]"
                      style={{ fontFamily: appleFont }}
                    >
                      {newsroomPosts.length} published {newsroomPosts.length === 1 ? "article" : "articles"}
                    </h2>
                  </div>
                  <div className="space-y-12">
                    {newsroomGroups.map(([categoryLabel, posts]) => (
                      <section key={categoryLabel} aria-labelledby={`community-${categoryLabel.replace(/\s+/g, "-").toLowerCase()}`}>
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p
                              className="mb-2 text-[13px] font-semibold uppercase"
                              style={{
                                color: getTint(categoryLabel),
                                fontFamily: appleFont,
                                letterSpacing: 2.6,
                              }}
                            >
                              {categoryLabel}
                            </p>
                            <h3
                              id={`community-${categoryLabel.replace(/\s+/g, "-").toLowerCase()}`}
                              className="text-[28px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1D1D1F] md:text-[36px]"
                              style={{ fontFamily: appleFont }}
                            >
                              {posts.length} {posts.length === 1 ? "story" : "stories"}
                            </h3>
                          </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                          {posts.map((post) =>
                            renderPostLink(
                              post,
                              <ArticleCard
                                post={post}
                                image={post.image}
                                date={formatDisplayDate(post.date)}
                                categoryLabel={labelFor(post.category || "general")}
                                description={getPostDescription(post)}
                              />
                            )
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </AppleSection>
            ) : null}
          </>
        ) : (
          <AppleSection tone="light" pad="tight" last>
            <div
              className="mx-auto max-w-md px-6 py-10 text-center text-[14px] text-[#1D1D1F]/55"
              style={{ fontFamily: appleFont }}
            >
              {searchQuery
                ? `No articles matched "${searchQuery}". Try a different keyword.`
                : selectedCategory === NDA_OPTION && !ndaApproved
                  ? "Please complete NDA approval to view sensitive documents."
                  : "No content available."}
            </div>
          </AppleSection>
        )}
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />

      <NDARequestModal
        isOpen={showNdaModal}
        onClose={() => setShowNdaModal(false)}
        session={session}
        onSubmit={() => {}}
      />
      <NDADocumentModal
        isOpen={showNdaDocModal}
        onClose={() => setShowNdaDocModal(false)}
        session={session}
        ndaMetadata={ndaMetadata}
        onAccept={() => {
          setNdaApproved(true);
          setShowNdaDocModal(false);
        }}
      />
    </div>
  );
}
