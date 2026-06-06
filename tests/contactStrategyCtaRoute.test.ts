import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Contact strategy CTA route", () => {
  it("keeps Learn About Our Strategy pointed at the established leadership route", () => {
    const source = readFileSync(resolve("src/pages/Contact.tsx"), "utf8");

    expect(source).toContain("Learn About Our Strategy");
    expect(source).toContain('navigate("/about/leadership")');
    expect(source).not.toContain('navigate("/discover-fund-a")');
  });
});
