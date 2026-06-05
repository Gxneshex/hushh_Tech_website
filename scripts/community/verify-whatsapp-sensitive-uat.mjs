#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const option = (name, fallback = "") => {
  const prefix = `--${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const TARGET = option("target", "uat").trim().toLowerCase();
const EXPECTED_COUNT = Number.parseInt(option("expected", "239"), 10);
const BASE_URL = option(
  "base-url",
  TARGET === "prod" ? "https://hushhtech.com" : "https://uat.hushhtech.com",
).replace(/\/+$/, "");
const SECRET_PROJECT = option("secret-project", "53407187172");
const SKIP_BROWSER = flag("skip-browser");

if (!["uat", "prod"].includes(TARGET)) {
  throw new Error(`Unsupported target "${TARGET}".`);
}
if (TARGET === "prod" && !flag("allow-prod")) {
  throw new Error("Production verification is blocked unless --allow-prod is explicit.");
}

const FORBIDDEN_BODY_PATTERN =
  /(?:^|\n)\s*[-*]?\s*(?:\*\*)?(?:Group|Sender|Timestamp|WhatsApp message id|dedupe_hash)(?:\*\*)?\s*:|Source references|immutable provenance|Draft - review before publishing|Draft — review before publishing/i;
const RAW_SOURCE_ID_PATTERN = /\b(?:[0-9A-F]{16,}|[a-f0-9]{40,}|120363\d{8,})\b/i;
const MIN_ARTICLE_TEXT_LENGTH = 250;
const ADP_TITLE = "ADP Call Scheduled for 1099 Support";

const secret = (name) =>
  process.env[name] ||
  execFileSync(
    "gcloud",
    ["secrets", "versions", "access", "latest", `--project=${SECRET_PROJECT}`, `--secret=${name}`],
    { encoding: "utf8" },
  ).trim();

const fail = (message, extra = {}) => {
  console.error(JSON.stringify({ ok: false, message, ...extra }, null, 2));
  process.exitCode = 1;
  throw new Error(message);
};

const markdownTextLength = (value) =>
  String(value || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text in the returned object for debugging.
  }
  return { response, text, json };
};

const main = async () => {
  const startedAt = new Date().toISOString();
  const supabaseUrl = secret("SUPABASE_URL").replace(/\/+$/, "");
  const serviceKey = secret("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = secret("SUPABASE_ANON_KEY");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  if (projectRef !== "ibsisfnjxeowvdtvgzff") {
    fail("Unexpected Supabase project ref", { projectRef });
  }

  let userId = "";
  const adminRequest = (path, options = {}) =>
    requestJson(`${supabaseUrl}${path}`, {
      ...options,
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });
  const cleanup = async () => {
    if (!userId) return;
    await adminRequest(`/rest/v1/nda_signatures?user_id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
  };

  try {
    const denied = await requestJson(`${BASE_URL}/api/community/posts?accessLevel=NDA&limit=1000`, {
      headers: { accept: "application/json" },
    });
    if (denied.response.status !== 401) {
      fail("Unsigned NDA list did not fail closed", {
        status: denied.response.status,
        body: denied.json || denied.text.slice(0, 300),
      });
    }

    const email = `uat-wa-sensitive-audit-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@example.hushh.ai`;
    const password = `Hushh-UAT-${crypto.randomBytes(14).toString("base64url")}1!`;
    const create = await adminRequest("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { smoke: "wa-sensitive-article-repair" },
      }),
    });
    if (!create.response.ok || !create.json?.id) {
      fail("Could not create temporary audit user", {
        status: create.response.status,
        body: create.json || create.text.slice(0, 300),
      });
    }
    userId = create.json.id;

    const login = await requestJson(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!login.response.ok || !login.json?.access_token) {
      fail("Could not sign in temporary audit user", {
        status: login.response.status,
        body: login.json || login.text.slice(0, 300),
      });
    }
    const session = {
      ...login.json,
      expires_at: Math.floor(Date.now() / 1000) + Number(login.json.expires_in || 3600),
    };
    const token = session.access_token;

    const sign = await requestJson(`${supabaseUrl}/rest/v1/rpc/sign_global_nda`, {
      method: "POST",
      headers: { apikey: anonKey, authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        p_signer_name: "UAT WhatsApp Sensitive Article Audit",
        p_nda_version: "uat-audit-wa-sensitive-article-repair",
        p_signer_ip: "127.0.0.1",
        p_documents_acknowledged: [],
        p_consent_version: "uat-audit",
      }),
    });
    if (!sign.response.ok || sign.json?.success !== true) {
      fail("Could not sign NDA for temporary audit user", {
        status: sign.response.status,
        body: sign.json || sign.text.slice(0, 300),
      });
    }

    const list = await requestJson(`${BASE_URL}/api/community/posts?accessLevel=NDA&limit=1000`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    const posts = Array.isArray(list.json?.posts) ? list.json.posts : [];
    const waPosts = posts.filter(
      (post) => post.sourceKind === "whatsapp-sensitive" || String(post.slug || "").startsWith("wa-sensitive-"),
    );
    if (list.response.status !== 200 || waPosts.length !== EXPECTED_COUNT) {
      fail("Signed NDA list did not return expected WhatsApp-sensitive posts", {
        status: list.response.status,
        totalSensitive: posts.length,
        whatsappSensitive: waPosts.length,
        expected: EXPECTED_COUNT,
      });
    }

    const failures = [];
    const concurrency = 12;
    for (let index = 0; index < waPosts.length; index += concurrency) {
      const batch = waPosts.slice(index, index + concurrency);
      const results = await Promise.all(
        batch.map(async (post) => {
          const detail = await requestJson(`${BASE_URL}/api/community/posts/${encodeURIComponent(post.slug)}`, {
            headers: { accept: "application/json", authorization: `Bearer ${token}` },
          });
          const item = detail.json?.post || {};
          const body = String(item.bodyMarkdown || item.bodyHtml || "");
          return {
            slug: post.slug,
            title: post.title,
            status: detail.response.status,
            forbiddenMetadata: FORBIDDEN_BODY_PATTERN.test(body) || RAW_SOURCE_ID_PATTERN.test(body),
            bodyLength: markdownTextLength(body),
            sourceAuditLeaked: JSON.stringify(item).includes("sourceAudit"),
          };
        }),
      );
      failures.push(
        ...results.filter(
          (result) =>
            result.status !== 200 ||
            result.forbiddenMetadata ||
            result.bodyLength < MIN_ARTICLE_TEXT_LENGTH ||
            result.sourceAuditLeaked,
        ),
      );
    }
    if (failures.length) {
      fail("One or more WhatsApp-sensitive details failed article-quality verification", {
        failures: failures.length,
        sampleFailures: failures.slice(0, 5),
      });
    }

    const adp = waPosts.find((post) => post.title === ADP_TITLE);
    if (!adp) {
      fail("ADP article was not present in WhatsApp-sensitive list");
    }

    let browserSmoke = { skipped: SKIP_BROWSER };
    if (!SKIP_BROWSER) {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext({ viewport: { width: 1180, height: 780 } });
        await context.addInitScript(
          ({ projectRef: ref, authSession }) => {
            window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(authSession));
          },
          { projectRef, authSession: session },
        );
        await context.route("**/*", (route) => {
          const type = route.request().resourceType();
          if (["image", "media", "font"].includes(type)) return route.abort();
          return route.continue();
        });
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        await page.goto(`${BASE_URL}/community/${adp.slug}`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction((title) => document.body?.innerText.includes(title), ADP_TITLE);
        const bodyText = await page.locator("body").innerText();
        browserSmoke = {
          skipped: false,
          url: page.url(),
          titleRendered: bodyText.includes(ADP_TITLE),
          referencesRendered: bodyText.includes("References") && bodyText.includes("ADP Webex meeting reference"),
          forbiddenMetadata: FORBIDDEN_BODY_PATTERN.test(bodyText) || RAW_SOURCE_ID_PATTERN.test(bodyText),
        };
        if (!browserSmoke.titleRendered || !browserSmoke.referencesRendered || browserSmoke.forbiddenMetadata) {
          fail("ADP browser smoke failed", browserSmoke);
        }
      } finally {
        await browser.close();
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          target: TARGET,
          baseUrl: BASE_URL,
          startedAt,
          finishedAt: new Date().toISOString(),
          publicGate: { unsignedNdaStatus: denied.response.status },
          signedNda: {
            totalSensitive: posts.length,
            whatsappSensitive: waPosts.length,
            detailChecked: waPosts.length,
            failures: 0,
          },
          adp: {
            slug: adp.slug,
            url: `${BASE_URL}/community/${adp.slug}`,
          },
          browserSmoke,
          temporaryUserDeleted: true,
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanup();
  }
};

main().catch((error) => {
  if (!process.exitCode) {
    console.error(JSON.stringify({ ok: false, message: error.message }, null, 2));
    process.exitCode = 1;
  }
});
