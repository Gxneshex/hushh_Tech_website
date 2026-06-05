#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "../..");

const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const PROJECTS = {
  uat: {
    projectId: "hushh-tech-uat",
    collection: "community_posts",
  },
  prod: {
    projectId: "hushh-tech-prod",
    collection: "community_posts",
  },
};

const TARGET = option("target", "uat").trim().toLowerCase();
const BACKEND = option("backend", "local").trim().toLowerCase();
const DATABASE = option("database", "(default)");
const DB_PATH = option("db", "~/wa-blog-poc/data/poc.db").replace(/^~(?=\/|$)/, homedir());
const EXPECTED_COUNT = Number.parseInt(option("expected", "239"), 10);
const AUTH_MODE = option("auth", "adc").trim().toLowerCase();
const DRY_RUN = flag("dry-run");
const ALLOW_PROD = flag("allow-prod");
const CLEANUP_EXISTING = !flag("skip-cleanup-existing");

if (!PROJECTS[TARGET]) throw new Error(`Unsupported target "${TARGET}".`);
if (!["local", "gcp"].includes(BACKEND)) throw new Error(`Unsupported backend "${BACKEND}".`);
if (!["adc", "gcloud"].includes(AUTH_MODE)) throw new Error(`Unsupported auth mode "${AUTH_MODE}".`);
if (TARGET === "prod" && !ALLOW_PROD) {
  throw new Error("Production sensitive publishing is blocked. Use UAT first or pass --allow-prod explicitly.");
}

export const PROVENANCE_MARKER_PATTERN =
  /(?:^|\n)\s*[-*]?\s*(?:\*\*)?(?:Group|Sender|Timestamp|WhatsApp message id|dedupe_hash)(?:\*\*)?\s*:|Source references|immutable provenance/i;

const RAW_ID_PATTERN =
  /\b(?:[0-9A-F]{16,}|[a-f0-9]{40,}|120363\d{8,})\b/i;

const PRIVATE_URL_HOST_PATTERN =
  /\b(?:webex\.com|zoom\.us|meet\.google\.com|calendar\.google\.com|docs\.google\.com|drive\.google\.com)\b/i;

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

