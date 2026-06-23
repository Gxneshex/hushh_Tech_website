/**
 * Deployments dashboard logic — client-side sign-in gate + data loading.
 *
 * NOTE: the sign-in is a hardcoded page gate (ankit@hushh.ai / 123456) per
 * product request. It is NOT a security boundary on its own (anyone can read
 * the bundle); the /api/deployments endpoint independently password-checks the
 * request server-side before returning any data.
 */
import { useCallback, useEffect, useState } from "react";

const AUTH_KEY = "hushh_deployments_auth_v1";
const OWNER_EMAIL = "ankit@hushh.ai";
const OWNER_PASSWORD = "123456";

export interface Deployment {
  env: "UAT" | "PROD";
  revision: string;
  createdAt: string | null;
  isLive: boolean;
  buildUrl: string | null;
  image: string | null;
}

interface StoredAuth {
  email: string;
  password: string;
}

function readAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function useDeploymentsDashboard() {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readAuth());
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [envErrors, setEnvErrors] = useState<{ env: string; error: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback((email: string, password: string): string | null => {
    if (email.trim().toLowerCase() !== OWNER_EMAIL || password !== OWNER_PASSWORD) {
      return "Incorrect email or password.";
    }
    const next: StoredAuth = { email: OWNER_EMAIL, password };
    try {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
    setAuth(next);
    return null;
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setAuth(null);
    setDeployments([]);
    setEnvErrors([]);
    setError(null);
  }, []);

  const load = useCallback(
    async (a: StoredAuth) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/deployments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: a.password }),
        });
        const data = await res
          .json()
          .catch(() => ({ success: false, error: "Invalid response" }));
        if (!res.ok || !data.success) {
          if (res.status === 401) {
            signOut();
            throw new Error("Session expired — please sign in again.");
          }
          throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
        }
        setDeployments(Array.isArray(data.deployments) ? data.deployments : []);
        setEnvErrors(Array.isArray(data.errors) ? data.errors : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deployments.");
      } finally {
        setLoading(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    if (auth) void load(auth);
  }, [auth, load]);

  return {
    isAuthed: Boolean(auth),
    signIn,
    signOut,
    deployments,
    envErrors,
    loading,
    error,
    refresh: () => {
      if (auth) void load(auth);
    },
  };
}
