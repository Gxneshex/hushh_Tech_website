import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'
import config from './resources/config/config.ts'

// Initialize i18n for multi-language support
import './i18n'

const appVersion = typeof __APP_VERSION__ === "undefined" ? "local-dev" : __APP_VERSION__
const buildTimestamp =
  typeof __BUILD_TIMESTAMP__ === "undefined" ? new Date().toISOString() : __BUILD_TIMESTAMP__
const gitCommit = typeof __GIT_COMMIT__ === "undefined" ? "local-dev" : __GIT_COMMIT__

// ─── App Version ────────────────────────────────────────────────────────────
// Expose version globally so team can check via DevTools console:
//   Type: __HUSHH_VERSION__  →  { version, built, commit }
// This survives production minification (unlike console.log which is stripped)
;(window as any).__HUSHH_VERSION__ = {
  version: appVersion,
  built: buildTimestamp,
  commit: gitCommit,
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("name", name)
    document.head.appendChild(meta)
  }

  meta.setAttribute("content", content)
}

upsertMeta("app-version", appVersion)
upsertMeta("build-commit", gitCommit)
upsertMeta("deploy-verified", buildTimestamp)

function clearLegacyServiceWorkerCache() {
  if (typeof window === "undefined") return

  const cleanupKey = `hushh-cache-cleaned:${appVersion}`
  if (window.localStorage.getItem(cleanupKey) === "true") return

  const rememberCleanup = () => {
    window.localStorage.setItem(cleanupKey, "true")
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined)
  }

  if ("caches" in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(rememberCleanup)
      .catch(() => undefined)
  } else {
    rememberCleanup()
  }
}

clearLegacyServiceWorkerCache()

// Import DM Sans font weights
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MotionConfig>
  </React.StrictMode>,
)
