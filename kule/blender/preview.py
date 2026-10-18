#!/usr/bin/env python3
"""Quick look at EXR frames: simple filmic tone-map into a JPG contact sheet."""
import sys

import numpy as np
import OpenEXR
from PIL import Image


def load(path):
    with OpenEXR.File(path) as f:
        ch = f.channels()
        rgb = None
        for k in ch:
            if k.endswith("Combined") or k == "RGBA" or k == "RGB":
                rgb = ch[k].pixels
                break
        if rgb is None:
            names = [k for k in ch if k.endswith((".R", "Combined.R"))]
            raise SystemExit(f"no Combined in {list(ch)}")
        return np.asarray(rgb, np.float32)[..., :3]


def tonemap(x, exposure=0.0):
    x = x * 2 ** exposure
    a = x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14)
    return np.clip(a, 0, 1) ** (1 / 2.2)


if __name__ == "__main__":
    out = sys.argv[1]
    exp = float(sys.argv[2])
    ims = [Image.fromarray((tonemap(load(p), exp) * 255).astype(np.uint8)) for p in sys.argv[3:]]
    w, h = ims[0].size
    cols = min(len(ims), 6)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (w * cols, h * rows))
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(out, quality=90)
