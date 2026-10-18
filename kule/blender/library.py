"""The library set (0 s - 23.6 s): desk, the two-volume dictionary, the first
sheet, the sheets that multiply under it and the stack that rises to the ceiling.

build() creates the set once; apply(t) poses everything for time t (seconds),
including sub-frame times, so Cycles motion blur sees real motion."""
import math

import bpy
import numpy as np
from mathutils import Vector

import common as C
import timeline
from common import Track, smooth, smoother

D = 0.78                       # desk top height
SHEET = (0.21, 0.297)          # A4
TH = 1e-4                      # sheet thickness (0.1 mm)
S0_POS = Vector((0.0, -0.18, D))
S0_ROT = math.radians(-4)
BOOK_C = Vector((0.03, 0.17, D))      # Vol I, lying
BW, BD, BLOCK, BOARD = 0.20, 0.28, 0.066, 0.003
SPINE_X = BOOK_C.x - BW / 2
HINGE_Z = D + BOARD + BLOCK / 2       # height of the page surfaces once open
N_FLIP = 7
N_FLY = 28
SLAB = 0.01                    # 1 cm reams in the rising stack
CEIL = 5.0
END = 23.6                     # this set renders up to here

rng = np.random.default_rng(3)
S = {}                         # handles to animated objects


# ------------------------------------------------------------------ timeline
def stack_count(t):
    """Number of sheets under the first one at time t."""
    arr = sheet_arrivals()
    n_early = np.searchsorted(arr, t - 0.42)          # landed
    if t < 19.3:
        return float(n_early)
    n0 = float(np.searchsorted(arr, 19.3 - 0.42))
    k = math.log(CEIL * 0.93 / TH / n0) / (END - 19.3)
    return n0 * math.exp(k * (t - 19.3))


_ARR = None


def sheet_arrivals():
    global _ARR
    if _ARR is None:
        _ARR = timeline.sheet_arrivals()
    return _ARR


def pile(t):
    return stack_count(t) * TH


