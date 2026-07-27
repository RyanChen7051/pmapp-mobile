#!/usr/bin/env python3
"""生成 PMApp PWA 桌面图标 — PMApp + 科奈信海外团队"""

from PIL import Image, ImageDraw, ImageFont
import math

# ── 配置 ──
SIZE = 512
BG_COLOR = (26, 26, 46)       # #1a1a2e 深蓝底
ACCENT_COLOR = (233, 69, 96)  # #e94560 红
SUBTITLE_COLOR = (200, 200, 220)  # 浅灰蓝
CORNER_RADIUS = 112

# 字体路径
CN_FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
EN_FONT_BOLD = "/System/Library/Fonts/Helvetica.ttc"


def rounded_rect_mask(size, radius):
    """生成圆角矩形 mask"""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def draw_icon(size):
    """绘制图标"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圆角背景
    draw.rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=int(CORNER_RADIUS * size / 512),
        fill=BG_COLOR + (255,)
    )

    # ── "PMApp" 主标题 ──
    main_font_size = int(150 * size / 512)
    try:
        main_font = ImageFont.truetype(EN_FONT_BOLD, main_font_size)
    except Exception:
        main_font = ImageFont.truetype(CN_FONT, main_font_size)

    main_text = "PMApp"
    bbox = draw.textbbox((0, 0), main_text, font=main_font)
    main_w = bbox[2] - bbox[0]
    main_h = bbox[3] - bbox[1]
    main_x = (size - main_w) // 2 - bbox[0]
    # 主标题位置：略偏上
    main_y = int(size * 0.28) - bbox[1]

    draw.text((main_x, main_y), main_text, font=main_font, fill=ACCENT_COLOR + (255,))

    # ── 分隔线 ──
    line_y = int(size * 0.58)
    line_margin = int(size * 0.22)
    line_color = (60, 60, 90, 200)
    draw.line(
        [(line_margin, line_y), (size - line_margin, line_y)],
        fill=line_color,
        width=max(1, int(2 * size / 512))
    )

    # ── "科奈信海外团队" 副标题 ──
    sub_font_size = int(48 * size / 512)
    sub_font = ImageFont.truetype(CN_FONT, sub_font_size)

    sub_text = "\u79d1\u5948\u4fe1\u6d77\u5916\u56e2\u961f"  # 科奈信海外团队
    bbox2 = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = bbox2[2] - bbox2[0]
    sub_h = bbox2[3] - bbox2[1]
    sub_x = (size - sub_w) // 2 - bbox2[0]
    sub_y = line_y + int(size * 0.04) - bbox2[1]

    draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=SUBTITLE_COLOR + (255,))

    return img


def main():
    out_dir = "/Users/chenbangjie/WorkBuddy/PMApp/pwa"

    # 512x512 主图标
    icon_512 = draw_icon(512)
    icon_512.save(f"{out_dir}/icon-512.png", "PNG")
    print(f"Generated: icon-512.png ({icon_512.size})")

    # 192x192 小图标
    icon_192 = draw_icon(192)
    icon_192.save(f"{out_dir}/icon-192.png", "PNG")
    print(f"Generated: icon-192.png ({icon_192.size})")

    # 180x180 apple-touch-icon (iOS)
    icon_180 = draw_icon(180)
    # iOS apple-touch-icon 不需要透明背景，用纯色填充
    bg = Image.new("RGB", (180, 180), BG_COLOR)
    bg.paste(icon_180, (0, 0), icon_180)
    bg.save(f"{out_dir}/apple-touch-icon.png", "PNG")
    print(f"Generated: apple-touch-icon.png ({bg.size})")

    # favicon 32x32
    icon_32 = draw_icon(32)
    bg32 = Image.new("RGB", (32, 32), BG_COLOR)
    bg32.paste(icon_32, (0, 0), icon_32)
    bg32.save(f"{out_dir}/favicon-32.png", "PNG")
    print(f"Generated: favicon-32.png ({bg32.size})")

    print("\nAll icons generated successfully!")


if __name__ == "__main__":
    main()
