import { afterEach, describe, expect, it, vi } from "vitest";

const firestoreDoc = (id: string, fields: Record<string, string>) => ({
  name: `projects/hushh-tech-uat/databases/(default)/documents/community_posts/${id}`,
  fields: Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, { stringValue: value }]),
  ),
});

describe("community GCP pagination", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.doUnmock("googleapis");
  });

  it("lists NDA posts that appear after the first Firestore page", async () => {
    vi.stubEnv("COMMUNITY_CONTENT_BACKEND", "gcp");
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "hushh-tech-uat");
    vi.stubEnv("COMMUNITY_CONTENT_COLLECTION", "community_posts");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

    vi.doMock("googleapis", () => ({
      google: {
        auth: {
          GoogleAuth: class {
            async getClient() {
              return {
                async getRequestHeaders() {
                  return { Authorization: "Bearer gcp-token" };
                },
              };
            }
          },
        },
      },
    }));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "signed-user" }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ signed_at: "2026-06-05T00:00:00.000Z" }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              firestoreDoc("public-first-page", {
                slug: "public-first-page",
                title: "Public First Page",
                publishedAt: "2026-06-01",
                accessLevel: "Public",
                status: "published",
              }),
            ],
            nextPageToken: "page-two",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              firestoreDoc("wa-sensitive-after-first-page", {
                slug: "wa-sensitive-after-first-page",
                title: "WhatsApp Sensitive After First Page",
                publishedAt: "2026-06-05",
                description: "Should be listed for signed NDA users.",
                category: "sensitive documents",
                accessLevel: "NDA",
                status: "published",
                sourceKind: "whatsapp-sensitive",
              }),
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { listCommunityPosts } = await import("../api/community/content-service.js");
    const posts = await listCommunityPosts({
      query: { accessLevel: "NDA" },
      headers: { authorization: "Bearer signed-token" },
    } as any);

    expect(posts).toEqual([
      expect.objectContaining({
        slug: "wa-sensitive-after-first-page",
        accessLevel: "NDA",
        sourceKind: "whatsapp-sensitive",
      }),
    ]);

    const firestoreUrls = fetchMock.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes("firestore.googleapis.com"));
    expect(firestoreUrls).toHaveLength(2);
    expect(firestoreUrls[0]).toContain("pageSize=300");
    expect(firestoreUrls[1]).toContain("pageToken=page-two");
  });
});