# ------------------------------------------------------------------ build
def build():
    coll = C.collection("library")
    mats = {}
    mats["desk"] = C.wood_mat("desk_wood", (0.07, 0.034, 0.018), 1.0, 0.36, 0.4)
    mats["floor"] = C.wood_mat("floor_wood", (0.04, 0.022, 0.013), 0.4, 0.5, 0.15)
    mats["dark_wood"] = C.wood_mat("shelf_wood", (0.03, 0.017, 0.01), 0.8, 0.5, 0.1)
    mats["wall"] = C.simple_mat("plaster", (0.06, 0.058, 0.055), 0.9)
    mats["brass"] = C.simple_mat("brass", (0.8, 0.6, 0.32), 0.28, 1.0)
    mats["ink"] = C.simple_mat("ink_glass", (0.01, 0.01, 0.012), 0.08, 0.0, spec=0.8, coat=0.5)

    # room
    C.box("floor", (12, 12, 0.1), (0, 0, -0.05), coll, mats["floor"])
    C.box("ceiling", (12, 12, 0.3), (0, 0, CEIL + 0.15), coll, mats["dark_wood"])
    for i in range(-5, 6):                                  # coffered beams
        C.box(f"beam_x{i}", (12, 0.25, 0.35), (0, i * 1.1, CEIL - 0.17), coll, mats["dark_wood"])
    C.box("wall_back", (12, 0.2, CEIL + 0.3), (0, 3.4, CEIL / 2), coll, mats["wall"])
    C.box("wall_front", (12, 0.2, CEIL + 0.3), (0, -5.0, CEIL / 2), coll, mats["wall"])
    C.box("wall_right", (0.2, 12, CEIL + 0.3), (3.6, 0, CEIL / 2), coll, mats["wall"])
    # left wall with a tall window opening (built from four pieces)
    wx, wy0, wy1, wz0, wz1 = -3.2, -0.6, 1.0, 1.4, 4.4
    C.box("wall_l_a", (0.3, 12, wz0), (wx, 0, wz0 / 2), coll, mats["wall"])
    C.box("wall_l_b", (0.3, 12, CEIL - wz1 + 0.3), (wx, 0, (wz1 + CEIL + 0.3) / 2), coll, mats["wall"])
    C.box("wall_l_c", (0.3, 6 - abs(wy0) + 0, wz1 - wz0), (wx, wy0 - (6 + wy0) / 2 - 0.0, (wz0 + wz1) / 2), coll, mats["wall"])
    C.box("wall_l_d", (0.3, 6 - wy1, wz1 - wz0), (wx, wy1 + (6 - wy1) / 2, (wz0 + wz1) / 2), coll, mats["wall"])
    for k in range(1, 4):                                   # mullions
        C.box(f"mull_v{k}", (0.06, 0.05, wz1 - wz0), (wx, wy0 + k * (wy1 - wy0) / 4, (wz0 + wz1) / 2), coll, mats["dark_wood"])
    for k in range(1, 5):
        C.box(f"mull_h{k}", (0.06, wy1 - wy0, 0.05), (wx, (wy0 + wy1) / 2, wz0 + k * (wz1 - wz0) / 5), coll, mats["dark_wood"])

    # bookshelves: back wall and right wall, floor to ceiling
    shelves(coll, mats, "back", origin=(-3.0, 3.1), axis=(1, 0), length=6.4, facing=(0, -1))
    shelves(coll, mats, "right", origin=(3.3, 2.9), axis=(0, -1), length=7.0, facing=(-1, 0))
    shelves(coll, mats, "left", origin=(-2.9, -1.4), axis=(0, -1), length=3.2, facing=(1, 0))

    # desk
    C.box("desk_top", (1.9, 1.05, 0.05), (0, 0.0, D - 0.025), coll, mats["desk"], bevel=0.006)
    for sx in (-0.86, 0.86):
        for sy in (-0.44, 0.44):
            C.box(f"desk_leg_{sx}_{sy}", (0.08, 0.08, D - 0.05), (sx, sy, (D - 0.05) / 2), coll, mats["desk"], bevel=0.004)
    C.box("desk_apron", (1.7, 0.9, 0.12), (0, 0, D - 0.11), coll, mats["desk"])

    # props: brass inkwell + pen at the back right, a closed notebook at the left
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.032, depth=0.05, location=(0.42, 0.25, D + 0.025))
    ink = bpy.context.object
    ink.data.materials.append(mats["ink"])
    C.link_move(ink, coll)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.02, depth=0.012, location=(0.42, 0.25, D + 0.056))
    cap = bpy.context.object
    cap.data.materials.append(mats["brass"])
    C.link_move(cap, coll)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.0055, depth=0.15, location=(0.36, -0.06, D + 0.006),
                                        rotation=(0, math.radians(90), math.radians(62)))
    pen = bpy.context.object
    pen.data.materials.append(C.simple_mat("pen", (0.012, 0.012, 0.012), 0.2, coat=0.8))
    C.link_move(pen, coll)
    C.box("notebook", (0.17, 0.235, 0.014), (-0.48, 0.12, D + 0.007), coll,
          C.simple_mat("notebook", (0.05, 0.045, 0.04), 0.7), bevel=0.002, rot=(0, 0, math.radians(9)))

    build_books(coll, mats)
    build_sheets(coll)
    build_lights(coll)
    build_volume(coll)
    S["cam"] = C.make_camera()


