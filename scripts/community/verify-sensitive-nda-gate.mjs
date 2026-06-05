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
const EXPECTED_MIN = Number.parseInt(option("expected-min", "1"), 10);
const BASE_URL = option(
  "base-url",
  TARGET === "prod" ? "https://hushhtech.com" : "https://uat.hushhtech.com",
).replace(/\/+$/, "");
const SECRET_PROJECT = option("secret-project", "53407187172");
const KNOWN_NDA_SLUG = option("known-slug", "funds/fund-performance");
const SKIP_BROWSER = flag("skip-browser");

if (!["uat", "prod"].includes(TARGET)) {
  throw new Error(`Unsupported target "${TARGET}".`);
}
if (TARGET === "prod" && !flag("allow-prod")) {
  throw new Error("Production verification is blocked unless --allow-prod is explicit.");
}

const secret = (name) =>
  process.env[name] ||
  execFileSync(
    "gcloud",
    ["secrets", "versions", "access", "latest", `--project=${SECRET_PROJECT}`, `--secret=${name}`],
    { encoding: "utf8" },
  ).trim();

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Raw text stays available for debugging.
  }
  return { response, text, json };
};

const fail = (message, extra = {}) => {
  console.error(JSON.stringify({ ok: false, message, ...extra }, null, 2));
  process.exitCode = 1;
  throw new Error(message);
};

const assertStatus = (label, actual, expected, extra = {}) => {
  if (actual !== expected) {
    fail(`${label} returned HTTP ${actual}, expected ${expected}`, extra);
  }
};

