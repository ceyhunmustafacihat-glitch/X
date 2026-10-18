#!/usr/bin/env python3
"""Finishing: grade, bloom, upscale, grain, typography, logo, and the final encode.

Reads the Cycles frames (linear EXR), writes the picture straight into ffmpeg
together with the mixed soundtrack, and adds the narration as a switchable
subtitle track.

    python3 post/compose.py                 -> output/sozlukdeus_bir_kelimeden_gokdelene.mp4
    python3 post/compose.py --stills 2,10   -> build/stills/*.jpg (look development)
"""
import argparse
import json
import math
import os
import subprocess
import sys

import cv2
import numpy as np
import OpenEXR
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config  # noqa: E402
import timeline as T  # noqa: E402

W, H, FPS = config.W, config.H, config.FPS
NF = int(round(config.DURATION * FPS))
FR = os.path.join(config.BUILD, "frames")
FONTS = os.path.join(config.ROOT, "assets", "fonts")
GOLD = np.array([201, 164, 96]) / 255
GOLD_HI = np.array([236, 208, 146]) / 255
IVORY = np.array([238, 233, 222]) / 255
LIB_LAST = int(round(T.LIB_END * FPS))           # first city frame
CITY_LAST = int(round(39.7 * FPS))


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def keyed(keys, t):
    ts = [k[0] for k in keys]
    vs = [k[1] for k in keys]
    return float(np.interp(t, ts, vs))


# ------------------------------------------------------------------ look
# exposure (stops) and warmth per moment of the film
EXPOSURE = [(0, -0.4), (5, -0.35), (7.5, -0.6), (10.6, -0.55), (13, -0.4), (19, -0.2), (22.5, 0.2), (23.58, 0.2),
            (23.6, -0.5), (28.15, -0.6), (28.16, -0.2), (35.85, -0.2), (35.86, -0.5), (39.7, -0.5)]
BLOOM = [(0, 0.08), (23.58, 0.1), (23.6, 0.16), (39.7, 0.16)]


def load(f):
    if f < LIB_LAST:
        p = os.path.join(FR, "library", f"f_{f:04d}.exr")
    elif f < CITY_LAST:
        p = os.path.join(FR, "city", f"f_{f:04d}.exr")
    else:
        return None
    with OpenEXR.File(p) as e:
        return np.asarray(e.channels()["ViewLayer.Combined"].pixels, np.float32)[..., :3]


def aces(x):
    a = x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14)
    return np.clip(a, 0, 1)


def bloom(x, strength):
    lum = x.mean(axis=2, keepdims=True)
    hi = x * np.clip((lum - 0.7) / 1.5, 0, 1)
    acc = np.zeros_like(x)
    h, w = x.shape[:2]
    for k, wt in [(6, 0.45), (18, 0.35), (48, 0.2)]:
        small = cv2.resize(hi, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
        acc += cv2.resize(cv2.GaussianBlur(small, (0, 0), k / 4), (w, h), interpolation=cv2.INTER_LINEAR) * wt
    return x + acc * strength * 6


def grade(lin, t):
    wb = np.array([1.06, 1.0, 0.92]) if t < T.LIB_END else np.array([1.0, 1.0, 1.0])
    x = lin * wb * 2 ** keyed(EXPOSURE, t)
    x = bloom(x, keyed(BLOOM, t))
    y = aces(x * 1.6)
    y = y ** (1 / 2.2)
    # palette: black, anthracite, ivory, a trace of gold in the highlights
    lum = (y * [0.2126, 0.7152, 0.0722]).sum(axis=2, keepdims=True)
    y = lum + (y - lum) * 0.72
    hi = np.clip((lum - 0.45) / 0.55, 0, 1)
    y = y * (1 + hi * np.array([0.025, 0.008, -0.03])) * (1 + (1 - hi) * np.array([-0.012, 0.0, 0.018]))
    y = 0.012 + y * (1 - 0.012)                      # filmic toe: never pure digital black
    return np.clip(y, 0, 1)


VIG = None


def finish(y, f):
    global VIG
    big = cv2.resize(y.astype(np.float32), (W, H), interpolation=cv2.INTER_LANCZOS4)
    blur = cv2.GaussianBlur(big, (0, 0), 1.3)
    big = big + (big - blur) * 0.45
    if VIG is None:
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.7 + ((yy - H / 2) / (H / 2)) ** 2)
        VIG = (1 - 0.3 * np.clip(r / 1.25, 0, 1) ** 2.4)[..., None].astype(np.float32)
    big *= VIG
    rng = np.random.default_rng(f)
    g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    lum = big.mean(axis=2, keepdims=True)
    big = big + g[..., None] * 0.022 * (0.35 + lum * (1 - lum) * 2.2)
    return np.clip(big, 0, 1)


