import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";

import NDADocumentModal from "../../components/NDADocumentModal";
import NDARequestModal from "../../components/NDARequestModal";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";
import {
  Icon,
  SmallSpinner,
  appleFont,
  appleDisplayFont,
} from "../../components/hushh-tech-ui/HushhAppleUI";
import { getCategoryVariant, useCommunityListLogic } from "./logic";
import CommunityCover from "./CommunityCover";
import SeoHead from "../../components/seo/SeoHead";

/* ── Category accent tints (brand-aligned, used only for small badges/dots) ── */
const CATEGORY_TINT: Record<string, string> = {
  all: "#1D1D1F",
  investment: "#0066CC",
  "fund documents": "#5E5CE6",
  "fund updates": "#5E5CE6",
  "market updates": "#FF9500",
  general: "#34C759",
  "investor relations": "#AF52DE",
  product: "#5AC8FA",
  technical: "#0066CC",
  news: "#FF9500",
};

const tintFor = (value: string): string => {
  const lower = (value || "").toLowerCase();
  if (lower === "all") return CATEGORY_TINT.all;
  if (lower.includes("nda") || lower.includes("sensitive")) return CATEGORY_TINT.all;
  if (CATEGORY_TINT[lower]) return CATEGORY_TINT[lower];
  if (lower.includes("document")) return CATEGORY_TINT["fund documents"];
  if (lower.includes("fund")) return CATEGORY_TINT["fund updates"];
  if (lower.includes("market")) return CATEGORY_TINT["market updates"];
  if (lower.includes("investor")) return CATEGORY_TINT["investor relations"];
  if (lower.includes("investment")) return CATEGORY_TINT.investment;
  if (lower.includes("product")) return CATEGORY_TINT.product;
  if (lower.includes("technical")) return CATEGORY_TINT.technical;
  if (lower.includes("news")) return CATEGORY_TINT.news;
  return CATEGORY_TINT.general;
};

type CommunityPost = ReturnType<typeof useCommunityListLogic>["filteredContent"][number];

/* ── Search input (wired to existing searchQuery + setter) ── */
const SearchBar = ({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
}) => (
  <div className="flex h-11 items-center gap-2.5 rounded-[14px] bg-[#767680]/[0.10] px-4 shadow-[inset_0_0_0_0.5px_rgba(29,29,31,0.04)]">
    {Icon.search("rgba(60,60,67,0.55)", 16)}
    <label htmlFor="community-search" className="sr-only">
      Search articles
    </label>
    <input
      id="community-search"
      ref={inputRef}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search articles..."
      className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] tracking-normal text-[#1D1D1F] outline-none placeholder:text-[#3C3C43]/45"
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

/* ── Small category badge ── */
const CategoryBadge = ({ label, tint }: { label: string; tint: string }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F]/[0.045] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
    style={{ color: tint, fontFamily: appleFont }}
  >
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: tint }} />
    {label}
  </span>
);

/* ── Article meta line (date · author) ── */
const ArticleMeta = ({ date, author }: { date: string; author?: string }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span
      className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#1D1D1F]/50"
      style={{ fontFamily: appleFont }}
    >
      {date}
    </span>
    {author ? (
      <>
        <span className="h-0.5 w-0.5 rounded-full bg-[#1D1D1F]/30" />
        <span
          className="text-[11px] font-medium tracking-[-0.01em] text-[#1D1D1F]/50"
          style={{ fontFamily: appleFont }}
        >
          {author}
        </span>
      </>
    ) : null}
  </div>
);

