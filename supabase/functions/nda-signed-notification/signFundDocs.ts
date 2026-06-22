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

/**
 * Build signed copies of every fund document for this signer.
 * GP signature = "Manish Sainani"; LP signature/name = the signer's name; both dated.
 * Never throws — a doc that fails to render is skipped (logged), so the email still sends.
 */
export function buildSignedFundDocs(opts: {
  signerName: string;
  signedAt?: string;
}): SignedDocAttachment[] {
  const date = formatSignDate(opts.signedAt);
  const replacements: Record<string, string> = {
    "{{GP_SIGNATURE}}": xmlEscape(GENERAL_PARTNER_SIGNATORY),
    "{{GP_DATE}}": xmlEscape(date),
    "{{LP_SIGNATURE}}": xmlEscape(opts.signerName),
    "{{LP_NAME}}": xmlEscape(opts.signerName),
    "{{LP_DATE}}": xmlEscape(date),
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
