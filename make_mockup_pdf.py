# -*- coding: utf-8 -*-
"""把电脑版/手机版模拟截图裁切分页，合成一份 PDF（reportlab + STSong-Light）。"""
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                Spacer, Image, PageBreak, NextPageTemplate)
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from PIL import Image as PILImage
import os, tempfile

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
FONT = 'STSong-Light'
BG = (240, 242, 245)  # 模拟页面背景色，用于裁掉空白

def crop_to_content(path):
    im = PILImage.open(path).convert('RGB')
    W, H = im.size
    px = im.load()
    tol = 12
    def is_bg_row(y):
        # 仅扫描右侧内容区，避开左侧固定导航栏(整页深色)干扰高度判定
        for x in range(int(W * 0.3), W, 7):
            r, g, b = px[x, y]
            if abs(r-BG[0]) > tol or abs(g-BG[1]) > tol or abs(b-BG[2]) > tol:
                return False
        return True
    # 找最后一行非背景
    last = 0
    for y in range(H-1, -1, -1):
        if not is_bg_row(y):
            last = y
            break
    return im.crop((0, 0, W, last + 1)), W

def split_chunks(im, W, pagesize, target_w_pt, margin):
    safe_w = target_w_pt - 4
    safe_h = (pagesize[1] - 2 * margin) - 14
    scaleX = safe_w / W
    chunk_px = int(safe_h / scaleX)
    height_pt = chunk_px * scaleX
    chunks = []
    y = 0
    H = im.size[1]
    tmp = tempfile.mkdtemp()
    while y < H:
        sub = im.crop((0, y, W, min(y + chunk_px, H)))
        p = os.path.join(tmp, f'c{y}.png')
        sub.save(p)
        chunks.append((p, safe_w, height_pt))
        y += chunk_px
    return chunks

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(HexColor('#9ca3af'))
    canvas.drawRightString(doc.pagesize[0]-15*mm, 10*mm, f"PMApp 领导分析看板 · 模拟原型  ·  第 {doc.page} 页")
    canvas.restoreState()

# 样式
from reportlab.lib.styles import ParagraphStyle
st_title = ParagraphStyle('t', fontName=FONT, fontSize=22, leading=28, textColor=HexColor('#1a237e'), spaceAfter=6)
st_sub   = ParagraphStyle('s', fontName=FONT, fontSize=12, leading=18, textColor=HexColor('#374151'), spaceAfter=4)
st_h2    = ParagraphStyle('h2', fontName=FONT, fontSize=15, leading=20, textColor=HexColor('#283593'), spaceBefore=4, spaceAfter=8)
st_note  = ParagraphStyle('n', fontName=FONT, fontSize=10, leading=15, textColor=HexColor('#6b7280'))

# 裁切
desk_im, desk_W = crop_to_content('_shot_desktop.png')
mob_im,  mob_W  = crop_to_content('_shot_mobile.png')

A4L = landscape(A4)          # 电脑版用横向
A4P = A4                     # 手机版用纵向
M = 14 * mm

# 分页
desk_chunks = split_chunks(desk_im, desk_W, A4L, A4L[0]-2*M, M)          # 电脑版铺满横向
mob_chunks  = split_chunks(mob_im,  mob_W,  A4P, 300, M)                # 手机版居中(宽300pt)

# 文档
doc = BaseDocTemplate('PMApp_模拟原型_电脑版+手机版.pdf', pagesize=A4P,
                      leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=M)
fw_cover = A4P[0]-2*M
fw_desk  = A4L[0]-2*M
fw_mob   = A4P[0]-2*M
frame_cover = Frame(M, M, fw_cover, A4P[1]-2*M, id='cover')
frame_desk  = Frame(M, M, fw_desk,  A4L[1]-2*M, id='desk')
frame_mob   = Frame(M, M, fw_mob,   A4P[1]-2*M, id='mob')

doc.addPageTemplates([
    PageTemplate(id='COVER', frames=[frame_cover], pagesize=A4P, onPage=footer),
    PageTemplate(id='DESK',  frames=[frame_desk],  pagesize=A4L, onPage=footer),
    PageTemplate(id='MOB',   frames=[frame_mob],   pagesize=A4P, onPage=footer),
])

story = []
# 封面
story.append(Spacer(1, 30*mm))
story.append(Paragraph('PMApp 领导分析看板', st_title))
story.append(Paragraph('模拟原型 · 电脑版 / 手机版（同一份）', st_sub))
story.append(Spacer(1, 6*mm))
story.append(Paragraph('本文件为界面模拟，用于确认「分析看板」的密度与风格，对标《全项目模具寿命预测分析看板》。', st_note))
story.append(Paragraph('电脑版：宽屏左侧导航 + 多列分析看板；手机版：窄屏底部标签 + 单列卡片。两者为同一套响应式代码。', st_note))
story.append(Paragraph('图表与数据均为示例；正式版将接入 Chart.js（离线打包）、实时 App.cache 数据与真实 AI 后端。', st_note))

# 电脑版
story.append(NextPageTemplate('DESK'))
story.append(PageBreak())
story.append(Paragraph('一、电脑版（宽屏：左侧导航 + 多列分析看板）', st_h2))
for p, w, h in desk_chunks:
    img = Image(p, width=w, height=h); img.hAlign='CENTER'
    story.append(img)

# 手机版
story.append(NextPageTemplate('MOB'))
story.append(PageBreak())
story.append(Paragraph('二、手机版（窄屏：底部标签 + 单列卡片）', st_h2))
for p, w, h in mob_chunks:
    img = Image(p, width=w, height=h); img.hAlign='CENTER'
    story.append(img)

doc.build(story)
print('PDF built:', 'PMApp_模拟原型_电脑版+手机版.pdf')
print('desktop chunks:', len(desk_chunks), '| mobile chunks:', len(mob_chunks))