/* ── Spotlight card — large, cover art on top ── */
const SpotlightCard = ({
  post,
  date,
  category,
  tint,
  description,
  author,
}: {
  post: CommunityPost;
  date: string;
  category: string;
  tint: string;
  description: string;
  author?: string;
}) => (
  <article className="group overflow-hidden rounded-[24px] bg-[#FFFFFF] shadow-[0_2px_14px_rgba(29,29,31,0.05),inset_0_0_0_0.5px_rgba(29,29,31,0.06)] transition-shadow duration-200 hover:shadow-[0_18px_44px_rgba(29,29,31,0.10),inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
    <CommunityCover
      category={category}
      title={post.title}
      slug={post.slug}
      className="h-56 w-full md:h-72"
    />
    <div className="p-6 md:p-8">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <CategoryBadge label={category} tint={tint} />
        <ArticleMeta date={date} author={author} />
      </div>
      <h2
        className="mb-2.5 text-[26px] font-semibold leading-[1.08] tracking-[-0.025em] text-[#1D1D1F] md:text-[30px]"
        style={{ fontFamily: appleDisplayFont }}
      >
        {post.title}
      </h2>
      <p
        className="mb-4 line-clamp-2 max-w-[60ch] text-[15px] font-normal leading-[1.5] text-[#1D1D1F]/62 md:text-[16px]"
        style={{ fontFamily: appleFont }}
      >
        {description}
      </p>
      <span
        className="inline-flex items-center gap-1 text-[15px] font-medium text-[#0066CC]"
        style={{ fontFamily: appleFont }}
      >
        Read article {Icon.arrowRight("#0066CC", 13)}
      </span>
    </div>
  </article>
);

/* ── Trending row — compact, small cover thumbnail ── */
const TrendingRow = ({
  post,
  date,
  category,
  tint,
  isLast,
}: {
  post: CommunityPost;
  date: string;
  category: string;
  tint: string;
  isLast: boolean;
}) => (
  <article className="relative flex items-center gap-4 py-3.5">
    <CommunityCover
      category={category}
      title={post.title}
      slug={post.slug}
      className="h-[64px] w-[88px] shrink-0"
      rounded="rounded-[12px]"
    />
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: tint, fontFamily: appleFont }}
        >
          {category}
        </span>
        <span className="h-0.5 w-0.5 rounded-full bg-[#1D1D1F]/30" />
        <span
          className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#1D1D1F]/50"
          style={{ fontFamily: appleFont }}
        >
          {date}
        </span>
      </div>
      <h3
        className="line-clamp-2 text-[15px] font-medium leading-[1.2] tracking-[-0.018em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {post.title}
      </h3>
    </div>
    <span className="shrink-0 self-center">{Icon.chevronRight("rgba(60,60,67,0.25)", 13)}</span>
    {!isLast ? (
      <span className="absolute bottom-0 left-[104px] right-0 h-px bg-[#000000]/[0.08]" />
    ) : null}
  </article>
);