def shelves(coll, mats, name, origin, axis, length, facing):
    """Floor-to-ceiling shelving full of bound volumes (muted leather tones)."""
    ox, oy = origin
    ax, ay = axis
    fx, fy = facing
    depth = 0.34
    rows = np.arange(0.12, CEIL - 0.3, 0.42)
    cx, cy = ox + ax * length / 2 - fx * depth / 2, oy + ay * length / 2 - fy * depth / 2
    rot = math.atan2(ay, ax)
    C.box(f"shelf_{name}_back", (length, 0.03, CEIL), (cx - fx * depth / 2 * 0.9, cy - fy * depth / 2 * 0.9, CEIL / 2),
          coll, mats["dark_wood"], rot=(0, 0, rot))
    for z in rows:
        C.box(f"shelf_{name}_{z:.2f}", (length, depth, 0.03), (cx, cy, z), coll, mats["dark_wood"], rot=(0, 0, rot))
    for k in range(int(length / 1.0) + 1):
        s = min(k * 1.0, length)
        C.box(f"shelf_{name}_post{k}", (0.05, depth + 0.02, CEIL), (ox + ax * s - fx * depth / 2, oy + ay * s - fy * depth / 2, CEIL / 2),
              coll, mats["dark_wood"], rot=(0, 0, rot))
    # books: one mesh per shelf wall with a colour attribute per book
    palette = np.array([(0.09, 0.025, 0.02), (0.035, 0.05, 0.035), (0.06, 0.04, 0.025), (0.02, 0.02, 0.022),
                        (0.12, 0.09, 0.06), (0.05, 0.02, 0.03), (0.16, 0.14, 0.11), (0.03, 0.035, 0.05)])
    verts, faces, cols = [], [], []
    for z in rows[:-1]:
        s = 0.03
        while s < length - 0.05:
            w = rng.uniform(0.022, 0.065)
            if s + w > length - 0.03:
                break
            if rng.random() < 0.04:            # gaps / leaning gaps
                s += rng.uniform(0.04, 0.12)
                continue
            hgt = rng.uniform(0.24, 0.37)
            dep = rng.uniform(0.2, 0.3)
            col = palette[rng.integers(len(palette))] * rng.uniform(0.6, 1.3)
            lean = rng.normal(0, 0.012)
            px, py = ox + ax * (s + w / 2), oy + ay * (s + w / 2)
            base = len(verts)
            for (u, d, h) in [(-1, 0, 0), (1, 0, 0), (1, 1, 0), (-1, 1, 0), (-1, 0, 1), (1, 0, 1), (1, 1, 1), (-1, 1, 1)]:
                uu = u * w / 2 + lean * h * hgt
                back = 0.02 + d * dep
                verts.append((px + ax * uu - fx * back, py + ay * uu - fy * back, z + 0.015 + h * hgt))
            for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
                faces.append(tuple(base + i for i in f))
                cols.append(col)
            s += w + rng.uniform(0.0, 0.004)
    o = C.mesh_obj(f"books_{name}", verts, faces, coll)
    attr = o.data.color_attributes.new("book_col", "FLOAT_COLOR", "CORNER")
    loop_cols = np.repeat(np.c_[np.array(cols), np.ones(len(cols))], 4, axis=0)
    attr.data.foreach_set("color", loop_cols.astype(np.float32).ravel())
    o.data.materials.append(book_spine_mat())


_BSM = None


