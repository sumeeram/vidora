#!/usr/bin/env python3
"""Generate Vidora Windows installer bitmaps (NSIS + WiX).

Requires Pillow:  python3 -m pip install pillow

Writes 24-bit BMPs (what NSIS/WiX consume) plus PNG previews:

NSIS (Tauri `bundle.windows.nsis`)
  header.bmp   150 x 57     inner-page header (left)
  sidebar.bmp  164 x 314    Welcome / Finish sidebar

WiX MSI (Tauri `bundle.windows.wix`) — cheap extra branding
  wix-banner.bmp  493 x 58
  wix-dialog.bmp  493 x 312

Also copies icons/icon.ico → installer/installer.ico.

Run from anywhere:

  python3 vidora-desktop/scripts/generate-nsis-assets.py
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src-tauri" / "installer"
ICON_ICO = ROOT / "src-tauri" / "icons" / "icon.ico"

# Brand tokens from scripts/make-icon.ps1 and src/index.css
BG_DARK = (14, 32, 36)
BG_DARK_DEEP = (8, 22, 26)
TEAL = (45, 212, 191)
TEAL_SOFT = (110, 231, 210)
TEAL_DIM = (20, 92, 88)
PLAY = (11, 36, 34)
LIGHT = (243, 250, 248)
LIGHT_EDGE = (226, 242, 236)
INK = (18, 42, 44)
MUTED = (90, 122, 122)
WHITE = (255, 255, 255)

SCALE = 8  # supersample, then Lanczos downscale

def _pick_font(*relative_names: str) -> Path | None:
    roots = [
        Path("/usr/share/fonts/truetype/macos"),
        Path("/usr/share/fonts/truetype/inter"),
        Path("/usr/share/fonts/truetype/dejavu"),
        Path("/usr/share/fonts/truetype/noto"),
        Path("/usr/share/fonts/truetype/liberation"),
        Path(r"C:\Windows\Fonts"),
        Path("/System/Library/Fonts/Supplemental"),
        Path("/Library/Fonts"),
    ]
    for root in roots:
        for name in relative_names:
            candidate = root / name
            if candidate.is_file():
                return candidate
    return None


FONT_BOLD = _pick_font("Inter-Bold.ttf", "DejaVuSans-Bold.ttf", "NotoSans-Bold.ttf", "segoeuib.ttf", "SegoeUI-Bold.ttf")
FONT_SEMI = _pick_font("Inter-SemiBold.ttf", "Inter-Bold.ttf", "DejaVuSans-Bold.ttf", "segoeuib.ttf")
FONT_MED = _pick_font("Inter-Medium.ttf", "Inter-Regular.ttf", "DejaVuSans.ttf", "segoeui.ttf")
FONT_REG = _pick_font("Inter-Regular.ttf", "DejaVuSans.ttf", "NotoSans-Regular.ttf", "segoeui.ttf")


def font(path: Path | None, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if path is not None and path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = color
    return img


def horizontal_gradient(size: tuple[int, int], left: tuple[int, int, int], right: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for x in range(w):
        t = x / max(w - 1, 1)
        color = tuple(int(left[i] + (right[i] - left[i]) * t) for i in range(3))
        for y in range(h):
            px[x, y] = color
    return img


def add_glow(base: Image.Image, center: tuple[int, int], radius: int, color: tuple[int, int, int], alpha: int) -> Image.Image:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = center
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(*color, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=int(radius * 0.55)))
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    return out


def draw_mark(canvas: Image.Image, cx: int, cy: int, diameter: int) -> None:
    """Teal circle + play triangle, matching BrandMark / app-icon.png."""
    draw = ImageDraw.Draw(canvas)
    r = diameter / 2
    bbox = (cx - r, cy - r, cx + r, cy + r)
    draw.ellipse(bbox, fill=TEAL + (255,))
    # Equilateral-ish play triangle inset inside the circle
    inset = diameter * 0.18
    left = cx - diameter * 0.12
    top = cy - diameter * 0.22
    bottom = cy + diameter * 0.22
    right = cx + diameter * 0.28
    draw.polygon(
        [(left, top + inset * 0.15), (right, cy), (left, bottom - inset * 0.15)],
        fill=PLAY + (255,),
    )


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, ...],
    width: int,
) -> None:
    tw, _ = text_size(draw, text, fnt)
    draw.text(((width - tw) / 2, y), text, font=fnt, fill=fill)


def downscale(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return img.convert("RGB").resize(size, Image.Resampling.LANCZOS)


def save_bmp_and_png(img: Image.Image, stem: str) -> None:
    rgb = img.convert("RGB")
    bmp_path = OUT / f"{stem}.bmp"
    png_path = OUT / f"{stem}.png"
    rgb.save(bmp_path, "BMP")
    rgb.save(png_path, "PNG")
    print(f"  {bmp_path.name:18} {rgb.size[0]}x{rgb.size[1]}  ({bmp_path.stat().st_size} bytes)")


def make_sidebar() -> Image.Image:
    w, h = 164 * SCALE, 314 * SCALE
    base = vertical_gradient((w, h), BG_DARK_DEEP, BG_DARK)
    img = add_glow(base, (w // 2, int(h * 0.34)), int(w * 0.72), TEAL, 90)
    img = add_glow(img, (int(w * 0.15), int(h * 0.08)), int(w * 0.55), TEAL_SOFT, 40)

    # Soft glass card behind the mark
    glass = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glass)
    pad_x, pad_y = int(w * 0.14), int(h * 0.12)
    card = (pad_x, pad_y, w - pad_x, int(h * 0.62))
    gdraw.rounded_rectangle(card, radius=int(22 * SCALE), fill=(255, 255, 255, 22), outline=(*TEAL_SOFT, 38), width=max(SCALE, 2))
    img.alpha_composite(glass)

    mark_d = int(88 * SCALE)
    draw_mark(img, w // 2, int(h * 0.30), mark_d)

    draw = ImageDraw.Draw(img)
    title = font(FONT_BOLD, int(22 * SCALE))
    caption = font(FONT_MED, int(9.5 * SCALE))
    centered_text(draw, "Vidora", int(h * 0.52), title, (*WHITE, 255), w)
    centered_text(draw, "Local-first downloads", int(h * 0.60), caption, (*TEAL_SOFT, 230), w)

    # Hairline accent near the bottom
    y = int(h * 0.78)
    draw.rounded_rectangle(
        (int(w * 0.28), y, int(w * 0.72), y + max(2 * SCALE, 8)),
        radius=SCALE,
        fill=(*TEAL, 180),
    )
    foot = font(FONT_REG, int(8.5 * SCALE))
    centered_text(draw, "Windows Setup", int(h * 0.84), foot, (*MUTED, 255), w)
    return downscale(img, (164, 314))


def make_header() -> Image.Image:
    w, h = 150 * SCALE, 57 * SCALE
    base = horizontal_gradient((w, h), LIGHT, LIGHT_EDGE)
    img = base.convert("RGBA")

    # Teal accent bar on the left
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, int(5 * SCALE), h), fill=(*TEAL, 255))

    mark_d = int(34 * SCALE)
    cx = int(28 * SCALE)
    cy = h // 2
    draw_mark(img, cx, cy, mark_d)

    word = font(FONT_SEMI, int(18 * SCALE))
    # Vertically center using textbbox
    dummy = ImageDraw.Draw(img)
    _, th = text_size(dummy, "Vidora", word)
    dummy.text((int(52 * SCALE), (h - th) / 2 - int(1 * SCALE)), "Vidora", font=word, fill=(*INK, 255))
    return downscale(img, (150, 57))


def make_wix_banner() -> Image.Image:
    w, h = 493 * SCALE, 58 * SCALE
    base = horizontal_gradient((w, h), LIGHT, (236, 248, 246))
    img = base.convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, int(6 * SCALE), h), fill=(*TEAL, 255))

    mark_d = int(36 * SCALE)
    draw_mark(img, int(32 * SCALE), h // 2, mark_d)

    word = font(FONT_SEMI, int(20 * SCALE))
    _, th = text_size(draw, "Vidora", word)
    draw.text((int(58 * SCALE), (h - th) / 2 - int(1 * SCALE)), "Vidora", font=word, fill=(*INK, 255))

    sub = font(FONT_REG, int(11 * SCALE))
    label = "Windows Setup"
    tw, sh = text_size(draw, label, sub)
    draw.text((w - tw - int(18 * SCALE), (h - sh) / 2), label, font=sub, fill=(*MUTED, 255))
    return downscale(img, (493, 58))


def make_wix_dialog() -> Image.Image:
    """Left dark brand column; right stays light so WiX overlay text stays readable."""
    w, h = 493 * SCALE, 312 * SCALE
    split = int(180 * SCALE)
    left = vertical_gradient((split, h), BG_DARK_DEEP, BG_DARK)
    right = Image.new("RGB", (w - split, h), LIGHT)
    base = Image.new("RGB", (w, h))
    base.paste(left, (0, 0))
    base.paste(right, (split, 0))

    img = add_glow(base, (split // 2, int(h * 0.38)), int(split * 0.7), TEAL, 88)

    mark_d = int(92 * SCALE)
    draw_mark(img, split // 2, int(h * 0.36), mark_d)

    draw = ImageDraw.Draw(img)
    title = font(FONT_BOLD, int(24 * SCALE))
    caption = font(FONT_MED, int(10 * SCALE))
    centered_text(draw, "Vidora", int(h * 0.56), title, (*WHITE, 255), split)
    centered_text(draw, "Local-first downloads", int(h * 0.66), caption, (*TEAL_SOFT, 230), split)
    return downscale(img, (493, 312))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Writing installer assets to {OUT}")
    save_bmp_and_png(make_header(), "header")
    save_bmp_and_png(make_sidebar(), "sidebar")
    save_bmp_and_png(make_wix_banner(), "wix-banner")
    save_bmp_and_png(make_wix_dialog(), "wix-dialog")

    dest_ico = OUT / "installer.ico"
    shutil.copy2(ICON_ICO, dest_ico)
    print(f"  {dest_ico.name:18} copied from icons/icon.ico  ({dest_ico.stat().st_size} bytes)")
    print("Done.")


if __name__ == "__main__":
    main()
