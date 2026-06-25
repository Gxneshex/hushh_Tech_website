// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => React.createElement("header", null, "HushhTechHeader"),
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  default: () => React.createElement("footer", null, "HushhTechFooter"),
}));

import FaqPage from "../src/pages/faq";

describe("FAQ page", () => {
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

  it("renders the modern header and accessible accordion controls", async () => {
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(FaqPage),
        ),
      );
    });

    expect(container.textContent).toContain("HushhTechHeader");
    expect(container.textContent).toContain("FAQ.");
    expect(container.textContent).not.toContain("Hu$$h");

    const buttons = Array.from(container.querySelectorAll("button"));
    const firstFaq = buttons.find((button) =>
      button.textContent?.includes("long-term value creation"),
    );

    expect(firstFaq?.getAttribute("aria-expanded")).toBe("false");
    const controlledPanelId = firstFaq?.getAttribute("aria-controls");
    expect(controlledPanelId).toBeTruthy();

    await act(async () => {
      firstFaq?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(firstFaq?.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(`#${controlledPanelId}`)).toBeTruthy();
  });
});