const main = async () => {
  const startedAt = new Date().toISOString();
  const supabaseUrl = secret("SUPABASE_URL").replace(/\/+$/, "");
  const serviceKey = secret("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = secret("SUPABASE_ANON_KEY");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

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

  let result = null;
  const cleanup = async () => {
    if (!userId) return true;
    await adminRequest(`/rest/v1/nda_signatures?user_id=eq.${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    const deleted = await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
    return deleted.response.ok;
  };

  try {
    const publicList = await requestJson(`${BASE_URL}/api/community/posts`, {
      headers: { accept: "application/json" },
    });
    assertStatus("Public community list", publicList.response.status, 200, {
      body: publicList.json || publicList.text.slice(0, 300),
    });
    const publicPosts = Array.isArray(publicList.json?.posts) ? publicList.json.posts : [];
    if (!publicPosts.length || publicPosts.some((post) => post.accessLevel === "NDA")) {
      fail("Public community list leaked NDA posts or returned no posts", {
        publicCount: publicPosts.length,
        leakedNda: publicPosts.filter((post) => post.accessLevel === "NDA").slice(0, 5),
      });
    }

    const deniedList = await requestJson(`${BASE_URL}/api/community/posts?accessLevel=NDA`, {
      headers: { accept: "application/json" },
    });
    assertStatus("Unsigned NDA list", deniedList.response.status, 401, {
      body: deniedList.json || deniedList.text.slice(0, 300),
    });

    const deniedAlias = await requestJson(`${BASE_URL}/api/community/posts?access=sensitive`, {
      headers: { accept: "application/json" },
    });
    assertStatus("Unsigned sensitive alias list", deniedAlias.response.status, 401, {
      body: deniedAlias.json || deniedAlias.text.slice(0, 300),
    });

    const deniedKnownDetail = await requestJson(
      `${BASE_URL}/api/community/posts/${KNOWN_NDA_SLUG.split("/").map(encodeURIComponent).join("/")}`,
      { headers: { accept: "application/json" } },
    );
    assertStatus("Unsigned known NDA detail", deniedKnownDetail.response.status, 401, {
      body: deniedKnownDetail.json || deniedKnownDetail.text.slice(0, 300),
    });

    const email = `uat-sensitive-nda-gate-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@example.hushh.ai`;
    const password = `Hushh-UAT-${crypto.randomBytes(14).toString("base64url")}1!`;
    const create = await adminRequest("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { smoke: "sensitive-nda-gate" },
      }),
    });
    if (!create.response.ok || !create.json?.id) {
      fail("Could not create temporary gate user", {
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
      fail("Could not sign in temporary gate user", {
        status: login.response.status,
        body: login.json || login.text.slice(0, 300),
      });
    }
    const session = {
      ...login.json,
      expires_at: Math.floor(Date.now() / 1000) + Number(login.json.expires_in || 3600),
    };
    const token = session.access_token;

    const unsignedList = await requestJson(`${BASE_URL}/api/community/posts?accessLevel=NDA`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    assertStatus("Authenticated unsigned NDA list", unsignedList.response.status, 403, {
      body: unsignedList.json || unsignedList.text.slice(0, 300),
    });

    const unsignedDetail = await requestJson(
      `${BASE_URL}/api/community/posts/${KNOWN_NDA_SLUG.split("/").map(encodeURIComponent).join("/")}`,
      { headers: { accept: "application/json", authorization: `Bearer ${token}` } },
    );
    assertStatus("Authenticated unsigned NDA detail", unsignedDetail.response.status, 403, {
      body: unsignedDetail.json || unsignedDetail.text.slice(0, 300),
    });

    const unsignedStatus = await requestJson(
      `${supabaseUrl}/rest/v1/nda_signatures?select=signed_at&signed_at=not.is.null&limit=1`,
      {
        headers: { apikey: anonKey, authorization: `Bearer ${token}`, accept: "application/json" },
      },
    );
    assertStatus("Unsigned UI access-status query", unsignedStatus.response.status, 200, {
      body: unsignedStatus.json || unsignedStatus.text.slice(0, 300),
    });
    if (Array.isArray(unsignedStatus.json) && unsignedStatus.json.some((row) => row?.signed_at)) {
      fail("Temporary user unexpectedly had signed NDA access before signing");
    }

    const sign = await requestJson(`${supabaseUrl}/rest/v1/rpc/sign_global_nda`, {
      method: "POST",
      headers: { apikey: anonKey, authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        p_signer_name: "UAT Sensitive NDA Gate Audit",
        p_nda_version: "uat-sensitive-gate-audit",
        p_signer_ip: "127.0.0.1",
        p_documents_acknowledged: [],
        p_consent_version: "uat-audit",
      }),
    });
    if (!sign.response.ok || sign.json?.success !== true) {
      fail("Could not sign NDA for temporary gate user", {
        status: sign.response.status,
        body: sign.json || sign.text.slice(0, 300),
      });
    }

    const signedStatus = await requestJson(
      `${supabaseUrl}/rest/v1/nda_signatures?select=signed_at&signed_at=not.is.null&limit=1`,
      {
        headers: { apikey: anonKey, authorization: `Bearer ${token}`, accept: "application/json" },
      },
    );
    assertStatus("Signed UI access-status query", signedStatus.response.status, 200, {
      body: signedStatus.json || signedStatus.text.slice(0, 300),
    });
    if (!Array.isArray(signedStatus.json) || !signedStatus.json.some((row) => row?.signed_at)) {
      fail("Signed NDA row was not visible to the temporary user");
    }

    const signedList = await requestJson(`${BASE_URL}/api/community/posts?accessLevel=NDA`, {
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
    });
    assertStatus("Signed NDA list", signedList.response.status, 200, {
      body: signedList.json || signedList.text.slice(0, 300),
    });
    if (signedList.response.headers.get("cache-control") !== "private, no-store") {
      fail("Signed NDA list did not use private no-store cache headers", {
        cacheControl: signedList.response.headers.get("cache-control"),
      });
    }
    const ndaPosts = Array.isArray(signedList.json?.posts) ? signedList.json.posts : [];
    if (ndaPosts.length < EXPECTED_MIN || ndaPosts.some((post) => post.accessLevel !== "NDA")) {
      fail("Signed NDA list returned an unexpected sensitive post set", {
        expectedMin: EXPECTED_MIN,
        count: ndaPosts.length,
        nonNda: ndaPosts.filter((post) => post.accessLevel !== "NDA").slice(0, 5),
      });
    }
    if (ndaPosts.some((post) => "bodyMarkdown" in post || "bodyHtml" in post)) {
      fail("Signed NDA summaries leaked article bodies");
    }

    const detailSlug = ndaPosts.find((post) => post.slug === KNOWN_NDA_SLUG)?.slug || ndaPosts[0]?.slug;
    const detailTitle = ndaPosts.find((post) => post.slug === detailSlug)?.title || "";
    const signedDetail = await requestJson(
      `${BASE_URL}/api/community/posts/${String(detailSlug).split("/").map(encodeURIComponent).join("/")}`,
      { headers: { accept: "application/json", authorization: `Bearer ${token}` } },
    );
    assertStatus("Signed NDA detail", signedDetail.response.status, 200, {
      slug: detailSlug,
      body: signedDetail.json || signedDetail.text.slice(0, 300),
    });
    if (signedDetail.response.headers.get("cache-control") !== "private, no-store") {
      fail("Signed NDA detail did not use private no-store cache headers", {
        cacheControl: signedDetail.response.headers.get("cache-control"),
      });
    }
    if (signedDetail.json?.post?.accessLevel !== "NDA") {
      fail("Signed NDA detail did not return an NDA post", { post: signedDetail.json?.post });
    }

    let browserSmoke = { skipped: SKIP_BROWSER };
    if (!SKIP_BROWSER) {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        await context.addInitScript(
          ({ ref, authSession }) => {
            window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(authSession));
          },
          { ref: projectRef, authSession: session },
        );
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        await page.goto(`${BASE_URL}/community/${detailSlug}`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          ({ title }) => {
            const text = document.body?.innerText || "";
            return text.includes(title) || /Access Restricted|Post Not Found/i.test(text);
          },
          { title: detailTitle },
        );
        const bodyText = await page.locator("body").innerText();
        browserSmoke = {
          skipped: false,
          url: page.url(),
          titleRendered: bodyText.includes(detailTitle),
          blocked: /Access Restricted|Post Not Found/i.test(bodyText),
        };
        if (!browserSmoke.titleRendered || browserSmoke.blocked) {
          fail("Signed NDA browser smoke failed", browserSmoke);
        }
      } finally {
        await browser.close();
      }
    }

    result = {
      ok: true,
      target: TARGET,
      baseUrl: BASE_URL,
      startedAt,
      finishedAt: new Date().toISOString(),
      publicGate: {
        publicPosts: publicPosts.length,
        unsignedListStatus: deniedList.response.status,
        unsignedSensitiveAliasStatus: deniedAlias.response.status,
        unsignedKnownDetailStatus: deniedKnownDetail.response.status,
        authenticatedUnsignedListStatus: unsignedList.response.status,
        authenticatedUnsignedDetailStatus: unsignedDetail.response.status,
      },
      signedNda: {
        postCount: ndaPosts.length,
        detailSlug,
        detailTitle,
        signedListStatus: signedList.response.status,
        signedDetailStatus: signedDetail.response.status,
      },
      uiAccessStatus: {
        unsignedRows: Array.isArray(unsignedStatus.json) ? unsignedStatus.json.length : null,
        signedRows: Array.isArray(signedStatus.json) ? signedStatus.json.length : null,
      },
      browserSmoke,
    };
  } finally {
    const temporaryUserDeleted = await cleanup();
    if (result) {
      console.log(JSON.stringify({ ...result, temporaryUserDeleted }, null, 2));
    }
  }
};

main().catch((error) => {
  if (!process.exitCode) {
    console.error(error);
    process.exitCode = 1;
  }
});
