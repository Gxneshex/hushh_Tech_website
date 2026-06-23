import { getInlineAssetCid, type EmailInlineAssetKey } from "./emailInlineAssets.ts";

export const EMAIL_COLORS = {
  black: "#0D0D0D",
  white: "#FFFFFF",
  gold: "#E9C349",
  cardBorder: "#E3E3E3",
  cardHeader: "#FAFAFA",
  bodyText: "#1A1A1A",
  mutedText: "#6A6A6A",
  fineText: "#A4A4A4",
  monoText: "#4A4A4A",
};

// Website-exact font stacks (src/index.css [data-page="home"] + tailwind.config.js).
// Apple Mail / iOS Mail honor the web fonts; Gmail-web / Outlook fall back down the chain.
const FONT_HEADLINE = "'Playfair Display', Georgia, 'Times New Roman', serif";
const FONT_BODY = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";

// Subtle neutrals layered on top of EMAIL_COLORS for finer rhythm.
const PAGE_BG = "#F4F2EC"; // warm off-white canvas behind the 600px card
const HAIRLINE = "#F0F0F0"; // ultra-light interior dividers
const HERO_HAIRLINE = "#262626"; // hairline on dark hero

type ButtonVariant = "primary" | "secondary";

export interface KeyValueRow {
  label: string;
  value?: string;
  htmlValue?: string;
  monospace?: boolean;
  breakAll?: boolean;
}

export interface ActionButton {
  label: string;
  href: string;
  variant?: ButtonVariant;
}

export interface FeatureItem {
  glyph: string;
  title: string;
  description: string;
  icon?: FeatureIcon;
}

type FeatureIcon = Extract<
  EmailInlineAssetKey,
  "calendar" | "bank" | "shield" | "analytics" | "quiz" | "calendar-check"
>;

type SocialIcon = Extract<EmailInlineAssetKey, "home" | "x" | "youtube" | "linkedin" | "facebook">;

function renderImageIcon(src: string, width: number, height: number): string {
  return `<img src="${escapeAttribute(src)}" alt="" width="${width}" height="${height}" style="display:block;margin:0 auto;width:${width}px;height:${height}px;border:0;outline:none;text-decoration:none;" />`;
}

