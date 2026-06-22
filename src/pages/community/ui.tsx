import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";

import NDADocumentModal from "../../components/NDADocumentModal";
import NDARequestModal from "../../components/NDARequestModal";
import HushhTechHeader from "../../components/hushh-tech-header/HushhTechHeader";
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

const SearchBar = ({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement>;
}) => (
  <div className="flex h-10 items-center gap-2 rounded-[12px] bg-[#767680]/10 px-3.5">
    {Icon.search("rgba(60,60,67,0.55)", 15)}
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

const CategoryDropdown = ({
  value,
  options,
  onChange,
  labelFor,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labelFor: (value: string) => string;
}) => {
  const [open, setOpen] = useState(false);
  const selectedTint = getTint(value);
  const selectedLabel = getCategoryMeta(value).label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-[12px] bg-[#FFFFFF] px-3.5 text-[15px] font-medium tracking-[-0.01em] text-[#1D1D1F] shadow-[inset_0_0_0_1px_rgba(29,29,31,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]/35"
        style={{ fontFamily: appleFont }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: selectedTint }} />
          <span className="truncate">Category: {selectedLabel}</span>
        </span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>
          {Icon.chevronDown("rgba(29,29,31,0.6)", 12)}
        </span>
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-[14px] bg-[#FFFFFF] shadow-[0_16px_32px_rgba(29,29,31,0.18),inset_0_0_0_0.5px_rgba(29,29,31,0.06)]"
          role="listbox"
        >
          {options.map((option, index) => {
            const tint = getTint(option);
            const label = getCategoryMeta(option).label || labelFor(option);
            const selected = option === value;

            return (
              <button
                type="button"
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="relative flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[15px] tracking-normal text-[#1D1D1F]"
                style={{ fontFamily: appleFont, fontWeight: selected ? 600 : 400 }}
                role="option"
                aria-selected={selected}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tint }} />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {selected ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2 7l3 3 7-7"
                      stroke="#0066CC"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                ) : null}
                {index !== options.length - 1 ? (
                  <span className="absolute bottom-0 left-8 right-0 h-px bg-[#000000]/[0.10]" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

type CommunityPost = ReturnType<typeof useCommunityListLogic>["filteredContent"][number];

const FeaturedArticle = ({
  date,
  categoryLabel,
  tint,
  title,
  description,
}: {
  date: string;
  categoryLabel: string;
  tint: string;
  title: string;
  description: string;
}) => (
  <article className="cursor-pointer rounded-[22px] bg-[#FFFFFF] p-[22px]">
    <div
      className="relative mb-[18px] h-[120px] overflow-hidden rounded-[16px]"
      style={{
        background: `linear-gradient(135deg, ${tint}40 0%, ${tint}10 100%)`,
      }}
    >
      <div
        className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase text-[#1D1D1F]"
        style={{
          background: "rgba(255,255,255,0.85)",
          color: tint,
          fontFamily: appleFont,
          letterSpacing: 0.6,
        }}
      >
        {categoryLabel}
      </div>
      <div
        className="absolute -bottom-10 -right-5 h-[140px] w-[140px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${tint}50 0%, transparent 70%)`,
        }}
      />
    </div>
    <p
      className="mb-2 text-[11px] font-medium uppercase text-[#1D1D1F]/55"
      style={{ fontFamily: appleFont, letterSpacing: 0.6 }}
    >
      {date}
    </p>
    <h2
      className="mb-2 text-[22px] font-medium leading-[1.06] tracking-[-0.028em] text-[#1D1D1F]"
      style={{ fontFamily: appleFont }}
    >
      {title}
    </h2>
    <p
      className="mb-[14px] line-clamp-3 text-[14px] font-normal leading-[1.4] text-[#1D1D1F]/65"
      style={{ fontFamily: appleFont, letterSpacing: -0.12 }}
    >
      {description}
    </p>
    <span
      className="inline-flex items-center gap-1 text-[15px] font-medium text-[#0066CC]"
      style={{ fontFamily: appleFont, letterSpacing: -0.2 }}
    >
      Read More {Icon.arrowRight("#0066CC", 13)}
    </span>
  </article>
);

const ArticleRow = ({
  post,
  date,
  categoryLabel,
  tint,
  description,
  isLast,
}: {
  post: CommunityPost;
  date: string;
  categoryLabel: string;
  tint: string;
  description: string;
  isLast: boolean;
}) => (
  <article className="relative flex cursor-pointer gap-[14px] px-[18px] py-4">
    <span className="mt-1 h-6 w-1 shrink-0 rounded-full" style={{ background: tint }} />
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span
          className="text-[11px] font-medium uppercase text-[#1D1D1F]/55 tabular-nums"
          style={{ fontFamily: appleFont, letterSpacing: 0.6 }}
        >
          {date}
        </span>
        <span className="h-0.5 w-0.5 rounded-full bg-[#1D1D1F]/30" />
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: tint, fontFamily: appleFont, letterSpacing: 0.4 }}
        >
          {categoryLabel}
        </span>
      </div>
      <h3
        className="mb-1 text-[16px] font-medium leading-[1.06] text-[#1D1D1F]"
        style={{ fontFamily: appleFont, letterSpacing: "-0.028em" }}
      >
        {post.title}
      </h3>
      <p
        className="line-clamp-2 text-[13.5px] font-normal leading-[1.4] text-[#1D1D1F]/60"
        style={{ fontFamily: appleFont, letterSpacing: -0.1 }}
      >
        {description}
      </p>
    </div>
    <span className="self-center">{Icon.chevronRight("rgba(60,60,67,0.25)", 13)}</span>
    {!isLast ? (
      <span className="absolute bottom-0 left-9 right-0 h-px bg-[#000000]/[0.10]" />
    ) : null}
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

  const [featured, ...rest] = filteredContent;
  const labelFor = (value: string) => getCategoryMeta(value).label || (value === "All" ? "All" : toTitleCase(value));

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
      <HushhTechHeader showSearch={false} />

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

          <div className="mx-auto mt-7 flex max-w-2xl flex-col gap-2.5 px-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              inputRef={searchInputRef}
            />
            <CategoryDropdown
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
                <div className="px-5">
                  <p
                    className="mb-3 text-[11px] font-medium uppercase text-[#0066CC]/85"
                    style={{ fontFamily: appleFont, letterSpacing: 1.6 }}
                  >
                    Featured
                  </p>
                  {renderPostLink(
                    featured,
                    <FeaturedArticle
                      date={formatDisplayDate(featured.date)}
                      categoryLabel={labelFor(featured.category || "general")}
                      tint={getTint(featured.category || "general")}
                      title={featured.title}
                      description={getPostDescription(featured)}
                    />
                  )}
                </div>
              </AppleSection>
            ) : null}

            <AppleSection tone="light" pad="tight" last>
              <div className="px-5">
                <p
                  className="mb-3 text-[11px] font-medium uppercase text-[#0066CC]/85"
                  style={{ fontFamily: appleFont, letterSpacing: 1.6 }}
                >
                  {rest.length} more {rest.length === 1 ? "article" : "articles"}
                </p>
                <div className="overflow-hidden rounded-[16px] bg-[#FFFFFF] shadow-[0_0_0_0.5px_rgba(29,29,31,0.06)]">
                  {rest.map((post, index) =>
                    renderPostLink(
                      post,
                      <ArticleRow
                        post={post}
                        date={formatDisplayDate(post.date)}
                        categoryLabel={labelFor(post.category || "general")}
                        tint={getTint(post.category || "general")}
                        description={getPostDescription(post)}
                        isLast={index === rest.length - 1}
                      />,
                      "block rounded-none"
                    )
                  )}
                </div>
              </div>
            </AppleSection>
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
