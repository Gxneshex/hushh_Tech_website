export interface CommunityMediaItem {
  name?: string;
  url: string;
  type?: "image" | "video";
  alt?: string;
}

export interface CommunityPostSummary {
  id: string;
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  description: string;
  category: string;
  accessLevel: string;
  status: string;
  sourceKind: "article" | "deck" | "document" | "legacy" | string;
  componentName?: string;
  assetUrl?: string;
  mediaItems?: CommunityMediaItem[];
}

export interface CommunityPostDetail extends CommunityPostSummary {
  bodyMarkdown?: string;
  bodyHtml?: string;
}

export class CommunityContentError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CommunityContentError";
    this.status = status;
  }
}

interface CommunityFetchOptions {
  accessLevel?: "Public" | "NDA";
  accessToken?: string;
  fetcher?: typeof fetch;
}

const resolveOptions = (
  optionsOrFetcher?: CommunityFetchOptions | typeof fetch,
): Required<Pick<CommunityFetchOptions, "fetcher">> & Omit<CommunityFetchOptions, "fetcher"> => {
  if (typeof optionsOrFetcher === "function") {
    return { fetcher: optionsOrFetcher };
  }

  return { fetcher: fetch, ...(optionsOrFetcher || {}) };
};

const authenticatedHeaders = (accessToken?: string) => ({
  Accept: "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

export const fetchCommunityPosts = async (
  optionsOrFetcher: CommunityFetchOptions | typeof fetch = fetch,
): Promise<CommunityPostSummary[]> => {
  const { fetcher, accessLevel, accessToken } = resolveOptions(optionsOrFetcher);
  const url = accessLevel === "NDA" ? "/api/community/posts?accessLevel=NDA" : "/api/community/posts";
  const response = await fetcher(url, {
    headers: authenticatedHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new CommunityContentError(
      response.status,
      `Community posts request failed with HTTP ${response.status}`,
    );
  }

  const payload = (await response.json()) as { posts?: CommunityPostSummary[] };
  return payload.posts || [];
};

export const fetchCommunityPost = async (
  slug: string,
  optionsOrFetcher: CommunityFetchOptions | typeof fetch = fetch,
): Promise<CommunityPostDetail | null> => {
  const { fetcher, accessToken } = resolveOptions(optionsOrFetcher);
  const encodedSlug = slug.split("/").map(encodeURIComponent).join("/");
  const response = await fetcher(`/api/community/posts/${encodedSlug}`, {
    headers: authenticatedHeaders(accessToken),
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new CommunityContentError(
      response.status,
      `Community post request failed with HTTP ${response.status}`,
    );
  }

  const payload = (await response.json()) as { post?: CommunityPostDetail };
  return payload.post || null;
};
