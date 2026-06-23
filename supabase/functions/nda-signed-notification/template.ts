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
import { EMAIL_FOOTER_INLINE_ASSET_KEYS, type EmailInlineAssetKey } from "../_shared/emailInlineAssets.ts";

export interface NDATemplateData {
  signerName: string;
  signerEmail: string;
  signedDate: string;
  ndaVersion: string;
  signerIp: string;
  pdfUrl?: string;
  pdfBase64?: string;
  userId?: string;
  documentsAcknowledged?: string[];
}

export const NDA_INLINE_ASSET_KEYS: EmailInlineAssetKey[] = [...EMAIL_FOOTER_INLINE_ASSET_KEYS];

// Website-exact font stacks, mirrored from _shared/emailTemplateChrome.ts
// (those constants are private to the chrome module, so we re-declare them here
// to keep this template's inline styles consistent with the shared chrome).
const FONT_HEADLINE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";

function renderSimpleCardBody(contentHtml: string): string {
  return `
    <div style="padding:18px 22px;font-family:${FONT_BODY};font-size:14px;line-height:1.7;font-weight:400;color:${EMAIL_COLORS.mutedText};">
      ${contentHtml}
    </div>
  `;
}

function renderDocumentsList(documentsAcknowledged: string[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${documentsAcknowledged
        .map(
          (doc, index) => `
            <tr>
              <td style="padding:0;${index === documentsAcknowledged.length - 1 ? "" : `border-bottom:1px solid ${EMAIL_COLORS.cardBorder};`}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td valign="top" style="width:44px;padding:16px 0 16px 22px;font-family:${FONT_BODY};font-size:9px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_COLORS.gold};font-weight:700;">
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

export function buildNDANotificationHtml({
  signerName,
  signerEmail,
  signedDate,
  ndaVersion,
  signerIp,
  pdfUrl,
  pdfBase64,
  userId,
  documentsAcknowledged = [],
}: NDATemplateData): string {
  const signerRows = [
    { label: "Name", value: signerName, monospace: true },
    {
      label: "Email",
      htmlValue: `<a href="mailto:${escapeAttribute(
        signerEmail
      )}" style="font-family:${FONT_MONO};font-size:13px;line-height:1.55;font-weight:500;letter-spacing:0.01em;color:${EMAIL_COLORS.monoText};text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(
        signerEmail
      )}</a>`,
    },
    { label: "Signed At", value: signedDate, monospace: true, breakAll: true },
    { label: "NDA Version", value: ndaVersion, monospace: true },
    { label: "IP Address", value: signerIp, monospace: true },
    ...(userId
      ? [{ label: "User ID", value: userId, monospace: true, breakAll: true }]
      : []),
  ];

  const actionButtons: ActionButton[] = userId
    ? [
        {
          label: "View This User's NDA",
          href: `https://hushhtech.com/nda-admin?highlight=${encodeURIComponent(userId)}`,
          variant: "primary",
        },
        {
          label: "View All NDA Agreements",
          href: "https://hushhtech.com/nda-admin",
          variant: "secondary",
        },
      ]
    : [
        {
          label: "View All NDA Agreements",
          href: "https://hushhtech.com/nda-admin",
          variant: "primary",
        },
      ];

  const extraSections = [
    pdfUrl
      ? renderCard(
          "Signed NDA Document",
          renderSimpleCardBody(
            `A signed NDA PDF has been stored for this user.<br/><br/><a href="${escapeAttribute(
              pdfUrl
            )}" style="color:${EMAIL_COLORS.bodyText};font-weight:700;text-decoration:underline;">View / Download PDF</a>`
          )
        )
      : "",
    pdfBase64
      ? renderCard(
          "Attachment Notice",
          renderSimpleCardBody("The signed NDA PDF is attached to this email.")
        )
      : "",
    (!pdfUrl && !pdfBase64)
      ? renderCard(
          "⚠ Signed PDF not yet generated",
          renderSimpleCardBody(
            "The signature is recorded, but the signed PDF could not be generated at signing time. It can be regenerated from the admin panel — please follow up."
          )
        )
      : "",
    documentsAcknowledged.length > 0
      ? renderCard("Fund Documents Acknowledged", renderDocumentsList(documentsAcknowledged))
      : "",
  ]
    .filter(Boolean)
    .join('<div style="height:18px;line-height:18px;">&nbsp;</div>');

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_HEADLINE};font-size:42px;line-height:1.08;color:${EMAIL_COLORS.white};font-weight:600;letter-spacing:-0.01em;padding:0 0 14px 0;">
            NDA Agreement Signed
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_BODY};font-size:10px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.26em;text-transform:uppercase;">
            Internal Notification
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:44px;">
        <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.75;font-weight:400;color:${EMAIL_COLORS.mutedText};">
          A new user has signed the Non-Disclosure Agreement on the Hushh platform. This signature has been cryptographically logged and stored within the secure estate.
        </p>
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:22px;padding-bottom:6px;">
        ${renderCard("Signer Information", renderKeyValueRows(signerRows))}
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
        <div style="border-top:1px solid ${EMAIL_COLORS.cardBorder};padding-top:30px;font-family:${FONT_BODY};font-size:12px;line-height:1.9;font-weight:400;color:${EMAIL_COLORS.mutedText};">
          <strong style="color:${EMAIL_COLORS.bodyText};font-weight:700;">Confidentiality Notice:</strong>
          This internal notification contains sensitive legal data. Please keep this confidential. Unauthorized disclosure is strictly prohibited.
        </div>
      </div>
    `)}
    ${renderFooter()}
  `);
}
