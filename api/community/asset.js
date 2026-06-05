import { isCommunityAccessError, streamCommunityAsset } from "./content-service.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    await streamCommunityAsset(req, res);
  } catch (error) {
    if (isCommunityAccessError(error)) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
}
