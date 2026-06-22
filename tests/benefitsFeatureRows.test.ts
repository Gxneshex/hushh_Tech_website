// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BenefitsPage from "../src/pages/benefits";

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => React.createElement("header", null, "HushhTechHeader"),
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  default: () => React.createElement("footer", null, "HushhTechFooter"),
}));

describe("Benefits feature rows", () => {
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

  it("keeps check icons aligned with consistently spaced feature text", async () => {
    await act(async () => {
      root.render(React.createElement(BenefitsPage));
    });

    const rows = Array.from(container.querySelectorAll("li"));

    expect(rows).toHaveLength(24);

    rows.forEach((row) => {
      expect(row.className).toContain("items-start");
      expect(row.className).toContain("gap-3.5");

      const icon = row.querySelector("svg");

      expect(icon?.getAttribute("class")).toContain("mt-[3px]");
      expect(icon?.getAttribute("class")).toContain("shrink-0");
    });
  });

  it("uses a responsive card grid with roomier feature-row spacing", async () => {
    await act(async () => {
      root.render(React.createElement(BenefitsPage));
    });

    // The four benefit category cards each render a feature list with roomy spacing.
    const featureLists = Array.from(container.querySelectorAll("ul"));
    expect(featureLists).toHaveLength(4);
    featureLists.forEach((list) => {
      expect(list.className).toContain("gap-y-3");
      expect(list.className).toContain("sm:gap-y-3.5");
      expect(list.className).toContain("md:gap-y-4");
    });

    // Cards are laid out in a responsive two-column grid.
    const cardGrid = container.querySelector('[class*="lg:grid-cols-2"]');
    expect(cardGrid).not.toBeNull();
    expect(cardGrid?.className).toContain("grid");
    expect(cardGrid?.className).toContain("gap-4");
    expect(cardGrid?.className).toContain("sm:gap-5");
  });
});
