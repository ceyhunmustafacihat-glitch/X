#!/usr/bin/env python3
"""Paintbrush version of the gold pencil logo.

Keeps the original's canvas (1080x1080, #40454c), angle (45°), length, width,
gold gradient and segmented look; the pencil becomes a round paintbrush and the
pencil line becomes a tapered brush stroke.

    python3 logo/firca.py   -> logo/firca_logo.svg and logo/firca_logo_seffaf.svg
"""
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
R2 = math.sqrt(2)
P0 = 789.1                      # centre line of the original pencil, (x + y) / sqrt(2)
BG = "#40454c"
GOLD_LIGHT, GOLD_DARK = "#ebd39b", "#c9a66c"
STROKE = "#d6b77e"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def catmull(pts, n=24):
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                   + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in range(2)))
    out.append(pts[-1])
    return out


def brush_stroke():
    """The squiggle as a tapered paint stroke: thin where it starts, full where the brush is."""
    centre = [(251, 768), (268, 749), (288, 734), (306, 729), (320, 736), (330, 752), (342, 768), (354, 774),
              (368, 767), (386, 750), (402, 727), (412, 710)]
    pts = catmull(centre)
    n = len(pts)
    left, right, w = [], [], 0
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        u = i / (n - 1)
        w = 3 + 14.5 * math.sin(min(1, u / 0.45) * math.pi / 2) ** 1.3      # swell from a fine start
        w *= 1 - 0.14 * max(0, u - 0.72) / 0.28                              # settle near the brush
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    end = pts[-1]
    a = pts[-2]
    ang = math.atan2(end[1] - a[1], end[0] - a[0])
    cap = [(end[0] + math.cos(ang + k) * w / 2, end[1] + math.sin(ang + k) * w / 2)
           for k in [math.pi / 2 - j * math.pi / 12 for j in range(13)]]
    poly = left + cap + right[::-1]
    return "M " + " L ".join(f"{f(x)} {f(y)}" for x, y in poly) + " Z"


def rrect(s0, s1, half, r):
    return f'<rect x="{f(s0)}" y="{f(-half)}" width="{f(s1 - s0)}" height="{f(2 * half)}" rx="{f(r)}"/>'


def brush_parts():
    """Shapes in local coordinates: s runs along the brush (tip -> end), q across it."""
    parts = []
    # paint-loaded tip, separated from the bristles by a curved gap
    parts.append('<path d="M -198 2 C -184 -8 -164 -22 -146 -28 C -153 -18 -156 -9 -156 0 '
                 'C -156 9 -153 18 -146 28 C -164 24 -184 13 -198 2 Z"/>')
    # bristles: a full belly narrowing into the ferrule
    parts.append('<path d="M -42 -32 C -60 -37 -84 -42 -104 -40 C -120 -38 -132 -33 -137 -29 '
                 'C -144 -19 -147 -9 -147 0 C -147 9 -144 19 -137 29 C -132 33 -120 38 -104 40 '
                 'C -84 42 -60 37 -42 32 Z"/>')
    # ferrule (metal band) and its crimp
    parts.append(rrect(-34, 54, 40.3, 4))
    parts.append(rrect(63, 79, 35, 3))
    # handle: thick at the ferrule, slimming towards the end
    parts.append('<path d="M 88 -36 C 140 -39 200 -33 262 -25 L 334 -19 C 337 -18 338 -16 338 -13 L 338 13 '
                 'C 338 16 337 18 334 19 L 262 25 C 200 33 140 39 88 36 Z"/>')
    # rounded end of the handle
    parts.append('<path d="M 347 -18 C 368 -20 384 -13 384 0 C 384 13 368 20 347 18 Z"/>')
    return "\n    ".join(parts)


def svg(background=True):
    m = f"matrix({f(1 / R2)} {f(-1 / R2)} {f(1 / R2)} {f(1 / R2)} {f(P0 / R2)} {f(P0 / R2)})"
    bg = f'<rect width="1080" height="1080" fill="{BG}"/>\n  ' if background else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="-40.3" x2="0" y2="40.3">
      <stop offset="0" stop-color="{GOLD_LIGHT}"/>
      <stop offset="1" stop-color="{GOLD_DARK}"/>
    </linearGradient>
  </defs>
  {bg}<path d="{brush_stroke()}" fill="{STROKE}"/>
  <g transform="{m}" fill="url(#gold)">
    {brush_parts()}
  </g>
</svg>
'''


for name, bgd in [("firca_logo.svg", True), ("firca_logo_seffaf.svg", False)]:
    with open(os.path.join(HERE, name), "w", encoding="utf-8") as fh:
        fh.write(svg(bgd))
print("wrote logo/firca_logo.svg and logo/firca_logo_seffaf.svg")
