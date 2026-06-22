import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("community cover images", () => {
  it("exposes a typed getCoverImage backed by the Unsplash CDN", () => {
    const coverImages = read("src/pages/community/coverImages.ts");

    expect(coverImages).toContain("export function getCoverImage");
    expect(coverImages).toContain("export interface CoverImage");
    expect(coverImages).toContain("images.unsplash.com");
  });

  it("renders a real lazy-loaded photo from getCoverImage in CommunityCover", () => {
    const cover = read("src/pages/community/CommunityCover.tsx");

    expect(cover).toContain('from "./coverImages"');
    expect(cover).toContain("getCoverImage");
    expect(cover).toContain("<img");
    expect(cover).toContain("object-cover");
    expect(cover).toContain('loading="lazy"');
  });

  it("regression: root className is caller-sized (no hardcoded h-full w-full)", () => {
    const cover = read("src/pages/community/CommunityCover.tsx");

    // The root must build its className from "relative overflow-hidden" + caller
    // className, so sizing is owned by the caller (e.g. "h-40 w-full").
    expect(cover).toContain('["relative overflow-hidden"');
    // Guard against the old buggy root that hardcoded h-full w-full and
    // collided with caller sizing.
    expect(cover).not.toContain("relative h-full w-full overflow-hidden");
  });
});
