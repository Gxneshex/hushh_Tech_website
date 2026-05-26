import { describe, expect, it } from "vitest";

import { formatProfileIntelligenceReport } from "../api/shared/profileIntelligenceFormatter.js";

describe("profile intelligence formatter", () => {
  it("converts a raw Deep Intelligence report into a profile view model", () => {
    const { intelligence } = formatProfileIntelligenceReport({
      status: "completed",
      report: {
        summary:
          "Ada appears in public founder material. Her email ada@example.com was present in one source.",
        confidence: "medium",
        publicProfiles: [
          {
            platform: "LinkedIn",
            title: "Ada Lovelace",
            url: "https://www.linkedin.com/in/ada-lovelace",
          },
        ],
        sourceCitations: [
          {
            title: "Ada Company Bio",
            uri: "https://example.com/team/ada",
          },
          {
            title: "Duplicate",
            url: "https://example.com/team/ada",
          },
        ],
        missingSignals: ["verified investment history"],
      },
    });

    expect(intelligence).toMatchObject({
      status: "completed",
      confidenceLabel: "Medium",
      identityMatch: {
        label: "possible",
      },
      publicProfiles: [
        {
          platform: "LinkedIn",
          title: "Ada Lovelace",
          url: "https://www.linkedin.com/in/ada-lovelace",
          confidence: "medium",
        },
      ],
      evidence: [
        {
          title: "Ada Company Bio",
          domain: "example.com",
          url: "https://example.com/team/ada",
          supports: "Professional profile",
        },
      ],
    });
    expect(intelligence.summary).toContain("[redacted-email]");
    expect(intelligence.redactions).toContain("email");
    expect(intelligence.missingSignals).toContain("verified investment history");
  });

  it("marks ambiguous and low-source reports as partial", () => {
    const { intelligence } = formatProfileIntelligenceReport({
      report: {
        summary: "The match is ambiguous and cannot confirm this is the same person.",
        sourceCitations: [],
      },
    });

    expect(intelligence.status).toBe("partial");
    expect(intelligence.confidenceLabel).toBe("Low");
    expect(intelligence.identityMatch.label).toBe("ambiguous");
    expect(intelligence.riskFlags).toContain("identity_match_ambiguous");
    expect(intelligence.riskFlags).toContain("source_coverage_low");
  });

  it("parses markdown OSINT reports into UI sections", () => {
    const { intelligence } = formatProfileIntelligenceReport({
      summary: `# OSINT Profile Report: Ada Lovelace

## 1. **Geographical & Contextual Intelligence**
- Submitted zip code \`10001\` resolves to New York.
- Context is used only for disambiguation.

## 2. **Digital Persona & OSINT Overview**
- Public source [Example Profile](https://example.com/ada) mentions analytical engines.
- Email ada@example.com is redacted before display.`,
      missingInformation: ["verified public profile links"],
      sources: [{ title: "Example Profile", uri: "https://example.com/ada" }],
    });

    expect(intelligence.summarySections).toEqual([
      {
        title: "Geographical & Contextual Intelligence",
        items: [
          "Submitted zip code 10001 resolves to New York.",
          "Context is used only for disambiguation.",
        ],
      },
      {
        title: "Digital Persona & OSINT Overview",
        items: [
          "Public source Example Profile (https://example.com/ada) mentions analytical engines.",
          "Email [redacted-email] is redacted before display.",
        ],
      },
    ]);
    expect(intelligence.summaryBullets[0]).toBe("Submitted zip code 10001 resolves to New York.");
    expect(intelligence.redactions).toContain("email");
  });
});
