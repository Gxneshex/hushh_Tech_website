import { beforeEach, describe, expect, it, vi } from "vitest";

const createDeleteAccountAdminClientFromEnvMock = vi.fn();
const executeDeleteAccountMock = vi.fn();

vi.mock("../api/delete-account-service.js", () => ({
  createDeleteAccountAdminClientFromEnv: (...args) =>
    createDeleteAccountAdminClientFromEnvMock(...args),
  executeDeleteAccount: (...args) => executeDeleteAccountMock(...args),
}));

import deleteAccountHandler from "../api/delete-account.js";

const createResponse = () => {
  let statusCode = 200;
  let body;

  return {
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };
};

describe("delete-account API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects non-POST requests", async () => {
    const res = createResponse();

    await deleteAccountHandler({ method: "GET", headers: {} }, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: "Method not allowed" });
    expect(executeDeleteAccountMock).not.toHaveBeenCalled();
  });

  it("passes the auth header through to the delete-account service", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    createDeleteAccountAdminClientFromEnvMock.mockReturnValue({
      adminClient: { marker: "admin" },
      auditSecret: "audit-secret",
    });
    executeDeleteAccountMock.mockResolvedValue({
      status: 200,
      body: { success: true, deletedScopes: [], retainedScopes: [] },
    });

    const res = createResponse();
    await deleteAccountHandler(
      {
        method: "POST",
        headers: { authorization: "Bearer live-token" },
      },
      res
    );

    expect(executeDeleteAccountMock).toHaveBeenCalledWith({
      adminClient: { marker: "admin" },
      authHeader: "Bearer live-token",
      auditSecret: "audit-secret",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      deletedScopes: [],
      retainedScopes: [],
    });
  });

  it("delegates to the Supabase function when local service-role env is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ success: true })),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = createResponse();
    await deleteAccountHandler(
      {
        method: "POST",
        headers: { authorization: "Bearer user-token" },
      },
      res
    );

    expect(createDeleteAccountAdminClientFromEnvMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/functions/v1/delete-user-account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-token",
          apikey: "anon-key",
        },
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("fails closed when neither local env nor Supabase function env is configured", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const res = createResponse();
    await deleteAccountHandler(
      {
        method: "POST",
        headers: {},
      },
      res
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: "Server configuration error",
      details: "Supabase URL is missing",
    });
  });
});
