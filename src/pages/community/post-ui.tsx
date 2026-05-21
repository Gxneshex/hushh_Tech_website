/**
 * Community Post — UI / Presentation (Revamped)
 * Apple iOS colors, Playfair Display headings, proper English.
 * Matches Home + Fund A design language.
 * Logic stays in post-logic.ts — zero data here.
 */
import ReactMarkdown from "react-markdown";
import { useCommunityPostLogic } from "./post-logic";
import HushhTechBackHeader from "../../components/hushh-tech-back-header/HushhTechBackHeader";
import HushhTechFooter, {
  HushhFooterTab,
} from "../../components/hushh-tech-footer/HushhTechFooter";

/* ── Playfair heading style ── */
const playfair = { fontFamily: "'Playfair Display', serif" };

export default function CommunityPostPage() {
  const { post, legacyPost, loading, handleBack } = useCommunityPostLogic();

  /* loading state */
  if (loading) {
    return (
      <div
        className="bg-white min-h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-8 h-8 border-2 border-gray-200 border-t-hushh-blue rounded-full animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">Loading community article</span>
      </div>
    );
  }

  if (!post) return null;

  const LegacyPostComponent =
    legacyPost && typeof legacyPost.Component !== "string"
      ? legacyPost.Component
      : null;
  const legacyPostLayoutClassName =
    post.sourceKind === "deck"
      ? "flex-1 w-full pb-24"
      : "flex-1 max-w-[900px] mx-auto w-full px-4 md:px-8 py-6 md:py-10 pb-32";

  /* ── Document Post ── */
  if (post.sourceKind === "document" && post.assetUrl) {
    return (
      <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
        <HushhTechBackHeader
          onBackClick={handleBack}
          rightType="hamburger"
        />

        <main className="flex-1 px-4 md:px-8 py-4 pb-32">
          <h1
            className="sr-only"
            style={playfair}
          >
            {post.title}
          </h1>
          <iframe
            src={`${post.assetUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-[calc(100vh-120px)] min-h-[70vh] rounded-2xl border border-gray-200 bg-white"
            title={post.title}
          />
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
      <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
        <HushhTechBackHeader
          onBackClick={handleBack}
          rightType="hamburger"
        />

        <main className={legacyPostLayoutClassName}>
          <LegacyPostComponent />
        </main>

        <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
      </div>
    );
  }

  if (post.bodyMarkdown || post.bodyHtml || post.sourceKind === "deck") {
    return (
      <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
        <HushhTechBackHeader
          onBackClick={handleBack}
          rightType="hamburger"
        />

        <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-8 py-8 md:py-12 pb-32">
          <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-hushh-blue/70 mb-3">
            {post.category}
          </p>
          <h1
            className="text-[2.35rem] md:text-[3.1rem] leading-[1.1] font-normal text-black tracking-tight font-serif mb-4"
            style={playfair}
          >
            {post.title}
          </h1>
          <p className="text-[14px] text-gray-500 font-light leading-relaxed mb-10 max-w-2xl">
            {post.description}
          </p>

          {post.bodyHtml ? (
            <article
              className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-hushh-blue"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          ) : (
            <article className="prose prose-neutral max-w-none prose-headings:font-serif prose-a:text-hushh-blue">
              <ReactMarkdown>{post.bodyMarkdown || ""}</ReactMarkdown>
            </article>
          )}
        </main>

        <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
      </div>
    );
  }

  if (!LegacyPostComponent) return null;

  return (
    <div className="bg-white text-gray-900 min-h-screen antialiased flex flex-col selection:bg-hushh-blue selection:text-white">
      <HushhTechBackHeader
        onBackClick={handleBack}
        rightType="hamburger"
      />

      <main className={legacyPostLayoutClassName}>
        <LegacyPostComponent />
      </main>

      <HushhTechFooter activeTab={HushhFooterTab.COMMUNITY} />
    </div>
  );
}
