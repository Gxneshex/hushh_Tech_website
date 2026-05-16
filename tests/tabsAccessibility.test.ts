// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../src/components/ui/tabs";

describe("Tabs accessibility", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderTabs() {
    await act(async () => {
      root.render(
        React.createElement(
          Tabs,
          { defaultValue: "overview" },
          React.createElement(
            TabsList,
            null,
            React.createElement(TabsTrigger, { value: "overview" }, "Overview"),
            React.createElement(TabsTrigger, { value: "details" }, "Details"),
            React.createElement(TabsTrigger, { value: "settings" }, "Settings")
          ),
          React.createElement(
            TabsContent,
            { value: "overview" },
            "Overview panel"
          ),
          React.createElement(TabsContent, { value: "details" }, "Details panel"),
          React.createElement(
            TabsContent,
            { value: "settings" },
            "Settings panel"
          )
        )
      );
    });
  }

  function tabs() {
    return Array.from(container.querySelectorAll('[role="tab"]'));
  }

  async function press(tab: Element, key: string) {
    await act(async () => {
      tab.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true })
      );
    });
  }

  it("wires tab, tablist, and active panel semantics", async () => {
    await renderTabs();

    const tablist = container.querySelector('[role="tablist"]');
    const [overview, details] = tabs();
    const panel = container.querySelector('[role="tabpanel"]');

    expect(tablist?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(overview.getAttribute("tabindex")).toBe("0");
    expect(details.getAttribute("aria-selected")).toBe("false");
    expect(details.getAttribute("tabindex")).toBe("-1");
    expect(panel?.textContent).toBe("Overview panel");
    expect(panel?.id).toBe(overview.getAttribute("aria-controls"));
    expect(panel?.getAttribute("aria-labelledby")).toBe(overview.id);
  });

  it("moves focus and active state with arrow, home, and end keys", async () => {
    await renderTabs();

    let [overview, details, settings] = tabs() as HTMLElement[];
    overview.focus();
    await press(overview, "ArrowRight");

    [overview, details, settings] = tabs() as HTMLElement[];
    expect(document.activeElement).toBe(details);
    expect(details.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("Details panel");

    await press(details, "End");
    [overview, details, settings] = tabs() as HTMLElement[];
    expect(document.activeElement).toBe(settings);
    expect(settings.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("Settings panel");

    await press(settings, "Home");
    [overview, details, settings] = tabs() as HTMLElement[];
    expect(document.activeElement).toBe(overview);
    expect(overview.getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("Overview panel");
  });
});
