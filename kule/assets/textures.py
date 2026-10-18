#!/usr/bin/env python3
"""Paints every texture with readable text: dictionary pages, word sheets,
the dictionary's cloth binding and the paper-edge strata of the tower.

    python3 assets/textures.py   -> build/tex/*.png
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config  # noqa: E402
from assets import lexicon  # noqa: E402

FONTS = os.path.join(config.ROOT, "assets", "fonts")
TEX = os.path.join(config.BUILD, "tex")
rng = np.random.default_rng(11)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def smooth_noise(h, w, scale, seed):
    r = np.random.default_rng(seed)
    small = r.standard_normal((max(2, h // scale), max(2, w // scale))).astype(np.float32)
    im = Image.fromarray(small).resize((w, h), Image.BICUBIC)
    return np.asarray(im)


def paper(h, w, tone=(236, 231, 220), seed=1, age=0.0):
    """Off-white paper: multi-scale mottling plus short fibres."""
    n = (0.55 * smooth_noise(h, w, 160, seed) + 0.3 * smooth_noise(h, w, 40, seed + 1)
         + 0.15 * smooth_noise(h, w, 8, seed + 2))
    base = np.array(tone, np.float32)[None, None, :] * (1 + 0.018 * n[..., None])
    fib = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(fib)
    r = np.random.default_rng(seed + 3)
    for _ in range(int(h * w / 2500)):
        x, y = r.random() * w, r.random() * h
        a = r.random() * np.pi
        ln = r.uniform(4, 22) * w / 2000
        d.line([x, y, x + np.cos(a) * ln, y + np.sin(a) * ln], fill=int(r.uniform(20, 70)), width=1)
    fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
    base *= (1 - 0.05 * fib[..., None])
    if age:
        yy, xx = np.mgrid[0:h, 0:w]
        edge = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]).astype(np.float32) / (0.06 * w)
        warm = np.exp(-edge) * age
        base *= 1 - warm[..., None] * np.array([0.04, 0.09, 0.2])
    return np.clip(base, 0, 255)


def ink(canvas, layer, color=(24, 22, 20), strength=0.94, bleed=0.7, seed=5):
    """Composite a white-on-black text mask as slightly bled, uneven ink."""
    m = np.asarray(layer.filter(ImageFilter.GaussianBlur(bleed)), np.float32) / 255
    h, w = m.shape
    var = 0.85 + 0.15 * smooth_noise(h, w, 6, seed)
    a = np.clip(m * strength * var, 0, 1)[..., None]
    return canvas * (1 - a) + np.array(color, np.float32) * a


def save(arr, name):
    os.makedirs(TEX, exist_ok=True)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(TEX, name))


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if draw.textlength(t, font=fnt) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = wd
    lines.append(cur)
    return lines


def dict_page(entries, name, guide, number, seed):
    W, H = 1800, 2560
    c = paper(H, W, (234, 228, 214), seed, age=0.6)
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    fb, fr, fh = font("EBGaramond-700.ttf", 52), font("EBGaramond-400.ttf", 49), font("EBGaramond-400.ttf", 40)
    fi = ImageFont.truetype(os.path.join(FONTS, "EBGaramond-400.ttf"), 42)
    mx, top = 150, 230
    d.text((mx, 120), guide[0], font=fh, fill=255)
    d.text((W - mx, 120), guide[1], font=fh, fill=255, anchor="ra")
    d.text((W / 2, 120), str(number), font=fh, fill=255, anchor="ma")
    d.line([mx, 190, W - mx, 190], fill=200, width=2)
    colw = (W - 2 * mx - 90) / 2
    x, y, col = mx, top, 0
    lh = 64
    for head, pos, defin in entries:
        hw = d.textlength(head + " ", font=fb)
        pw = d.textlength(pos + " ", font=fi) if pos else 0
        lines = wrap(d, defin, fr, colw - hw - pw)
        first = lines[0]
        rest = wrap(d, " ".join(lines[1:]), fr, colw - 40) if len(lines) > 1 else []
        need = lh * (1 + len(rest)) + 18
        if y + need > H - 170:
            col += 1
            if col > 1:
                break
            x, y = mx + colw + 90, top
        d.text((x, y), head, font=fb, fill=255)
        if pos:
            d.text((x + hw, y + 2), pos, font=fi, fill=190)
        d.text((x + hw + pw, y), first, font=fr, fill=255)
        for i, ln in enumerate(rest):
            d.text((x + 40, y + lh * (i + 1)), ln, font=fr, fill=255)
        y += need
    d.line([W / 2, top, W / 2, H - 200], fill=110, width=2)
    save(ink(c, layer, seed=seed), name)


def word_sheet(word, name, seed, first=False):
    W, H = 1240, 1754                      # A4 proportions
    if first:                              # the hero sheet is seen in macro: 300 dpi
        return word_sheet_hd(word, name, seed)
    c = paper(H, W, (238, 234, 225) if first else (236, 232, 222), seed, age=0.25 if first else 0.1)
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    f = font("CormorantGaramond-600.ttf", 140 if len(word) < 8 else 112)
    d.text((W / 2, H * 0.47), word, font=f, fill=255, anchor="mm")
    # a faint ruled line and a small folio mark, like a hand-made index card
    d.line([W * 0.36, H * 0.47 + 110, W * 0.64, H * 0.47 + 110], fill=70, width=3)
    save(ink(c, layer, (22, 20, 19), 0.95, 0.9, seed), name)


def word_sheet_hd(word, name, seed):
    W, H = 2480, 3508
    c = paper(H, W, (238, 234, 225), seed, age=0.25)
    layer = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(layer)
    d.text((W / 2, H * 0.47), word, font=font("CormorantGaramond-600.ttf", 280), fill=255, anchor="mm")
    d.line([W * 0.36, H * 0.47 + 220, W * 0.64, H * 0.47 + 220], fill=70, width=5)
    save(ink(c, layer, (22, 20, 19), 0.95, 1.6, seed), name)


def cloth():
    """Dark green-black buckram with gold-stamped spine and cover titles."""
    W, H = 2048, 2048
    n = smooth_noise(H, W, 3, 40) * 0.5 + smooth_noise(H, W, 30, 41) * 0.5
    weave = (np.sin(np.arange(W) * 1.9)[None, :] * np.sin(np.arange(H) * 1.9)[:, None])
    base = np.array([26, 30, 28], np.float32) * (1 + 0.08 * n[..., None] + 0.05 * weave[..., None])
    save(base, "cloth.png")
    # gold masks (white = gold leaf)
    ft = font("CormorantGaramond-700.ttf", 150)
    fs = font("CormorantGaramond-600.ttf", 90)
    for vol, label in [(1, "I"), (2, "II")]:
        m = Image.new("L", (1448, 2000), 0)          # front cover, 21 x 29 cm
        d = ImageDraw.Draw(m)
        d.rectangle([110, 110, 1338, 1890], outline=255, width=5)
        d.rectangle([135, 135, 1313, 1865], outline=255, width=2)
        d.text((724, 760), "TÜRKÇE", font=ft, fill=255, anchor="mm")
        d.text((724, 940), "SÖZLÜK", font=ft, fill=255, anchor="mm")
        d.line([600, 1070, 848, 1070], fill=255, width=3)
        d.text((724, 1170), label, font=fs, fill=255, anchor="mm")
        save(np.asarray(m.filter(ImageFilter.GaussianBlur(1.0)), np.float32)[..., None].repeat(3, 2), f"cover_{vol}.png")
        m = Image.new("L", (520, 2000), 0)           # spine, 7.5 x 29 cm
        d = ImageDraw.Draw(m)
        fsp = font("CormorantGaramond-700.ttf", 92)
        for y in (150, 175, 1825, 1850):
            d.rectangle([40, y, 480, y + (8 if y in (150, 1850) else 3)], fill=255)
        d.text((260, 560), "TÜRKÇE", font=fsp, fill=255, anchor="mm")
        d.text((260, 680), "SÖZLÜK", font=fsp, fill=255, anchor="mm")
        d.line([200, 770, 320, 770], fill=255, width=3)
        d.text((260, 860), label, font=font("CormorantGaramond-600.ttf", 80), fill=255, anchor="mm")
        save(np.asarray(m.filter(ImageFilter.GaussianBlur(1.0)), np.float32)[..., None].repeat(3, 2), f"spine_{vol}.png")


def edge_strata():
    """Side view of stacked sheets: fine strata, slight waviness, tone drift.
    Tileable vertically; 1 px ~ one sheet at the stack scale used in Blender."""
    W, H = 1024, 2048
    y = np.arange(H, dtype=np.float32)[:, None]
    x = np.arange(W, dtype=np.float32)[None, :]
    wav = 1.6 * np.sin(x / W * 2 * np.pi * 3 + y / 37.0) + smooth_noise(H, W, 64, 50) * 2
    yy = y + wav
    s = 0.5 + 0.5 * np.cos(yy * np.pi)                    # one dark seam per sheet
    tone = 0.9 + 0.06 * smooth_noise(H, W, 256, 51) + 0.04 * (np.random.default_rng(52).random((H, 1)) - 0.5)
    v = (0.8 + 0.2 * (1 - s ** 6)) * tone
    col = np.array([236, 231, 220], np.float32)
    save(v[..., None] * col, "strata.png")


def main():
    dict_page(lexicon.PAGE_S1, "page_s1.png", ("söylem", "sözcük"), 2104, 21)
    dict_page(lexicon.PAGE_S2, "page_s2.png", ("sözcükbilim", "sözsüz"), 2105, 22)
    dict_page(lexicon.PAGE_D1, "page_d1.png", ("dikkat", "dilekçe"), 588, 23)
    dict_page(lexicon.PAGE_D2, "page_d2.png", ("dilim", "doğru"), 589, 24)
    word_sheet(lexicon.FIRST_WORD, "sheet_00.png", 30, first=True)
    for i, w in enumerate(lexicon.SHEET_WORDS):
        word_sheet(w, f"sheet_{i + 1:02d}.png", 31 + i)
    save(paper(1754, 1240, (236, 232, 222), 99, 0.1), "sheet_blank.png")
    cloth()
    edge_strata()
    print("textures ->", TEX)


if __name__ == "__main__":
    main()
