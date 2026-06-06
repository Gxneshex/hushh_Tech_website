// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.hoisted(() => vi.fn());
const headerMock = vi.hoisted(() => vi.fn(() => null));

vi.mock("../src/pages/home/logic", () => ({
  useHomeLogic: () => ({
    primaryCTA: {
      // PD-6 / fix for the home page label-override bug: the hook now
      // returns an honest label that the page renders verbatim. The
      // previous test asserted "Invest with Hushh" because the page used
      // to ignore primaryCTA.text and render that string regardless.
      text: "Start investing",
      action: navigateMock,
      loading: false,
    },
    onNavigate: navigateMock,
  }),
}));

vi.mock("../src/components/hushh-tech-header/HushhTechHeader", () => ({
  default: headerMock,
}));

vi.mock("../src/components/hushh-tech-footer/HushhTechFooter", () => ({
  HushhFooterTab: { HOME: "home" },
  default: () => null,
}));

import HomePage from "../src/pages/home/ui";

describe("HomePage focus order", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    navigateMock.mockClear();
    headerMock.mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("keeps the home CTAs and Fund A investment CTAs in the natural button focus order", async () => {
    await act(async () => {
      root.render(React.createElement(HomePage));
    });

    const buttons = Array.from(container.querySelectorAll("button"));

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      "Start investing",
      "Discover Fund A",
      "Invest in Fund A",
      "Read the fund prospectus",
    ]);
    expect(buttons[2].getAttribute("tabindex")).toBeNull();
    expect(headerMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ showSearch: false }),
    );
  });

  it("opens the populated legal and support pages from the home footer", async () => {
    await act(async () => {
      root.render(React.createElement(HomePage));
    });

    const footerLinks = Array.from(
      container.querySelectorAll("footer a"),
    ).map((link) => ({
      text: link.textContent?.trim(),
      href: link.getAttribute("href"),
    }));

    expect(footerLinks).toEqual([
      { text: "Disclosures", href: "/risk-disclosures" },
      { text: "Privacy", href: "/privacy-policy" },
      { text: "Terms", href: "/terms" },
      { text: "Support", href: "/support" },
    ]);
    expect(container.textContent).toContain("© 2026 Hushh All Rights Reserved.");
  });
});
