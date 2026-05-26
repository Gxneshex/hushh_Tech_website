import {
  createDeleteAccountAdminClientFromEnv,
  executeDeleteAccount,
} from "./delete-account-service.js";

const trimEnv = (value) => (typeof value === "string" ? value.trim() : "");

const isPlaceholderEnv = (value) => {
  const normalized = trimEnv(value).toLowerCase();
  return (
    !normalized ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("placeholder") ||
    normalized.includes("replace_me")
  );
};

const hasLocalDeleteAccountConfig = () =>
  (!isPlaceholderEnv(process.env.SUPABASE_URL) ||
    !isPlaceholderEnv(process.env.VITE_SUPABASE_URL)) &&
  !isPlaceholderEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

const resolveSupabaseFunctionConfig = () => {
  const supabaseUrl =
    trimEnv(process.env.SUPABASE_URL) || trimEnv(process.env.VITE_SUPABASE_URL);
  const anonKey =
    trimEnv(process.env.SUPABASE_ANON_KEY) ||
    trimEnv(process.env.VITE_SUPABASE_ANON_KEY);

  if (!supabaseUrl) {
    throw new Error("Supabase URL is missing");
  }

  return {
    endpoint: `${supabaseUrl.replace(/\/$/, "")}/functions/v1/delete-user-account`,
    anonKey,
  };
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
};

async function executeDeleteAccountViaSupabaseFunction(authHeader) {
  const { endpoint, anonKey } = resolveSupabaseFunctionConfig();
  const headers = {
    "Content-Type": "application/json",
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  if (anonKey) {
    headers.apikey = anonKey;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
  });
  const body = await parseJsonResponse(response);

  return {
    status: response.status,
    body,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization || null;

  try {
    const result = hasLocalDeleteAccountConfig()
      ? await (async () => {
          const { adminClient, auditSecret } = createDeleteAccountAdminClientFromEnv();
          return executeDeleteAccount({
            adminClient,
            authHeader,
            auditSecret,
          });
        })()
      : await executeDeleteAccountViaSupabaseFunction(authHeader);

    return res.status(result.status).json(result.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("delete-account route error:", message);

    return res.status(500).json({
      success: false,
      error: "Server configuration error",
      details: message,
    });
  }
}
