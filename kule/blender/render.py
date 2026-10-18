#!/usr/bin/env python3
"""Render one set of the film with Blender (bpy module, Cycles CPU).

    python3 blender/render.py library --scale 1.0 --spp 48            # all frames of the set
    python3 blender/render.py city --frames 600,640 --scale 0.25      # a few test frames

Frames go to build/frames/<set>/f_<frame>.exr (multilayer: Combined, Mist, Depth).
"""
import argparse
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bpy  # noqa: E402

import common as C  # noqa: E402
import config  # noqa: E402

SETS = {"library": (0, None), "city": (None, None)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("set", choices=["library", "city"])
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--spp", type=int, default=48)
    ap.add_argument("--frames", default="")
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--out", default="")
    ap.add_argument("--skip-existing", action="store_true")
    ap.add_argument("--save-blend", action="store_true")
    a = ap.parse_args()

    C.reset()
    if a.set == "library":
        import library as M
        f0, f1 = 0, int(round(M.END * config.FPS))
    else:
        import city as M
        f0, f1 = int(round(M.START * config.FPS)), int(round(M.END * config.FPS))
    M.build()
    w, h = int(config.W * a.scale) // 2 * 2, int(config.H * a.scale) // 2 * 2
    C.render_settings(w, h, a.spp)
    sc = bpy.context.scene
    sc.world.mist_settings.depth = getattr(M, "MIST_DEPTH", 30.0)

    def handler(scene, depsgraph=None):
        try:
            M.apply((scene.frame_current + scene.frame_subframe) / config.FPS)
        except Exception:
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
            os._exit(1)            # never render a half-posed frame

    bpy.app.handlers.frame_change_pre.append(handler)
    if a.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(config.BUILD, f"{a.set}.blend"))

    if a.frames:
        frames = []
        for part in a.frames.split(","):
            if "-" in part:
                x, y = part.split("-")
                frames += list(range(int(x), int(y) + 1, a.step))
            else:
                frames.append(int(part))
    else:
        frames = list(range(f0, f1, a.step))
    out = a.out or os.path.join(config.BUILD, "frames", a.set)
    os.makedirs(out, exist_ok=True)
    t_all = time.time()
    for i, f in enumerate(frames):
        path = os.path.join(out, f"f_{f:04d}.exr")
        if a.skip_existing and os.path.exists(path):
            continue
        t = time.time()
        sc.frame_set(f)
        sc.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print(f"[{a.set}] frame {f} ({i + 1}/{len(frames)}) {time.time() - t:.1f}s", flush=True)
        if getattr(M, "SCREEN", None) is not None:
            import json
            sp = os.path.join(out, "screen.json")
            old = json.load(open(sp)) if os.path.exists(sp) else {}
            old.update({str(k): v for k, v in M.SCREEN.items()})
            json.dump(old, open(sp, "w"))
    print(f"done {len(frames)} frames in {(time.time() - t_all) / 60:.1f} min", flush=True)


if __name__ == "__main__":
    main()