def book_spine_mat():
    global _BSM
    if _BSM:
        return _BSM
    m, nt, out = C.nodes_mat("shelf_books")
    L = nt.links
    a = nt.nodes.new("ShaderNodeAttribute")
    a.attribute_name = "book_col"
    tc = nt.nodes.new("ShaderNodeTexCoord")
    # thin gilt bands across spines at fixed heights
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sep.inputs[0])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 7.0
    wave.bands_direction = "Z"
    L.new(tc.outputs["Object"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.93
    ramp.color_ramp.elements[1].position = 0.96
    L.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    gold = C.principled(nt, base=(0.6, 0.42, 0.18, 1), rough=0.35, metal=1.0)
    leather = C.principled(nt, rough=0.55, spec=0.4, coat=0.15)
    L.new(a.outputs["Color"], leather.inputs["Base Color"])
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 180.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.15
    L.new(nz.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], leather.inputs["Normal"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    L.new(ramp.outputs["Color"], mix.inputs["Fac"])
    L.new(leather.outputs[0], mix.inputs[1])
    L.new(gold.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    _BSM = m
    return m


def cloth_mat(name, gold_mask):
    m, nt, out = C.nodes_mat(name)
    L = nt.links
    tc = nt.nodes.new("ShaderNodeTexCoord")
    cl = C.image(nt, "cloth.png", extension="REPEAT")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (3, 3, 3)
    L.new(tc.outputs["UV"], mp.inputs["Vector"])
    L.new(mp.outputs["Vector"], cl.inputs["Vector"])
    gm = C.image(nt, gold_mask, "Non-Color", "CLIP")
    L.new(tc.outputs["UV"], gm.inputs["Vector"])
    clothp = C.principled(nt, rough=0.62, spec=0.35, sheen=0.4)
    L.new(cl.outputs["Color"], clothp.inputs["Base Color"])
    gold = C.principled(nt, base=(0.78, 0.58, 0.28, 1), rough=0.26, metal=1.0)
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.4
    bump.invert = True
    L.new(gm.outputs["Color"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], gold.inputs["Normal"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    L.new(gm.outputs["Color"], mix.inputs["Fac"])
    L.new(clothp.outputs[0], mix.inputs[1])
    L.new(gold.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    return m


def edge_mat(name="page_edges", scale_m=0.2048):
    """Fore-edge of a page block / ream: the strata texture tiled in metres."""
    m, nt, out = C.nodes_mat(name)
    L = nt.links
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], sep.inputs[0])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    add = nt.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    L.new(sep.outputs["X"], add.inputs[0])
    L.new(sep.outputs["Y"], add.inputs[1])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 1 / 0.3
    L.new(add.outputs[0], mul.inputs[0])
    mz = nt.nodes.new("ShaderNodeMath")
    mz.operation = "MULTIPLY"
    mz.inputs[1].default_value = 1 / scale_m
    L.new(sep.outputs["Z"], mz.inputs[0])
    L.new(mul.outputs[0], comb.inputs["X"])
    L.new(mz.outputs[0], comb.inputs["Y"])
    st = C.image(nt, "strata.png", extension="REPEAT")
    L.new(comb.outputs[0], st.inputs["Vector"])
    p = C.principled(nt, rough=0.8, spec=0.3, sheen=0.2)
    L.new(st.outputs["Color"], p.inputs["Base Color"])
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    L.new(st.outputs["Color"], tr.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.12
    L.new(p.outputs[0], mix.inputs[1])
    L.new(tr.outputs[0], mix.inputs[2])
    L.new(mix.outputs[0], out.inputs["Surface"])
    return m


def textured_quad(name, corners, mat, coll, flip_u=False):
    """Quad with UV (0,0) at corners[0] ... counter-clockwise."""
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    if flip_u:
        uvs = [(1 - u, v) for u, v in uvs]
    o = C.mesh_obj(name, corners, [(0, 1, 2, 3)], coll, uvs)
    o.data.materials.append(mat)
    return o


def build_books(coll, mats):
    em = edge_mat()
    cloth1, cloth2 = cloth_mat("cloth_vol1", "cover_1.png"), cloth_mat("cloth_vol2", "spine_2.png")
    plain = cloth_mat("cloth_plain", "cover_2.png")
    x0, x1 = SPINE_X, SPINE_X + BW
    y0, y1 = BOOK_C.y - BD / 2, BOOK_C.y + BD / 2
    zb = D + BOARD
    # back board and lower half of the block (stays put)
    C.box("vol1_back", (BW + 0.01, BD + 0.012, BOARD), (BOOK_C.x + 0.003, BOOK_C.y, D + BOARD / 2), coll, plain, bevel=0.0008)
    C.box("vol1_lower", (BW, BD, BLOCK / 2), (BOOK_C.x, BOOK_C.y, zb + BLOCK / 4), coll, em)
    textured_quad("vol1_page_right", [(x0, y0, HINGE_Z + 0.00005), (x1, y0, HINGE_Z + 0.00005),
                                      (x1, y1, HINGE_Z + 0.00005), (x0, y1, HINGE_Z + 0.00005)],
                  C.paper_mat("page_s2", "page_s2.png"), coll)
    # upper half + front cover: one rigid unit hinged at the spine
    piv = bpy.data.objects.new("vol1_hinge", None)
    C.link(piv, coll)
    piv.location = (x0, BOOK_C.y, HINGE_Z)
    up = C.box("vol1_upper", (BW, BD, BLOCK / 2), (BW / 2, 0, BLOCK / 4), coll, em)
    up.parent = piv
    cov = C.box("vol1_cover", (BW + 0.01, BD + 0.012, BOARD), (BW / 2 + 0.003, 0, BLOCK / 2 + BOARD / 2), coll, None, bevel=0.0008)
    cov.parent = piv
    cov.data.materials.append(plain)
    # gilt cover title on the outside face
    zt = BLOCK / 2 + BOARD + 0.00008
    textured_quad("vol1_cover_title", [(-0.002, -BD / 2 - 0.006, zt), (BW + 0.008, -BD / 2 - 0.006, zt),
                                       (BW + 0.008, BD / 2 + 0.006, zt), (-0.002, BD / 2 + 0.006, zt)], cloth1, coll).parent = piv
    # page surface under the upper half; becomes the left page once open
    zl = -0.00005
    lp = textured_quad("vol1_page_left", [(BW, -BD / 2, zl), (0, -BD / 2, zl), (0, BD / 2, zl), (BW, BD / 2, zl)],
                       C.paper_mat("page_d1", "page_d1.png"), coll)
    lp.parent = piv
    S["hinge"] = piv
    # spine (round-backed, shrinks under the book as it opens)
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=BLOCK / 2 + BOARD, depth=BD + 0.012,
                                        location=(x0, BOOK_C.y, HINGE_Z), rotation=(math.radians(90), 0, 0))
    sp = bpy.context.object
    sp.scale = (0.35, 1, 1)
    sp.data.materials.append(plain)
    C.link_move(sp, coll)
    S["spine"] = sp
    # flipping pages
    S["flip"] = []
    pages = ["page_d2", "page_d1", "page_d2", "page_d1", "page_d2", "page_d1", "page_s1"]
    for k in range(N_FLIP):
        front = "page_d1.png" if k % 2 else "page_d2.png"
        mat = C.paper_mat(f"flip_{k}", front, pages[k] + ".png")
        g = C.grid(f"flip_page_{k}", BW, BD, 28, 6, coll, mat)
        S["flip"].append(g)
    # Vol II standing behind, spine to camera
    v2c = Vector((0.07, 0.43, D))
    C.box("vol2_body", (BLOCK + 2 * BOARD, 0.21, 0.29), (v2c.x, v2c.y + 0.004, D + 0.145), coll, plain, bevel=0.0015)
    zt0, zt1 = D + 0.003, D + 0.287
    xs0, xs1 = v2c.x - (BLOCK + 2 * BOARD) / 2, v2c.x + (BLOCK + 2 * BOARD) / 2
    yf = v2c.y - 0.105 + 0.004 - 0.0004
    textured_quad("vol2_spine", [(xs0, yf, zt0), (xs1, yf, zt0), (xs1, yf, zt1), (xs0, yf, zt1)], cloth2, coll)
    # and Vol I's twin spine plate is never seen; a third, unrelated book leans on Vol II
    C.box("old_book", (0.05, 0.17, 0.24), (v2c.x + 0.075, v2c.y + 0.02, D + 0.12), coll,
          C.simple_mat("old_leather", (0.06, 0.03, 0.02), 0.6), bevel=0.002, rot=(0, math.radians(-8), 0))


def page_shape(phi, curl):
    """Vertices for a flipping page hinged at the spine; phi = 0 (right) .. pi (left)."""
    nx, ny = 28, 6
    s = np.linspace(0, BW, nx + 1)
    a = phi - curl * math.sin(phi) * (s / BW) ** 1.3
    ds = BW / nx
    x = np.concatenate([[0], np.cumsum(np.cos(a[:-1]) * ds)])
    z = np.concatenate([[0], np.cumsum(np.sin(a[:-1]) * ds)])
    ys = np.linspace(-BD / 2, BD / 2, ny + 1)
    X = np.tile(x, ny + 1) + SPINE_X
    Z = np.tile(z, ny + 1)
    Y = np.repeat(ys, nx + 1) + BOOK_C.y
    # slight droop of the outer corners
    Z = Z - 0.004 * np.sin(phi) * np.tile((s / BW) ** 2, ny + 1) * np.abs(np.repeat(ys, nx + 1) / (BD / 2)) * 0.5
    return np.c_[X, Y, Z]


def sheet_shape(nx, ny, lift, t, seed, flutter=1.0, curl=1.0):
    """A4 sheet surface: resting curl plus travelling flutter waves when airborne."""
    w, h = SHEET
    xs = np.linspace(-w / 2, w / 2, nx + 1)
    ys = np.linspace(-h / 2, h / 2, ny + 1)
    X, Y = np.meshgrid(xs, ys)
    r = np.random.default_rng(seed)
    p1, p2 = r.random(2) * 6.28
    edge = (np.abs(X) / (w / 2)) ** 4 * 0.0012 * curl + (Y / (h / 2)) ** 4 * 0.0008 * curl
    wave = flutter * lift * (0.0045 * np.sin(2 * math.pi * (Y / h * 0.8 - t * 1.3) + p1) * (0.5 + 0.5 * Y / (h / 2))
                             + 0.002 * np.sin(2 * math.pi * (X / w * 0.6 + t * 0.9) + p2) * (X / (w / 2)))
    return np.c_[X.ravel(), Y.ravel(), (edge + wave).ravel()]


def build_sheets(coll):
    from assets import lexicon
    S["sheet_mats"] = [C.paper_mat("sheet_00", "sheet_00.png", "sheet_blank.png")]
    for i in range(1, len(lexicon.SHEET_WORDS) + 1):
        S["sheet_mats"].append(C.paper_mat(f"sheet_{i:02d}", f"sheet_{i:02d}.png", "sheet_blank.png"))
    S["s0"] = C.grid("sheet_first", SHEET[0], SHEET[1], 20, 28, coll, S["sheet_mats"][0])
    S["s0"].modifiers.new("solid", "SOLIDIFY").thickness = TH
    S["fly"] = []
    for k in range(N_FLY):
        g = C.grid(f"sheet_fly_{k}", SHEET[0], SHEET[1], 12, 16, coll, S["sheet_mats"][1 + k % 40])
        S["fly"].append(g)
    # reams of the rising stack: unit boxes scaled per frame
    em = edge_mat("ream_edges")
    top = C.paper_mat("ream_top", "sheet_blank.png")
    n = int(CEIL / SLAB) + 2
    S["reams"] = []
    S["ream_off"] = np.c_[rng.normal(0, 0.0018, n), rng.normal(0, 0.0018, n), rng.normal(0, math.radians(0.5), n)]
    for j in range(n):
        o = C.box(f"ream_{j}", (SHEET[0], SHEET[1], 1.0), (0, 0, 0), coll, em)
        o.data.materials.append(top)
        o.data.polygons[1].material_index = 1                    # top face
        o.data.polygons[0].material_index = 1
        S["reams"].append(o)


def build_lights(coll):
    cool = C.kelvin(7800)
    warm = C.kelvin(3300)
    sun = bpy.data.lights.new("moon_sun", "SUN")
    sun.energy = 6.5
    sun.angle = math.radians(0.6)
    sun.color = cool
    so = C.link(bpy.data.objects.new("moon_sun", sun), coll)
    so.rotation_euler = (math.radians(56), 0, math.radians(-93))   # shines in through the left window
    S["sun"] = so
    # sky glow through the window
    S["win"] = C.area_light("window_fill", (-3.5, 0.2, 2.9), (0, math.radians(-90), 0), 1.6, 70, cool, size_y=3.0, coll=coll)
    # warm practical (unseen desk lamp, back right) for the gold accents
    S["lamp"] = C.area_light("lamp", (0.9, 0.75, 1.32), (math.radians(-35), math.radians(38), 0), 0.25, 9, warm, coll=coll)
    # faint bounce from the front so the shadows are never empty
    S["bounce"] = C.area_light("bounce", (0.0, -2.5, 1.6), (math.radians(80), 0, 0), 2.0, 2.5, C.kelvin(5200), coll=coll)
    # big soft top light for the stack shots
    S["top"] = C.area_light("hall_top", (0.5, 0.0, CEIL - 0.4), (0, 0, 0), 3.0, 0, C.kelvin(4800), coll=coll)
    w = bpy.data.worlds.new("lib_world")
    bpy.context.scene.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.002, 0.0025, 0.003, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0


def build_volume(coll):
    m, nt, out = C.nodes_mat("room_haze")
    v = nt.nodes.new("ShaderNodeVolumePrincipled")
    v.inputs["Density"].default_value = 0.014
    v.inputs["Anisotropy"].default_value = 0.55
    v.inputs["Color"].default_value = (0.9, 0.92, 0.95, 1)
    nt.links.new(v.outputs[0], out.inputs["Volume"])
    C.box("haze", (6.6, 8.2, CEIL - 0.02), (0.15, -0.8, CEIL / 2), coll, m)


# ------------------------------------------------------------------ camera
W0 = Vector((0.0, -0.185, D))             # the word on the first sheet
V2T = Vector((0.07, 0.33, D + 0.19))      # Vol II spine title
CAM = [
    # t,    position,                  target,                 lens, focus point,          f-stop
    (0.0,  (0.012, -0.585, D + 0.17),  (0.0, -0.175, D + 0.0),  65, (0.0, -0.176, D), 2.0),
    (3.2,  (0.008, -0.50, D + 0.145),  (0.0, -0.175, D + 0.0),  65, (0.0, -0.176, D), 2.0),
    (4.9,  (0.01, -0.47, D + 0.14),    (0.05, 0.25, D + 0.13),  65, (0.07, 0.33, D + 0.19), 2.0),
    (6.2,  (0.03, -0.17, D + 0.33),    (0.03, 0.17, D + 0.05),  45, (0.03, 0.17, D + 0.07), 2.8),
    (7.4,  (0.01, -0.12, D + 0.40),    (0.02, 0.17, D + 0.03),  40, (0.02, 0.17, D + 0.04), 2.8),
    (8.1,  (-0.05, -0.17, D + 0.12),   (-0.06, 0.16, D + 0.06), 32, (-0.06, 0.12, D + 0.05), 2.8),
    (9.6,  (-0.06, -0.11, D + 0.10),   (-0.06, 0.18, D + 0.05), 32, (-0.06, 0.15, D + 0.05), 2.8),
    (10.5, (-0.10, 0.04, D + 0.11),    (-0.08, 0.20, D + 0.037), 40, (-0.08, 0.17, D + 0.037), 2.8),
    (12.8, (0.0, 0.0, D + 0.98),       (0.0, 0.025, D),         35, (0.0, 0.03, D + 0.03), 5.6),
    (14.3, (0.25, -0.40, D + 0.13),    (0.0, -0.18, D + 0.03),  35, (0.0, -0.18, D + 0.02), 2.8),
    (16.2, (0.31, -0.34, D + 0.07),    (0.0, -0.18, D + 0.025), 35, (0.0, -0.18, D + 0.02), 2.8),
    (19.0, (0.34, -0.12, D + 0.06),    (0.0, -0.18, D + 0.035), 35, (0.0, -0.18, D + 0.02), 2.8),
    (20.6, (0.24, -0.36, D + 0.012),   (0.0, -0.18, D + 0.07),  24, (0.0, -0.18, D + 0.04), 2.8),
    (22.4, (1.1, -1.75, 0.35),         (0.0, -0.18, 1.6),       18, (0.0, -0.18, 1.2), 4.0),
    (END,  (1.7, -2.9, 0.25),          (0.0, -0.18, CEIL + 0.5), 18, (0.0, -0.18, 3.0), 4.0),
]
_trk = None


def camera(t):
    global _trk
    if _trk is None:
        _trk = Track([(k[0], (*k[1], *k[2], k[3], *k[4], k[5])) for k in CAM])
    v = _trk(t)
    pos, tgt, lens, foc, fstop = Vector(v[0:3]), Vector(v[3:6]), v[6], Vector(v[7:10]), v[10]
    # while the stack races up, the frame follows its top (low angle, tilting up)
    w = smooth((t - 20.4) / 0.8)
    if w > 0:
        top = Vector((S0_POS.x, S0_POS.y, D + pile(t) + 0.05))
        tgt = tgt.lerp(Vector((top.x, top.y, max(tgt.z, top.z * 0.75 + D * 0.25))), w * 0.6)
        foc = foc.lerp(top, w)
    fwd = (tgt - pos).normalized()
    dist = (foc - pos).dot(fwd)
    # handheld-free, but a whisper of drift keeps it alive
    drift = Vector((math.sin(t * 0.7) * 0.0006, math.sin(t * 0.53 + 1) * 0.0005, math.sin(t * 0.61 + 2) * 0.0004))
    C.set_camera(S["cam"], pos + drift, tgt, lens, dist, fstop)


# ------------------------------------------------------------------ pose everything for time t
def apply(t):
    camera(t)
    # light emerges from darkness
    up = smooth((t - 0.5) / 2.4)
    S["sun"].data.energy = 6.5 * up
    S["win"].data.energy = 70 * up
    S["lamp"].data.energy = 3.5 * smooth((t - 1.2) / 2.5)
    S["bounce"].data.energy = 2.5 * up
    S["top"].data.energy = 60 * smooth((t - 21.0) / 1.5)

    # cover (with the upper half of the block) swings open 6.1 -> 7.7 s
    o = smoother((t - 6.1) / 1.6)
    S["hinge"].rotation_euler = (0, -math.pi * o, 0)
    S["spine"].scale = (0.35 * (1 - 0.8 * o), 1, 1 - 0.6 * o)
    S["spine"].location.z = HINGE_Z - 0.03 * o
    S["spine"].hide_render = bool(o > 0.35)
    # pages flip: an accelerating riffle 7.7 -> 9.9 s, the last one settles slowly
    starts = [7.75, 8.15, 8.45, 8.7, 8.9, 9.05, 9.25]
    durs = [0.75, 0.6, 0.5, 0.45, 0.42, 0.4, 0.9]
    for k, pg in enumerate(S["flip"]):
        p = smoother((t - starts[k]) / durs[k])
        phi = math.pi * p
        sh = page_shape(phi, 0.9 if 0 < p < 1 else 0.0)
        # stacking order: unflipped pages on the right, flipped ones on the left
        sh[:, 2] += HINGE_Z + (0.00012 * (N_FLIP - k) if p < 0.5 else 0.00012 * (k + 1))
        C.set_verts(pg, sh)

    # ---- first sheet + stack
    h = pile(t)
    lift = smooth((t - 14.1) / 0.9)
    settle = smooth((t - 19.0) / 1.6)
    gap = 0.028 * lift * (1 - settle) + 0.0025 * settle
    flutter = lift * (1 - 0.6 * settle)
    s0 = sheet_shape(20, 28, flutter, t, 0, 1.0, 1.0 - 0.5 * lift)
    C.set_verts(S["s0"], s0)
    sway = lift * (1 - settle)
    S["s0"].location = (S0_POS.x + 0.004 * math.sin(t * 1.3) * sway, S0_POS.y + 0.003 * math.sin(t * 0.9) * sway,
                        D + TH + h + gap + 0.003 * math.sin(t * 2.1) * sway)
    S["s0"].rotation_euler = (0.03 * math.sin(t * 1.7) * sway, 0.04 * math.sin(t * 1.1 + 1) * sway,
                              S0_ROT + 0.02 * math.sin(t * 0.8) * sway)

    # reams (only once the pile is taller than a couple of millimetres)
    for j, rm in enumerate(S["reams"]):
        z0 = j * SLAB
        fill = np.clip((h - 0.002 - z0) / SLAB, 0, 1)
        if fill <= 0:
            rm.hide_render = True
            rm.location = (0, 0, -10)
            continue
        rm.hide_render = False
        ox, oy, orr = S["ream_off"][j]
        rm.scale = (1, 1, max(SLAB * fill, 1e-5))
        rm.location = (S0_POS.x + ox, S0_POS.y + oy, D + z0 + SLAB * fill / 2)
        rm.rotation_euler = (0, 0, S0_ROT + orr)

    # flying sheets: early ones are individual arrivals, later ones a sampled flurry
    arr = sheet_arrivals()
    for k, f in enumerate(S["fly"]):
        f.hide_render = True
    slots = []
    for i, ta in enumerate(arr):
        if ta - 0.05 <= t:
            slots.append((i, ta, 0.42 if i < 12 else max(0.42 - 0.012 * (i - 12), 0.22)))
    # recent arrivals only (older ones are inside the pile and covered by reams)
    slots = slots[-N_FLY:]
    if t > 19.6:                                   # continuous flurry while the pile races upwards
        period = 0.06
        base = int((t - 19.6) / period)
        slots = [(1000 + m, 19.6 + m * period, 0.3) for m in range(max(0, base - N_FLY + 1), base + 1)]
    for slot_i, (i, ta, dur) in enumerate(slots):
        f = S["fly"][slot_i % N_FLY]
        u = (t - ta) / dur
        if u > 1.6:
            continue
        r = np.random.default_rng(i * 7 + 1)
        ang = r.uniform(-2.6, -0.5) if i < 1000 else r.uniform(0, 2 * math.pi)
        dist0 = r.uniform(0.32, 0.5) * (1 if i < 1000 else (1 + min(h, 3)))
        uu = smooth(min(u, 1.0))
        land_h = pile(ta + dur)
        start = Vector((S0_POS.x + math.cos(ang) * dist0, S0_POS.y + math.sin(ang) * dist0, D + land_h + gap * 0.8 + 0.02))
        end = Vector((S0_POS.x + r.normal(0, 0.003), S0_POS.y + r.normal(0, 0.003), D + land_h))
        p = start.lerp(end, uu)
        p.z += 0.025 * math.sin(math.pi * uu) * (1 - uu)
        if u >= 1:
            # landed: lies on the pile until the reams cover it
            p = end
            if h - land_h > 0.0035:
                continue
        f.hide_render = False
        f.location = p
        f.rotation_euler = (0.25 * (1 - uu) * math.sin(i), 0.3 * (1 - uu) * math.cos(i * 1.3),
                            S0_ROT + r.normal(0, 0.03) + (1 - uu) * r.uniform(-0.6, 0.6))
        C.set_verts(f, sheet_shape(12, 16, (1 - uu) * 1.4, t, i, 1.0, 0.8))
        f.data.materials[0] = S["sheet_mats"][1 + (i % 40)]
