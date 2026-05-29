// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { HushhMark } from "../src/components/hushh-tech-ui/HushhAppleUI";

describe("HushhMark glass consistency", () => {
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

  it("keeps production logo sizing without adding a second glass tile", async () => {
    await act(async () => {
      root.render(React.createElement(HushhMark));
    });

    const mark = container.querySelector("div");
    const image = container.querySelector('img[alt="Hushh"]');

    expect(image).toBeTruthy();
    expect(mark?.className).not.toContain("bg-[#FFFFFF]");
    expect(mark?.className).not.toContain("overflow-hidden");
    expect(mark?.className).not.toContain("rounded-full");
    expect(image?.className).toContain("object-contain");
    expect(image?.className).not.toContain("scale-");
    expect(image?.className).not.toContain("object-cover");
    expect(mark?.style.background).toBe("");
    expect(mark?.style.boxShadow).toBe("");
    expect(mark?.style.overflow).toBe("");
  });
});
