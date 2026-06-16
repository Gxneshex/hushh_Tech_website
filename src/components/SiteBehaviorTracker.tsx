import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  sanitizeAnalyticsPath,
  trackSiteEvent,
} from "../services/analytics/siteAnalytics";

const SESSION_STARTED_KEY = "hushh_site_behavior_session_started";
const MIN_ENGAGEMENT_MS = 1000;
const DUPLICATE_INTERACTION_WINDOW_MS = 750;

type InteractionElement =
  | HTMLAnchorElement
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLElement;

function getSessionStorageValue(key: string) {
  try {
    return window.sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setSessionStorageValue(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Analytics must never break the product path.
  }
}

function getInteractiveElement(target: EventTarget | null): InteractionElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<InteractionElement>(
    [
      "a[href]",
      "button",
      "input[type='button']",
      "input[type='submit']",
      "input[type='reset']",
      "input[type='checkbox']",
      "input[type='radio']",
      "select",
      "[role='button']",
      "[role='menuitem']",
      "[role='tab']",
      "[role='checkbox']",
      "[role='switch']",
      "[data-analytics-id]",
    ].join(",")
  );
}

function getElementRole(element: InteractionElement) {
  const explicitRole = element.getAttribute("role");
  if (explicitRole) {
    return explicitRole.slice(0, 48);
  }

  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLButtonElement) return "button";
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox" || element.type === "radio") return element.type;
    return "input-action";
  }

  return "interactive";
}

function getElementKey(element: InteractionElement) {
  const analyticsId = element.getAttribute("data-analytics-id") || "";
  if (/^[a-z0-9:_/-]{1,80}$/i.test(analyticsId) && !analyticsId.includes("@")) {
    return analyticsId;
  }

  return element.tagName.toLowerCase();
}

function getControlType(element: InteractionElement) {
  if (element instanceof HTMLInputElement) {
    return element.type || "input";
  }

  if (element instanceof HTMLSelectElement) {
    return "select";
  }

  return "";
}

function getTargetRoute(element: InteractionElement) {
  if (!(element instanceof HTMLAnchorElement)) {
    return "";
  }

  try {
    const url = new URL(element.href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return "external";
    }

    return sanitizeAnalyticsPath(url.pathname, url.search, url.hash);
  } catch {
    return "";
  }
}

function getAction(element: InteractionElement) {
  if (element instanceof HTMLAnchorElement) return "navigate";
  if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) {
    return "toggle";
  }
  if (element instanceof HTMLSelectElement) return "select_opened";
  return "click";
}

function getFormId(form: HTMLFormElement) {
  const analyticsId = form.getAttribute("data-analytics-id") || "";
  if (/^[a-z0-9:_/-]{1,80}$/i.test(analyticsId) && !analyticsId.includes("@")) {
    return analyticsId;
  }

  const name = form.getAttribute("name") || "";
  if (/^[a-z0-9:_/-]{1,80}$/i.test(name) && !name.includes("@")) {
    return name;
  }

  return "form";
}

function emitRouteEngagement(routePath: string, startedAt: number, status: string) {
  const durationMs = Date.now() - startedAt;
  if (durationMs < MIN_ENGAGEMENT_MS) {
    return;
  }

  void trackSiteEvent("route_engagement", {
    routePath,
    properties: {
      action: "route_exit",
      status,
      durationMs,
    },
  });
}

export default function SiteBehaviorTracker() {
  const location = useLocation();
  const routeRef = useRef({
    path: sanitizeAnalyticsPath(location.pathname, location.search, location.hash),
    startedAt: Date.now(),
  });
  const lastInteractionRef = useRef({ key: "", trackedAt: 0 });

  useEffect(() => {
    if (getSessionStorageValue(SESSION_STARTED_KEY)) {
      return;
    }

    setSessionStorageValue(SESSION_STARTED_KEY, "1");
    void trackSiteEvent("session_start", {
      properties: {
        surface: "site",
      },
    });
  }, []);

  useEffect(() => {
    const currentRoute = routeRef.current;
    const nextPath = sanitizeAnalyticsPath(location.pathname, location.search, location.hash);
    if (nextPath === currentRoute.path) {
      return;
    }

    emitRouteEngagement(currentRoute.path, currentRoute.startedAt, "route_change");
    routeRef.current = {
      path: nextPath,
      startedAt: Date.now(),
    };
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const element = getInteractiveElement(event.target);
      if (!element) {
        return;
      }

      const elementKey = getElementKey(element);
      const role = getElementRole(element);
      const action = getAction(element);
      const targetRoute = getTargetRoute(element);
      const duplicateKey = `${routeRef.current.path}:${action}:${role}:${elementKey}:${targetRoute}`;
      const now = Date.now();

      if (
        duplicateKey === lastInteractionRef.current.key &&
        now - lastInteractionRef.current.trackedAt < DUPLICATE_INTERACTION_WINDOW_MS
      ) {
        return;
      }

      lastInteractionRef.current = {
        key: duplicateKey,
        trackedAt: now,
      };

      void trackSiteEvent("ui_interaction", {
        routePath: routeRef.current.path,
        properties: {
          action,
          category: "interaction",
          element: elementKey,
          role,
          controlType: getControlType(element),
          targetRoute,
          outbound: targetRoute === "external",
        },
      });
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement)) {
        return;
      }

      void trackSiteEvent("form_submit", {
        routePath: routeRef.current.path,
        properties: {
          action: "submit",
          category: "form",
          formId: getFormId(event.target),
        },
      });
    };

    const handleError = () => {
      void trackSiteEvent("client_error", {
        routePath: routeRef.current.path,
        properties: {
          action: "error",
          errorCategory: "runtime",
        },
      });
    };

    const handleUnhandledRejection = () => {
      void trackSiteEvent("client_error", {
        routePath: routeRef.current.path,
        properties: {
          action: "error",
          errorCategory: "unhandled_rejection",
        },
      });
    };

    const handlePageHide = () => {
      emitRouteEngagement(routeRef.current.path, routeRef.current.startedAt, "pagehide");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        emitRouteEngagement(routeRef.current.path, routeRef.current.startedAt, "hidden");
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      emitRouteEngagement(routeRef.current.path, routeRef.current.startedAt, "unmount");
    };
  }, []);

  return null;
}
