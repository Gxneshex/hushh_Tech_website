/**
 * /api/deployments — internal deployments dashboard data source.
 *
 * Lists Cloud Run revisions for the website service across UAT + PROD using the
 * runtime service account (ADC, same pattern as api/metrics). Each revision maps
 * to a "deployment": when it was created, whether it is currently live (serving
 * traffic), and its per-build URL (the Cloud Run revision TAG url, if tagged).
 *
 * Gated by a password (env DEPLOYMENTS_DASHBOARD_PASSWORD, default '123456') so
 * the deploy list is not world-readable even though the page gate is client-side.
 */
import { google } from "googleapis";

const SERVICE = "hushh-tech-website";
const REGION = "us-central1";
const PROJECTS = [
  { env: "PROD", project: "hushh-tech-prod" },
  { env: "UAT", project: "hushh-tech-uat" },
];
const PASSWORD = process.env.DEPLOYMENTS_DASHBOARD_PASSWORD || "123456";
const MAX_PER_ENV = 50;

async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  const token = typeof res === "string" ? res : res && res.token;
  if (!token) throw new Error("Could not obtain Google access token");
  return token;
}

async function runApi(path, token) {
  const r = await fetch(`https://run.googleapis.com/v2/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Cloud Run API ${r.status}: ${text.slice(0, 180)}`);
  }
  return r.json();
}

async function listEnv({ env, project }, token) {
  const base = `projects/${project}/locations/${REGION}/services/${SERVICE}`;

  // Service → observed traffic (which revision is live) + tag URLs.
  const svc = await runApi(base, token);
  const statuses = Array.isArray(svc.trafficStatuses) ? svc.trafficStatuses : [];
  const liveRevisions = new Set(
    statuses.filter((s) => (s.percent || 0) > 0 && s.revision).map((s) => s.revision),
  );
  const tagUrlByRevision = {};
  for (const s of statuses) {
    if (s.revision && s.uri && s.tag) tagUrlByRevision[s.revision] = s.uri;
  }

  // Revisions → the deployment history.
  const revResp = await runApi(`${base}/revisions?pageSize=${MAX_PER_ENV}`, token);
  const revisions = Array.isArray(revResp.revisions) ? revResp.revisions : [];

  return revisions.map((rev) => {
    const short = String(rev.name || "").split("/").pop();
    return {
      env,
      revision: short,
      createdAt: rev.createTime || null,
      isLive: liveRevisions.has(short),
      buildUrl: tagUrlByRevision[short] || null,
      image: (rev.containers && rev.containers[0] && rev.containers[0].image) || null,
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const password =
    (req.body && req.body.password) || req.headers["x-dashboard-password"] || "";
  if (password !== PASSWORD) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const token = await getAccessToken();
    const results = await Promise.allSettled(PROJECTS.map((p) => listEnv(p, token)));
    const deployments = [];
    const errors = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") deployments.push(...r.value);
      else errors.push({ env: PROJECTS[i].env, error: String((r.reason && r.reason.message) || r.reason) });
    });
    deployments.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
    return res.status(200).json({ success: true, deployments, errors });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: String((err && err.message) || err) });
  }
}