# dust in the moonlight (library only): soft motes drifting on the air
MOTES = np.random.default_rng(42).random((40, 6))


def dust(img, t):
    if t > 13.0:
        return img
    a = smooth((t - 0.8) / 1.5) * (1 - smooth((t - 12.0) / 1.0))
    lum = cv2.GaussianBlur(img.mean(axis=2), (0, 0), 25)
    out = img.copy()
    for x0, y0, sz, sp, ph, br in MOTES:
        x = (x0 * W + t * (12 + 30 * sp) + 25 * math.sin(t * 0.4 + ph * 6)) % W
        y = (y0 * H - t * (8 + 20 * sp) + 18 * math.sin(t * 0.3 + ph * 4)) % H
        r = 1.2 + sz ** 3 * 9                           # a few are big out-of-focus discs
        lit = float(lum[int(y), int(x)])
        k = int(r * 3) + 2
        xi, yi = int(x), int(y)
        y_a, y_b, x_a, x_b = max(yi - k, 0), min(yi + k + 1, H), max(xi - k, 0), min(xi + k + 1, W)
        yy, xx = np.mgrid[y_a:y_b, x_a:x_b]
        g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * r * r)) * (0.2 / (1 + r * 0.3)) * (0.3 + br) * a * min(lit * 3, 1.0)
        out[y_a:y_b, x_a:x_b] += g[..., None] * IVORY
    return out


