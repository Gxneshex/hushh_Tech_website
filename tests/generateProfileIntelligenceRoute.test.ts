import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const createClient = vi.fn(() => ({
  auth: { getUser },
}));
const fetchMock = vi.fn();
const generateContent = vi.fn();
const GoogleGenAI = vi.fn(() => ({
  models: { generateContent },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI,
}));

const createResponse = () => {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: any;
  let ended = false;

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get ended() {
      return ended;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    end() {
      ended = true;
      return this;
    },
  };
};

const validRequest = {
  method: "POST",
  headers: {
    authorization: "Bearer profile-token",
  },
  body: {
    input: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      zipCode: "10001",
    },
  },
};

const importHandler = async () => {
  const module = await import("../api/generate-profile-intelligence.js");
  return module.default;
};

describe("generate profile intelligence route", () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = "https://ibsisfnjxeowvdtvgzff.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.PROFILE_INTELLIGENCE_API_BASE_URL = "https://profile-intelligence.example";
    process.env.PROFILE_INTELLIGENCE_API_KEY = "internal-profile-key";
    process.env.PROFILE_INTELLIGENCE_TIMEOUT_MS = "1000";
    process.env.PROFILE_INTELLIGENCE_POLL_INTERVAL_MS = "1";
    process.env.GOOGLE_CLOUD_PROJECT = "hushh-tech-prod";
    process.env.GOOGLE_CLOUD_LOCATION = "us-central1";
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    generateContent.mockResolvedValue({
      text:
        "Summary: Public web fallback found a professional profile at https://example.com/fallback. Confidence: medium.",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {
                web: {
                  title: "Fallback Profile",
                  uri: "https://example.com/fallback",
                },
              },
            ],
          },
        },
      ],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        success: true,
        jobId: "job-1",
        status: "in_progress",
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        jobId: "job-1",
        status: "completed",
        report: {
          summary: "Public sources show a technical founder profile with limited investment signals.",
          missingSignals: ["verified investment history", "current firm affiliation"],
          confidence: "medium",
          model: "deep-research-max-preview-04-2026",
          publicProfiles: [
            {
              platform: "Website",
              title: "Ada Example Profile",
              url: "https://example.com/ada",
            },
          ],
          sourceCitations: [
            {
              title: "Ada Example Profile",
              uri: "https://example.com/ada",
            },
            {
              title: "Duplicate Source",
              url: "https://example.com/ada",
            },
            {
              title: "Unsafe Source",
              url: "javascript:alert(1)",
            },
          ],
          warnings: ["Review ambiguous matches before reuse."],
          redactions: [],
          riskFlags: [],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.PROFILE_INTELLIGENCE_API_BASE_URL;
    delete process.env.PROFILE_INTELLIGENCE_API_KEY;
    delete process.env.PROFILE_INTELLIGENCE_TIMEOUT_MS;
    delete process.env.PROFILE_INTELLIGENCE_POLL_INTERVAL_MS;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_LOCATION;
    delete process.env.PROFILE_INTELLIGENCE_FALLBACK_MODEL;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("requires a Supabase bearer token", async () => {
    const handler = await importHandler();
    const res = createResponse();

    await handler({ ...validRequest, headers: {} }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Missing authorization header");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before calling the upstream intelligence backend", async () => {
    const handler = await importHandler();
    const res = createResponse();

    await handler(
      {
        ...validRequest,
        body: {
          input: {
            name: "Ada Lovelace",
            email: "not-an-email",
            zipCode: "",
          },
        },
      },
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Missing required fields: location");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a valid response into the safe profileIntelligence shape", async () => {
    const handler = await importHandler();
    const res = createResponse();

    await handler(validRequest, res);

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://profile-intelligence.example/v1/intelligence/reports",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer internal-profile-key",
        }),
        body: expect.stringContaining('"purpose":"self_audit"'),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://profile-intelligence.example/v1/intelligence/reports/job-1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer internal-profile-key",
        }),
      }),
    );
    expect(fetchMock.mock.calls[0][1].body).not.toContain("ada@example.com");
    expect(res.body.success).toBe(true);
    expect(res.body.intelligence).toMatchObject({
      status: "completed",
      headline: "Public sources show a technical founder profile with limited investment signals",
      summary: "Public sources show a technical founder profile with limited investment signals.",
      summaryBullets: ["Public sources show a technical founder profile with limited investment signals."],
      confidenceLabel: "Medium",
      model: "deep-research-max-preview-04-2026",
      missingSignals: ["verified investment history", "current firm affiliation"],
      publicProfiles: [
        {
          platform: "Website",
          title: "Ada Example Profile",
          url: "https://example.com/ada",
          confidence: "medium",
        },
      ],
      evidence: [
        {
          title: "Ada Example Profile",
          url: "https://example.com/ada",
          domain: "example.com",
          supports: "Professional profile",
        },
      ],
      sources: [
        {
          title: "Ada Example Profile",
          url: "https://example.com/ada",
          domain: "example.com",
        },
      ],
    });
    expect(res.body.shadow_profile).toMatchObject({
      confidence: expect.any(Number),
      profileIntelligence: res.body.intelligence,
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("falls back to Vertex Gemini search when the standalone backend is unavailable", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: {
          code: "upstream_error",
          message: "Gemini API project is denied access to Deep Research/Interactions.",
        },
      }),
    });
    const handler = await importHandler();
    const res = createResponse();

    await handler(validRequest, res);

    expect(res.statusCode).toBe(200);
    expect(GoogleGenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexai: true,
        project: "hushh-tech-prod",
        location: "us-central1",
      }),
    );
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        config: expect.objectContaining({
          tools: [{ googleSearch: {} }],
        }),
      }),
    );
    expect(res.body.intelligence).toMatchObject({
      status: "completed",
      model: "gemini-2.5-flash",
      riskFlags: expect.arrayContaining(["deep_research_unavailable", "vertex_search_fallback"]),
      evidence: [
        expect.objectContaining({
          title: "Fallback Profile",
          url: "https://example.com/fallback",
        }),
      ],
    });
  });

  it("returns a safe browser error when both upstream and fallback fail", async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        detail: "internal provider stack: secret token exhausted",
      }),
    });
    generateContent.mockRejectedValueOnce(new Error("provider secret token exhausted"));
    const handler = await importHandler();
    const res = createResponse();

    await handler(validRequest, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe(
      "Profile intelligence is temporarily unavailable. Please try again shortly.",
    );
    expect(JSON.stringify(res.body)).not.toMatch(/secret|token|provider/i);
  });
});
