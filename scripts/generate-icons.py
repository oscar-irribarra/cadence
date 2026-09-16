"""Genera los iconos PWA de Cadence en public/icons y public/favicon.ico.

Requiere Pillow:  pip install Pillow
Uso:              python3 scripts/generate-icons.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZE = 1024
CENTER = SIZE // 2
BG = (9, 9, 11)
WHITE = (250, 250, 250)
LIME = (163, 230, 53)
RADIUS = 340
ARC_WIDTH = 30
MASKABLE_SAFE_DISTANCE = 322
ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512]
FAVICON_SIZES = [(16, 16), (32, 32), (48, 48)]

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "public" / "icons"
FAVICON_PATH = ROOT / "public" / "favicon.ico"


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size)


def draw_crank(canvas: Image.Image) -> None:
    crank = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(crank)

    beam_top, beam_bottom = 260, 764
    draw.line([(CENTER, beam_top), (CENTER, beam_bottom)], fill=WHITE, width=40)
    for y in (beam_top, beam_bottom):
        draw.ellipse([CENTER - 20, y - 20, CENTER + 20, y + 20], fill=WHITE)
        draw.rounded_rectangle([CENTER - 90, y - 32, CENTER + 90, y + 32], radius=20, fill=WHITE)
        draw.ellipse([CENTER - 10, y - 10, CENTER + 10, y + 10], fill=BG)

    ring = 78
    draw.ellipse(
        [CENTER - ring, CENTER - ring, CENTER + ring, CENTER + ring],
        outline=WHITE,
        width=36,
    )
    draw.ellipse([CENTER - 18, CENTER - 18, CENTER + 18, CENTER + 18], fill=WHITE)

    crank = crank.rotate(-45, resample=Image.Resampling.BICUBIC, center=(CENTER, CENTER))
    canvas.paste(crank, (0, 0), crank)


def arrow_head(angle_deg: float, length: int = 75, half_width: int = 45) -> list[tuple[float, float]]:
    rad = math.radians(angle_deg)
    tip = (CENTER + RADIUS * math.cos(rad), CENTER + RADIUS * math.sin(rad))
    direction = (math.sin(rad), -math.cos(rad))
    perp = (-direction[1], direction[0])
    base = (tip[0] - length * direction[0], tip[1] - length * direction[1])
    p1 = (base[0] + half_width * perp[0], base[1] + half_width * perp[1])
    p2 = (base[0] - half_width * perp[0], base[1] - half_width * perp[1])
    return [tip, p1, p2]


def draw_arrows(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    bbox = (CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS)
    draw.arc(bbox, 110, 200, fill=LIME, width=ARC_WIDTH)
    draw.arc(bbox, 290, 360, fill=LIME, width=ARC_WIDTH)
    draw.arc(bbox, 0, 20, fill=LIME, width=ARC_WIDTH)

    half_arc = ARC_WIDTH // 2
    for angle in (200, 20):
        rad = math.radians(angle)
        x = CENTER + RADIUS * math.cos(rad)
        y = CENTER + RADIUS * math.sin(rad)
        draw.ellipse([x - half_arc, y - half_arc, x + half_arc, y + half_arc], fill=LIME)

    draw.polygon(arrow_head(110), fill=LIME)
    draw.polygon(arrow_head(290), fill=LIME)


def draw_label(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    font = load_font(104)
    bbox = draw.textbbox((0, 0), "RPM", font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    label_cx = label_cy = CENTER
    for radius in range(320, 200, -2):
        rad = math.radians(62)
        cx = CENTER + radius * math.cos(rad)
        cy = CENTER + radius * math.sin(rad)
        corners = [
            (cx - text_width / 2, cy - text_height / 2),
            (cx + text_width / 2, cy - text_height / 2),
            (cx - text_width / 2, cy + text_height / 2),
            (cx + text_width / 2, cy + text_height / 2),
        ]
        farthest = max(math.hypot(x - CENTER, y - CENTER) for x, y in corners)
        if farthest <= MASKABLE_SAFE_DISTANCE:
            label_cx, label_cy = cx, cy
            break

    draw.text((label_cx, label_cy), "RPM", font=font, fill=LIME, anchor="mm")


def main() -> None:
    canvas = Image.new("RGB", (SIZE, SIZE), BG)
    draw_crank(canvas)
    draw_arrows(canvas)
    draw_label(canvas)

    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    for size in ICON_SIZES:
        resized = canvas.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(ICONS_DIR / f"icon-{size}x{size}.png", optimize=True)

    favicon = canvas.resize((256, 256), Image.Resampling.LANCZOS)
    favicon.save(FAVICON_PATH, sizes=FAVICON_SIZES)

    print(f"iconos generados en {ICONS_DIR} y {FAVICON_PATH}")


if __name__ == "__main__":
    main()