function escapeLineBreaks(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

export function renderEmailDocument(contentHtml: string): string {
  const fontsHref =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Hushh</title>
  <!--[if !mso]><!-->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fontsHref}" rel="stylesheet" type="text/css" />
  <!--<![endif]-->
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('${fontsHref}');
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, div, p, a, span {
      color-scheme: light;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    /* Defend critical colors against client dark-mode inversion. */
    [data-ogsc] .hushh-hero,
    [data-ogsb] .hushh-hero { background-color: ${EMAIL_COLORS.black} !important; }
    [data-ogsc] .hushh-footer,
    [data-ogsb] .hushh-footer { background-color: ${EMAIL_COLORS.black} !important; }
    @media (prefers-color-scheme: dark) {
      .hushh-hero { background-color: ${EMAIL_COLORS.black} !important; }
      .hushh-footer { background-color: ${EMAIL_COLORS.black} !important; }
    }
    @media only screen and (max-width: 620px) {
      .hushh-shell { width: 100% !important; }
      .hushh-pad-x { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body bgcolor="${PAGE_BG}" style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT_BODY};-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;color:${EMAIL_COLORS.bodyText};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE_BG};opacity:0;">&#8203;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}" style="width:100%;background-color:${PAGE_BG};border-collapse:collapse;">
    <tr>
      <td align="center" bgcolor="${PAGE_BG}" style="padding:32px 16px;background-color:${PAGE_BG};">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_COLORS.white}" class="hushh-shell" style="width:600px;max-width:600px;border-collapse:separate;border-spacing:0;background-color:${EMAIL_COLORS.white};border-radius:18px;overflow:hidden;border:1px solid ${EMAIL_COLORS.cardBorder};">
          ${contentHtml}
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBrandBadge(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td valign="middle" style="font-size:15px;line-height:1;padding-right:9px;">&#129323;</td>
        <td valign="middle" style="font-family:${FONT_BODY};font-size:13px;line-height:13px;font-weight:700;letter-spacing:0.34em;color:${EMAIL_COLORS.gold};text-transform:uppercase;">
          HUSHH
        </td>
      </tr>
    </table>
  `;
}

export function renderHeroSection(contentHtml: string): string {
  return `
    <tr>
      <td bgcolor="${EMAIL_COLORS.black}" class="hushh-hero hushh-pad-x" style="background-color:${EMAIL_COLORS.black};padding:34px 44px 46px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td align="left" style="padding-bottom:22px;">
              ${renderBrandBadge()}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${HERO_HAIRLINE};padding-top:34px;">
              ${contentHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function renderBodySection(contentHtml: string, padding = "36px 44px"): string {
  return `
    <tr>
      <td bgcolor="${EMAIL_COLORS.white}" class="hushh-pad-x" style="background-color:${EMAIL_COLORS.white};padding:${padding};">
        ${contentHtml}
      </td>
    </tr>
  `;
}

export function renderTextBlock(text: string, opts?: { centered?: boolean; uppercase?: boolean; muted?: boolean }): string {
  if (opts?.uppercase) {
    return `
      <p style="margin:0;font-family:${FONT_BODY};font-size:10px;line-height:1.6;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${opts?.muted ? EMAIL_COLORS.fineText : EMAIL_COLORS.mutedText};text-align:${opts?.centered ? "center" : "left"};">
        ${escapeLineBreaks(text)}
      </p>
    `;
  }

  return `
    <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.7;font-weight:400;color:${opts?.muted ? EMAIL_COLORS.mutedText : EMAIL_COLORS.bodyText};text-align:${opts?.centered ? "center" : "left"};">
      ${escapeLineBreaks(text)}
    </p>
  `;
}

export function renderCard(title: string, bodyHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_COLORS.white}" style="width:100%;border:1px solid ${EMAIL_COLORS.cardBorder};border-radius:14px;overflow:hidden;border-collapse:separate;border-spacing:0;background-color:${EMAIL_COLORS.white};">
      <tr>
        <td bgcolor="${EMAIL_COLORS.cardHeader}" style="padding:15px 22px;background-color:${EMAIL_COLORS.cardHeader};border-bottom:1px solid ${EMAIL_COLORS.cardBorder};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              <td valign="middle" style="padding-right:10px;">
                <div style="width:5px;height:5px;background-color:${EMAIL_COLORS.gold};border-radius:3px;font-size:0;line-height:0;">&nbsp;</div>
              </td>
              <td valign="middle" style="font-family:${FONT_BODY};font-size:10px;line-height:1.2;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLORS.fineText};">
                ${escapeHtml(title)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td bgcolor="${EMAIL_COLORS.white}" style="padding:0;background-color:${EMAIL_COLORS.white};">
          ${bodyHtml}
        </td>
      </tr>
    </table>
  `;
}

export function renderKeyValueRows(rows: KeyValueRow[]): string {
  const renderedRows = rows
    .map((row, index) => {
      const borderBottom =
        index === rows.length - 1 ? "" : `border-bottom:1px solid ${HAIRLINE};`;
      const valueHtml =
        row.htmlValue ??
        `<span style="font-family:${row.monospace ? FONT_MONO : FONT_BODY};font-size:${row.monospace ? "13px" : "14px"};line-height:1.5;font-weight:${row.monospace ? "500" : "600"};color:${row.monospace ? EMAIL_COLORS.monoText : EMAIL_COLORS.bodyText};${row.monospace ? "letter-spacing:0.01em;" : ""}${row.breakAll ? "word-break:break-word;overflow-wrap:anywhere;" : ""}">${escapeLineBreaks(
          row.value ?? ""
        )}</span>`;

      return `
        <tr>
          <td style="padding:0;${borderBottom}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td valign="top" style="width:36%;padding:16px 18px 16px 22px;font-family:${FONT_BODY};font-size:10px;line-height:1.5;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_COLORS.mutedText};">
                  ${escapeHtml(row.label)}
                </td>
                <td valign="top" align="right" style="padding:16px 22px 16px 18px;text-align:right;">
                  ${valueHtml}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${renderedRows}
    </table>
  `;
}

export function renderButtons(buttons: ActionButton[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${buttons
        .map((button, index) => {
          const variant = button.variant ?? "primary";
          const isPrimary = variant === "primary";
          const bg = isPrimary ? EMAIL_COLORS.black : EMAIL_COLORS.white;
          const fg = isPrimary ? EMAIL_COLORS.white : EMAIL_COLORS.bodyText;
          const borderColor = isPrimary ? EMAIL_COLORS.black : EMAIL_COLORS.cardBorder;
          const href = escapeAttribute(button.href);
          const label = escapeHtml(button.label);

          return `
            <tr>
              <td style="padding:${index === 0 ? "0" : "12px"} 0 0 0;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:512px;" arcsize="24%" ${isPrimary ? `fillcolor="${EMAIL_COLORS.black}" strokecolor="${EMAIL_COLORS.black}"` : `fillcolor="${EMAIL_COLORS.white}" strokecolor="${EMAIL_COLORS.cardBorder}"`}>
                  <w:anchorlock/>
                  <center style="color:${fg};font-family:${FONT_BODY};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${label}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${href}" style="display:block;width:100%;box-sizing:border-box;padding:17px 22px;border-radius:12px;border:1px solid ${borderColor};background-color:${bg};color:${fg};font-family:${FONT_BODY};font-size:12px;line-height:1.2;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-align:center;text-decoration:none;mso-hide:all;">
                  ${label}
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
}

export function renderFeatureList(items: FeatureItem[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${items
        .map(
          (item, index) => `
            <tr>
              <td style="padding:${index === 0 ? "0" : "20px"} 0 0 0;${index === 0 ? "" : `border-top:1px solid ${HAIRLINE};`}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;padding-top:${index === 0 ? "0" : "20px"};">
                  <tr>
                    <td valign="top" style="width:62px;padding-right:18px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:46px;height:46px;border:1px solid ${EMAIL_COLORS.cardBorder};border-radius:23px;border-collapse:separate;background-color:${EMAIL_COLORS.cardHeader};">
                        <tr>
                          <td align="center" valign="middle" style="width:46px;height:46px;font-family:${FONT_HEADLINE};font-size:16px;line-height:1;font-weight:600;color:${EMAIL_COLORS.bodyText};">
                            ${item.icon ? renderFeatureIcon(item.icon) : escapeHtml(item.glyph)}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <div style="font-family:${FONT_HEADLINE};font-size:16px;line-height:1.3;font-weight:600;color:${EMAIL_COLORS.bodyText};margin:0 0 5px 0;">
                        ${escapeHtml(item.title)}
                      </div>
                      <div style="font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${EMAIL_COLORS.mutedText};">
                        ${escapeHtml(item.description)}
                      </div>
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

function renderFeatureIcon(icon: FeatureIcon): string {
  return renderImageIcon(getInlineAssetCid(icon), 20, 20);
}

function renderSocialLink(label: string, url: string, icon: SocialIcon): string {
  const iconHtml = renderImageIcon(getInlineAssetCid(icon), 18, 18);

  return `
    <td align="center" style="padding:0 6px;">
      <a href="${escapeAttribute(url)}" title="${escapeAttribute(label)}" style="display:inline-block;text-decoration:none;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:40px;height:40px;border:1px solid #2D2D2D;border-radius:20px;border-collapse:separate;background-color:#171717;">
          <tr>
            <td align="center" valign="middle" style="width:40px;height:40px;line-height:0;">
              ${iconHtml}
            </td>
          </tr>
        </table>
      </a>
    </td>
  `;
}

export function renderFooter(): string {
  const currentYear = new Date().getFullYear();
  const sep = `<span style="color:${EMAIL_COLORS.gold};padding:0 9px;">&middot;</span>`;

  return `
    <tr>
      <td bgcolor="${EMAIL_COLORS.black}" class="hushh-footer hushh-pad-x" style="background-color:${EMAIL_COLORS.black};padding:46px 44px 50px 44px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding-bottom:30px;">
              ${renderBrandBadge()}
            </td>
          </tr>
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  ${renderSocialLink("Hushh", "https://hushhtech.com", "home")}
                  ${renderSocialLink("X", "https://x.com/hushh_ai", "x")}
                  ${renderSocialLink("YouTube", "https://www.youtube.com/@hushhai", "youtube")}
                  ${renderSocialLink("LinkedIn", "https://www.linkedin.com/company/hushh-ai/", "linkedin")}
                  ${renderSocialLink("Facebook", "https://www.facebook.com/hushhaiplatform", "facebook")}
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:32px;">
              <div style="font-family:${FONT_BODY};font-size:12px;line-height:1.8;color:${EMAIL_COLORS.white};">
                <a href="https://hushhtech.com/about/philosophy" style="color:${EMAIL_COLORS.white};text-decoration:none;">About</a>
                ${sep}
                <a href="https://hushhtech.com/faq" style="color:${EMAIL_COLORS.white};text-decoration:none;">Help Center</a>
                ${sep}
                <a href="https://hushhtech.com/privacy-policy" style="color:${EMAIL_COLORS.white};text-decoration:none;">Privacy</a>
                ${sep}
                <a href="https://hushhtech.com/terms" style="color:${EMAIL_COLORS.white};text-decoration:none;">Terms</a>
                ${sep}
                <a href="mailto:support@hushh.ai?subject=Email%20Preferences" style="color:${EMAIL_COLORS.white};text-decoration:none;">Unsubscribe</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:30px;">
              <div style="border-top:1px solid ${HERO_HAIRLINE};font-size:0;line-height:0;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;font-family:${FONT_BODY};">
              <div style="font-size:10px;line-height:1.6;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_COLORS.gold};">
                Sent by Hushh Technologies Pte Ltd.
              </div>
              <div style="padding-top:9px;font-size:11px;line-height:1.6;color:${EMAIL_COLORS.fineText};">
                &copy; ${currentYear} Hushh. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}