/* ── Standard article card — cover art on top ── */
const ArticleCard = ({
  post,
  date,
  category,
  tint,
  description,
  author,
}: {
  post: CommunityPost;
  date: string;
  category: string;
  tint: string;
  description: string;
  author?: string;
}) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-[#FFFFFF] shadow-[0_2px_12px_rgba(29,29,31,0.04),inset_0_0_0_0.5px_rgba(29,29,31,0.06)] transition-shadow duration-200 hover:shadow-[0_14px_36px_rgba(29,29,31,0.09),inset_0_0_0_0.5px_rgba(29,29,31,0.08)]">
    <CommunityCover
      category={category}
      title={post.title}
      slug={post.slug}
      className="h-40 w-full"
    />
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-2.5">
        <CategoryBadge label={category} tint={tint} />
      </div>
      <h3
        className="mb-2 text-[17px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1D1D1F]"
        style={{ fontFamily: appleFont }}
      >
        {post.title}
      </h3>
      <p
        className="mb-4 line-clamp-3 text-[13.5px] font-normal leading-[1.45] text-[#1D1D1F]/60"
        style={{ fontFamily: appleFont }}
      >
        {description}
      </p>
      <div className="mt-auto pt-1">
        <ArticleMeta date={date} author={author} />
      </div>
    </div>
  </article>
);

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
    handlePostClick,
    setNdaApproved,
    getPostDescription,
    formatDisplayDate,
    getPostUrl,
    toTitleCase,
    NDA_OPTION,
  } = useCommunityListLogic();

  // Author is optional and not guaranteed on the unified post shape — read it
  // safely so it renders only when present.
  const authorOf = (post: CommunityPost): string | undefined =>
    (post as unknown as { author?: string }).author;

  const labelFor = (value: string) =>
    value === "All" ? "All" : value === NDA_OPTION ? "Sensitive Documents" : toTitleCase(value);

  const categoryOf = (post: CommunityPost) => getCategoryVariant(post);

  useEffect(() => {
    if (searchParams.get("focus") !== "search") return;

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInputRef.current?.focus({ preventScroll: true });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [searchParams]);

  /* The category rail mirrors the hook's dropdownOptions: All + present
   * categories + the NDA option. */
  const railOptions = dropdownOptions;

  const isMagazineView = selectedCategory === "All" && !searchQuery.trim();

  /* Magazine layout grouping (only for the All + no-search overview). */
  const spotlight = isMagazineView ? filteredContent[0] : undefined;
  const trending = isMagazineView ? filteredContent.slice(1, 4) : [];

  const categorySections = useMemo(() => {
    if (!isMagazineView) return [] as { category: string; posts: CommunityPost[] }[];

    const presentCategories = railOptions.filter(
      (option) => option !== "All" && option !== NDA_OPTION
    );

    return presentCategories
      .map((category) => ({
        category,
        posts: filteredContent.filter((post) => categoryOf(post) === category),
      }))
      .filter((section) => section.posts.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMagazineView, railOptions, filteredContent, NDA_OPTION]);

  const renderPostLink = (
    post: CommunityPost,
    content: ReactNode,
    className = "block"
  ) => (
    <Link
      key={post.id}
      to={getPostUrl(post)}
      className={`${className} rounded-[20px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35`}
      onClick={() => handlePostClick(post)}
    >
      {content}
    </Link>
  );

  const sectionHeader = (label: string, tint: string, onReadMore?: () => void) => (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#1D1D1F]/[0.08] pb-3">
      <h2
        className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em] text-[#1D1D1F] md:text-[22px]"
        style={{ fontFamily: appleDisplayFont }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tint }} />
        {label}
      </h2>
      {onReadMore ? (
        <button
          type="button"
          onClick={onReadMore}
          className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-[#0066CC] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
          style={{ fontFamily: appleFont }}
        >
          Read More {Icon.chevronRight("#0066CC", 12)}
        </button>
      ) : null}
    </div>
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
      <HushhTechHeader showSearch={false} />

      <main id="main-content" aria-busy={apiLoading}>
        {/* Hero */}
        <section className="bg-[#FFFFFF] px-5 pb-8 pt-12 md:pt-16">
          <div className="mx-auto w-full max-w-[1180px]">
            <div
              className="mb-4 text-[13px] font-bold uppercase leading-tight tracking-[0.14em] text-[#0066CC]/85"
              style={{ fontFamily: appleFont }}
            >
              Community
            </div>
            <h1
              className="text-[clamp(34px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.025em] text-[#1D1D1F]"
              style={{ fontFamily: appleDisplayFont }}
            >
              All Articles
            </h1>
            <p
              className="mt-3 max-w-[52ch] text-[clamp(16px,1.6vw,19px)] font-normal leading-[1.5] text-[#1D1D1F]/62"
              style={{ fontFamily: appleFont }}
            >
              Insights, news, and privacy technology updates from Hushh Technologies.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1180px] px-5 pb-28 md:pb-36">
          {/* Mobile category rail — horizontal, scrollable, sticky under header */}
          <nav
            aria-label="Article categories"
            className="sticky top-[140px] z-30 -mx-5 mb-6 border-b border-[#1D1D1F]/[0.08] bg-white/85 px-5 py-2.5 backdrop-blur-xl md:hidden"
          >
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {railOptions.map((option) => {
                const active = selectedCategory === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onCategoryChange(option)}
                    aria-current={active ? "true" : undefined}
                    className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition ${
                      active
                        ? "bg-[#0066CC] text-white"
                        : "bg-[#1D1D1F]/[0.05] text-[#1D1D1F]/65 hover:bg-[#1D1D1F]/[0.08]"
                    }`}
                    style={{ fontFamily: appleFont }}
                  >
                    {labelFor(option)}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-12 lg:gap-16">
            {/* Desktop left rail — sticky categories list */}
            <nav aria-label="Article categories" className="hidden md:block">
              <div className="sticky top-[170px]">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1D1D1F]/40">
                  Categories
                </p>
                <ul className="flex flex-col gap-0.5">
                  {railOptions.map((option) => {
                    const active = selectedCategory === option;
                    const tint = tintFor(option);
                    return (
                      <li key={option}>
                        <button
                          type="button"
                          onClick={() => onCategoryChange(option)}
                          aria-current={active ? "true" : undefined}
                          className={`group flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35 ${
                            active ? "bg-[#0066CC]/[0.08]" : "hover:bg-[#1D1D1F]/[0.04]"
                          }`}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full transition"
                            style={{
                              background: active ? "#0066CC" : tint,
                              opacity: active ? 1 : 0.55,
                            }}
                          />
                          <span
                            className={`text-[14px] leading-snug tracking-[-0.01em] transition ${
                              active
                                ? "font-semibold text-[#0066CC]"
                                : "font-medium text-[#1D1D1F]/60 group-hover:text-[#1D1D1F]"
                            }`}
                            style={{ fontFamily: appleFont }}
                          >
                            {labelFor(option)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            {/* Right column — search + content */}
            <div className="min-w-0">
              <div className="mb-8">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  inputRef={searchInputRef}
                />
              </div>

              {apiLoading ? (
                <SmallSpinner label="Loading articles" />
              ) : filteredContent.length === 0 ? (
                <div
                  className="mx-auto max-w-md px-6 py-16 text-center text-[14px] text-[#1D1D1F]/55"
                  style={{ fontFamily: appleFont }}
                >
                  {searchQuery
                    ? `No articles matched "${searchQuery}". Try a different keyword.`
                    : selectedCategory === NDA_OPTION && !ndaApproved
                      ? "Please complete NDA approval to view sensitive documents."
                      : "No content available."}
                </div>
              ) : isMagazineView ? (
                <div className="flex flex-col gap-12 md:gap-14">
                  {/* Spotlight */}
                  {spotlight ? (
                    <section aria-labelledby="community-spotlight">
                      {sectionHeader("Spotlight", "#0066CC")}
                      {renderPostLink(
                        spotlight,
                        <SpotlightCard
                          post={spotlight}
                          date={formatDisplayDate(spotlight.date)}
                          category={categoryOf(spotlight)}
                          tint={tintFor(categoryOf(spotlight))}
                          description={getPostDescription(spotlight)}
                          author={authorOf(spotlight)}
                        />
                      )}
                    </section>
                  ) : null}

                  {/* Trending */}
                  {trending.length > 0 ? (
                    <section aria-labelledby="community-trending">
                      {sectionHeader("Trending", "#FF9500")}
                      <div className="overflow-hidden rounded-[20px] bg-[#FFFFFF] px-5 shadow-[0_2px_12px_rgba(29,29,31,0.04),inset_0_0_0_0.5px_rgba(29,29,31,0.06)]">
                        {trending.map((post, index) =>
                          renderPostLink(
                            post,
                            <TrendingRow
                              post={post}
                              date={formatDisplayDate(post.date)}
                              category={categoryOf(post)}
                              tint={tintFor(categoryOf(post))}
                              isLast={index === trending.length - 1}
                            />,
                            "block rounded-none"
                          )
                        )}
                      </div>
                    </section>
                  ) : null}

                  {/* Per-category sections */}
                  {categorySections.map(({ category, posts }) => (
                    <section key={category} aria-label={category}>
                      {sectionHeader(
                        labelFor(category),
                        tintFor(category),
                        () => onCategoryChange(category)
                      )}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {posts.slice(0, 6).map((post) =>
                          renderPostLink(
                            post,
                            <ArticleCard
                              post={post}
                              date={formatDisplayDate(post.date)}
                              category={category}
                              tint={tintFor(category)}
                              description={getPostDescription(post)}
                              author={authorOf(post)}
                            />,
                            "block h-full"
                          )
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                /* Category selected OR search active — single responsive grid */
                <section aria-label={searchQuery ? "Search results" : labelFor(selectedCategory)}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#0066CC]/85"
                      style={{ fontFamily: appleFont }}
                    >
                      {filteredContent.length}{" "}
                      {filteredContent.length === 1 ? "article" : "articles"}
                      {searchQuery ? "" : ` · ${labelFor(selectedCategory)}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredContent.map((post) =>
                      renderPostLink(
                        post,
                        <ArticleCard
                          post={post}
                          date={formatDisplayDate(post.date)}
                          category={categoryOf(post)}
                          tint={tintFor(categoryOf(post))}
                          description={getPostDescription(post)}
                          author={authorOf(post)}
                        />,
                        "block h-full"
                      )
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
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
