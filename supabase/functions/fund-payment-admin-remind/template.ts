// Friendly, branded nudge email sent by the fund-admin team to an investor.
import {
  ActionButton,
  EMAIL_COLORS,
  escapeHtml,
  renderBodySection,
  renderButtons,
  renderEmailDocument,
  renderFooter,
  renderHeroSection,
} from "../_shared/emailTemplateChrome.ts";

// Website-exact font stacks, mirroring _shared/emailTemplateChrome.ts so this
// template renders with the same Playfair/Manrope treatment as the chrome.
const FONT_HEADLINE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

export interface ReminderEmailData {
  recipientName: string;
  heading: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function buildFundReminderHtml({
  recipientName,
  heading,
  bodyText,
  ctaLabel,
  ctaUrl,
}: ReminderEmailData): string {
  const buttons: ActionButton[] =
    ctaUrl && ctaLabel ? [{ label: ctaLabel, href: ctaUrl, variant: "primary" }] : [];

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_HEADLINE};font-size:34px;line-height:1.15;color:${EMAIL_COLORS.white};font-weight:600;padding:0 0 14px 0;">
            ${escapeHtml(heading)}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_BODY};font-size:10px;line-height:1.6;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
            A note from Hushh
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:8px;">
        <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.7;font-weight:600;color:${EMAIL_COLORS.bodyText};">
          Hi ${escapeHtml(recipientName)},
        </p>
        <p style="margin:14px 0 0 0;font-family:${FONT_BODY};font-size:14px;line-height:1.75;font-weight:400;color:${EMAIL_COLORS.mutedText};">
          ${escapeHtml(bodyText)}
        </p>
      </div>
    `)}
    ${
      buttons.length
        ? renderBodySection(`<div style="padding-top:22px;">${renderButtons(buttons)}</div>`)
        : ""
    }
    ${renderBodySection(`
      <div style="padding-top:34px;padding-bottom:14px;">
        <div style="border-top:1px solid #F0F0F0;padding-top:26px;font-family:${FONT_BODY};font-size:12px;line-height:1.9;font-weight:400;color:${EMAIL_COLORS.mutedText};">
          Questions? Just reply to this email and our team will help.
        </div>
      </div>
    `)}
    ${renderFooter()}
  `);
}
