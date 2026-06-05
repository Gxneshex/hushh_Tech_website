import {
  isCommunityAccessError,
  listCommunityPosts,
  requestAccessLevel,
  setCommunityCacheHeaders,
} from "./content-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const accessLevel = requestAccessLevel(req);
    const posts = await listCommunityPosts(req);
    setCommunityCacheHeaders(res, { privateContent: accessLevel === "NDA" });
    res.status(200).json({
      posts: posts.map(({ bodyMarkdown, bodyHtml, ...post }) => post),
    });
  } catch (error) {
    if (isCommunityAccessError(error)) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
}
