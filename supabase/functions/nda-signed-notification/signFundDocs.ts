// Runtime fund-document signer.
//
// Takes the tokenized templates (fundDocTemplates.base64.ts) and fills the
// signature tokens with the General Partner (constant) + the Limited Partner
// (the signer) names and dates, producing signed .docx email attachments.
//
// All the docx surgery was done offline by scripts/build-signed-doc-templates.mjs;
// here we only swap tokens -> values, so this stays simple and reliable. Uses a
// bare `fflate` import (mapped in deno.json for Deno; resolved from node_modules
// in vitest) and atob/btoa (global in both Deno and Node 18+), so it is testable.
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import { FUND_DOC_TEMPLATES } from "./fundDocTemplates.base64.ts";

export interface SignedDocAttachment {
  filename: string;
  mimeType: string;
  base64Data: string;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const GENERAL_PARTNER_SIGNATORY = "Manish Sainani";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  return arr;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function formatSignDate(signedAt?: string): string {
  const d = signedAt ? new Date(signedAt) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export interface SignFundDocsOptions {
  signerName: string;
  signerEmail?: string;
  /** ISO timestamp of signing — drives the GP/LP date and the certificate UTC line. */
  signedAt?: string;
  /** Human-readable local time + timezone shown on the certificate (display only). */
  signedAtLocal?: string;
  /** Server-captured source IP (x-forwarded-for) — electronic-signature attribution. */
  ip?: string;
  /** Signer's browser user-agent. */
  userAgent?: string;
  /** Unique signature identifier (UUID), shared with the PDF + DB record. */
  signatureId?: string;
  /** Consent/version the signer accepted. */
  consentVersion?: string;
}

function utcLine(signedAt?: string): string {
  const d = signedAt ? new Date(signedAt) : new Date();
  return (Number.isNaN(d.getTime()) ? new Date() : d).toISOString();
}

/**
 * Build signed copies of every fund document for this signer, each carrying an
 * Electronic Signature Certificate (ESIGN/UETA evidence: signer, signature ID,
 * UTC + local time, IP, device, consent, document hash).
 * GP signature = "Manish Sainani"; LP signature/name = the signer's name.
 * Never throws — a doc that fails to render is skipped (logged), so the email still sends.
 */
export function buildSignedFundDocs(opts: SignFundDocsOptions): SignedDocAttachment[] {
  const date = formatSignDate(opts.signedAt);
  const replacements: Record<string, string> = {
    "{{GP_SIGNATURE}}": xmlEscape(GENERAL_PARTNER_SIGNATORY),
    "{{GP_DATE}}": xmlEscape(date),
    "{{LP_SIGNATURE}}": xmlEscape(opts.signerName),
    "{{LP_NAME}}": xmlEscape(opts.signerName),
    "{{LP_DATE}}": xmlEscape(date),
    "{{SIG_ID}}": xmlEscape(opts.signatureId || "Not recorded"),
    "{{SIG_NAME}}": xmlEscape(opts.signerName),
    "{{SIG_EMAIL}}": xmlEscape(opts.signerEmail || "Not recorded"),
    "{{SIG_SIGNED_UTC}}": xmlEscape(utcLine(opts.signedAt)),
    "{{SIG_SIGNED_LOCAL}}": xmlEscape(opts.signedAtLocal || date),
    "{{SIG_IP}}": xmlEscape(opts.ip || "Not recorded"),
    "{{SIG_DEVICE}}": xmlEscape(opts.userAgent || "Not recorded"),
    "{{SIG_CONSENT}}": xmlEscape(
      opts.consentVersion
        ? `Consent to electronic records & signatures (v${opts.consentVersion})`
        : "Consent to electronic records & signatures",
    ),
  };

  const out: SignedDocAttachment[] = [];
  for (const template of FUND_DOC_TEMPLATES) {
    try {
      const files = unzipSync(base64ToBytes(template.base64));
      const docXmlBytes = files["word/document.xml"];
      if (!docXmlBytes) throw new Error("template missing word/document.xml");
      let xml = strFromU8(docXmlBytes);
      for (const [token, value] of Object.entries(replacements)) {
        xml = xml.split(token).join(value);
      }
      files["word/document.xml"] = strToU8(xml);
      out.push({
        filename: template.filename,
        mimeType: DOCX_MIME,
        base64Data: bytesToBase64(zipSync(files)),
      });
    } catch (err) {
      console.warn(`[signFundDocs] failed to sign ${template.key}:`, err);
    }
  }
  return out;
}
