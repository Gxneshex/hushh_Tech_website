#!/usr/bin/env python3
"""
4-page technical PDF for the Hushh in-house Electronic Signature.
P1  Swimlane activity flow — MuleSoft style (gray header band, vertical lane
    separators, white bg). CTA hits the Process API which calls each layer
    (Records / Document / Notification System APIs) over HTTPS, round-trip.
P2  Architecture diagram
P3  Evidence captured + ESIGN/UETA mapping
P4  Component responsibilities + scope
"""
import math
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

W, H = letter  # 612 x 792 portrait

BLACK = HexColor("#0D0D0D")
GOLD = HexColor("#E9C349")
INK = HexColor("#2B2B2B")
MUTE = HexColor("#6A6A6A")
ARROW = HexColor("#8A8F96")
BORDER = HexColor("#AEB4BB")
HEADBG = HexColor("#C6CAD0")      # gray lane-header band (like the example)
SEP = HexColor("#CFCFCF")          # vertical lane separators
SOFT = HexColor("#F5F5F7")
WHITE = HexColor("#FFFFFF")
GREEN = HexColor("#1D7A3A")
CARDBORDER = HexColor("#C9CDD2")

OUT = "docs/Hushh_Electronic_Signature_Flow_and_Architecture.pdf"
c = canvas.Canvas(OUT, pagesize=letter)


def wrap(text, n):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 <= n:
            cur = (cur + " " + w).strip()
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def box(cx, cy, w, h, text, fs=6.4, fill=WHITE, border=BORDER, tcol=INK, bold=False, rad=8):
    c.setStrokeColor(border); c.setLineWidth(1); c.setFillColor(fill)
    c.roundRect(cx - w / 2, cy - h / 2, w, h, rad, stroke=1, fill=1)
    c.setFillColor(tcol); c.setFont("Helvetica-Bold" if bold else "Helvetica", fs)
    lines = wrap(text, max(8, int(w / (fs * 0.5))))
    ly = cy + (len(lines) - 1) * (fs + 1.4) / 2
    for ln in lines:
        c.drawCentredString(cx, ly - fs * 0.34, ln); ly -= (fs + 1.4)


def diamond(cx, cy, w, h, text, fs=6.4):
    c.setStrokeColor(BORDER); c.setLineWidth(1); c.setFillColor(WHITE)
    p = c.beginPath()
    p.moveTo(cx, cy + h / 2); p.lineTo(cx + w / 2, cy); p.lineTo(cx, cy - h / 2); p.lineTo(cx - w / 2, cy); p.close()
    c.drawPath(p, stroke=1, fill=1)
    c.setFillColor(INK); c.setFont("Helvetica", fs)
    lines = wrap(text, 12)
    ly = cy + (len(lines) - 1) * (fs + 1) / 2
    for ln in lines:
        c.drawCentredString(cx, ly - fs * 0.34, ln); ly -= (fs + 1)


def arr(x1, y1, x2, y2, label=None, col=ARROW):
    c.setStrokeColor(col); c.setLineWidth(1)
    c.line(x1, y1, x2, y2)
    ang = math.atan2(y2 - y1, x2 - x1); a = 4.5
    c.setFillColor(col)
    p = c.beginPath(); p.moveTo(x2, y2)
    p.lineTo(x2 - a * math.cos(ang - 0.45), y2 - a * math.sin(ang - 0.45))
    p.lineTo(x2 - a * math.cos(ang + 0.45), y2 - a * math.sin(ang + 0.45))
    p.close(); c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFillColor(MUTE); c.setFont("Helvetica", 5.6)
        c.drawCentredString((x1 + x2) / 2, max(y1, y2) + 3, label)


def roundtrip(px, py, sx, sy, pw, sw, label="HTTPS"):
    """process box (px,py,pw) -> system box (sx,sy,sw): out arrow (HTTPS) + return."""
    pr = px + pw / 2; sl = sx - sw / 2
    arr(pr, py + 5, sl, sy + 5, label)        # request
    arr(sl, sy - 5, pr, py - 5)               # response


def xnode(cx, cy):
    c.setStrokeColor(ARROW); c.setLineWidth(1); c.setFillColor(WHITE)
    c.circle(cx, cy, 6, stroke=1, fill=1)
    c.line(cx - 4.2, cy + 4.2, cx + 4.2, cy - 4.2)
    c.line(cx + 4.2, cy + 4.2, cx - 4.2, cy - 4.2)


