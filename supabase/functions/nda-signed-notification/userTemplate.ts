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
    <div style="padding:18px 20px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:13px;line-height:1.7;color:${EMAIL_COLORS.mutedText};">
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
              <td style="padding:0;${index === documents.length - 1 ? "" : `border-bottom:1px solid ${EMAIL_COLORS.cardBorder};`}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td valign="top" style="width:44px;padding:16px 0 16px 20px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:1;color:${EMAIL_COLORS.bodyText};font-weight:700;">
                      OK
                    </td>
                    <td valign="top" style="padding:16px 20px 16px 0;font-family:Inter, Arial, Helvetica, sans-serif;font-size:13px;line-height:1.55;color:${EMAIL_COLORS.monoText};font-weight:600;">
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
      )}" style="font-family:SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;font-size:13px;line-height:1.55;font-weight:700;color:${EMAIL_COLORS.monoText};text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(
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
          <td align="center" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:50px;line-height:1.05;color:${EMAIL_COLORS.white};font-weight:700;padding:0 0 12px 0;">
            Your NDA is signed
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:11px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:500;letter-spacing:0.26em;text-transform:uppercase;">
            Confirmation
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:44px;">
        <p style="margin:0;font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:1.85;color:${EMAIL_COLORS.bodyText};">
          Hi ${escapeHtml(signerName)},
        </p>
        <p style="margin:14px 0 0 0;font-family:Inter, Arial, Helvetica, sans-serif;font-size:13px;line-height:1.95;color:${EMAIL_COLORS.mutedText};">
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
        <div style="border-top:1px solid #EFEFEF;padding-top:30px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:12px;line-height:1.9;color:${EMAIL_COLORS.mutedText};">
          Questions about your agreement or the fund? Just reply to this email and our team will help.
        </div>
      </div>
    `)}
    ${renderFooter()}
  `);
}
