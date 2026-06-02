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
          <td align="center" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:34px;line-height:1.12;color:${EMAIL_COLORS.white};font-weight:700;padding:0 0 12px 0;">
            ${escapeHtml(heading)}
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:Inter, Arial, Helvetica, sans-serif;font-size:11px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:500;letter-spacing:0.26em;text-transform:uppercase;">
            A note from Hushh
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:44px;">
        <p style="margin:0;font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:1.85;color:${EMAIL_COLORS.bodyText};">
          Hi ${escapeHtml(recipientName)},
        </p>
        <p style="margin:14px 0 0 0;font-family:Inter, Arial, Helvetica, sans-serif;font-size:13px;line-height:1.95;color:${EMAIL_COLORS.mutedText};">
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
      <div style="padding-top:42px;padding-bottom:50px;">
        <div style="border-top:1px solid #EFEFEF;padding-top:26px;font-family:Inter, Arial, Helvetica, sans-serif;font-size:12px;line-height:1.9;color:${EMAIL_COLORS.mutedText};">
          Questions? Just reply to this email and our team will help.
        </div>
      </div>
    `)}
    ${renderFooter()}
  `);
}