def start_node(cx, cy):
    c.setFillColor(BLACK); c.circle(cx, cy, 7, stroke=0, fill=1)


def end_node(cx, cy):
    c.setFillColor(BLACK); c.circle(cx, cy, 7.5, stroke=0, fill=1)
    c.setStrokeColor(WHITE); c.setLineWidth(1.2); c.circle(cx, cy, 3.6, stroke=1, fill=0)


def page_header(title, sub):
    c.setFillColor(BLACK); c.rect(0, H - 52, W, 52, stroke=0, fill=1)
    c.setFillColor(GOLD); c.setFont("Helvetica-Bold", 7); c.drawString(40, H - 19, "HUSHH  TECHNOLOGIES")
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 12.5); c.drawString(40, H - 36, title)
    c.setFillColor(HexColor("#C9C9C9")); c.setFont("Helvetica", 7.6); c.drawString(40, H - 47, sub)


def footer(pg):
    c.setStrokeColor(HexColor("#E3E3E3")); c.setLineWidth(0.5); c.line(40, 30, W - 40, 30)
    c.setFillColor(MUTE); c.setFont("Helvetica", 6.3)
    c.drawString(40, 21, "Hushh in-house Electronic Signature (ESIGN Act / UETA — Simple Electronic Signature + audit certificate). Informational, not legal advice.")
    c.drawRightString(W - 40, 21, f"Page {pg} of 4")


# ───────────────────────── PAGE 1 — MuleSoft-style swimlane ─────────────────────────
page_header("Electronic Signature — Technical Flow",
            "Signature CTA hits the Process API, which calls each layer (Records / Document / Notification System APIs)")

# lane geometry
PL, PR_ = 86, 604
seps = [PL, 348, 436, 524, PR_]   # Process | Records | Notification | Document
lane_titles = [
    ("E-Signature\nProcess API", (PL + 348) / 2),
    ("FSC Wealth\nRecords System API", (348 + 436) / 2),
    ("Notification\nSystem API (Slack/Gmail)", (436 + 524) / 2),
    ("Document\nSystem API (in-house)", (524 + PR_) / 2),
]
TOP, BOTTOM = H - 84, 92
# header band
c.setFillColor(HEADBG); c.rect(PL, TOP - 4, PR_ - PL, 30, stroke=0, fill=1)
c.setStrokeColor(HexColor("#AFAFAF")); c.setLineWidth(0.5); c.rect(PL, TOP - 4, PR_ - PL, 30, stroke=1, fill=0)
c.setFillColor(HexColor("#33373C"));
for title, lx in lane_titles:
    parts = title.split("\n")
    c.setFont("Helvetica-Bold", 6.7)
    for j, ln in enumerate(parts):
        c.drawCentredString(lx, TOP + 14 - j * 8, ln)
# vertical separators
c.setStrokeColor(SEP); c.setLineWidth(0.8)
for sx in seps:
    c.line(sx, TOP - 4, sx, BOTTOM)

SPINE = 150          # process spine x
BR = 290             # process branch x
REC = (348 + 436) / 2
NOT = (436 + 524) / 2
DOC = (524 + PR_) / 2
SPW, BRW, SYW = 112, 96, 80

# start (outside left)
sy = TOP - 28
start_node(58, sy)
c.setFillColor(INK); c.setFont("Helvetica", 6.2)
c.drawCentredString(58, sy - 16, "Signature"); c.drawCentredString(58, sy - 24, "CTA hit")
arr(66, sy, SPINE - SPW / 2, sy, "HTTPS")

# spine row helpers
def spine_box(y, text, fs=6.4, h=30):
    box(SPINE, y, SPW, h, text, fs=fs)

y1 = sy
spine_box(y1, "Receive sign request (name, email, docs)")
y2 = y1 - 52; arr(SPINE, y1 - 15, SPINE, y2 + 16)
spine_box(y2, "Capture evidence (IP, signature ID, device, time, consent)", h=34, fs=6.0)

