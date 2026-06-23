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

export const FUND_PAYMENT_INLINE_ASSET_KEYS: EmailInlineAssetKey[] = [
  ...EMAIL_FOOTER_INLINE_ASSET_KEYS,
];

// Website-exact font stacks, mirrored from _shared/emailTemplateChrome.ts so this
// template renders in the same Playfair / Manrope / JetBrains Mono family as the chrome.
const FONT_HEADLINE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";

export interface FundPaymentEmailData {
  recipientName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  paymentUrl?: string | null;
  requestReference?: string | null;
  selectedFund: string;
  classAUnits: number;
  classBUnits: number;
  classCUnits: number;
  commitmentLabel: string;
  firstPaymentLabel: string;
  remainingCommitmentLabel?: string | null;
  recurringSummary?: string | null;
  plaidStatus?: string | null;
  kycStatus?: string | null;
  expiresAtLabel?: string | null;
  stripeSessionId?: string | null;
  paymentStatus?: string | null;
  reviewStatus?: string | null;
}

function renderParagraph(value: string): string {
  return `
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.7;font-weight:400;color:${EMAIL_COLORS.bodyText};">
      ${escapeHtml(value)}
    </p>
  `;
}

function renderUnitSummary(data: FundPaymentEmailData): string {
  return renderKeyValueRows([
    { label: "Fund Ticket", value: data.selectedFund, monospace: true },
    { label: "Class A Units", value: String(data.classAUnits), monospace: true },
    { label: "Class B Units", value: String(data.classBUnits), monospace: true },
    { label: "Class C Units", value: String(data.classCUnits), monospace: true },
    { label: "Commitment", value: data.commitmentLabel, monospace: true },
    { label: "First Payment", value: data.firstPaymentLabel, monospace: true },
    ...(data.remainingCommitmentLabel
      ? [{ label: "Remaining Commitment", value: data.remainingCommitmentLabel, monospace: true }]
      : []),
    { label: "Recurring Plan", value: data.recurringSummary || "Not selected", monospace: true },
    { label: "Plaid Status", value: data.plaidStatus || "Not available", monospace: true },
    { label: "KYC Status", value: data.kycStatus || "In review", monospace: true },
    ...(data.expiresAtLabel
      ? [{ label: "Link Expires", value: data.expiresAtLabel, monospace: true, breakAll: true }]
      : []),
    ...(data.requestReference
      ? [{ label: "Request Reference", value: data.requestReference, monospace: true, breakAll: true }]
      : []),
  ]);
}

export function buildFundPaymentRequestUserHtml(data: FundPaymentEmailData): string {
  const actionButtons: ActionButton[] = data.paymentUrl
    ? [{ label: "Open Secure Payment Link", href: data.paymentUrl, variant: "primary" }]
    : [];

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_HEADLINE};font-size:40px;line-height:1.1;color:${EMAIL_COLORS.white};font-weight:600;padding:0 0 14px 0;">
            Hushh Fund Payment Link
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_BODY};font-size:11px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">
            Investor Review Step
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:42px;">
        ${renderParagraph(`Hi ${data.recipientName || "there"}, your Hushh Fund payment request is ready. This first payment records a serious investor signal. Final investor access stays pending until the Hushh team completes manual review.`)}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:20px;padding-bottom:6px;">
        ${renderCard("Payment Request", renderUnitSummary(data))}
      </div>
    `)}
    ${
      actionButtons.length
        ? renderBodySection(`
            <div style="padding-top:18px;padding-bottom:8px;">
              ${renderButtons(actionButtons)}
            </div>
          `)
        : ""
    }
    ${renderBodySection(`
      <div style="padding-top:12px;padding-bottom:34px;">
        ${renderParagraph("After Stripe confirms payment, you and the Hushh team will receive a confirmation. Your KYC and Plaid profile stay in review until an agent approves the account.")}
      </div>
    `)}
    ${renderFooter()}
  `);
}

export function buildFundPaymentRequestTeamHtml(data: FundPaymentEmailData): string {
  const rows = [
    { label: "User", value: data.recipientName || "Unknown", monospace: true },
    ...(data.userEmail
      ? [{
          label: "Email",
          htmlValue: `<a href="mailto:${escapeAttribute(data.userEmail)}" style="font-family:${FONT_MONO};font-size:13px;line-height:1.55;font-weight:500;letter-spacing:0.01em;color:${EMAIL_COLORS.monoText};text-decoration:none;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(data.userEmail)}</a>`,
        }]
      : []),
    ...(data.userId ? [{ label: "User ID", value: data.userId, monospace: true, breakAll: true }] : []),
    ...[
      { label: "Payment Status", value: data.paymentStatus || "payment_link_sent", monospace: true },
      { label: "Review Status", value: data.reviewStatus || "not_started", monospace: true },
    ],
  ];

  return renderEmailDocument(`
    ${renderHeroSection(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="font-family:${FONT_HEADLINE};font-size:40px;line-height:1.1;color:${EMAIL_COLORS.white};font-weight:600;padding:0 0 14px 0;">
            Fund Payment Event
          </td>
        </tr>
        <tr>
          <td align="center" style="font-family:${FONT_BODY};font-size:11px;line-height:1.4;color:${EMAIL_COLORS.gold};font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">
            Operations Notification
          </td>
        </tr>
      </table>
    `)}
    ${renderBodySection(`
      <div style="padding-top:42px;">
        ${renderParagraph("A Hushh Fund payment event needs operations review. Payment is Stripe-confirmed only after webhook fulfillment, and investor unlock remains manual.")}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:20px;padding-bottom:6px;">
        ${renderCard("Investor", renderKeyValueRows(rows))}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:16px;padding-bottom:6px;">
        ${renderCard("Fund Commitment", renderUnitSummary(data))}
      </div>
    `)}
    ${renderBodySection(`
      <div style="padding-top:12px;padding-bottom:34px;">
        ${renderParagraph("Use Stripe as the payment truth and Plaid as the verification/risk truth. If bank-to-card matching is weak or skipped, keep the investor pending manual verification.")}
      </div>
    `)}
    ${renderFooter()}
  `);
}
