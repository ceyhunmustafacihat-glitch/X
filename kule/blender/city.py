"""The city set (23.6 s - 39.7 s): a night city, the paper tower rising in a
plaza next to a 59-storey, 176 m skyscraper, the reveal, and the last sheet.

The tower's height is true to the numbers (1,756,396 sheets x 0.1 mm =
175.64 m). Its footprint is enlarged (A4 x 20) so it can be seen at all from
the distance where both towers fit in one frame; the README says so."""
import json
import math
import os

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

import common as C
import config
from common import Track, smooth, smoother

START = 23.6
END = 39.7
H_TOWER = config.TOWER_M
SCALE = 20.0
TW, TD = 0.21 * SCALE, 0.297 * SCALE
REAM = 0.5                         # 5000 sheets per visible layer
VIEW = np.array([-0.64, -0.77])     # direction from the towers to the wide-shot camera
PERP = np.array([0.77, -0.64])
SKY_C = PERP * 45.0                 # skyscraper centre: beside the tower, not behind it
SKY_ROT = math.atan2(PERP[1], PERP[0])
SKY_W = 34.0
RIVER_C = VIEW * 230.0              # a river between the towers and the camera
RIVER_HALF = 105.0
FLOOR = H_TOWER / config.FLOORS    # 2.98 m
MIST_DEPTH = 2600.0
rng = np.random.default_rng(5)
S = {}
SCREEN = {}                        # per-frame screen positions for the overlays


def tower_height(t):
    u = np.clip((t - START) / (27.75 - START), 0, 1)
    e = 1 - (1 - u) ** 2.4                 # fast, then braking into the final height
    return 9.0 + (H_TOWER - 9.0) * e


