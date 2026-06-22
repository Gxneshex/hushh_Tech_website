// @vitest-environment jsdom

import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Leadership from "../src/components/Leadership";

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: () => React.createElement("header", null, "HushhTechHeader"),
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  default: () => React.createElement("footer", null, "HushhTechFooter"),
}));

describe("Leadership card grid", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }

    container?.remove();
    container = null;
    root = null;
  });

  it("renders leadership cards in the constrained responsive grid", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            ChakraProvider,
            null,
            React.createElement(Leadership),
          ),
        ),
      );
    });

    const leadershipHeading = Array.from(container.querySelectorAll("h2")).find((heading) =>
      heading.textContent?.includes("People behind the strategy."),
    );
    expect(leadershipHeading).toBeTruthy();

    // Justin Donaldson has been removed — only Manish remains, in a single card.
    const leaderCards = Array.from(container.querySelectorAll("article")).filter((article) =>
      article.textContent?.includes("Founder & CEO"),
    );

    expect(leaderCards).toHaveLength(1);
    expect(container.textContent).toContain("Manish");
    expect(container.textContent).not.toContain("Justin");
    expect(container.textContent).not.toContain("Chief Scientist & Investment Strategist");
  });

  it("keeps the strategy overview aligned to the home-page grid rhythm", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            ChakraProvider,
            null,
            React.createElement(Leadership),
          ),
        ),
      );
    });

    const lede = Array.from(container.querySelectorAll("p")).find((node) =>
      node.textContent?.includes("We combine quantitative expertise"),
    );
    const mission = container.querySelector('[data-testid="leadership-mission-block"]');
    const approachGrid = container.querySelector('[data-testid="leadership-approach-grid"]');
    const approachCards = Array.from(approachGrid?.children || []);

    expect(lede?.className).toContain("max-w-[680px]");
    expect(mission?.className).toContain("max-w-[1060px]");
    expect(approachGrid?.className).toContain("auto-rows-fr");
    expect(approachCards).toHaveLength(4);
    expect(approachCards.every((card) => card.className.includes("h-full"))).toBe(true);
  });
});
