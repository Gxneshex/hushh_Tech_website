// Signer-facing NDA confirmation email — warm, branded, NOT the internal admin
// notification. Sent to the person who signed, with their signed PDF attached.
import {
  ActionButton,
  EMAIL_COLORS,
  escapeAttribute,
  escapeHtml,
  renderBodySection,
  renderButtons,
  renderCard,
  renderEmailDocument,
  renderFooter,
  renderHeroSection,
  renderKeyValueRows,
} from "../_shared/emailTemplateChrome.ts";

// Website-exact font stacks, mirrored from _shared/emailTemplateChrome.ts so the
// few places this file inline-styles directly match the new chrome.
const FONT_HEADLINE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";
const HAIRLINE = "#F0F0F0";

export interface NDAUserConfirmationData {
  signerName: string;
  signerEmail: string;
  signedDate: string;
  ndaVersion: string;
  pdfAttached: boolean;
  pdfUrl?: string;
  documentsAcknowledged?: string[];
  /** Friendly names of the signed fund agreements attached to this email. */
  signedDocuments?: string[];
  profileUrl: string;
}

function renderSimpleCardBody(contentHtml: string): string {
  return `
    <div style="padding:20px 22px;font-family:${FONT_BODY};font-size:14px;line-height:1.7;color:${EMAIL_COLORS.mutedText};">
      ${contentHtml}
    </div>
  `;
}

function renderDocumentsList(documents: string[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${documents
        .map(
          (doc, index) => `
            <tr>
              <td style="padding:0;${index === documents.length - 1 ? "" : `border-bottom:1px solid ${HAIRLINE};`}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td valign="top" style="width:44px;padding:16px 0 16px 22px;font-family:${FONT_BODY};font-size:10px;line-height:1.6;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLORS.gold};font-weight:700;">
                      OK
                    </td>
                    <td valign="top" style="padding:16px 22px 16px 0;font-family:${FONT_BODY};font-size:14px;line-height:1.55;color:${EMAIL_COLORS.bodyText};font-weight:600;">
                      ${escapeHtml(doc)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `;
}

export function buildNDAUserConfirmationHtml({
  signerName,
  signerEmail,
  signedDate,
  ndaVersion,
  pdfAttached,
  pdfUrl,
  documentsAcknowledged = [],
  signedDocuments = [],
  profileUrl,
}: NDAUserConfirmationData): string {
  const detailRows = [
    { label: "Name", value: signerName, monospace: true },
    {
      label: "Email",
      htmlValue: `<a href="mailto:${escapeAttribute(
        signerEmail
      )}" style="font-family:${FONT_MONO};font-size:13px;line-height:1.55;font-weight:500;color:${EMAIL_COLORS.monoText};text-decoration:none;word-break:break-word;overflow-wrap:anywhere;letter-spacing:0.01em;">${escapeHtml(
        signerEmail
      )}</a>`,
    },
    { label: "Signed", value: signedDate, monospace: true, breakAll: true },
    { label: "NDA Version", value: ndaVersion, monospace: true },
  ];

  const actionButtons: ActionButton[] = [
    { label: "View your profile", href: profileUrl, variant: "primary" },
    ...(pdfUrl
      ? [{ label: "Download your signed NDA", href: pdfUrl, variant: "secondary" as const }]
      : []),
  ];

  const ndaCopyLine = pdfAttached
    ? "A copy of your signed NDA is attached to this email — keep it for your records."
    : pdfUrl
      ? `Your signed NDA is saved for you.<br/><br/><a href="${escapeAttribute(
          pdfUrl
        )}" style="color:${EMAIL_COLORS.bodyText};font-weight:700;text-decoration:underline;">View / Download your NDA</a>`
      : "Your countersigned NDA copy is being prepared and will follow shortly — you can also download it anytime from your profile.";

  const signedDocsLine =
    signedDocuments.length > 0
      ? `<br/><br/>Your signed fund agreements are also attached, executed for your records: ${signedDocuments
          .map((name) => escapeHtml(name))
          .join(", ")}.`
      : "";

  const extraSections = [
    renderCard("Your signed copy", renderSimpleCardBody(`${ndaCopyLine}${signedDocsLine}`)),
    documentsAcknowledged.length > 0
      ? renderCard("Documents you reviewed", renderDocumentsList(documentsAcknowledged))
      : "",
  ]
    .filter(Boolean)
    .join('<div style="height:18px;line-height:18px;">&nbsp;</div>');

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_HEADLINE};font-size:46px;line-height:1.08;color:${EMAIL_COLORS.white};font-weight:600;padding:0 0 14px 0;">
            Your NDA is signed
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_BODY};font-size:11px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.26em;text-transform:uppercase;">
            Confirmation
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:44px;">
        <p style="margin:0;font-family:${FONT_HEADLINE};font-size:20px;line-height:1.5;font-weight:600;color:${EMAIL_COLORS.bodyText};">
          Hi ${escapeHtml(signerName)},
        </p>
        <p style="margin:14px 0 0 0;font-family:${FONT_BODY};font-size:14px;line-height:1.9;color:${EMAIL_COLORS.mutedText};">
          Thank you for signing the Hushh Non-Disclosure Agreement. Your signature is confirmed and securely recorded, and you now have access to our confidential investment materials. You can revisit your signed NDA any time from your profile.
        </p>
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:22px;padding-bottom:6px;">
        ${renderCard("Your agreement", renderKeyValueRows(detailRows))}
      </div>
    `)}
    ${
      extraSections
        ? renderBodySection(`
            <div style="padding-top:12px;padding-bottom:6px;">
              ${extraSections}
            </div>
          `)
        : ""
    }
    ${renderBodySection(`
      <div style="padding-top:18px;padding-bottom:0;">
        ${renderButtons(actionButtons)}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:46px;padding-bottom:54px;">
        <div style="border-top:1px solid ${HAIRLINE};padding-top:30px;font-family:${FONT_BODY};font-size:13px;line-height:1.9;color:${EMAIL_COLORS.mutedText};">
          Questions about your agreement or the fund? Just reply to this email and our team will help.
        </div>
      </div>
    `)}
    ${renderFooter()}
  `);
}