# ------------------------------------------------------------------ materials
def window_mat(name, floor_h, bay, lit_frac, glass=False, warmth=0.6, strength=4.0):
    m, nt, out = C.nodes_mat(name)
    L = nt.links
    N = nt.nodes

    def math_node(op, a=None, b=None, v1=None):
        n = N.new("ShaderNodeMath")
        n.operation = op
        if a is not None:
            L.new(a, n.inputs[0])
        if b is not None:
            L.new(b, n.inputs[1])
        if v1 is not None:
            n.inputs[1].default_value = v1
        return n.outputs[0]

    geo = N.new("ShaderNodeNewGeometry")
    tco = N.new("ShaderNodeTexCoord")
    sp = N.new("ShaderNodeSeparateXYZ")
    L.new(tco.outputs["Object"], sp.inputs[0])
    vt = N.new("ShaderNodeVectorTransform")
    vt.vector_type = "NORMAL"
    vt.convert_from = "WORLD"
    vt.convert_to = "OBJECT"
    L.new(geo.outputs["Normal"], vt.inputs[0])
    sn = N.new("ShaderNodeSeparateXYZ")
    L.new(vt.outputs[0], sn.inputs[0])
    ax = math_node("ABSOLUTE", sn.outputs["X"])
    ay = math_node("ABSOLUTE", sn.outputs["Y"])
    az = math_node("ABSOLUTE", sn.outputs["Z"])
    u = math_node("ADD", math_node("MULTIPLY", sp.outputs["X"], ay), math_node("MULTIPLY", sp.outputs["Y"], ax))
    attr = N.new("ShaderNodeAttribute")
    attr.attribute_type = "OBJECT"
    attr.attribute_name = "bld"            # unused for merged meshes (0)
    ar = N.new("ShaderNodeAttribute")
    ar.attribute_name = "brand"
    uu = math_node("DIVIDE", u, None, bay)
    vv = math_node("DIVIDE", math_node("SUBTRACT", sp.outputs["Z"], None, 0.4), None, floor_h)
    fu = math_node("FRACT", uu)
    fv = math_node("FRACT", vv)
    cu = math_node("FLOOR", uu)
    cv = math_node("FLOOR", vv)
    lo_u, hi_u, lo_v, hi_v = (0.05, 0.95, 0.2, 0.92) if glass else (0.22, 0.78, 0.32, 0.8)
    win = math_node("MULTIPLY",
                    math_node("MULTIPLY", math_node("GREATER_THAN", fu, None, lo_u), math_node("LESS_THAN", fu, None, hi_u)),
                    math_node("MULTIPLY", math_node("GREATER_THAN", fv, None, lo_v), math_node("LESS_THAN", fv, None, hi_v)))
    win = math_node("MULTIPLY", win, math_node("LESS_THAN", az, None, 0.5))
    comb = N.new("ShaderNodeCombineXYZ")
    L.new(cu, comb.inputs["X"])
    L.new(cv, comb.inputs["Y"])
    L.new(math_node("MULTIPLY", ar.outputs["Fac"], None, 977.0), comb.inputs["Z"])
    wn = N.new("ShaderNodeTexWhiteNoise")
    wn.noise_dimensions = "3D"
    L.new(comb.outputs[0], wn.inputs["Vector"])
    sepc = N.new("ShaderNodeSeparateColor")
    L.new(wn.outputs["Color"], sepc.inputs[0])
    lit = math_node("GREATER_THAN", sepc.outputs[0], None, 1 - lit_frac)
    # some offices in whole lit bands (same floor, neighbouring bays)
    comb2 = N.new("ShaderNodeCombineXYZ")
    L.new(math_node("FLOOR", math_node("DIVIDE", cu, None, 5.0)), comb2.inputs["X"])
    L.new(cv, comb2.inputs["Y"])
    L.new(math_node("MULTIPLY", ar.outputs["Fac"], None, 531.0), comb2.inputs["Z"])
    wn2 = N.new("ShaderNodeTexWhiteNoise")
    wn2.noise_dimensions = "3D"
    L.new(comb2.outputs[0], wn2.inputs["Vector"])
    band = math_node("GREATER_THAN", wn2.outputs["Value"], None, 1 - lit_frac * 0.5)
    lit = math_node("MAXIMUM", lit, band)
    bright = math_node("ADD", math_node("POWER", sepc.outputs[1], None, 2.2), None, 0.06)
    emit_amt = math_node("MULTIPLY", math_node("MULTIPLY", lit, win), bright)
    warm, cool = np.array(C.kelvin(2900)), np.array(C.kelvin(5600))
    mixc = N.new("ShaderNodeMix")
    mixc.data_type = "RGBA"
    L.new(math_node("GREATER_THAN", sepc.outputs[2], None, 1 - warmth), mixc.inputs["Factor"])
    mixc.inputs[6].default_value = (*cool, 1)
    mixc.inputs[7].default_value = (*warm, 1)
    p = C.principled(nt, rough=0.12 if glass else 0.75, spec=0.6 if glass else 0.3,
                     base=((0.012, 0.014, 0.018, 1) if glass else (0.035, 0.034, 0.033, 1)))
    # glass panes reflect, walls do not
    rough = N.new("ShaderNodeMapRange")
    L.new(win, rough.inputs["Value"])
    rough.inputs["To Min"].default_value = 0.7
    rough.inputs["To Max"].default_value = 0.08
    L.new(rough.outputs["Result"], p.inputs["Roughness"])
    L.new(mixc.outputs[2], p.inputs["Emission Color"])
    L.new(math_node("MULTIPLY", emit_amt, None, strength), p.inputs["Emission Strength"])
    L.new(p.outputs[0], out.inputs["Surface"])
    m.cycles.emission_sampling = "NONE"        # thousands of windows: hit them, don't sample them
    return m


