import { afterEach, describe, expect, it, vi } from "vitest";
import postsHandler from "../api/community/posts.js";
import postDetailHandler from "../api/community/post-detail.js";
import { normalizePost } from "../api/community/content-service.js";

const createRes = () => {
  const res: any = {
    statusCode: 200,
    headers: new Map<string, string>(),
    payload: undefined,
    setHeader: vi.fn((key: string, value: string) => {
      res.headers.set(key, value);
    }),
    status: vi.fn((statusCode: number) => {
      res.statusCode = statusCode;
      return res;
    }),
    json: vi.fn((payload: unknown) => {
      res.payload = payload;
      return res;
    }),
  };
  return res;
};

describe("community API routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns public community posts from the Cloud Run API fallback", async () => {
    const res = createRes();

    await postsHandler({ method: "GET" } as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.posts.length).toBeGreaterThan(0);
    expect(res.payload.posts[0]).not.toHaveProperty("bodyMarkdown");
    expect(res.payload.posts.some((post: any) => post.slug === "general/the-perpetual-alpha-engine")).toBe(true);
  });

  it("returns a post detail by slash slug", async () => {
    const res = createRes();

    await postDetailHandler(
      {
        method: "GET",
        params: { 0: "general/the-perpetual-alpha-engine" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload.post).toMatchObject({
      slug: "general/the-perpetual-alpha-engine",
      title: "The Perpetual Alpha Engine",
      accessLevel: "Public",
      sourceKind: "deck",
    });
  });

  it("does not list NDA community posts without a signed session", async () => {
    const res = createRes();

    await postsHandler(
      {
        method: "GET",
        query: { accessLevel: "NDA" },
        headers: {},
      } as any,
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "NDA access requires sign-in" });
  });

  it("does not return an NDA post detail without a signed session", async () => {
    const res = createRes();

    await postDetailHandler(
      {
        method: "GET",
        params: { 0: "funds/fund-performance" },
        headers: {},
      } as any,
      res,
    );

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({ error: "NDA access requires sign-in" });
  });

  it("returns NDA summaries only after the bearer token has a signed NDA row", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "signed-user" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([{ signed_at: "2026-06-05T00:00:00.000Z" }]), {
            status: 200,
          }),
        ),
    );
    const res = createRes();

    await postsHandler(
      {
        method: "GET",
        query: { accessLevel: "NDA" },
        headers: { authorization: "Bearer signed-token" },
      } as any,
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.payload.posts.length).toBeGreaterThan(0);
    expect(res.payload.posts.every((post: any) => post.accessLevel === "NDA")).toBe(true);
    expect(res.payload.posts[0]).not.toHaveProperty("bodyMarkdown");
  });

  it("normalizes media object names to same-origin community asset URLs", () => {
    const post = normalizePost({
      slug: "market/hushh-market-update-7-april",
      title: "Hushh Market Update - 7 April",
      publishedAt: "2025-04-07",
      mediaItems: [
        "market-updates/dmu7apr/1.png",
        {
          object: "market-updates/dmu7apr/m2.png",
          alt: "Momentum chart",
        },
      ],
    });

    expect(post.mediaItems).toEqual([
      {
        name: "1.png",
        url: "/api/community/assets/market-updates/dmu7apr/1.png",
        type: "image",
        alt: "",
      },
      {
        name: "m2.png",
        url: "/api/community/assets/market-updates/dmu7apr/m2.png",
        type: "image",
        alt: "Momentum chart",
      },
    ]);
  });

  it("does not treat missing access levels as public", () => {
    expect(
      normalizePost({
        slug: "missing-access",
        title: "Missing Access",
        publishedAt: "2026-06-05",
      }).accessLevel,
    ).toBe("");
  });

  it("does not expose private WhatsApp audit metadata through normalized posts", () => {
    const post = normalizePost({
      slug: "wa-sensitive-general-adp-call-scheduled-for-1099-support",
      title: "ADP Call Scheduled for 1099 Support",
      publishedAt: "2026-05-18",
      accessLevel: "NDA",
      sourceKind: "whatsapp-sensitive",
      sourceAudit: {
        sender: "120363301133443224",
        waMessageId: "3A3EACCA6562CAFD98E4",
      },
    } as any);

    expect(post).not.toHaveProperty("sourceAudit");
    expect(JSON.stringify(post)).not.toContain("120363301133443224");
    expect(JSON.stringify(post)).not.toContain("3A3EACCA6562CAFD98E4");
  });
});
