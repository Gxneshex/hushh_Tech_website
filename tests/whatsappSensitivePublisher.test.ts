import { describe, expect, it } from "vitest";
import {
  buildSensitivePayloadsFromDrafts,
  cleanSensitiveBody,
  cleanReferenceLabels,
  hasRenderedProvenance,
} from "../scripts/community/publish-whatsapp-sensitive-posts.mjs";

const adpSourceRefs = {
  group: "Hussh Agents, Community & Champions",
  sender: "120363301133443224",
  timestamp: "2026-05-18T21:07:14",
  wa_message_id: "3A3EACCA6562CAFD98E4",
  dedupe_hash: "c6485587d0a39ec032d79a9b64e478a4bdf14bc84c5256c1210b81b6dc364153",
  media: [],
  links: [
    {
      canonical_url:
        "https://adpmeet.webex.com/adpmeet/j.php?MTID=mb79801e6404f07224be0f8784838cf3c",
      link_type: "generic",
      fetch_status: "skipped",
    },
  ],
};

const adpDraftBody = `# ADP Call Scheduled for 1099 Support
> _Draft - review before publishing. Category: ops_admin_REJECT -> general/_
**TL;DR:** A call has been arranged with ADP to discuss 1099 support services.
## Quick Update: ADP 1099 Support Discussion

The team has scheduled a call with ADP to go over 1099 support services. This appears to be an internal operational meeting focused on administrative processes.

We'll share any relevant updates that emerge from the discussion if they impact broader operations.

*This is an internal scheduling note and does not represent any material business development.*
---
### Source references (immutable provenance)
- **Group:** Hussh Agents, Community & Champions
- **Sender:** 120363301133443224
- **Timestamp:** 2026-05-18T21:07:14
- **WhatsApp message id:** \`3A3EACCA6562CAFD98E4\`
- **dedupe_hash:** \`c6485587d0a39ec032d79a9b64e478a4bdf14bc84c5256c1210b81b6dc364153\`
- **Links:** https://adpmeet.webex.com/adpmeet/j.php?MTID=mb79801e6404f07224be0f8784838cf3c [generic/skipped]`;

const draftAt = (index: number, overrides = {}) => ({
  id: `draft-${index}`,
  title: `Sensitive Draft ${index}`,
  slug: `general/sensitive-draft-${index}`,
  description: `Description ${index}`,
  body: `# Sensitive Draft ${index}
**TL;DR:** Summary ${index}.
## Update

This is the user-facing article body for draft ${index}.
---
### Source references (immutable provenance)
- **Group:** Internal Group
- **Sender:** 120363301133443224
- **Timestamp:** 2026-05-18T21:07:14
- **WhatsApp message id:** \`3A3EACCA6562CAFD98E4\`
- **dedupe_hash:** \`c6485587d0a39ec032d79a9b64e478a4bdf14bc84c5256c1210b81b6dc364153\``,
  target_folder: "general",
  category: "ops_admin_REJECT",
  access_level: "NDA",
  status: "needs_human",
  source_refs: JSON.stringify({
    ...adpSourceRefs,
    links: [],
    media: [{ original_filename: `source-${index}.pdf`, media_status: "available" }],
  }),
  attachment_paths: JSON.stringify([`evidence/message-${index}/source-${index}.pdf`]),
  created_at: "2026-05-18T21:07:14",
  updated_at: "2026-05-18T21:07:14",
  ...overrides,
});

describe("WhatsApp sensitive publisher", () => {
  it("turns ADP draft metadata into a clean article with sanitized references", () => {
    const body = cleanSensitiveBody(adpDraftBody, {
      links: adpSourceRefs.links,
      media: [],
      attachmentPaths: [],
    });

    expect(body).toContain("# ADP Call Scheduled for 1099 Support");
    expect(body).toContain("A call has been arranged with ADP to discuss 1099 support services.");
    expect(body).not.toContain("**TL;DR:**");
    expect(body).not.toMatch(/Group|Sender|Timestamp|WhatsApp message id|dedupe_hash/i);
    expect(body).not.toContain("3A3EACCA6562CAFD98E4");
    expect(body).not.toContain("c6485587d0a39ec032d79a9b64e478a4bdf14bc84c5256c1210b81b6dc364153");
    expect(body).not.toContain("https://adpmeet.webex.com");
    expect(body).toContain("## References");
    expect(body).toContain("- ADP Webex meeting reference");
    expect(hasRenderedProvenance(body)).toBe(false);
  });

  it("builds 239 clean NDA payloads and preserves private audit fields separately", () => {
    const ndaDrafts = Array.from({ length: 239 }, (_item, index) => draftAt(index + 1));
    const { payloads, summary } = buildSensitivePayloadsFromDrafts({
      publicPosts: [],
      ndaDrafts,
      expectedCount: 239,
    });

    expect(summary.heldSensitive).toBe(239);
    expect(payloads).toHaveLength(239);
    expect(payloads.every((payload) => payload.accessLevel === "NDA")).toBe(true);
    expect(payloads.every((payload) => payload.category === "sensitive documents")).toBe(true);
    expect(payloads.every((payload) => payload.sourceKind === "whatsapp-sensitive")).toBe(true);
    expect(payloads.every((payload) => !hasRenderedProvenance(payload.bodyMarkdown))).toBe(true);
    expect(payloads.every((payload) => payload.sourceAudit?.waMessageId === "3A3EACCA6562CAFD98E4")).toBe(true);
    expect(payloads[0].bodyMarkdown).not.toContain("Source references");
    expect(payloads[0].bodyMarkdown).toContain("## References");
  });

  it("deduplicates clean reference labels without exposing source paths", () => {
    const labels = cleanReferenceLabels({
      links: [
        { canonical_url: "https://docs.google.com/document/d/private-doc/edit" },
        { canonical_url: "https://docs.google.com/document/d/private-doc/edit?usp=sharing" },
      ],
      media: [{ original_filename: "Fund A Four Layer Deployment Strategy.docx" }],
      attachmentPaths: ["evidence/raw/459ae05007b9.docx"],
    });

    expect(labels).toEqual([
      "Source document: Fund A Four Layer Deployment Strategy.docx",
      "Google document reference",
    ]);
    expect(labels.join(" ")).not.toContain("evidence/raw");
    expect(labels.join(" ")).not.toContain("private-doc");
  });
});