def tower_mat():
    """Paper strata seen from metres away: fine bands, ream seams, faint translucency."""
    m, nt, out = C.nodes_mat("tower_paper")
    L = nt.links
    N = nt.nodes
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.25, 0.25, 30.0)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 2.0
    nz.inputs["Detail"].default_value = 5.0
    nz.inputs["Roughness"].default_value = 0.6
    L.new(mp.outputs["Vector"], nz.inputs["Vector"])
    wv = N.new("ShaderNodeTexWave")
    wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 9.0
    wv.inputs["Distortion"].default_value = 2.0
    wv.inputs["Detail"].default_value = 2.0
    L.new(tc.outputs["Object"], wv.inputs["Vector"])
    mx = N.new("ShaderNodeMix")
    mx.inputs["Factor"].default_value = 0.35
    L.new(nz.outputs["Fac"], mx.inputs[2])
    L.new(wv.outputs["Fac"], mx.inputs[3])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.50, 0.49, 0.46, 1)
    ramp.color_ramp.elements[1].color = (0.74, 0.72, 0.68, 1)
    L.new(mx.outputs[0], ramp.inputs["Fac"])
    p = C.principled(nt, rough=0.85, spec=0.25, sheen=0.3)
    L.new(ramp.outputs["Color"], p.inputs["Base Color"])
    bump = N.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    L.new(nz.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], p.inputs["Normal"])
    tr = N.new("ShaderNodeBsdfTranslucent")
    L.new(ramp.outputs["Color"], tr.inputs["Color"])
    mix = N.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.1
    L.new(p.outputs[0], mix.inputs[1])
    L.new(tr.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    return m


# ------------------------------------------------------------------ build
def merged_boxes(name, boxes, coll, mat):
    """boxes: list of (cx, cy, w, d, h, rot, rand). One mesh, per-face 'brand' attribute."""
    verts, faces, rnd = [], [], []
    for cx, cy, w, d, h, rot, r in boxes:
        c, s = math.cos(rot), math.sin(rot)
        base = len(verts)
        for (x, y, z) in [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
            lx, ly = x * w / 2, y * d / 2
            verts.append((cx + c * lx - s * ly, cy + s * lx + c * ly, z * h))
        for f in [(4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
            faces.append(tuple(base + i for i in f))
            rnd.append(r)
    o = C.mesh_obj(name, verts, faces, coll)
    a = o.data.attributes.new("brand", "FLOAT", "FACE")
    a.data.foreach_set("value", np.array(rnd, np.float32))
    o.data.materials.append(mat)
    return o


def build():
    coll = C.collection("city")
    # ground: asphalt (wet-ish), plaza paving
    asphalt = C.simple_mat("asphalt", (0.018, 0.018, 0.02), 0.32, spec=0.5)
    paving = C.simple_mat("paving", (0.07, 0.066, 0.06), 0.45, spec=0.4)
    C.box("ground", (8000, 8000, 1), (0, 0, -0.5), coll, asphalt)
    C.box("plaza", (120, 120, 0.3), (12, -12, 0.15), coll, paving)
    build_river(coll)
    curb = C.simple_mat("curb", (0.09, 0.09, 0.085), 0.6)
    pitch, street = 96.0, 18.0
    # pavements along the street grid near the centre
    for i in range(-6, 7):
        for j in range(-6, 7):
            cx, cy = i * pitch, j * pitch
            if abs(cx - 12) < 75 and abs(cy + 12) < 75 or river_dist(cx, cy) < RIVER_HALF + 30:
                continue
            C.box(f"block_{i}_{j}", (pitch - street, pitch - street, 0.18), (cx, cy, 0.09), coll, curb)

    # surrounding buildings, merged into a few meshes
    near, far = [], []
    for i in range(-26, 27):
        for j in range(-26, 27):
            cx, cy = i * pitch, j * pitch
            r = math.hypot(cx, cy)
            if r < 95 or r > 2500 or river_dist(cx, cy) < RIVER_HALF + 40:
                continue
            nb = rng.integers(1, 4)
            for k in range(nb):
                w = rng.uniform(18, (pitch - street) / (1 if nb == 1 else 2))
                d = rng.uniform(18, pitch - street - 4)
                ox = rng.uniform(-(pitch - street - w) / 2, (pitch - street - w) / 2)
                oy = rng.uniform(-(pitch - street - d) / 2, (pitch - street - d) / 2)
                hmax = 150 if r > 700 else 125
                h = float(np.clip(rng.lognormal(math.log(26 + 30 * math.exp(-r / 900)), 0.55), 9, hmax))
                if r < 260:
                    h = min(h, 22 + r * 0.12)  # keep the bases of the two towers readable
                if np.dot([cx, cy], VIEW) > 0 and r < 420:
                    h = min(h, 30)             # nothing tall between the river and the towers
                box = (cx + ox, cy + oy, w, d, h, 0.0, float(rng.random()))
                (near if r < 900 else far).append(box)
    S["near"] = merged_boxes("city_near", near, coll, window_mat("windows", 3.3, 2.4, 0.2, strength=3.0))
    S["far"] = merged_boxes("city_far", far, coll, window_mat("windows_far", 3.3, 2.4, 0.22, strength=2.6))
    roof = C.simple_mat("roof_gear", (0.04, 0.04, 0.04), 0.7)
    # rooftop clutter on near buildings (water tanks, plant rooms) breaks the boxes
    clutter = []
    for (cx, cy, w, d, h, rot, r) in near[::2]:
        clutter.append((cx + rng.uniform(-w / 4, w / 4), cy + rng.uniform(-d / 4, d / 4), w * 0.3, d * 0.3, h + rng.uniform(2, 4.5), 0, 0))
    o = merged_boxes("roof_clutter", clutter, coll, roof)
    # red aircraft beacons on the tallest roofs
    beacon = C.emission_mat("beacon", (1.0, 0.05, 0.02), 40.0)
    for (cx, cy, w, d, h, rot, r) in sorted(near, key=lambda b: -b[4])[:14]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.5, location=(cx, cy, h + 4.8), segments=12, ring_count=6)
        b = bpy.context.object
        b.data.materials.append(beacon)
        C.link_move(b, coll)

    build_skyscraper(coll)
    build_tower(coll)
    build_street(coll, pitch, street)
    build_lights(coll)
    S["cam"] = C.make_camera()


def river_dist(x, y):
    return abs(np.dot(np.array([x, y]) - RIVER_C, VIEW))


def build_river(coll):
    m, nt, out = C.nodes_mat("river")
    p = C.principled(nt, base=(0.004, 0.005, 0.006, 1), rough=0.06, spec=0.8)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.35
    nz.inputs["Detail"].default_value = 8.0
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.0, 4.0, 1.0)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = 0.35
    nt.links.new(nz.outputs["Fac"], b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    nt.links.new(p.outputs[0], out.inputs["Surface"])
    ang = math.atan2(PERP[1], PERP[0])
    C.box("river", (6000, 2 * RIVER_HALF, 2.0), (RIVER_C[0], RIVER_C[1], -1.6), coll, m, rot=(0, 0, ang))
    wall = C.simple_mat("embankment", (0.05, 0.048, 0.045), 0.8)
    for side in (-1, 1):
        c = RIVER_C + VIEW * side * (RIVER_HALF + 3)
        C.box(f"embankment_{side}", (6000, 6, 2.4), (c[0], c[1], -0.9), coll, wall, rot=(0, 0, ang))
    # lamps along both quays: reflections stretch across the water
    lamp = C.emission_mat("quay_lamp", C.kelvin(2900), 60.0)
    for side in (-1, 1):
        for k in range(-40, 41):
            c = RIVER_C + VIEW * side * (RIVER_HALF + 5) + PERP * k * 25
            C.box(f"quay_{side}_{k}", (0.5, 0.5, 0.5), (c[0], c[1], 5.0), coll, lamp)


def build_skyscraper(coll):
    """59 floors, 176 m, curtain wall with a dark spandrel at every floor."""
    mat = window_mat("sky_glass", FLOOR, 1.5, 0.2, glass=True, warmth=0.3, strength=2.4)
    h = FLOOR * config.FLOORS
    piv = bpy.data.objects.new("skyscraper_pivot", None)
    C.link(piv, coll)
    piv.location = (SKY_C[0], SKY_C[1], 0)
    piv.rotation_euler = (0, 0, SKY_ROT)
    o = C.box("skyscraper", (SKY_W, SKY_W, h), (0, 0, h / 2), coll, mat)
    o.parent = piv
    a = o.data.attributes.new("brand", "FLOAT", "FACE")
    a.data.foreach_set("value", np.full(len(o.data.polygons), 0.37, np.float32))
    S["sky_parts"] = [o]
    # vertical mullion fins (catch light, read as a real facade)
    fin = C.simple_mat("fins", (0.16, 0.16, 0.17), 0.3, metal=0.9)
    fins = []
    for k in range(-11, 12):
        x = k * SKY_W / 22
        for side in (-1, 1):
            fins.append((x, side * (SKY_W / 2 + 0.2), 0.22, 0.4, h, 0, 0))
            fins.append((side * (SKY_W / 2 + 0.2), x, 0.4, 0.22, h, 0, 0))
    parts = [merged_boxes("sky_fins", fins, coll, fin)]
    # parapet and a slim lit crown line marking the roof
    parts.append(C.box("sky_parapet", (SKY_W + 1.0, SKY_W + 1.0, 1.2), (0, 0, h - 0.6), coll, fin))
    parts.append(C.box("sky_crown", (SKY_W + 1.1, SKY_W + 1.1, 0.22), (0, 0, h - 1.4), coll, C.emission_mat("crown", C.kelvin(4200), 8.0)))
    parts.append(C.box("sky_plant", (14, 14, 4.5), (-4, 3, h - 0.5), coll, C.simple_mat("plant", (0.05, 0.05, 0.05), 0.7)))
    parts.append(C.box("sky_lobby", (SKY_W + 0.4, SKY_W + 0.4, 6.0), (0, 0, 3.0), coll, C.emission_mat("lobby", C.kelvin(3600), 2.0)))
    for p_ in parts:
        p_.parent = piv


def build_tower(coll):
    mat = tower_mat()
    top_mat = C.paper_mat("tower_top", "sheet_00.png", "sheet_blank.png")
    n = int(math.ceil(H_TOWER / REAM)) + 1
    S["reams"] = []
    S["ream_off"] = np.c_[rng.normal(0, 0.014, n), rng.normal(0, 0.014, n), rng.normal(0, math.radians(0.25), n)]
    for j in range(n):
        o = C.box(f"tower_ream_{j}", (TW, TD, 1.0), (0, 0, -100), coll, mat)
        S["reams"].append(o)
    S["top"] = C.grid("tower_top_sheet", TW, TD, 16, 22, coll, top_mat)
    S["top_rest"] = np.array([v.co[:] for v in S["top"].data.vertices])
    # the flurry of arriving sheets around the top while it grows
    fm = [C.paper_mat(f"flurry_{k}", f"sheet_{1 + k:02d}.png", "sheet_blank.png") for k in range(12)]
    S["flurry"] = []
    for k in range(16):
        g = C.grid(f"flurry_{k}", TW, TD, 6, 8, coll, fm[k % 12])
        S["flurry"].append(g)
    S["flurry_rest"] = np.array([v.co[:] for v in S["flurry"][0].data.vertices])


def build_street(coll, pitch, street):
    """Cars on the avenues around the plaza, trees, lamp posts, a few people."""
    body = C.simple_mat("car_paint", (0.02, 0.022, 0.025), 0.25, metal=0.5, coat=0.8)
    head = C.emission_mat("headlight", C.kelvin(5200), 60.0)
    tail = C.emission_mat("taillight", (1.0, 0.03, 0.02), 25.0)
    S["cars"] = []
    lanes = []
    for j in (-1, 0, 1):                      # east-west avenues
        y = j * pitch + pitch / 2
        lanes += [("x", y - 3.0, 1), ("x", y + 3.0, -1)]
    for i in (-2, -1, 0, 1):                  # north-south avenues
        x = i * pitch + pitch / 2
        lanes += [("y", x - 3.0, -1), ("y", x + 3.0, 1)]
    for li, (axis, off, dirn) in enumerate(lanes):
        for k in range(7):
            car = C.box(f"car_{li}_{k}", (4.5, 1.85, 1.1), (0, 0, 0), coll, body, bevel=0.25)
            for sx in (-0.65, 0.65):
                h_ = C.box(f"car_{li}_{k}_h{sx}", (0.1, 0.35, 0.16), (2.27, sx, 0.05), coll, head)
                h_.parent = car
                t_ = C.box(f"car_{li}_{k}_t{sx}", (0.1, 0.4, 0.12), (-2.27, sx, 0.1), coll, tail)
                t_.parent = car
            S["cars"].append((car, axis, off, dirn, rng.uniform(0, 600), rng.uniform(11, 16)))
    trunk = C.simple_mat("trunk", (0.03, 0.022, 0.016), 0.8)
    leaf = C.simple_mat("leaves", (0.012, 0.02, 0.012), 0.7, spec=0.3)
    pole = C.simple_mat("pole", (0.03, 0.03, 0.03), 0.4, metal=0.8)
    lamp = C.emission_mat("street_lamp", C.kelvin(3000), 35.0)
    pts = []
    for a in np.linspace(0, 2 * math.pi, 22, endpoint=False):           # ring of trees in the plaza
        pts.append((12 + 52 * math.cos(a), -12 + 52 * math.sin(a)))
    for k in range(-14, 15):                                             # avenue trees
        pts += [(k * 13.0, pitch / 2 - 9.5), (k * 13.0, -pitch / 2 + 9.5)]
    for k, (x, y) in enumerate(pts):
        if math.hypot(x - SKY_C[0], y - SKY_C[1]) < SKY_W * 0.75 + 3 or math.hypot(x + 14, y + 30) < 12 \
                or river_dist(x, y) < RIVER_HALF + 8:
            continue
        hgt = rng.uniform(5, 8)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.18, depth=hgt * 0.5, location=(x, y, hgt * 0.25))
        tr_ = bpy.context.object
        tr_.data.materials.append(trunk)
        C.link_move(tr_, coll)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=hgt * 0.32, location=(x, y, hgt * 0.68))
        cn = bpy.context.object
        cn.scale = (1, 1, 0.85)
        dm = cn.modifiers.new("lumpy", "DISPLACE")
        tex = bpy.data.textures.new(f"leaf_tex_{k}", "CLOUDS")
        tex.noise_scale = 0.9
        dm.texture = tex
        dm.strength = 0.9
        cn.data.materials.append(leaf)
        C.link_move(cn, coll)
    for k in range(-10, 11):                                             # lamp posts
        for y in (pitch / 2 - 8.5, -pitch / 2 + 8.5):
            x = k * 22.0 + 5
            C.box(f"pole_{k}_{y}", (0.16, 0.16, 7.5), (x, y, 3.75), coll, pole)
            C.box(f"lamp_{k}_{y}", (0.9, 0.35, 0.12), (x, y - math.copysign(0.4, y), 7.5), coll, lamp)
    # people: dark silhouettes strolling in the plaza (simple capsules, never seen close)
    cloth = C.simple_mat("people", (0.02, 0.02, 0.022), 0.8)
    S["people"] = []
    for k in range(46):
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.22, depth=1.25, location=(0, 0, 0))
        b = bpy.context.object
        bev = b.modifiers.new("round", "BEVEL")
        bev.width = 0.18
        bev.segments = 3
        b.data.materials.append(cloth)
        C.link_move(b, coll)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.13, location=(0, 0, 0.82), segments=12, ring_count=8)
        hd = bpy.context.object
        hd.data.materials.append(cloth)
        hd.parent = b
        C.link_move(hd, coll)
        a0, r0 = rng.uniform(0, 2 * math.pi), rng.uniform(8, 26)
        S["people"].append((b, a0, r0, rng.uniform(-0.04, 0.04), rng.uniform(1.62, 1.85)))