# ------------------------------------------------------------------ typography
def tracked(draw, xy, text, fnt, fill, spacing, anchor="m"):
    """Letter-spaced text centred on xy."""
    widths = [draw.textlength(c, font=fnt) for c in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x = xy[0] - total / 2 if anchor == "m" else xy[0]
    for c, w in zip(text, widths):
        draw.text((x, xy[1]), c, font=fnt, fill=fill, anchor="ls")
        x += w + spacing
    return total


def layer():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def over(img, lay, alpha=1.0):
    a = np.asarray(lay, np.float32) / 255
    al = a[..., 3:4] * alpha
    return img * (1 - al) + a[..., :3] * al


def gold_fill(mask, top=GOLD_HI, bottom=GOLD, y0=0, y1=H):
    yy = np.linspace(0, 1, H)[:, None, None]
    g = top + (bottom - top) * np.clip((yy - y0 / H) / max((y1 - y0) / H, 1e-3), 0, 1)
    rgba = np.concatenate([np.broadcast_to(g, (H, W, 3)), mask[..., None]], axis=2)
    return Image.fromarray((rgba * 255).astype(np.uint8), "RGBA")


def counter_layer(t):
    v = T.counter_value(t)
    s = f"{v:,}".replace(",", ".")
    lay = layer()
    d = ImageDraw.Draw(lay)
    fn = font("Montserrat-300.ttf", 112)
    slot = max(d.textlength(str(k), font=fn) for k in range(10))
    dot = d.textlength(".", font=fn)
    full = "1.756.396"
    total = sum(slot if c.isdigit() else dot for c in full)
    x = W / 2 + total / 2                      # right-aligned in fixed slots: digits never jump
    y = 935
    for c in reversed(s):
        wdt = slot if c.isdigit() else dot
        x -= wdt
        d.text((x + wdt / 2, y), c, font=fn, fill=tuple(int(c_ * 255) for c_ in IVORY) + (255,), anchor="ms")
    m = Image.new("L", (W, H), 0)
    dm = ImageDraw.Draw(m)
    dm.line([W / 2 - 90, y + 40, W / 2 + 90, y + 40], fill=255, width=2)
    tracked(dm, (W / 2, y + 112), "SÖZCÜK", font("Montserrat-500.ttf", 38), 255, 16)
    g = gold_fill(np.asarray(m, np.float32) / 255, y0=y + 40, y1=y + 120)
    lay.alpha_composite(g)
    return lay


def scrim(img, cy, ry, strength):
    yy = np.arange(H)[:, None]
    xx = np.arange(W)[None, :]
    r = np.sqrt(((xx - W / 2) / (W * 0.55)) ** 2 + ((yy - cy) / ry) ** 2)
    a = (np.clip(1 - r, 0, 1) ** 1.5 * strength)[..., None]
    return img * (1 - a)


SCREEN = None


def screen(f):
    global SCREEN
    if SCREEN is None:
        p = os.path.join(FR, "city", "screen.json")
        SCREEN = json.load(open(p)) if os.path.exists(p) else {}
    d = SCREEN.get(str(f))
    return {k: (v[0] * W, (1 - v[1]) * H) for k, v in d.items()} if d else None


def measure_layer(t, f):
    sp = screen(f)
    if not sp:
        return None, 0
    lay = layer()
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    (x0, y0), (x1, y1) = sp["tower_top"], sp["sky_top_c"]
    grow = smooth((t - (T.TEXT_176 - 0.3)) / 0.7)
    ext = 26
    ux, uy = (x1 - x0), (y1 - y0)
    L = math.hypot(ux, uy) + 1e-6
    ux, uy = ux / L, uy / L
    a = (x0 - ux * ext, y0 - uy * ext)
    b = (a[0] + ux * (L + 2 * ext) * grow, a[1] + uy * (L + 2 * ext) * grow)
    d.line([a, b], fill=255, width=2)
    for px, py in ((x0, y0), (x1, y1)):
        if grow > 0.05:
            d.line([px, py - 10, px, py + 10], fill=255, width=2)
    cx, cy = (x0 + x1) / 2, min(y0, y1)
    a176 = smooth((t - T.TEXT_176) / 0.6)
    a59 = smooth((t - T.TEXT_59) / 0.6)
    t1 = Image.new("L", (W, H), 0)
    tracked(ImageDraw.Draw(t1), (cx, cy - 118), "176 METRE", font("Montserrat-300.ttf", 76), 255, 12)
    t2 = Image.new("L", (W, H), 0)
    tracked(ImageDraw.Draw(t2), (cx, cy - 52), "YAKLAŞIK 59 KAT", font("Montserrat-500.ttf", 34), 255, 11)
    mask = np.asarray(m, np.float32) / 255 * 0.9 + np.asarray(t1, np.float32) / 255 * a176 + np.asarray(t2, np.float32) / 255 * a59
    lay = gold_fill(np.clip(mask, 0, 1), y0=cy - 190, y1=cy)
    glow = lay.filter(ImageFilter.GaussianBlur(10))
    return (lay, glow), 1.0


_TAG = None


def tag_layer():
    global _TAG
    if _TAG is None:
        m = Image.new("L", (W, H), 0)
        tracked(ImageDraw.Draw(m), (W / 2, 940), "Her kelimede yeni bir dünya.", font("Montserrat-300.ttf", 44), 255, 4)
        tm = json.load(open(os.path.join(config.BUILD, "voice", "timing.json"), encoding="utf-8"))
        _TAG = (np.asarray(m, np.float32) / 255, tm[-1]["end"] - 1.65)   # as the line is spoken
    return _TAG


def logo_frame(t):
    """End card: no brand lettering, only the closing line of the story."""
    tag, t_in = tag_layer()
    img = np.zeros((H, W, 3), np.float32) + 0.006
    ta = smooth((t - t_in) / 0.6) * 0.9
    glow = cv2.GaussianBlur(tag, (0, 0), 10) * 0.3
    img = img + (glow[..., None] * GOLD * 0.6) * ta
    img = img * (1 - (tag * ta)[..., None]) + IVORY * (tag * ta)[..., None]
    return img * (1 - smooth((t - 41.72) / 0.28) * 0.15)


# ------------------------------------------------------------------ frame
def frame(f):
    t = f / FPS
    if t >= T.BLACK + 0.08 or f >= CITY_LAST:
        if t >= T.LOGO_IN:
            return logo_frame(t)
        return np.zeros((H, W, 3), np.float32) + 0.006
    lin = load(f)
    y = grade(lin, t)
    img = dust(finish(y, f), t)
    # fades: open from black, a dip at the cut out of the library, the lens covered by the sheet
    k = smooth((t - 0.15) / 1.0) if t < 1.2 else 1.0
    if T.LIB_END - 0.2 < t < T.LIB_END:
        k = 1 - smooth((t - (T.LIB_END - 0.2)) / 0.18)
    if T.LIB_END <= t < T.LIB_END + 0.35:
        k = smooth((t - T.LIB_END) / 0.35)
    if t > T.BLACK - 0.25:
        k = min(k, 1 - smooth((t - (T.BLACK - 0.25)) / 0.3))
    img = img * k + 0.006 * (1 - k)
    # counter
    c0, c1 = T.COUNTER
    if c0 - 0.3 < t < c1 + 1.0:
        a = smooth((t - (c0 - 0.25)) / 0.4) * (1 - smooth((t - (c1 + 0.5)) / 0.45))
        img = scrim(img, 960, 380, 0.62 * a)
        cl = counter_layer(t)
        sh = np.asarray(cl, np.float32)[..., 3] / 255
        sh = cv2.GaussianBlur(sh, (0, 0), 6) * 0.7          # soft shadow keeps it legible on white pages
        img = img * (1 - (sh * a)[..., None])
        img = over(img, cl, a)
    # height comparison
    if T.TEXT_176 - 0.4 < t < T.SUMMIT_CUT:
        lays, _ = measure_layer(t, f)
        if lays:
            out = 1 - smooth((t - (T.SUMMIT_CUT - 0.45)) / 0.4)
            img = over(img, lays[1], 0.5 * out)
            img = over(img, lays[0], out)
    return img


def to8(img):
    return (np.clip(img, 0, 1) * 255 + np.random.default_rng(0).random((H, W, 3)) * 0.999).astype(np.uint8)


def srt():
    tm = json.load(open(os.path.join(config.BUILD, "voice", "timing.json"), encoding="utf-8"))

    def ts(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    lines = []
    for i, e in enumerate(tm, 1):
        lines += [str(i), f"{ts(e['start'])} --> {ts(e['end'] + 0.25)}", e["text"], ""]
    p = os.path.join(config.OUT, "altyazi_tr.srt")
    with open(p, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills", default="")
    ap.add_argument("--out", default=os.path.join(config.OUT, "sozlukdeus_bir_kelimeden_gokdelene.mp4"))
    a = ap.parse_args()
    if a.stills:
        os.makedirs(os.path.join(config.BUILD, "stills"), exist_ok=True)
        for s in a.stills.split(","):
            f = int(round(float(s) * FPS))
            Image.fromarray(to8(frame(f))).save(os.path.join(config.BUILD, "stills", f"s_{f:04d}.jpg"), quality=92)
        return
    sub = srt()
    audio = os.path.join(config.BUILD, "audio", "mix_master.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(config.BUILD, "audio", "mix_premaster.wav"),
                    "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", "48000", "-c:a", "pcm_s24le", audio], check=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", audio, "-i", sub,
           "-map", "0:v", "-map", "1:a", "-map", "2:s",
           "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-tune", "film", "-profile:v", "high", "-level", "4.2",
           "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-maxrate", "40M", "-bufsize", "60M", "-g", "48",
           "-c:a", "aac", "-b:a", "320k", "-c:s", "mov_text", "-metadata:s:s:0", "language=tur",
           "-metadata:s:a:0", "language=tur", "-movflags", "+faststart", "-shortest", a.out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(NF):
        p.stdin.write(to8(frame(f)).tobytes())
        if f % 48 == 0:
            print(f"post {f}/{NF}", flush=True)
    p.stdin.close()
    p.wait()
    print("wrote", a.out)


if __name__ == "__main__":
    main()
