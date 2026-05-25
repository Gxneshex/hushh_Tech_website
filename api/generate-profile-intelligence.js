/**
 * Server-side Profile Intelligence wrapper for the Cloud Run web runtime.
 * Validates the Supabase session, calls the public-intelligence backend, and
 * returns only the safe normalized shape that the profile UI renders.
 */

import { createSupabaseServerClient } from "./shared/supabaseServerClient.js";

const DEFAULT_PROFILE_INTELLIGENCE_API_BASE_URL =
  "https://hushh-ria-intelligence-api-53407187172.us-central1.run.app";
const DEFAULT_PROFILE_INTELLIGENCE_TIMEOUT_MS = 180000;
const USER_SAFE_UPSTREAM_ERROR =
  "Profile intelligence is temporarily unavailable. Please try again shortly.";

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
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
    DEFAULT_PROFILE_INTELLIGENCE_API_BASE_URL
  ).replace(/\/+$/, "");
}

function parseTimeoutMs(env = process.env) {
  const configured = Number(env.PROFILE_INTELLIGENCE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_PROFILE_INTELLIGENCE_TIMEOUT_MS;
}

function normalizeInput(body = {}) {
  const raw = body.input && typeof body.input === "object" ? body.input : body;
  return {
    name: trimValue(raw.name),
    email: trimValue(raw.email).toLowerCase(),
    zipCode: trimValue(raw.zipCode || raw.zip_code || raw.postalCode),
  };
}

function validateInput(input) {
  const missing = [];
  if (!input.name) missing.push("name");
  if (!input.email) missing.push("email");
  if (!input.zipCode) missing.push("zipCode");

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Invalid email";
  }

  return "";
}

function toList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function sourceUrlFromValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  return trimValue(value.url || value.uri || value.link || value.href);
}

function normalizeSources(sources) {
  const seen = new Set();

  return toList(sources)
    .map((source) => {
      const rawUrl = sourceUrlFromValue(source);
      let url;
      try {
        url = new URL(rawUrl);
      } catch {
        return null;
      }

      if (!["http:", "https:"].includes(url.protocol)) {
        return null;
      }

      const href = url.toString();
      if (seen.has(href)) {
        return null;
      }
      seen.add(href);

      const rawTitle =
        typeof source === "object" && source
          ? trimValue(source.title || source.name || source.label)
          : "";

      return {
        title: rawTitle || url.hostname.replace(/^www\./, ""),
        url: href,
        domain: url.hostname.replace(/^www\./, ""),
      };
    })
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeMissingInformation(payload) {
  const raw =
    payload?.missingInformation ||
    payload?.missing_information ||
    payload?.missingSignals ||
    payload?.gaps ||
    [];

  return toList(raw)
    .map((item) => trimValue(item))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeSummary(payload) {
  return trimValue(payload?.summary || payload?.executiveSummary || payload?.overview);
}

function confidenceFromSignals(sources, missingInformation, payloadConfidence) {
  const raw = Number(payloadConfidence);
  if (Number.isFinite(raw)) {
    return Math.max(0, Math.min(1, Number(raw.toFixed(2))));
  }

  const sourceLift = Math.min(sources.length * 0.07, 0.35);
  const missingPenalty = Math.min(missingInformation.length * 0.03, 0.25);
  return Number(Math.max(0.25, Math.min(0.9, 0.45 + sourceLift - missingPenalty)).toFixed(2));
}

function normalizeProfileIntelligence(payload) {
  const summary = normalizeSummary(payload);
  const sources = normalizeSources(payload?.sources || payload?.sourceLinks);
  const missingInformation = normalizeMissingInformation(payload);
  const generatedAt = trimValue(payload?.generatedAt || payload?.generated_at) || new Date().toISOString();
  const model = trimValue(payload?.model || payload?.modelName || payload?.provider);
  const confidence = confidenceFromSignals(sources, missingInformation, payload?.confidence);

  if (!summary && sources.length === 0) {
    const error = new Error("Profile intelligence response was empty");
    error.statusCode = 502;
    throw error;
  }

  const profileIntelligence = {
    summary,
    sources,
    missingInformation,
    generatedAt,
    ...(model ? { model } : {}),
  };

  return {
    intelligence: profileIntelligence,
    shadow_profile: {
      profileIntelligence,
      confidence,
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

async function fetchProfileIntelligence(input, env = process.env) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parseTimeoutMs(env));

  try {
    const response = await fetch(`${normalizeBaseUrl(env)}/v1/intelligence/osint-profile`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const payload = await readJsonResponse(response);

    if (!response.ok) {
      const error = new Error(USER_SAFE_UPSTREAM_ERROR);
      error.statusCode = 502;
      error.upstreamStatus = response.status;
      throw error;
    }

    return payload;
  } catch (error) {
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

    const payload = await fetchProfileIntelligence(input);
    const normalized = normalizeProfileIntelligence(payload);

    return res.status(200).json({
      success: true,
      ...normalized,
    });
  } catch (error) {
    const status = error?.statusCode || 500;
    const message =
      status === 502
        ? USER_SAFE_UPSTREAM_ERROR
        : error?.message || "Failed to generate profile intelligence";

    console.error("Error generating profile intelligence:", {
      status,
      message,
      upstreamStatus: error?.upstreamStatus,
    });

    return res.status(status).json({ error: message });
  }
}
