#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate PMApp Desktop (Windows) Installation Guide PDF - English version.
Uses built-in Helvetica (Latin typography is crisp; no Chinese in this doc).
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

OUT = "/Users/chenbangjie/WorkBuddy/PMApp/pwa/PMApp_Desktop_Installation_Guide_EN.pdf"

# ---- colors ----
NAVY = colors.HexColor('#1F3864')
BLUE = colors.HexColor('#2E5FB0')
LIGHT = colors.HexColor('#EAF1FB')
ACCENT = colors.HexColor('#C0392B')
GREY = colors.HexColor('#555555')

F = 'Helvetica'
FB = 'Helvetica-Bold'

# ---- styles ----
styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault('fontName', F)
    return ParagraphStyle(name, parent=styles['Normal'], **kw)

title_style   = S('t', fontName=FB, fontSize=22, leading=28, textColor=colors.white, alignment=TA_CENTER, spaceAfter=2)
subtitle_style= S('st', fontSize=11, leading=16, textColor=colors.white, alignment=TA_CENTER)
h_step        = S('hs', fontName=FB, fontSize=14, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=4)
body          = S('b', fontSize=10.5, leading=16, textColor=colors.black)
body_ind      = S('bi', fontSize=10.5, leading=16, textColor=colors.black, leftIndent=10)
note          = S('n', fontSize=10, leading=15, textColor=GREY)
url_style     = S('u', fontName=FB, fontSize=10.5, leading=16, textColor=ACCENT)

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 26*mm, w, 26*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FB, 18)
    canvas.drawCentredString(w/2, h - 12*mm, "PMApp Desktop Installation Guide")
    canvas.setFont(F, 10)
    canvas.drawCentredString(w/2, h - 19*mm, "For Leaders  -  Windows  -  One account for phone & desktop")
    canvas.setFillColor(GREY)
    canvas.setFont(F, 8)
    canvas.drawString(18*mm, 10*mm, "PMApp - Internal use")
    canvas.drawRightString(w - 18*mm, 10*mm, "Page %d" % doc.page)
    canvas.restoreState()

def step_box(num, title, lines):
    badge = Paragraph(f'<font size=26 color="white"><b>{num}</b></font>', S('bdg', alignment=TA_CENTER, textColor=colors.white))
    right = [Paragraph(f'<b>{title}</b>', h_step)]
    for ln in lines:
        if isinstance(ln, tuple) and ln[0] == 'url':
            right.append(Paragraph(ln[1], url_style))
        else:
            right.append(Paragraph(ln, body))
    tbl = Table([[badge, right]], colWidths=[16*mm, 150*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), BLUE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (0,0), 0),
        ('RIGHTPADDING', (0,0), (0,0), 0),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (1,0), (1,0), 8),
    ]))
    return tbl

def bullets(items, style=body_ind):
    return [Paragraph(f'&bull; {t}', style) for t in items]

def main():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=32*mm, bottomMargin=16*mm,
        title="PMApp Desktop Installation Guide (For Leaders)",
        author="PMApp",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')
    doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=header_footer)])

    story = []

    intro = Paragraph(
        "This guide helps you install <b>PMApp</b> on your Windows computer as a standalone "
        "desktop app. On a wide screen it automatically shows the <b>Leadership Cockpit</b> "
        "overview; your login account is <b>exactly the same</b> as on your phone, and the "
        "<b>AI Assistant</b> is built in. Takes about 2 minutes - just follow the 4 steps below.",
        body)
    story.append(intro)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LIGHT))
    story.append(Spacer(1, 6))

    story.append(KeepTogether([
        step_box(1, "Open a browser", [
            "On your Windows PC, open <b>Google Chrome</b> or <b>Microsoft Edge</b> "
            "(usually on the taskbar or desktop - Chrome is the colored circle, Edge is the blue \"e\").",
            "If you don't have one, install Chrome from google.com/chrome, or Edge from the Microsoft Store (often pre-installed).",
        ]),
        Spacer(1, 4),
    ]))

    story.append(KeepTogether([
        step_box(2, "Open the site and sign in", [
            "In the browser <b>address bar</b>, type (or paste) the URL below and press Enter:",
            ('url', "https://ryanchen7051.github.io/pmapp-mobile/"),
            "Sign in with the <b>exact same</b> account and password as your phone app. "
            "You will land on the PMApp home page.",
        ]),
        Spacer(1, 4),
    ]))

    story.append(KeepTogether([
        step_box(3, "Install to desktop (standalone app)", [
            "<b>Method 1 (easiest)</b>: Look at the <b>far right</b> of the address bar - an "
            "\"Install\" icon appears (sometimes a computer/plus icon). Click it, then choose \"Install PMApp\".",
            "<b>Method 2</b>: Click the \"...\" or \"&#9776;\" menu at the top-right -> find "
            "\"Install PMApp / Install this site as an app\" -> click to install.",
            "After installation, a <b>PMApp icon</b> is added to your Windows <b>desktop</b> "
            "and also to the <b>Start menu</b>.",
        ]),
        Spacer(1, 4),
    ]))

    story.append(KeepTogether([
        step_box(4, "How to open it later", [
            "Simply <b>double-click the PMApp icon</b> on your desktop (or find PMApp in the Start menu).",
            "It opens as a <b>standalone window with no address bar</b> - like a native app. "
            "You won't accidentally close a tab or lose your work.",
        ]),
        Spacer(1, 4),
    ]))

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LIGHT))
    story.append(Spacer(1, 6))

    story.append(Paragraph("What you'll see (wide-screen)", h_step))
    story.append(Paragraph(
        "With the window widened, a <b>left navigation bar</b> appears and the home page "
        "shows the <b>Leadership Cockpit</b>:", body))
    story.append(Spacer(1, 2))
    for t in bullets([
        "<b>6 core KPIs</b>: total projects / open issues / DOA records / RMA in progress / shipments in transit / unfinished tasks",
        "<b>Recent activity</b>: latest updates on issues, DOA, RMA, and inspections (newest first)",
        "<b>Project stage distribution</b>: counts per stage at a glance",
        "<b>DOA / RMA trend charts</b>: quality trends visualized",
        "<b>8 quick-access shortcuts</b>: one tap to jump in",
        "<b>AI Assistant</b> built into the top-right of the home page - click to chat",
    ]):
        story.append(t)
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "Narrow the window, or open on your phone, and it automatically returns to the "
        "<b>bottom-tab mobile layout</b> - one system, automatically adapted. No switching needed.", body))

    story.append(Spacer(1, 8))

    story.append(Paragraph("Tips", h_step))
    tip_tbl = Table([[
        [Paragraph("&bull; " + t, note) for t in [
            "Your account is identical to the phone app - <b>no new registration</b>. Forgot your password? Contact your admin.",
            "If you installed an older version before: just <b>close the open PMApp window and reopen it</b> (or refresh once) - "
            "it will automatically update to the new version with the Cockpit.",
            "Network: normal internet access is enough (HTTPS is encrypted).",
            "If the install icon doesn't appear: make sure you're on a recent Chrome/Edge, and use the \"Install\" option in the menu.",
        ]]
    ]], colWidths=[166*mm])
    tip_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BLUE),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tip_tbl)

    doc.build(story)
    print("PDF generated:", OUT)
    print("size:", os.path.getsize(OUT), "bytes")

if __name__ == "__main__":
    main()
