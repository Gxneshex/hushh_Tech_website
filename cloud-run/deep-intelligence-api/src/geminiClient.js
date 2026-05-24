import { GoogleGenAI } from "@google/genai";

import { UpstreamError } from "./errors.js";
import { buildDeepResearchPrompt } from "./prompt.js";

export class GeminiDeepResearchClient {
  constructor({ apiKey, model, client } = {}) {
    if (!client && !apiKey) {
      throw new UpstreamError("GEMINI_API_KEY is not configured");
    }
    this.model = model || "deep-research-preview-04-2026";
    this.client = client || new GoogleGenAI({ apiKey });
  }

  async startReport(payload) {
    let interaction;
    try {
      interaction = await this.client.interactions.create({
        input: buildDeepResearchPrompt(payload),
        agent: this.model,
        background: true,
        store: true,
        agent_config: {
          type: "deep-research",
          thinking_summaries: "auto",
          visualization: "off",
          collaborative_planning: false,
        },
        tools: [{ type: "google_search" }, { type: "url_context" }, { type: "code_execution" }],
      });
    } catch (error) {
      throw normalizeGeminiError(error);
    }

    if (!interaction?.id) {
      throw new UpstreamError("Gemini did not return an interaction id");
    }

    return interaction;
  }

  async getReport(interactionId) {
    if (!interactionId) {
      throw new UpstreamError("Missing Gemini interaction id");
    }
    try {
      return await this.client.interactions.get(interactionId);
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  }
}

function normalizeGeminiError(error) {
  const code = error?.error?.error?.code || error?.error?.code || error?.code;
  const message = error?.error?.error?.message || error?.error?.message || error?.message || "";
  const status = error?.status || error?.statusCode;
  const detail = formatSafeGeminiDetail({ status, code, message });

  if (status === 403 || /permission_denied/i.test(String(code)) || /denied access/i.test(message)) {
    return new UpstreamError(
      "Gemini API project is denied access to Deep Research/Interactions. Enable preview access or use a Gemini API key from an allowed project.",
    );
  }

  return new UpstreamError(
    detail ? `Gemini Deep Research request failed: ${detail}` : "Gemini Deep Research request failed",
  );
}

function formatSafeGeminiDetail({ status, code, message }) {
  const parts = [];
  if (status) parts.push(`status ${status}`);
  if (code) parts.push(`code ${String(code).slice(0, 80)}`);

  const safeMessage = redactSecretLikeText(message).replace(/\s+/g, " ").trim();
  if (safeMessage) parts.push(safeMessage.slice(0, 500));

  return parts.join("; ");
}

function redactSecretLikeText(value) {
  return String(value || "")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted-api-key]")
    .replace(/([?&](?:key|api_key|access_token|token)=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(x-goog-api-key['":\s]+)[0-9A-Za-z_-]{20,}/gi, "$1[redacted]");
}
