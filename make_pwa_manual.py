#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 PMApp PWA 操作说明书（手机版 + 电脑版 领导驾驶舱 合一）PDF。
reportlab 直接生成，内嵌 STSong-Light 中文字体，无 headless 乱码问题。
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
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
CJK = 'STSong-Light'

OUT = "/Users/chenbangjie/WorkBuddy/PMApp/pwa/PMApp_PWA操作说明书_手机版+电脑版.pdf"

NAVY = colors.HexColor('#1F3864')
BLUE = colors.HexColor('#2E5FB0')
LIGHT = colors.HexColor('#EAF1FB')
LIGHT2 = colors.HexColor('#F3F6FB')
ACCENT = colors.HexColor('#C0392B')
GREY = colors.HexColor('#555555')
LINE = colors.HexColor('#C9D4E6')

styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault('fontName', CJK)
    return ParagraphStyle(name, parent=styles['Normal'], **kw)

body = S('b', fontSize=10.5, leading=16, textColor=colors.black, spaceAfter=4)
body_s = S('bs', fontSize=9.5, leading=14, textColor=colors.black, spaceAfter=3)
h1 = S('h1', fontName=CJK, fontSize=15, leading=20, textColor=NAVY, spaceBefore=10, spaceAfter=6)
h2 = S('h2', fontName=CJK, fontSize=12, leading=17, textColor=BLUE, spaceBefore=8, spaceAfter=4)
small = S('sm', fontSize=9, leading=13, textColor=GREY, spaceAfter=3)
cover_title = S('ct', fontName=CJK, fontSize=26, leading=32, textColor=NAVY, alignment=TA_CENTER, spaceAfter=4)
cover_sub = S('cs', fontSize=13, leading=19, textColor=BLUE, alignment=TA_CENTER, spaceAfter=2)
cover_m = S('cm', fontSize=10.5, leading=16, textColor=GREY, alignment=TA_CENTER)
cell = S('c', fontSize=9.5, leading=13.5, textColor=colors.black)
cellb = S('cb', fontSize=9.5, leading=13.5, textColor=NAVY)

def P(t, st=body): return Paragraph(t, st)
def bullets(items, st=body_s):
    return [Paragraph('• ' + it, st) for it in items]

def btn_table(rows):
    """rows: list of (button/位置, 功能说明)"""
    data = [[Paragraph('按钮 / 位置', cellb), Paragraph('功能说明', cellb)]]
    for a, b in rows:
        data.append([Paragraph(a, cell), Paragraph(b, cell)])
    t = Table(data, colWidths=[52*mm, 116*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), CJK),
        ('GRID', (0,0), (-1,-1), 0.5, LINE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT2]),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    return t

