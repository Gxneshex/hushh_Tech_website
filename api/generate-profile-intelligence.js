/**
 * Server-side Profile Intelligence wrapper for the Cloud Run web runtime.
 * Validates the Supabase session, calls the consent-gated Deep Intelligence
 * service, and returns only the formatted profile display model.
 */

import { GoogleGenAI } from "@google/genai";
import { formatProfileIntelligenceReport } from "./shared/profileIntelligenceFormatter.js";
import { createSupabaseServerClient } from "./shared/supabaseServerClient.js";

const DEFAULT_PROFILE_INTELLIGENCE_API_BASE_URL =
  "https://hushh-ria-intelligence-api-53407187172.us-central1.run.app";
const DEFAULT_PROFILE_INTELLIGENCE_TIMEOUT_MS = 180000;
const DEFAULT_PROFILE_INTELLIGENCE_POLL_INTERVAL_MS = 5000;
const DEFAULT_PROFILE_INTELLIGENCE_FALLBACK_MODEL = "gemini-2.5-flash";
const DEFAULT_VERTEX_LOCATION = "us-central1";
const USER_SAFE_UPSTREAM_ERROR =
  "Profile intelligence is temporarily unavailable. Please try again shortly.";

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function getBearerToken(req) {
  const raw = trimValue(req.headers?.authorization || req.headers?.Authorization);
  return raw.startsWith("Bearer ") ? raw.slice("Bearer ".length).trim() : "";
}

function getSupabaseConfig(env = process.env) {
  const supabaseUrl = trimValue(env.SUPABASE_URL) || trimValue(env.VITE_SUPABASE_URL);
  const serviceRoleKey = trimValue(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error("Profile authentication is not configured on server");
    error.statusCode = 503;
    throw error;
  }

  return { supabaseUrl, serviceRoleKey };
}

async function authenticateRequest(req, env = process.env) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Missing authorization header");
    error.statusCode = 401;
    throw error;
  }

  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig(env);
  const client = createSupabaseServerClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    const authError = new Error("Unauthorized - invalid token");
    authError.statusCode = 401;
    throw authError;
  }

  return data.user;
}

function normalizeBaseUrl(env = process.env) {
  return (
    trimValue(env.PROFILE_INTELLIGENCE_API_BASE_URL) ||
    trimValue(env.DEEP_INTELLIGENCE_API_BASE_URL) ||
    DEFAULT_PROFILE_INTELLIGENCE_API_BASE_URL
  ).replace(/\/+$/, "");
}

function getInternalApiKey(env = process.env) {
  const key =
    trimValue(env.PROFILE_INTELLIGENCE_API_KEY) ||
    trimValue(env.DEEP_INTELLIGENCE_API_KEY);

  if (!key) {
    const error = new Error("Profile intelligence upstream auth is not configured");
    error.statusCode = 503;
    throw error;
  }

  return key;
}

function getVertexConfig(env = process.env) {
  const project =
    trimValue(env.PROFILE_INTELLIGENCE_VERTEX_PROJECT) ||
    trimValue(env.GOOGLE_CLOUD_PROJECT) ||
    trimValue(env.GCP_PROJECT_ID) ||
    trimValue(env.GCLOUD_PROJECT);
  const location =
    trimValue(env.PROFILE_INTELLIGENCE_VERTEX_LOCATION) ||
    trimValue(env.GOOGLE_CLOUD_LOCATION) ||
    DEFAULT_VERTEX_LOCATION;

  if (!project) return null;
  return { project, location };
}

function getFallbackModel(env = process.env) {
  return (
    trimValue(env.PROFILE_INTELLIGENCE_FALLBACK_MODEL) ||
    trimValue(env.GEMINI_INVESTOR_PROFILE_MODEL) ||
    DEFAULT_PROFILE_INTELLIGENCE_FALLBACK_MODEL
  );
}

function parseTimeoutMs(env = process.env) {
  return parseInteger(
    env.PROFILE_INTELLIGENCE_TIMEOUT_MS,
    DEFAULT_PROFILE_INTELLIGENCE_TIMEOUT_MS,
    { min: 5000, max: 15 * 60 * 1000 },
  );
}

function parsePollIntervalMs(env = process.env) {
  return parseInteger(
    env.PROFILE_INTELLIGENCE_POLL_INTERVAL_MS,
    DEFAULT_PROFILE_INTELLIGENCE_POLL_INTERVAL_MS,
    { min: 250, max: 30000 },
  );
}