# consent decision
yd = y2 - 60; arr(SPINE, y2 - 17, SPINE, yd + 18)
diamond(SPINE, yd, 92, 40, "Consent valid?")
# No branch -> Records + Notification, then X
box(BR, yd, BRW, 28, "Record rejection in FSC Wealth", fs=6.0)
arr(SPINE + 46, yd, BR - BRW / 2, yd, "No")
box(REC, yd, SYW, 26, "Update record", fs=6.2)
roundtrip(BR, yd, REC, yd, BRW, SYW)
yb2 = yd - 50; arr(BR, yd - 14, BR, yb2 + 14)
box(BR, yb2, BRW, 28, "Notify FA of rejection", fs=6.0)
box(NOT, yb2, SYW, 28, "Post rejection message", fs=6.0)
roundtrip(BR, yb2, NOT, yb2, BRW, SYW)
arr(BR, yb2 - 14, BR, yb2 - 26); xnode(BR, yb2 - 33)
c.setFillColor(MUTE); c.setFont("Helvetica", 6); c.drawString(SPINE - 16, yd - 26, "Yes")

# Yes spine: record consent
yc = yd - 78; arr(SPINE, yd - 20, SPINE, yc + 16)
spine_box(yc, "Record consent in FSC Wealth")
box(REC, yc, SYW, 26, "Update record", fs=6.2)
roundtrip(SPINE, yc, REC, yc, SPW, SYW)

# send documents for signing -> Document System API
ys = yc - 56; arr(SPINE, yc - 15, SPINE, ys + 16)
spine_box(ys, "Send documents for signing")
box(DOC, ys, SYW, 40, "Generate & stamp signed docs (cert + SHA-256)", fs=5.8)
roundtrip(SPINE, ys, DOC, ys, SPW, SYW)

# docs signed decision
yd2 = ys - 62; arr(SPINE, ys - 15, SPINE, yd2 + 18)
diamond(SPINE, yd2, 92, 40, "Docs signed?")
box(BR, yd2, BRW, 28, "Notify FA of error", fs=6.0)
arr(SPINE + 46, yd2, BR - BRW / 2, yd2, "No")
box(NOT, yd2, SYW, 28, "Post error message", fs=6.0)
roundtrip(BR, yd2, NOT, yd2, BRW, SYW)
arr(BR, yd2 - 14, BR, yd2 - 26); xnode(BR, yd2 - 33)
c.setFillColor(MUTE); c.setFont("Helvetica", 6); c.drawString(SPINE - 16, yd2 - 26, "Yes")

# record evidence + doc IDs
yr = yd2 - 74; arr(SPINE, yd2 - 20, SPINE, yr + 16)
spine_box(yr, "Record signature evidence + doc IDs in FSC Wealth", h=34, fs=6.0)
box(REC, yr, SYW, 26, "Update record", fs=6.2)
roundtrip(SPINE, yr, REC, yr, SPW, SYW)

# notify success
yk = yr - 56; arr(SPINE, yr - 17, SPINE, yk + 16)
spine_box(yk, "Notify FA of success")
box(NOT, yk, SYW, 28, "Post success message", fs=6.0)
roundtrip(SPINE, yk, NOT, yk, SPW, SYW)

# end
ye = yk - 42; arr(SPINE, yk - 15, SPINE, ye + 9)
end_node(SPINE, ye)

footer(1)
c.showPage()

# ───────────────────────── PAGE 2 — Architecture ─────────────────────────
page_header("Electronic Signature — Architecture", "In-house signing on the existing FSC Wealth stack — no third-party e-sign vendor")

def acard(cx, cy, w, h, title, body, fill=WHITE, tcol=INK, tfs=8.2):
    c.setStrokeColor(CARDBORDER); c.setLineWidth(1.1); c.setFillColor(fill)
    c.roundRect(cx - w / 2, cy - h / 2, w, h, 8, stroke=1, fill=1)
    c.setFillColor(tcol); c.setFont("Helvetica-Bold", tfs)
    c.drawCentredString(cx, cy + h / 2 - 14, title)
    c.setFillColor(MUTE); c.setFont("Helvetica", 6.8)
    yy = cy + h / 2 - 26
    for ln in body:
        c.drawCentredString(cx, yy, ln); yy -= 9

midx = W / 2
acard(midx, H - 100, 300, 42, "Signer — Browser  ·  FSC Wealth Web App",
      ["React SPA on Google Cloud Run. Presents the NDA, captures explicit",
       "e-consent, and POSTs the sign request over HTTPS."], fill=SOFT)
