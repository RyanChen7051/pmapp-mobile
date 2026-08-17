#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 PMApp 电脑版（Windows）安装使用说明 PDF —— 领导专用。
使用 reportlab 直接生成，内嵌 STSong-Light 中文字体，无 headless 乱码问题。
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

# ---- 字体注册（中文） ----
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
CJK = 'STSong-Light'

OUT = "/Users/chenbangjie/WorkBuddy/PMApp/pwa/PMApp_电脑版安装说明_领导专用.pdf"

# ---- 配色 ----
NAVY = colors.HexColor('#1F3864')
BLUE = colors.HexColor('#2E5FB0')
LIGHT = colors.HexColor('#EAF1FB')
ACCENT = colors.HexColor('#C0392B')
GREY = colors.HexColor('#555555')

# ---- 样式 ----
styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault('fontName', CJK)
    return ParagraphStyle(name, parent=styles['Normal'], **kw)

title_style   = S('t', fontSize=22, leading=28, textColor=colors.white, alignment=TA_CENTER, spaceAfter=2)
subtitle_style= S('st', fontSize=11, leading=16, textColor=colors.white, alignment=TA_CENTER)
h_step        = S('hs', fontSize=14, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=4)
body          = S('b', fontSize=10.5, leading=16, textColor=colors.black)
body_ind      = S('bi', fontSize=10.5, leading=16, textColor=colors.black, leftIndent=10)
note          = S('n', fontSize=10, leading=15, textColor=GREY)
url_style     = S('u', fontSize=10.5, leading=16, textColor=ACCENT, fontName=CJK)
small_white   = S('sw', fontSize=9, leading=12, textColor=colors.white, alignment=TA_CENTER)

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # 顶部色带
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 26*mm, w, 26*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(CJK, 18)
    canvas.drawCentredString(w/2, h - 12*mm, "PMApp 电脑版安装使用说明")
    canvas.setFont(CJK, 10)
    canvas.drawCentredString(w/2, h - 19*mm, "领导专用 · Windows 系统 · 一套账号手机/电脑通用")
    # 页脚
    canvas.setFillColor(GREY)
    canvas.setFont(CJK, 8)
    canvas.drawString(18*mm, 10*mm, "PMApp · 内部使用")
    canvas.drawRightString(w - 18*mm, 10*mm, "第 %d 页" % doc.page)
    canvas.restoreState()

def step_box(num, title, lines):
    """生成一步的表格：左侧大号步骤编号，右侧标题+内容。"""
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
    return [Paragraph(f'• {t}', style) for t in items]

def main():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=32*mm, bottomMargin=16*mm,
        title="PMApp 电脑版安装使用说明（领导专用）",
        author="PMApp",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id='main')
    doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=header_footer)])

    story = []

    # 引言
    intro = Paragraph(
        "本说明帮助你把 <b>PMApp</b> 安装到 Windows 电脑上，变成桌面独立 App："
        "宽屏自动显示<b>领导驾驶舱</b>总览，登录账号与手机端<b>完全一致</b>，"
        "并内嵌 <b>AI 助理</b>。全程约 2 分钟，照着下面 4 步点即可。",
        body)
    story.append(intro)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LIGHT))
    story.append(Spacer(1, 6))

    # 步骤 1
    story.append(KeepTogether([
        step_box(1, "打开浏览器", [
            "在 Windows 电脑上，双击打开 <b>Google Chrome</b> 或 <b>Microsoft Edge</b>"
            "（一般在任务栏或桌面，Chrome 是彩色圆环、Edge 是蓝色“e”）。",
            "若电脑上没有，请先安装：Chrome 访问 chrome.google.com，或 Edge 通过微软商店 / 系统自带。",
        ]),
        Spacer(1, 4),
    ]))

    # 步骤 2
    story.append(KeepTogether([
        step_box(2, "访问网址并登录", [
            "在浏览器<b>地址栏</b>输入（或复制粘贴）下面网址，按回车：",
            ('url', "https://ryanchen7051.github.io/pmapp-mobile/"),
            "打开后用和<b>手机端完全相同</b>的账号、密码登录；登录后即进入 PMApp 首页。",
        ]),
        Spacer(1, 4),
    ]))

    # 步骤 3
    story.append(KeepTogether([
        step_box(3, "安装到桌面（变成独立 App）", [
            "<b>方法一（最简单）</b>：看浏览器地址栏<b>最右侧</b>，会出现一个「📥 安装」图标"
            "（有的浏览器显示为电脑/加号），点击它 → 在弹出的框里点「安装 PMApp」。",
            "<b>方法二</b>：点击浏览器右上角「⋯」或「⋮」菜单 → 找到"
            "「安装 PMApp / 将此站点安装为应用」→ 点击安装。",
            "安装完成后，Windows <b>桌面</b>会自动出现一个 <b>PMApp 图标</b>，同时也会加入「开始」菜单。",
        ]),
        Spacer(1, 4),
    ]))

    # 步骤 4
    story.append(KeepTogether([
        step_box(4, "以后怎么打开", [
            "直接<b>双击桌面上的 PMApp 图标</b>（或在「开始」菜单里找 PMApp）即可打开。",
            "打开的是一个<b>没有地址栏的独立窗口</b>，像本地软件一样使用，"
            "不会误关网页、不会丢失内容。",
        ]),
        Spacer(1, 4),
    ]))

    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=0.6, color=LIGHT))
    story.append(Spacer(1, 6))

    # 你会看到什么
    story.append(Paragraph("你会看到什么（宽屏效果）", h_step))
    story.append(Paragraph(
        "把窗口拉宽，左侧出现<b>导航栏</b>，首页直接显示<b>领导驾驶舱</b>：", body))
    story.append(Spacer(1, 2))
    for t in bullets([
        "<b>6 项核心 KPI</b>：项目总数 / 待处理问题 / DOA 记录 / RMA 在处 / 出货在途 / 未完成任务",
        "<b>近期动态</b>：问题、DOA、RMA、巡检的最新进展（按时间倒序）",
        "<b>项目阶段分布</b>：各阶段项目数量一目了然",
        "<b>DOA / RMA 趋势图</b>：直观看出质量走势",
        "<b>8 个常用功能快捷入口</b>：一点即达",
        "首页右上角内嵌 <b>AI 助理</b>，点开即可对话提问",
    ]):
        story.append(t)
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        "把窗口收窄、或用手机打开，会自动变回<b>底部标签 + 移动布局</b>——"
        "<b>同一套系统，自动适配</b>，无需切换。", body))

    story.append(Spacer(1, 8))

    # 温馨提示
    story.append(Paragraph("温馨提示", h_step))
    tip_tbl = Table([[
        [Paragraph("• " + t, note) for t in [
            "账号与手机端完全一致，<b>无需新注册</b>；忘记密码请联系管理员。",
            "若你之前已装过旧版本：只需<b>关闭已打开的 PMApp 窗口，重新双击打开（或刷新一次）</b>，"
            "就会自动更新到带驾驶舱的新版。",
            "网络要求：能正常访问互联网即可（HTTPS 已加密）。",
            "若地址栏没出现安装图标：确认浏览器为 Chrome/Edge 较新版本，并用菜单里的「安装」入口操作。",
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
