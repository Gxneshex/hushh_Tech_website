import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fetchCommunityPost, fetchCommunityPosts } from "../src/services/communityContent";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("community GCP runtime contract", () => {
  it("uses same-origin community APIs from the browser", async () => {
    const fetcher = async (url: RequestInfo | URL) => {
      expect(String(url)).toBe("/api/community/posts");
      return new Response(JSON.stringify({ posts: [] }), { status: 200 });
    };

    await expect(fetchCommunityPosts(fetcher as typeof fetch)).resolves.toEqual([]);
  });

  it("uses bearer auth only for NDA community summaries", async () => {
    const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("/api/community/posts?accessLevel=NDA");
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        Authorization: "Bearer signed-token",
      });
      return new Response(JSON.stringify({ posts: [] }), { status: 200 });
    };

    await expect(
      fetchCommunityPosts({
        accessLevel: "NDA",
        accessToken: "signed-token",
        fetcher: fetcher as typeof fetch,
      }),
    ).resolves.toEqual([]);
  });

  it("fetches post details from the same-origin community API", async () => {
    const fetcher = async (url: RequestInfo | URL) => {
      expect(String(url)).toBe("/api/community/posts/general/the-perpetual-alpha-engine");
      return new Response(
        JSON.stringify({
          post: {
            id: "general/the-perpetual-alpha-engine",
            slug: "general/the-perpetual-alpha-engine",
            title: "The Perpetual Alpha Engine",
            date: "2025-12-06",
            publishedAt: "2025-12-06",
            description: "A Technical Blueprint",
            category: "investment & financial strategies",
            accessLevel: "Public",
            status: "published",
            sourceKind: "article",
          },
        }),
        { status: 200 },
      );
    };

    await expect(
      fetchCommunityPost("general/the-perpetual-alpha-engine", fetcher as typeof fetch),
    ).resolves.toMatchObject({
      slug: "general/the-perpetual-alpha-engine",
      title: "The Perpetual Alpha Engine",
    });
  });

  it("passes bearer auth to community post details when available", async () => {
    const fetcher = async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe("/api/community/posts/wa-sensitive-fund-note");
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        Authorization: "Bearer signed-token",
      });
      return new Response(JSON.stringify({ post: null }), { status: 404 });
    };

    await expect(
      fetchCommunityPost("wa-sensitive-fund-note", {
        accessToken: "signed-token",
        fetcher: fetcher as typeof fetch,
      }),
    ).resolves.toBeNull();
  });

  it("keeps community code free of Supabase reports and Vercel config", () => {
    const files = [
      "src/pages/community/logic.ts",
      "src/pages/community/post-logic.ts",
      "src/pages/community/post-ui.tsx",
      "src/services/communityContent.ts",
      "src/components/MarketUpdateGallery.tsx",
      "api/community/content-service.js",
      "server.js",
    ];

    const combined = files.map(readRepoFile).join("\n");

    expect(combined).not.toMatch(/VITE_MARKET_SUPABASE/i);
    expect(combined).not.toMatch(/\/rest\/v1\/reports/i);
    expect(combined).not.toMatch(/vercel\.json/i);
  });

  it("allows the legacy Gamma presentation frame domains while rich decks are still embedded", () => {
    const server = readRepoFile("server.js");

    expect(server).toMatch(/https:\/\/gamma\.app/);
    expect(server).toMatch(/https:\/\/\*\.gamma\.app/);
    expect(server).toMatch(/https:\/\/\*\.gamma\.site/);
  });
});