arr(midx, H - 121, midx, H - 150, "HTTPS  (CTA / sign request)")
acard(midx, H - 188, 360, 50, "E-Signature Process API  ·  Supabase Edge Function (Deno)",
      ["nda-signed-notification — orchestrator. Captures server-attested evidence:",
       "IP (x-forwarded-for), signature ID (crypto UUID), device (user-agent),",
       "UTC + local timestamps, consent version. Never trusts the client for IP."],
      fill=HexColor("#FFF8E6"), tfs=8.4)
y3 = H - 300; lw = 168
lx, mx2, rx = midx - 185, midx, midx + 185
acard(lx, y3, lw, 64, "Document System API",
      ["signFundDocs.ts + fflate.", "Committed .docx templates.",
       "Fills GP/LP + date + sig ID,", "appends ESIGN Certificate,",
       "computes SHA-256, rezips."])
acard(mx2, y3, lw, 64, "Records System API",
      ["Supabase Postgres (RLS).", "Table nda_signatures:",
       "signer_ip, signature_id,", "signer_user_agent,", "consent_version, docs ackd."])
acard(rx, y3, lw, 64, "Notification System API",
      ["Gmail via Google service", "account (domain-wide deleg.)",
       "Sends signer + admin email", "with signed docs and the", "signature certificate."])
for tx in (lx, mx2, rx):
    arr(midx, H - 213, tx, y3 + 33)
yo = y3 - 70
acard(midx, yo, 380, 40, "Output  ·  Signed fund documents (x4) + Electronic Signature Certificate",
      ["Each document carries a stamped certificate (signer, signature ID, UTC/local time,",
       "IP, device, consent, SHA-256). Evidence row stored as the tamper-evident audit trail."],
      fill=HexColor("#EAF6EE"), tcol=GREEN, tfs=8.0)
for off in (-40, 0, 40):
    arr(midx + off * 1.0, y3 - 32, midx + off, yo + 20)
c.setFillColor(MUTE); c.setFont("Helvetica-Oblique", 6.8)
c.drawCentredString(midx, yo - 34, "Process API fans out to each System-API layer over HTTPS, then writes the signed output + audit record.")
footer(2)
c.showPage()

# ───────────────────────── PAGE 3 — Evidence + standards ─────────────────────────
page_header("Signature Evidence & ESIGN / UETA Mapping", "What is captured at signing time and why it makes the signature legally attributable")
rows = [
    ("Signer identity", "Typed name + account email", "nda_signatures + certificate", "Attribution of the act to a person"),
    ("Intent / consent", "Explicit 'agree to e-records & e-sign', consent version", "consent_version + certificate", "Consent to do business electronically (ESIGN 101(c))"),
    ("Signature ID", "Per-signature UUID (crypto.randomUUID)", "signature_id + certificate + docs", "Unique, correlatable signing event"),
    ("Timestamp", "UTC + signer-local time", "certificate (UTC + local)", "When the signature was made"),
    ("IP address", "Server-attested via x-forwarded-for", "signer_ip + certificate", "Origin evidence; never trusted from client"),
    ("Device", "Browser / OS user-agent", "signer_user_agent + certificate", "Device used to sign"),
    ("Documents", "Names of agreements acknowledged", "documents_acknowledged", "Scope of what was signed"),
    ("Integrity", "SHA-256 fingerprint of each signed doc", "certificate (per document)", "Tamper-evidence of the signed output"),
]
x0, y0 = 40, H - 80
cw = [86, 150, 150, 146]
heads = ["Evidence", "How captured", "Stored as", "Why it matters"]
c.setFillColor(BLACK); c.rect(x0, y0 - 4, sum(cw), 18, stroke=0, fill=1)
c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 7.4)
xx = x0
for h_, w_ in zip(heads, cw):
    c.drawString(xx + 5, y0 + 3, h_); xx += w_