def tip_box(text):
    t = Table([[Paragraph(text, S('tip', fontSize=9.5, leading=14, textColor=colors.black))]],
              colWidths=[168*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT),
        ('BOX', (0,0), (-1,-1), 0.8, BLUE),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def section(num, title):
    return [Spacer(1, 4), P(f'{num}  {title}', h1),
            HRFlowable(width='100%', thickness=1, color=LINE), Spacer(1, 2)]

def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 16*mm, w, 16*mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(CJK, 11)
    canvas.drawString(18*mm, h - 10.5*mm, "PMApp PWA 操作说明书")
    canvas.setFont(CJK, 8)
    canvas.drawRightString(w - 18*mm, h - 10.5*mm, "手机版 + 电脑版（领导驾驶舱）")
    canvas.setFillColor(GREY)
    canvas.setFont(CJK, 8)
    canvas.drawString(18*mm, 10*mm, "PMApp · 内部使用")
    canvas.drawRightString(w - 18*mm, 10*mm, "第 %d 页" % doc.page)
    canvas.restoreState()

def main():
    doc = BaseDocTemplate(OUT, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=22*mm, bottomMargin=16*mm,
        title="PMApp PWA 操作说明书（手机版+电脑版）",
        author="PMApp")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')
    doc.addPageTemplates([PageTemplate(id='all', frames=[frame], onPage=header_footer)])

    story = []

    # ── 封面 ──
    story.append(Spacer(1, 40*mm))
    story.append(P("PMApp PWA 操作说明书", cover_title))
    story.append(P("手机版 · 电脑版（领导驾驶舱）合一手册", cover_sub))
    story.append(Spacer(1, 6*mm))
    story.append(P("同一套响应式 PWA：手机浏览器为底部标签 + 移动布局；", cover_m))
    story.append(P("电脑宽屏（≥860px）自动切换为左侧导航 + 领导驾驶舱。", cover_m))
    story.append(Spacer(1, 14*mm))
    story.append(P("版本：PWA v3.5.0  /  桌面端 v8.0.0+", cover_m))
    story.append(P("访问网址：https://ryanchen7051.github.io/pmapp-mobile/", cover_m))
    story.append(P("编制日期：2026-07-28", cover_m))
    story.append(PageBreak())

    # ── 关于本文档 ──
    story += section('0', '关于本文档')
    story.append(P("本说明书同时覆盖 PMApp 的「手机版」与「电脑版」。两者是同一套 PWA（响应式网页应用）：", body))
    story += bullets([
        "在手机浏览器上：底部标签栏 + 移动布局（单栏卡片）。",
        "在电脑宽屏浏览器（窗口宽度 ≥ 860px）上：自动切换为左侧导航栏 + 领导驾驶舱总览。",
        "登录账号在手机、电脑、桌面 PyQt6 端完全一致，数据互通。",
    ])
    story.append(Spacer(1, 2))
    story.append(tip_box("提示：本文档中所有「按钮」均指界面上可点击的元素。手机与电脑版功能完全相同，仅排布方式不同（底部标签 vs 左侧栏），下文会分别说明。"))

    # ── 第一章 快速开始 ──
    story += section('1', '快速开始')
    story.append(P('1.1  打开方式', h2))
    story += bullets([
        "手机：用浏览器（推荐 Chrome / Safari）访问下方网址；登录后可「添加到主屏幕」生成 App 图标。",
        "电脑：用 Chrome / Edge 打开网址 → 地址栏右侧「安装」图标（或菜单「安装 PMApp」）→ 桌面生成独立 App，双击即开无地址栏窗口。",
    ])
    story.append(P('网址：<font color="#C0392B">https://ryanchen7051.github.io/pmapp-mobile/</font>', body))
    story.append(P('1.2  登录', h2))
    story.append(P("用与桌面端完全相同的账号、密码登录（在「设定」页登录）。未登录时仅能查看部分公开内容，且首页驾驶舱会提示先登录。", body))
    story.append(P('1.3  数据同步', h2))
    story.append(P("手机版、电脑版 PWA 与桌面 PyQt6 App 共享同一云端数据库，任何一端新增 / 修改都会自动同步到其他端。详见第 5 章。", body))

    # ── 第二章 通用界面与通用按钮 ──
    story += section('2', '通用界面与通用按钮（手机 + 电脑通用）')
    story.append(P('2.1  顶部栏（Top Bar）', h2))
    story.append(btn_table([
        ('返回 ‹', '进入详情 / 子页面时出现，点按返回上一级。'),
        ('页面标题', '显示当前所在模块名称。'),
        ('待同步 N', '存在尚未发出的离线操作时显示（如断网时填写的数据），联网后自动补发，无需手动操作。'),
        ('右侧动作（如 编辑）', '在可编辑的详情页显示，「编辑」当前记录（需有对应权限）。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('2.2  导航（Navigation）', h2))
    story.append(P("手机：屏幕底部的标签栏（Tab Bar），共 9 个入口；电脑：窗口拉宽后，底部栏自动变为左侧导航栏（Sidebar），顶部显示品牌「PMApp 驾驶舱」。9 个模块依次为：", body))
    story += bullets([
        "首页 / 工厂讯息 / 计划 / 物料 / 生产 / 品质 / DOA-RMA / 周月报 / 设定",
    ])
    story.append(P('2.3  悬浮新增按钮（FAB ＋）', h2))
    story.append(P("在「工厂讯息 / 生产 / 品质」等可写模块，右下角出现红色 ＋ 按钮，点按即新增一条记录（需具备对应权限；普通只读用户不显示）。", body))
    story.append(P('2.4  弹窗（Modal）', h2))
    story.append(P("表单、详情、报告等多以底部弹出（手机）或居中弹窗（电脑）呈现；点击遮罩区域或下拉即可关闭。", body))
    story.append(P('2.5  下拉刷新（Pull-to-Refresh）', h2))
    story.append(P("在列表页顶部向下拉动，触发重新从云端拉取最新数据（即执行一次同步）。", body))
    story.append(P('2.6  智能海外助理（AI）', h2))
    story.append(P("内嵌在首页：在输入框输入问题、点「发送」，助理会基于各端同步的数据回答；右上角「设置」图标可配置 AI 后端地址（由管理员统一设定，一般无需改动）。", body))
    story.append(P('2.7  留言板', h2))
    story.append(P("首页底部区域：填写姓名与内容后点「发布留言」；每条留言可「翻译」（自动译为目标语言）、管理员可「删除」。", body))
    story.append(P('2.8  设定页（通用入口）', h2))
    story.append(P("包含：登录 / 退出、修改密码、立即同步、API 代理地址、界面语言、清除翻译缓存、版本信息。详见 3.9。", body))

    # ── 第三章 手机版各模块按钮详解 ──
    story += section('3', '手机版各模块按钮详解')
    story.append(P('3.1  首页（Home）', h2))
    story.append(btn_table([
        ('总体看板', '移动端显示 5 项数字：总项目 / 进行中 / 已延期 / 质检中 / 待处理。'),
        ('世界时钟', '实时显示中国、越南、印度三地时间与时区。'),
        ('智能海外助理', '见 2.6，首页内嵌对话入口。'),
        ('行业动态', '显示最新行业新闻卡片，点开查看摘要与原文链接。'),
        ('留言板', '见 2.7。'),
        ('登录活动', '仅超级管理员可见，查看近期登录记录。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.2  工厂讯息（Factory）', h2))
    story.append(btn_table([
        ('＋ 新建', '管理员点按，登记一条工厂讯息（标题、内容等）。'),
        ('列表项', '点按查看详情；有权限时显示「编辑」。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.3  计划（Planning）', h2))
    story.append(btn_table([
        ('＋ 新建（计划任务）', '管理员创建主计划；列表项可点开 / 编辑。'),
        ('子计划输入框', '填写内容 → 选择所属主计划 → 选择到期日 → 点「添加」。'),
        ('勾选子计划', '勾选即标记完成；逾期未完成者自动进入「延误计划」。'),
        ('延误计划', '自动罗列逾期未完成的子计划（只读），勾选后从本栏消失。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.4  物料（Materials）', h2))
    story.append(btn_table([
        ('＋ 新建（物料预警）', '管理员登记物料预警（物料名、预警原因等）。'),
        ('列表项', '点开查看 / 编辑详情。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.5  生产（Production）', h2))
    story.append(btn_table([
        ('搜索框', '按项目名称实时搜索。'),
        ('阶段筛选', '全部 / NPI / EVT / DVT / PVT / MP，按项目阶段过滤。'),
        ('项目列表', '点开查看项目详情（含阶段进度条）。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.6  品质（Quality）', h2))
    story.append(btn_table([
        ('模块切换：问题 / 客验', '在「问题」与「客验」两个子模块间切换。'),
        ('问题统计', '显示总问题 / 待处理 / 处理中 / 已关闭 四项数字。'),
        ('搜索 + 状态筛选', '按关键字与状态（全部 / 待处理 / 处理中 / 已关闭）过滤问题。'),
        ('＋ 新建（客验）', '有编辑权限时显示，新增一条客验记录。'),
        ('列表项', '点开查看问题 / 客验详情，有权限时编辑。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.7  DOA / RMA', h2))
    story.append(btn_table([
        ('保存 DOA', '填写 DOA 表单（日期 / 项目 / 工厂 / 物料名 / 批次 / 来料数量 / 不良数量 / 不良描述 / 签核）后保存。'),
        ('DOA 列表', '点开查看 / 编辑某条 DOA 记录。'),
        ('保存 RMA', '填写 RMA 表单（日期 / 项目 / 客户 / 退货数量 / 原因 / 状态 / 描述）后保存。'),
        ('RMA 列表', '点开查看 / 编辑某条 RMA 记录。'),
        ('曲线分析', '页面底部显示 DOA 月度不良率趋势图与 RMA 月度退货趋势图。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.8  周 / 月报（Reports）', h2))
    story.append(btn_table([
        ('生成周报', '选择开始日期（自动计算 7 天区间）→ 选择项目 → 点「生成周报」。'),
        ('生成月报', '选择开始日期（自动计算 30 天区间）→ 选择项目 → 点「生成月报」。'),
        ('报告弹窗', '生成的报告在弹窗中查看，可复制 / 分享内容。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('3.9  设定（Settings）', h2))
    story.append(btn_table([
        ('登录 / 退出登录', '在登录区输入账号密码登录；登录后显示「退出登录」按钮。'),
        ('修改密码', '点按进入修改密码流程。'),
        ('API 代理地址', '「保存代理」填入临时代理；「清除代理」恢复直连（仅特殊网络环境需要）。'),
        ('立即同步', '手动触发一次与云端的双向同步（「设定 → 同步」区域）。'),
        ('界面语言', '多语言切换（点击语言项即生效）。'),
        ('清除翻译缓存', '清除留言翻译的本地缓存，之后可重新翻译。'),
        ('关于', '显示 PWA 版本与桌面端版本信息。'),
    ]))

    # ── 第四章 电脑版领导驾驶舱 ──
    story += section('4', '电脑版 · 领导驾驶舱（宽屏 ≥ 860px）')
    story.append(P('4.1  左侧导航栏', h2))
    story.append(P("与手机 9 个模块完全一致，宽屏下显示在窗口左侧（宽 240px），顶部品牌为「PMApp 驾驶舱」。点击任意一项即在右侧内容区切换模块，操作与手机一致。", body))
    story.append(P('4.2  驾驶舱首页（Cockpit）', h2))
    story.append(P("宽屏首页自动渲染领导驾驶舱总览，由实时同步的数据聚合而成：", body))
    story.append(P('4.2.1  六张 KPI 卡片（点按跳转对应模块）', h2))
    story.append(btn_table([
        ('项目总数', '显示全部项目数（含进行中 / 已延期），点击进入「生产」。'),
        ('待处理问题', '显示未关闭问题数（含严重 / 高），点击进入「品质」。'),
        ('DOA 记录', '显示 DOA 总数与平均不良率，点击进入「DOA-RMA」。'),
        ('RMA 在处', '显示 RMA 在处理中的数量，点击进入「DOA-RMA」。'),
        ('出货在途', '显示未发货的出货计划数，点击进入「生产」。'),
        ('未完成任务', '显示未完成的子计划数（含已完成占比），点击进入「计划」。'),
    ]))
    story.append(Spacer(1, 4))
    story.append(P('4.2.2  趋势图与分布', h2))
    story += bullets([
        "DOA 月度不良率趋势图：直观反映来料质量走势。",
        "RMA 月度退货趋势图：直观反映退货走势。",
        "项目阶段分布：以条形展示各阶段（NPI / EVT / DVT / PVT / MP）的项目数量。",
    ])
    story.append(P('4.2.3  近期动态', h2))
    story.append(P("按时间倒序展示问题、DOA、RMA、客验的最新进展，点按任意一条跳转对应模块。", body))
    story.append(P('4.2.4  快捷入口', h2))
    story.append(P("八个常用入口：项目 / 品质问题 / 计划任务 / 物料预警 / 工厂讯息 / 生产 / DOA-RMA / 周月报，点按直达对应模块。", body))
    story.append(Spacer(1, 2))
    story.append(tip_box("未登录时驾驶舱显示提示横幅；登录后（与手机同一账号）即显示完整数据与图表。"))

    # ── 第五章 同步说明 ──
    story += section('5', '数据同步说明（手机 / 电脑 PWA 与桌面版）')
    story.append(P('5.1  结论：三方同步已确认正常', h2))
    story += bullets([
        "手机 PWA 与电脑 PWA 是同一套响应式代码，均写入同一张云端同步表（sync_data）；桌面 PyQt6 App 读取并写入同一张表。",
        "任意一端新增 / 修改，其他两端会自动拉取更新；手机端离线时先本地排队，联网后自动补发。",
        "近期新增的「领导驾驶舱」「桌面自适应」仅做数据展示，不修改写入逻辑，因此不影响既有同步。",
    ])
    story.append(P('5.2  同步规则要点', h2))
    story += bullets([
        "账号一致：手机 / 电脑 / 桌面登录同一账号，数据互通。",
        "冲突处理：以更新时间较新的一方为准（云端 vs 本地），并记录冲突日志供追溯。",
        "代理：若公司网络无法直接访问云端，可在「设定 → 高级」填入 API 代理地址后通过代理同步。",
    ])

    # ── 附录 FAQ ──
    story += section('附录', '常见问题（FAQ）')
    story.append(btn_table([
        ('电脑上没看到驾驶舱？', '把浏览器窗口拉宽到 860px 以上；或在电脑版独立 App 中打开即可。'),
        ('数据没有更新？', '在「设定 → 立即同步」手动同步；手机端下拉刷新；并检查网络连接。'),
        ('之前装过旧版本？', '关闭已打开的窗口、重新双击打开（或刷新一次），即自动更新到带驾驶舱的新版。'),
        ('中文出现乱码？', '请使用 Chrome / Edge 最新版；本说明书为 PDF 内嵌中文字体，正常显示无乱码。'),
        ('忘记密码？', '请联系系统管理员重置。'),
    ]))

    doc.build(story)
    print("PDF generated:", OUT)
    print("size:", os.path.getsize(OUT), "bytes")

if __name__ == "__main__":
    main()