function normalizeInput(body = {}) {
  const raw = body.input && typeof body.input === "object" ? body.input : body;
  const location = raw.location && typeof raw.location === "object" ? raw.location : {};
  return {
    name: trimValue(raw.name),
    email: trimValue(raw.email).toLowerCase(),
    zipCode: trimValue(raw.zipCode || raw.zip_code || raw.postalCode),
    location: {
      city: trimValue(location.city || raw.city),
      region: trimValue(location.region || location.state || location.province || raw.region || raw.state),
      country: trimValue(location.country || raw.country || raw.residenceCountry || raw.citizenshipCountry),
    },
  };
}

function hasCoarseLocation(input) {
  return Boolean(input.location.city || input.location.region || input.location.country || input.zipCode);
}

function validateInput(input) {
  const missing = [];
  if (!input.name) missing.push("name");
  if (!input.email) missing.push("email");
  if (!hasCoarseLocation(input)) missing.push("location");

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Invalid email";
  }

  return "";
}

function buildSubjectLocation(input) {
  const coarse = Object.fromEntries(
    Object.entries(input.location).filter(([, value]) => Boolean(value)),
  );

  if (Object.keys(coarse).length > 0) {
    return coarse;
  }

  return {
    region: "user-provided postal region",
  };
}

function buildReportRequest(input) {
  return {
    subject: {
      name: input.name,
      location: buildSubjectLocation(input),
    },
    consent: {
      accepted: true,
      purpose: "self_audit",
      recordedAt: new Date().toISOString(),
    },
  };
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function waitForPoll(ms, signal) {
  if (signal.aborted) {
    return Promise.reject(new DOMException("Request timed out", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(new DOMException("Request timed out", "AbortError"));
      },
      { once: true },
    );
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    const error = new Error(USER_SAFE_UPSTREAM_ERROR);
    error.statusCode = 502;
    error.upstreamStatus = response.status;
    error.upstreamCode = payload?.error?.code;
    error.upstreamMessage = payload?.error?.message;
    throw error;
  }

  return payload;
}

function assertJobProgress(payload) {
  if (!payload?.jobId || !payload?.status) {
    const error = new Error("Profile intelligence upstream returned a malformed job response");
    error.statusCode = 502;
    throw error;
  }
}

async function fetchProfileIntelligence(input, env = process.env) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parseTimeoutMs(env));
  const baseUrl = normalizeBaseUrl(env);
  const apiKey = getInternalApiKey(env);
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    const startPayload = await fetchJson(`${baseUrl}/v1/intelligence/reports`, {
      method: "POST",
      headers,
      body: JSON.stringify(buildReportRequest(input)),
      signal: controller.signal,
    });
    assertJobProgress(startPayload);

    let job = startPayload;
    while (job.status === "queued" || job.status === "in_progress" || job.status === "running") {
      await waitForPoll(parsePollIntervalMs(env), controller.signal);
      job = await fetchJson(
        `${baseUrl}/v1/intelligence/reports/${encodeURIComponent(job.jobId)}`,
        {
          method: "GET",
          headers,
          signal: controller.signal,
        },
      );
      assertJobProgress(job);
    }

    if (job.status === "completed") {
      return job;
    }

    const error = new Error(USER_SAFE_UPSTREAM_ERROR);
    error.statusCode = 502;
    error.upstreamStatus = job.status;
    throw error;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(USER_SAFE_UPSTREAM_ERROR);
      timeoutError.statusCode = 504;
      timeoutError.cause = error;
      throw timeoutError;
    }

    if (error?.statusCode) {
      throw error;
    }

    const upstreamError = new Error(USER_SAFE_UPSTREAM_ERROR);
    upstreamError.statusCode = 502;
    upstreamError.cause = error;
    throw upstreamError;
  } finally {
    clearTimeout(timeout);
  }
}

function buildFallbackPrompt(input) {
  const location = [input.location.city, input.location.region, input.location.country]
    .filter(Boolean)
    .join(", ");

  return `Generate a consent-gated public-web self-audit for the user below.

Subject:
- Name: ${input.name}
- Coarse location: ${location || input.zipCode || "unknown coarse region"}

Rules:
- Use public web signals only.
- This is for the user's own profile audit, not for surveillance or eligibility decisions.
- Do not expose home addresses, private phone numbers, private emails, identity documents, credentials, family targeting, minors, or unverified accusations.
- If identity matching is ambiguous, say that plainly.
- Prefer official/professional sources: LinkedIn, GitHub, personal sites, company pages, publications, talks, and public directories.
- Include source URLs inline for every meaningful public signal so the formatter can cite them.

Return concise sections:
1. Summary
2. Public profiles found
3. Source citations
4. Confidence
5. Risk flags
6. Missing signals
7. Redactions and warnings`;
}

