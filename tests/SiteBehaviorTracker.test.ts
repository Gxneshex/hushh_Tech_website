// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const trackSiteEvent = vi.fn();

vi.mock("../src/services/analytics/siteAnalytics", async () => {
  const actual = await vi.importActual<typeof import("../src/services/analytics/siteAnalytics")>(
    "../src/services/analytics/siteAnalytics"
  );

  return {
    ...actual,
    trackSiteEvent,
  };
});

describe("SiteBehaviorTracker", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    trackSiteEvent.mockClear();
    window.sessionStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("starts one site session per browser session", async () => {
    const { default: SiteBehaviorTracker } = await import(
      "../src/components/SiteBehaviorTracker"
    );

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/onboarding/financial-link"] },
          React.createElement(SiteBehaviorTracker)
        )
      );
    });

    expect(trackSiteEvent).toHaveBeenCalledWith("session_start", {
      properties: { surface: "site" },
    });
  });

  it("tracks safe click metadata without element text or href query values", async () => {
    const { default: SiteBehaviorTracker } = await import(
      "../src/components/SiteBehaviorTracker"
    );

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/profile/private-user-id?token=secret"] },
          React.createElement(SiteBehaviorTracker),
          React.createElement(
            "a",
            {
              href: "/profile/person@example.com?token=secret",
              "data-analytics-id": "profile-link",
            },
            "person@example.com secret token"
          )
        )
      );
    });

    await act(async () => {
      document.querySelector("a")?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    const interactionCall = trackSiteEvent.mock.calls.find(
      ([eventName]) => eventName === "ui_interaction"
    );

    expect(interactionCall).toBeTruthy();
    expect(interactionCall?.[1]).toMatchObject({
      routePath: "/profile/:id",
      properties: {
        action: "navigate",
        category: "interaction",
        element: "profile-link",
        role: "link",
        targetRoute: "/profile/:id",
        outbound: false,
      },
    });
    expect(JSON.stringify(interactionCall)).not.toContain("person@example.com");
    expect(JSON.stringify(interactionCall)).not.toContain("secret token");
  });

  it("tracks form submits without field values", async () => {
    const { default: SiteBehaviorTracker } = await import(
      "../src/components/SiteBehaviorTracker"
    );

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/signup"] },
          React.createElement(SiteBehaviorTracker),
          React.createElement(
            "form",
            { "data-analytics-id": "signup-form" },
            React.createElement("input", {
              name: "email",
              defaultValue: "person@example.com",
            })
          )
        )
      );
    });

    await act(async () => {
      document.querySelector("form")?.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true })
      );
    });

    const submitCall = trackSiteEvent.mock.calls.find(
      ([eventName]) => eventName === "form_submit"
    );

    expect(submitCall).toBeTruthy();
    expect(submitCall?.[1]).toMatchObject({
      routePath: "/signup",
      properties: {
        action: "submit",
        category: "form",
        formId: "signup-form",
      },
    });
    expect(JSON.stringify(submitCall)).not.toContain("person@example.com");
  });
});