yy = y0 - 4
for i, r in enumerate(rows):
    rh = 30
    c.setFillColor(SOFT if i % 2 == 0 else WHITE); c.rect(x0, yy - rh, sum(cw), rh, stroke=0, fill=1)
    c.setStrokeColor(HexColor("#E3E3E3")); c.setLineWidth(0.4); c.rect(x0, yy - rh, sum(cw), rh, stroke=1, fill=0)
    xx = x0
    for j, (cell, w_) in enumerate(zip(r, cw)):
        c.setFillColor(INK if j == 0 else MUTE)
        c.setFont("Helvetica-Bold" if j == 0 else "Helvetica", 6.6)
        ly = yy - 11
        for ln in wrap(cell, int(w_ / 3.5)):
            c.drawString(xx + 5, ly, ln); ly -= 8
        xx += w_
    yy -= rh
c.setFillColor(INK); c.setFont("Helvetica-Bold", 8.5); c.drawString(40, yy - 18, "Standard")
c.setFillColor(MUTE); c.setFont("Helvetica", 7.2); ty = yy - 30
for ln in [
    "Classification: Simple Electronic Signature (SES) with a captured audit certificate — the model used by",
    "mainstream e-sign products for routine business agreements. Aligns to the US ESIGN Act (2000) + UETA:",
    "a signature is an electronic sound/symbol/process attached to a record and executed with intent to sign,",
    "made attributable by the evidence above. The certificate + DB row together form the audit trail.",
]:
    c.drawString(40, ty, ln); ty -= 11
footer(3)
c.showPage()

# ───────────────────────── PAGE 4 — Responsibilities + scope ─────────────────────────
page_header("Components & Scope", "Who does what, and what is intentionally deferred")
def section(y, title):
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 9); c.drawString(40, y, title)
    c.setStrokeColor(GOLD); c.setLineWidth(1.4); c.line(40, y - 4, W - 40, y - 4)
section(H - 80, "Component responsibilities")
comp = [
    ("FSC Wealth Web App (React SPA)", "Renders the NDA, captures explicit e-consent, POSTs the sign request over HTTPS when the CTA is hit."),
    ("E-Signature Process API (edge fn)", "Orchestrates signing; captures server-attested evidence; fans out to each System-API layer."),
    ("Document System API (signFundDocs)", "Fills GP/LP signatures + date + signature ID, appends the certificate, hashes (SHA-256), rezips."),
    ("Records System API (nda_signatures)", "Stores the evidence/audit record; RLS-protected, service-role writes only."),
    ("Notification System API (Gmail)", "Delivers signed documents + certificate to the signer and the admin/GP."),
]
y = H - 96
for t, d in comp:
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 7.6); c.drawString(46, y, t)
    c.setFillColor(MUTE); c.setFont("Helvetica", 7.2); yy = y - 10
    for ln in wrap(d, 96):
        c.drawString(52, yy, ln); yy -= 9
    y = yy - 6
section(y - 6, "In scope now  vs  deferred"); y -= 22
c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 7.6); c.drawString(46, y, "In scope (live):")
c.setFillColor(MUTE); c.setFont("Helvetica", 7.2)
for ln in ["Typed-name SES, explicit consent capture, per-signature UUID, UTC/local timestamps,",
           "server-attested IP + device, SHA-256 per document, stamped certificate, RLS audit row,",
           "signer + admin notification with the signed documents."]:
    y -= 10; c.drawString(52, y, ln)
y -= 16
c.setFillColor(HexColor("#9A6200")); c.setFont("Helvetica-Bold", 7.6); c.drawString(46, y, "Deferred (for counsel / larger build):")
c.setFillColor(MUTE); c.setFont("Helvetica", 7.2)
for ln in ["Embedded PKI / PAdES digital signatures, RFC-3161 trusted timestamps, hash-chained signed",
           "audit log, step-up OTP at signing, consumer-vs-entity classification & signing authority,",
           "per-document proof-of-view events, GP counter-signature workflow, WORM retention."]:
    y -= 10; c.drawString(52, y, ln)
c.setFillColor(SOFT); c.roundRect(40, y - 44, W - 80, 30, 6, stroke=0, fill=1)
c.setFillColor(INK); c.setFont("Helvetica-Bold", 7.4); c.drawString(50, y - 24, "Note")
c.setFillColor(MUTE); c.setFont("Helvetica", 7.0)
c.drawString(50, y - 35, "Built fully in-house on the existing stack (no DocuSign/third-party e-sign). This document is informational, not legal advice.")
footer(4)
c.showPage()
c.save()
print("WROTE Hushh_Electronic_Signature_Flow_and_Architecture.pdf")