async function extractResponseText(response) {
  if (typeof response?.text === "string") {
    return response.text;
  }

  if (typeof response?.text === "function") {
    return await response.text();
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((part) => part?.text || "").join("");
  }

  return "";
}

function extractGroundingSources(response) {
  const sources = [];
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];

  for (const candidate of candidates) {
    const chunks = candidate?.groundingMetadata?.groundingChunks;
    if (!Array.isArray(chunks)) continue;

    for (const chunk of chunks) {
      const source = chunk?.web || chunk?.retrievedContext || {};
      const url = trimValue(source.uri || source.url);
      if (!url) continue;
      sources.push({
        title: trimValue(source.title) || url,
        uri: url,
      });
    }
  }

  return sources;
}

async function generateVertexFallbackReport(input, env = process.env) {
  const vertexConfig = getVertexConfig(env);
  if (!vertexConfig) {
    const error = new Error("Profile intelligence Vertex fallback is not configured");
    error.statusCode = 503;
    throw error;
  }

  const model = getFallbackModel(env);
  const ai = new GoogleGenAI({
    vertexai: true,
    project: vertexConfig.project,
    location: vertexConfig.location,
    apiVersion: "v1",
  });
  const response = await ai.models.generateContent({
    model,
    contents: buildFallbackPrompt(input),
    config: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      tools: [{ googleSearch: {} }],
    },
  });
  const summary = await extractResponseText(response);

  if (!summary.trim()) {
    const error = new Error("Profile intelligence Vertex fallback returned no text");
    error.statusCode = 502;
    throw error;
  }

  return {
    success: true,
    jobId: "vertex-fallback",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    report: {
      summary,
      sourceCitations: extractGroundingSources(response),
      confidence: "medium",
      riskFlags: ["deep_research_unavailable", "vertex_search_fallback"],
      redactions: [],
      warnings: [
        "Gemini Deep Research was unavailable, so this used Vertex Gemini with Google Search grounding as a fallback.",
      ],
      model,
      provider: "vertex-gemini-search-fallback",
    },
  };
}

function shouldUseVertexFallback(error) {
  return error?.statusCode === 502 || error?.statusCode === 504;
}

function sendCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );
}

export default async function handler(req, res) {
  sendCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    await authenticateRequest(req);

    const input = normalizeInput(req.body || {});
    const inputError = validateInput(input);
    if (inputError) {
      return res.status(400).json({ error: inputError });
    }

    let payload;
    try {
      payload = await fetchProfileIntelligence(input);
    } catch (error) {
      if (!shouldUseVertexFallback(error)) {
        throw error;
      }

      console.warn("Profile intelligence upstream unavailable; using Vertex fallback", {
        upstreamStatus: error?.upstreamStatus,
        upstreamCode: error?.upstreamCode,
      });
      try {
        payload = await generateVertexFallbackReport(input);
      } catch (fallbackError) {
        const safeError = new Error(USER_SAFE_UPSTREAM_ERROR);
        safeError.statusCode = 502;
        safeError.cause = fallbackError;
        throw safeError;
      }
    }

    const formatted = formatProfileIntelligenceReport(payload, {
      model:
        payload?.report?.model ||
        process.env.PROFILE_INTELLIGENCE_MODEL ||
        process.env.DEEP_INTELLIGENCE_MODEL,
    });
    const profileIntelligence = formatted.intelligence;

    return res.status(200).json({
      success: true,
      intelligence: profileIntelligence,
      shadow_profile: {
        profileIntelligence,
        confidence: formatted.confidence,
      },
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    const message =
      status === 502 || status === 504
        ? USER_SAFE_UPSTREAM_ERROR
        : error?.message || "Failed to generate profile intelligence";

    console.error("Error generating profile intelligence:", {
      status,
      message,
      upstreamStatus: error?.upstreamStatus,
      upstreamCode: error?.upstreamCode,
    });

    return res.status(status).json({ error: message });
  }
}
