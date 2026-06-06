// @vitest-environment jsdom

import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Leadership from "../src/components/Leadership";

vi.mock("../src/components/hushh-tech-back-header/HushhTechBackHeader", () => ({
  default: () => React.createElement("header", null, "HushhTechBackHeader"),
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
    const grid = leadershipHeading?.parentElement?.querySelector(".mt-8.grid");
    const cards = Array.from(grid?.children || []);

    expect(grid).not.toBeNull();
    expect(cards).toHaveLength(2);
    expect(grid?.className).toContain("md:grid-cols-2");
    expect(grid?.textContent).toContain("Manish");
    expect(grid?.textContent).toContain("Justin");
    expect(grid?.textContent).toContain("Founder & CEO");
    expect(grid?.textContent).toContain("Chief Scientist & Investment Strategist");
  });
});