const parseJsonField = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const stripDraftBanner = (body) =>
  String(body || "").replace(/^(\s*# [^\n]+\n)> _Draft[^\n]*\n\n?/i, "$1\n");

const stripProvenanceBlock = (body) =>
  body
    .replace(/\n-{3,}\s*\n#{2,4}\s*Source references[^\n]*[\s\S]*$/i, "")
    .replace(/\n#{2,4}\s*Source references[^\n]*[\s\S]*$/i, "");

const normalizeTldr = (body) =>
  body.replace(/^\s*\*\*TL;?DR:\*\*\s*(.+)$/gim, (_match, summary) => summary.trim());

const sanitizePrivateUrls = (body) =>
  body.replace(/https?:\/\/[^\s)>\]]+/gi, (url) => {
    try {
      const parsed = new URL(url);
      if (PRIVATE_URL_HOST_PATTERN.test(parsed.hostname)) {
        return referenceLabelForUrl(parsed.toString());
      }
    } catch {
      return "";
    }
    return url;
  });

const removeMetadataLines = (body) =>
  body
    .split("\n")
    .filter((line) => {
      const normalized = line.trim();
      return !/^[-*]?\s*(?:\*\*)?(?:Group|Sender|Timestamp|WhatsApp message id|dedupe_hash)(?:\*\*)?\s*:/i.test(
        normalized,
      );
    })
    .join("\n");

const tidyMarkdown = (body) =>
  body
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const safeBasename = (value) =>
  String(value || "")
    .split(/[\\/]/)
    .pop()
    .replace(/[`*_#[\]<>]/g, "")
    .trim();

export const referenceLabelForUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./i, "");
    const joined = `${host}${parsed.pathname}`.toLowerCase();

    if (/adp.*webex|webex.*adp/.test(joined)) return "ADP Webex meeting reference";
    if (/webex\.com/i.test(host)) return "Webex meeting reference";
    if (/zoom\.us/i.test(host)) return "Zoom meeting reference";
    if (/meet\.google\.com/i.test(host)) return "Google Meet reference";
    if (/docs\.google\.com|drive\.google\.com/i.test(host)) return "Google document reference";

    return `${host} reference`;
  } catch {
    return "";
  }
};

const sourceAuditForDraft = (draft) => {
  const sourceRefs = parseJsonField(draft.source_refs, {});
  const attachmentPaths = parseJsonField(draft.attachment_paths, []);

  return {
    sourceDraftId: draft.id,
    originalSlug: draft.slug || "",
    originalCategory: draft.category || "",
    originalTargetFolder: draft.target_folder || "",
    group: sourceRefs.group || "",
    sender: sourceRefs.sender || "",
    timestamp: sourceRefs.timestamp || "",
    waMessageId: sourceRefs.wa_message_id || "",
    dedupeHash: sourceRefs.dedupe_hash || "",
    media: Array.isArray(sourceRefs.media) ? sourceRefs.media : [],
    links: Array.isArray(sourceRefs.links) ? sourceRefs.links : [],
    attachmentPaths: Array.isArray(attachmentPaths) ? attachmentPaths : [],
  };
};

export const cleanReferenceLabels = (sourceAudit) => {
  const labels = [];

  for (const media of sourceAudit?.media || []) {
    const filename = safeBasename(media?.original_filename);
    if (filename) labels.push(`Source document: ${filename}`);
  }

  for (const link of sourceAudit?.links || []) {
    const label = referenceLabelForUrl(link?.canonical_url || link?.url || "");
    if (label) labels.push(label);
  }

  if (!labels.length) {
    for (const attachmentPath of sourceAudit?.attachmentPaths || []) {
      const filename = safeBasename(attachmentPath);
      if (filename) labels.push(`Attachment reference: ${filename}`);
    }
  }

  return [...new Set(labels)];
};

const appendCleanReferences = (body, sourceAudit) => {
  const labels = cleanReferenceLabels(sourceAudit);
  if (!labels.length) return body;

  return `${body}\n\n## References\n\n${labels.map((label) => `- ${label}`).join("\n")}`;
};

export const cleanSensitiveBody = (body, sourceAudit = {}) => {
  const cleaned = tidyMarkdown(
    removeMetadataLines(
      sanitizePrivateUrls(normalizeTldr(stripProvenanceBlock(stripDraftBanner(body)))),
    ),
  );

  return appendCleanReferences(cleaned, sourceAudit);
};

export const hasRenderedProvenance = (body) =>
  PROVENANCE_MARKER_PATTERN.test(String(body || "")) || RAW_ID_PATTERN.test(String(body || ""));

const sensitivePayloadForDraft = (draft, slug) => {
  const sourceAudit = sourceAuditForDraft(draft);
  const bodyMarkdown = cleanSensitiveBody(draft.body, sourceAudit);

  if (hasRenderedProvenance(bodyMarkdown)) {
    throw new Error(`Rendered provenance marker remained in ${slug}`);
  }

  return {
    slug,
    title: draft.title,
    description: draft.description || "",
    category: "sensitive documents",
    publishedAt: draft.updated_at || draft.created_at,
    accessLevel: "NDA",
    status: "published",
    sourceKind: "whatsapp-sensitive",
    bodyMarkdown,
    sourceAudit,
    originalTargetFolder: draft.target_folder || "",
    originalCategory: draft.category || "",
    sourceDraftId: draft.id,
  };
};

export const buildSensitivePayloadsFromDrafts = ({
  publicPosts,
  ndaDrafts,
  expectedCount = EXPECTED_COUNT,
}) => {
  const publicTitles = new Set(publicPosts.map((post) => post.title.trim()));
  const publicSourceSlugs = new Set(publicPosts.map((post) => post.slug.trim()));

  const heldSensitive = ndaDrafts.filter(
    (draft) => !publicTitles.has(draft.title.trim()) && !publicSourceSlugs.has(draft.slug.trim()),
  );
  const excludedAsPublic = ndaDrafts.filter((draft) => !heldSensitive.includes(draft));

  if (heldSensitive.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} held sensitive drafts, got ${heldSensitive.length}. ` +
        `NDA drafts=${ndaDrafts.length}, already-public=${ndaDrafts.length - heldSensitive.length}.`,
    );
  }

  const slugs = new Set();
  const payloads = heldSensitive.map((draft) => {
    const slug = `wa-sensitive-${slugify(draft.slug || draft.title)}`;
    if (slugs.has(slug)) throw new Error(`Duplicate sensitive slug generated: ${slug}`);
    slugs.add(slug);

    return sensitivePayloadForDraft(draft, slug);
  });

  return {
    payloads,
    heldSensitive,
    excludedAsPublic,
    summary: {
      publicWhatsappPosts: publicPosts.length,
      ndaDrafts: ndaDrafts.length,
      alreadyPublicFromNda: ndaDrafts.length - heldSensitive.length,
      heldSensitive: heldSensitive.length,
      byOriginalFolder: heldSensitive.reduce((acc, draft) => {
        acc[draft.target_folder] = (acc[draft.target_folder] || 0) + 1;
        return acc;
      }, {}),
    },
  };
};

const readPublicWhatsappPosts = () => {
  const source = readFileSync(join(root, "src/data/whatsappCommunityPosts.ts"), "utf8");
  const start = source.indexOf("export const whatsappCommunityPosts");
  if (start < 0) throw new Error("Could not find whatsappCommunityPosts export.");
  const arraySource = source.slice(source.indexOf("[", start), source.lastIndexOf("];") + 1);
  return vm.runInNewContext(arraySource);
};

const readNdaDrafts = () => {
  const query = `
    select id, title, slug, description, body, target_folder, category, access_level,
           status, source_refs, attachment_paths, created_at, updated_at
    from blog_drafts
    where access_level = 'NDA'
    order by created_at asc;
  `;
  const output = execFileSync("sqlite3", ["-json", DB_PATH, query], { encoding: "utf8" });
  return JSON.parse(output || "[]");
};

const buildPayloads = () => {
  const publicPosts = readPublicWhatsappPosts();
  const ndaDrafts = readNdaDrafts();
  const { payloads, heldSensitive, excludedAsPublic, summary } = buildSensitivePayloadsFromDrafts({
    publicPosts,
    ndaDrafts,
    expectedCount: EXPECTED_COUNT,
  });

  return {
    payloads,
    summary,
    allNdaDraftIds: ndaDrafts.map((draft) => draft.id),
    heldSensitiveDraftIds: heldSensitive.map((draft) => draft.id),
    excludedPublicDraftIds: excludedAsPublic.map((draft) => draft.id),
  };
};

const firestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])),
      },
    };
  }
  return { stringValue: String(value) };
};

const firestoreDoc = (payload) => ({
  fields: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, firestoreValue(value)])),
});

const getGcpAuthHeaders = async () => {
  if (AUTH_MODE === "gcloud") {
    const token = execFileSync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" }).trim();
    return { Authorization: `Bearer ${token}` };
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  return client.getRequestHeaders();
};

const documentBaseUrl = () => {
  const target = PROJECTS[TARGET];
  return (
    `https://firestore.googleapis.com/v1/projects/${target.projectId}` +
    `/databases/${encodeURIComponent(DATABASE)}/documents/${target.collection}`
  );
};

const fieldValue = (field) => {
  if (!field) return undefined;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number.parseInt(field.integerValue, 10);
  if ("doubleValue" in field) return Number(field.doubleValue);
  if ("booleanValue" in field) return Boolean(field.booleanValue);
  if ("timestampValue" in field) return field.timestampValue;
  if ("arrayValue" in field) return (field.arrayValue.values || []).map(fieldValue);
  if ("mapValue" in field) {
    return Object.fromEntries(
      Object.entries(field.mapValue.fields || {}).map(([key, value]) => [key, fieldValue(value)]),
    );
  }
  return undefined;
};

const listExistingDocs = async (headers) => {
  const docs = [];
  let pageToken = "";
  do {
    const url = new URL(documentBaseUrl());
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to list existing community docs: HTTP ${response.status} ${await response.text()}`);
    }
    const payload = await response.json();
    docs.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return docs.map((doc) => ({
    name: doc.name,
    id: doc.name.split("/").pop(),
    fields: Object.fromEntries(Object.entries(doc.fields || {}).map(([key, value]) => [key, fieldValue(value)])),
  }));
};

const patchFields = async (docId, fields, headers, updateMask = []) => {
  const url = new URL(`${documentBaseUrl()}/${encodeURIComponent(docId)}`);
  updateMask.forEach((fieldPath) => url.searchParams.append("updateMask.fieldPaths", fieldPath));
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(firestoreDoc(fields)),
  });
  if (!response.ok) {
    throw new Error(`Failed to patch ${docId}: HTTP ${response.status} ${await response.text()}`);
  }
};

const hideExistingWhatsappNdaDocs = async (allNdaDraftIds, headers) => {
  if (!CLEANUP_EXISTING) return { hiddenExistingWhatsappNdaDocs: 0 };

  const allDraftIds = new Set(allNdaDraftIds);
  const existing = await listExistingDocs(headers);
  const staleDocs = existing.filter((doc) => {
    const draftId = doc.fields?.whatsappDraft?.draftId || doc.fields?.sourceDraftId;
    return allDraftIds.has(draftId) && doc.fields?.accessLevel === "NDA" && doc.fields?.status !== "draft";
  });

  if (DRY_RUN) return { hiddenExistingWhatsappNdaDocs: staleDocs.length };

  for (const doc of staleDocs) {
    await patchFields(doc.id, { status: "draft" }, headers, ["status"]);
  }

  return { hiddenExistingWhatsappNdaDocs: staleDocs.length };
};

const publishToGcp = async (payloads, allNdaDraftIds) => {
  const headers = await getGcpAuthHeaders();
  const cleanupSummary = await hideExistingWhatsappNdaDocs(allNdaDraftIds, headers);
  if (DRY_RUN) return cleanupSummary;

  for (const payload of payloads) {
    const url = `${documentBaseUrl()}/${encodeURIComponent(payload.slug)}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firestoreDoc(payload)),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to publish ${payload.slug}: HTTP ${response.status} ${text}`);
    }
  }

  return cleanupSummary;
};

const main = async () => {
  const { payloads, summary, allNdaDraftIds } = buildPayloads();
  const outputDir = join(root, "tmp", "whatsapp-sensitive-community");
  const outputPath = join(outputDir, `payloads-${TARGET}.json`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify({ summary, payloads }, null, 2) + "\n");

  let gcpSummary = {};
  if (BACKEND === "gcp") {
    gcpSummary = await publishToGcp(payloads, allNdaDraftIds);
  }

  console.log(
    JSON.stringify(
      {
        target: TARGET,
        backend: BACKEND,
        dryRun: DRY_RUN,
        authMode: AUTH_MODE,
        outputPath,
        ...gcpSummary,
        ...summary,
      },
      null,
      2,
    ),
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