def build_lights(coll):
    # moonlit sky, very low; city glow at the horizon
    w = bpy.data.worlds.new("night")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.5, (0.02, 0.018, 0.016, 1)
    e[1].position, e[1].color = 0.8, (0.0018, 0.0022, 0.0038, 1)
    mid = e.new(0.6)
    mid.color = (0.007, 0.0072, 0.0085, 1)
    nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
    nz = nt.nodes.new("ShaderNodeTexNoise")       # thin cloud layer lit from below
    nz.inputs["Scale"].default_value = 3.5
    nz.inputs["Detail"].default_value = 6
    nt.links.new(tc.outputs["Generated"], nz.inputs["Vector"])
    cr = nt.nodes.new("ShaderNodeMapRange")
    cr.inputs["From Min"].default_value = 0.5
    cr.inputs["From Max"].default_value = 0.8
    cr.inputs["To Max"].default_value = 0.004
    nt.links.new(nz.outputs["Fac"], cr.inputs["Value"])
    add = nt.nodes.new("ShaderNodeMix")
    add.data_type = "RGBA"
    add.blend_type = "ADD"
    add.inputs["Factor"].default_value = 1.0
    nt.links.new(ramp.outputs["Color"], add.inputs[6])
    nt.links.new(cr.outputs["Result"], add.inputs[7])
    nt.links.new(add.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0
    moon = bpy.data.lights.new("moon", "SUN")
    moon.energy = 0.06
    moon.color = C.kelvin(8500)
    moon.angle = math.radians(0.5)
    mo = C.link(bpy.data.objects.new("moon", moon), coll)
    mo.rotation_euler = (math.radians(52), 0, math.radians(-140))
    # architectural uplights around the tower base + two long-throw spots from roofs
    S["uplights"] = []
    for k, (x, y) in enumerate([(TW / 2 + 6, -TD / 2 - 6), (-TW / 2 - 6, -TD / 2 - 6), (-TW / 2 - 6, TD / 2 + 6), (TW / 2 + 6, TD / 2 + 6)]):
        ld = bpy.data.lights.new(f"uplight_{k}", "SPOT")
        ld.energy = 220000
        ld.spot_size = math.radians(16)
        ld.spot_blend = 0.6
        ld.shadow_soft_size = 0.4
        ld.color = C.kelvin(4300)
        o = C.link(bpy.data.objects.new(f"uplight_{k}", ld), coll)
        o.matrix_world = C.look_at_matrix((x, y, 0.4), (0, 0, 90))
        S["uplights"].append(o)
    for k, (pos, aim) in enumerate([((-160, -220, 70), (0, 0, 120)), ((-260, 120, 60), (0, 0, 150))]):
        ld = bpy.data.lights.new(f"longspot_{k}", "SPOT")
        ld.energy = 0.9e6
        ld.spot_size = math.radians(4.5)
        ld.spot_blend = 0.8
        ld.color = C.kelvin(5000)
        o = C.link(bpy.data.objects.new(f"longspot_{k}", ld), coll)
        o.matrix_world = C.look_at_matrix(pos, aim)
    # plaza lights
    for k, a in enumerate(np.linspace(0, 2 * math.pi, 8, endpoint=False)):
        ld = bpy.data.lights.new(f"plaza_{k}", "POINT")
        ld.energy = 2500
        ld.color = C.kelvin(3000)
        ld.shadow_soft_size = 0.3
        o = C.link(bpy.data.objects.new(f"plaza_{k}", ld), coll)
        o.location = (12 + 45 * math.cos(a), -12 + 45 * math.sin(a), 4.5)


# ------------------------------------------------------------------ camera
CAM = [
    # t,    position,               target,               lens, focus point,   f-stop
    (START, (-14.0, -30.0, 1.7),    (0.0, 0.0, 22.0),       20, (0, 0, 12), 5.6),
    (24.4,  (-16.0, -31.0, 5.0),    (0.0, 0.0, 22.0),       20, (0, 0, 20), 5.6),
    (25.4,  (-22.0, -33.0, 32.0),   (0.0, 0.0, 26.0),       22, (0, 0, 32), 5.6),
    (26.6,  (-27.0, -31.0, 100.0),  (0.0, 0.0, 92.0),       22, (0, 0, 100), 5.6),
    (27.4,  (-29.0, -28.0, 142.0),  (0.0, 0.0, 150.0),      22, (0, 0, 145), 5.6),
    (28.15, (-29.5, -27.0, 150.0),  (0.0, 0.0, 172.0),      22, (0, 0, 160), 5.6),
    # cut: wide reveal, base -> tops, then a slow orbit
    (28.16, (-190.0, -258.0, 24.0), (17.0, -14.0, 8.0),     35, (17, -14, 60), 11.0),
    (30.6,  (-192.0, -256.0, 27.0), (17.0, -14.0, 88.0),    35, (17, -14, 88), 11.0),
    (35.85, (-238.0, -214.0, 33.0), (17.0, -14.0, 92.0),    35, (17, -14, 92), 11.0),
    # cut: close to the summit, drifting in; the last sheet comes to us
    (35.86, (-34.0, -44.0, 188.0),  (0.0, 0.0, 174.0),      35, (0, 0, 176), 4.0),
    (37.4,  (-22.0, -29.0, 183.0),  (0.0, 0.0, 175.5),      35, (0, 0, 176), 4.0),
    (END,   (-16.0, -21.0, 181.0),  (-3.0, -4.0, 178.5),    35, (0, 0, 176), 4.0),
]
_trk = None


def camera(t):
    global _trk
    if _trk is None:
        # three separate shots: interpolate within each, never across a cut
        shots, cur = [], [CAM[0]]
        for k in CAM[1:]:
            if k[0] - cur[-1][0] < 0.05:
                shots.append(cur)
                cur = [k]
            else:
                cur.append(k)
        shots.append(cur)
        _trk = [(s[0][0], Track([(k[0], (*k[1], *k[2], k[3], *k[4], k[5])) for k in s])) for s in shots]
    tr = [s for s in _trk if s[0] <= t + 1e-6]
    tr = tr[-1][1] if tr else _trk[0][1]
    v = tr(t)
    pos, tgt, lens, foc, fstop = Vector(v[0:3]), Vector(v[3:6]), v[6], Vector(v[7:10]), v[10]
    if t < 24.5:                          # first beat: look up at the growing top
        top = tower_height(t)
        w = 1 - smooth((t - 23.9) / 0.6)
        tgt = tgt.lerp(Vector((0, 0, top + 4)), w)
        foc = Vector((0, 0, min(top, pos.z + 12)))
    if 35.85 < t:                         # follow the flying sheet once it leaves
        sp = sheet_flight(t)[0]
        w = smooth((t - 37.6) / 0.8)
        tgt = tgt.lerp(sp, w * 0.85)
        foc = foc.lerp(sp, w)
    fwd = (tgt - pos).normalized()
    C.set_camera(S["cam"], pos, tgt, lens, (foc - pos).dot(fwd), fstop)
    return pos


def sheet_flight(t):
    """The crowning sheet: lifts at 37.0 s, glides toward the lens, passes at ~39.5 s."""
    top = Vector((0, 0, H_TOWER + 0.02))
    u = np.clip((t - 37.0) / 2.55, 0, 1)
    cam_end = Vector(CAM[-1][1])
    # a gentle S-curve: up first, then toward the camera
    p0, p1, p2, p3 = top, top + Vector((-1.5, -2.0, 5.0)), cam_end + Vector((5.0, 5.0, 3.0)), cam_end + Vector((-0.2, -0.3, 0.1))
    s = smoother(u) * 0.75 + u * 0.25
    p = (1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3 * p3
    return p, u


# ------------------------------------------------------------------ pose
def apply(t):
    pos = camera(t)
    h = tower_height(t)
    for j, rm in enumerate(S["reams"]):
        z0 = j * REAM
        fill = float(np.clip((h - z0) / REAM, 0, 1))
        if fill <= 0:
            rm.hide_render = True
            rm.location = (0, 0, -100)
            continue
        rm.hide_render = False
        ox, oy, orr = S["ream_off"][j]
        rm.scale = (1, 1, max(REAM * fill, 1e-4))
        rm.location = (ox, oy, z0 + REAM * fill / 2)
        rm.rotation_euler = (0, 0, orr)

    # crowning sheet
    fp, u = sheet_flight(t)
    tp = S["top"]
    if u <= 0:
        tp.location = (0, 0, h + 0.03)
        tp.rotation_euler = (0, 0, 0.01)
        co = S["top_rest"].copy()
        co[:, 2] += 0.02 * np.sin(co[:, 0] * 0.6 + t * 2) * smooth((t - 36.0) / 1.0)
        C.set_verts(tp, co)
    else:
        tp.location = fp
        # tumbles slowly, ends almost facing the lens
        tp.rotation_euler = (math.radians(70) * smooth(u) + 0.25 * math.sin(u * 7),
                             0.35 * math.sin(u * 4.3),
                             math.radians(-38) * smooth(u) + 0.2 * math.sin(u * 3.1))
        co = S["top_rest"].copy()
        X, Y = co[:, 0] / (TW / 2), co[:, 1] / (TD / 2)
        co[:, 2] += (0.45 * np.sin(2.2 * Y - t * 3.0) * (0.4 + 0.6 * (Y + 1) / 2) + 0.25 * np.sin(1.7 * X + t * 2.2) * X) * smooth(u * 3)
        C.set_verts(tp, co)

    # flurry while growing (fades out as the tower reaches its height)
    grow = 1 - smooth((t - 27.2) / 0.6)
    for k, f in enumerate(S["flurry"]):
        r = np.random.default_rng(100 + k)
        period = r.uniform(0.35, 0.6)
        ph = (t / period + r.random()) % 1.0
        cycle = int(t / period + r.random())
        rr = np.random.default_rng(1000 + k * 97 + cycle)
        ang = rr.uniform(0, 2 * math.pi)
        dist = rr.uniform(6, 16)
        start = Vector((math.cos(ang) * dist, math.sin(ang) * dist, h + rr.uniform(3, 9)))
        end = Vector((rr.normal(0, 0.4), rr.normal(0, 0.4), h))
        if grow <= 0.02:
            f.hide_render = True
            continue
        f.hide_render = False
        e = smooth(ph)
        f.location = start.lerp(end, e)
        f.rotation_euler = (rr.uniform(-0.5, 0.5) * (1 - e), rr.uniform(-0.5, 0.5) * (1 - e), rr.uniform(-1, 1) * (1 - e))
        sc_ = grow * (0.6 + 0.4 * e)
        f.scale = (sc_, sc_, sc_)
        co = S["flurry_rest"].copy()
        co[:, 2] += 0.5 * (1 - e) * np.sin(co[:, 1] * 0.8 + t * 6 + k)
        C.set_verts(f, co)

    # traffic
    for car, axis, off, dirn, x0, v in S["cars"]:
        s = ((x0 + dirn * v * t) % 1200) - 600
        if axis == "x":
            car.location = (s, off, 0.75)
            car.rotation_euler = (0, 0, 0 if dirn > 0 else math.pi)
        else:
            car.location = (off, s, 0.75)
            car.rotation_euler = (0, 0, math.pi / 2 if dirn > 0 else -math.pi / 2)
        x_, y_ = car.location.x, car.location.y
        hide = (abs(x_ - 12) < 62 and abs(y_ + 12) < 62) or river_dist(x_, y_) < RIVER_HALF + 6
        car.hide_render = bool(hide)
        for ch in car.children:
            ch.hide_render = bool(hide)
    for b, a0, r0, w, hgt in S["people"]:
        a = a0 + w * t
        b.location = (-6 + r0 * math.cos(a), 6 + r0 * math.sin(a), 0.3 + 0.62)
        b.scale = (1, 1, hgt / 1.75)

    # screen-space anchors for the overlays (tower top, skyscraper roof, bases)
    sc = bpy.context.scene
    f = round(t * config.FPS, 3)
    if abs(f - round(f)) < 1e-6:
        cam = S["cam"]
        bpy.context.view_layer.update()
        pts = {"tower_top": (0, 0, h), "tower_base": (0, 0, 0), "sky_top_c": (SKY_C[0], SKY_C[1], H_TOWER),
               "sky_base_c": (SKY_C[0], SKY_C[1], 0)}
        SCREEN[int(round(f))] = {k: tuple(world_to_camera_view(sc, cam, Vector(p))) for k, p in pts.items()}
