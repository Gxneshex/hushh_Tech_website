import {
  EMAIL_COLORS,
  renderBodySection,
  renderCard,
  renderEmailDocument,
  renderFeatureList,
  renderFooter,
  renderHeroSection,
  renderKeyValueRows,
} from "../_shared/emailTemplateChrome.ts";
import { EMAIL_FOOTER_INLINE_ASSET_KEYS, type EmailInlineAssetKey } from "../_shared/emailInlineAssets.ts";

export interface CoinsDeductionTemplateData {
  coinsDeducted: number;
  meetingDate: string;
  meetingTime: string;
  transactionDate: string;
}

export const COINS_DEDUCTION_INLINE_ASSET_KEYS: EmailInlineAssetKey[] = [
  ...EMAIL_FOOTER_INLINE_ASSET_KEYS,
  "analytics",
  "quiz",
  "calendar-check",
];

function formatUsdValue(coinsDeducted: number): string {
  return (coinsDeducted / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function buildCoinsDeductionEmailHtml({
  coinsDeducted,
  meetingDate,
  meetingTime,
  transactionDate,
}: CoinsDeductionTemplateData): string {
  const amountLabel = coinsDeducted.toLocaleString("en-US");

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="left" style="font-family:'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;font-size:10px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:0 0 14px 0;">
            Meeting Confirmed
          </td>
        </tr>
        <tr>
          <td align="left" style="font-family:'Playfair Display', Georgia, 'Times New Roman', serif;font-size:30px;line-height:1.15;color:${EMAIL_COLORS.white};font-weight:600;padding:0 0 12px 0;">
            Your consultation has been successfully scheduled
          </td>
        </tr>
        <tr>
          <td align="left" style="font-family:'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;font-size:15px;line-height:1.6;color:#C9C9C9;font-weight:400;padding:0;">
            Your private session with the fund team has been booked. Here are the details.
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:46px;padding-bottom:12px;">
        ${renderCard(
          "Meeting Details",
          renderKeyValueRows([
            { label: "With", value: "Manish Sainani, Hedge Fund Manager", monospace: true, breakAll: true },
            { label: "Date", value: meetingDate, monospace: true, breakAll: true },
            { label: "Time", value: meetingTime, monospace: true },
            { label: "Duration", value: "1 Hour", monospace: true },
          ])
        )}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:14px;padding-bottom:16px;">
        ${renderCard(
          "Coins Transaction",
          renderKeyValueRows([
            { label: "Coins Used", value: `${amountLabel} HC`, monospace: true },
            { label: "Value", value: `$${formatUsdValue(coinsDeducted)}`, monospace: true },
            { label: "Purpose", value: "CEO Consultation Booking", monospace: true, breakAll: true },
            { label: "Transaction Date", value: transactionDate, monospace: true, breakAll: true },
          ])
        )}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:34px;padding-bottom:54px;">
        <div style="font-family:'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLORS.fineText};padding-bottom:24px;">
          Prepare For Your Session
        </div>
        ${renderFeatureList([
          {
            glyph: "R",
            icon: "analytics",
            title: "Review your portfolio",
            description: "Have your current investment holdings and goals ready to discuss.",
          },
          {
            glyph: "?",
            icon: "quiz",
            title: "Prepare questions",
            description: "Write down specific questions about strategies, allocation, or market outlook.",
          },
          {
            glyph: "C",
            icon: "calendar-check",
            title: "Check your calendar invite",
            description: "A separate calendar invite with the meeting link will be sent shortly.",
          },
        ])}
      </div>
    `)}
    ${renderFooter()}
  `);
}
