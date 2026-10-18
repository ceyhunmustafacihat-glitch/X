"""Blender helpers shared by the library and city sets: render settings,
materials, meshes, camera rigs and keyframe tracks."""
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector
from scipy.interpolate import PchipInterpolator

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config  # noqa: E402

TEX = os.path.join(config.BUILD, "tex")


# ------------------------------------------------------------------ scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.render.fps = config.FPS
    sc.unit_settings.system = "METRIC"
    return sc


def render_settings(width, height, spp, motion_blur=True, shutter=0.5):
    sc = bpy.context.scene
    r = sc.render
    r.resolution_x, r.resolution_y, r.resolution_percentage = width, height, 100
    r.use_motion_blur = motion_blur
    r.motion_blur_shutter = shutter
    r.use_persistent_data = True
    r.film_transparent = False
    r.image_settings.media_type = "MULTI_LAYER_IMAGE"
    r.image_settings.file_format = "OPEN_EXR_MULTILAYER"
    r.image_settings.color_depth = "16"
    r.image_settings.exr_codec = "DWAA"
    c = sc.cycles
    c.samples = spp
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.03
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    c.max_bounces = 6
    c.diffuse_bounces = 3
    c.glossy_bounces = 3
    c.transmission_bounces = 4
    c.volume_bounces = 0
    c.transparent_max_bounces = 4
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.blur_glossy = 1.0
    c.sample_clamp_indirect = 6.0
    c.volume_step_rate = 4.0
    sc.view_settings.view_transform = "Standard"     # we tone-map ourselves in post
    sc.view_layers[0].use_pass_mist = True
    sc.view_layers[0].use_pass_z = True
    sc.world.mist_settings.start = 0.0
    sc.world.mist_settings.falloff = "LINEAR"


def collection(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


# ------------------------------------------------------------------ meshes
def mesh_obj(name, verts, faces, coll=None, uvs=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    if uvs is not None:
        uv = me.uv_layers.new(name="UVMap")
        loop_uv = [uvs[vi] for f in faces for vi in f]
        uv.data.foreach_set("uv", np.array(loop_uv, np.float32).ravel())
    if smooth:
        me.shade_smooth()
    me.update()
    return link(bpy.data.objects.new(name, me), coll)


def box(name, size, loc=(0, 0, 0), coll=None, mat=None, bevel=0.0, rot=(0, 0, 0)):
    sx, sy, sz = (s / 2 for s in size)
    v = [(-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
         (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    o = mesh_obj(name, v, f, coll)
    # box-projected UVs in metres (generated in shader where needed)
    o.location = loc
    o.rotation_euler = rot
    if mat:
        o.data.materials.append(mat)
    if bevel > 0:
        m = o.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "NONE"
    return o


def grid(name, w, h, nx, ny, coll=None, mat=None):
    """Plane in XY centred on origin, UV 0..1, (nx+1)*(ny+1) vertices."""
    xs = np.linspace(-w / 2, w / 2, nx + 1)
    ys = np.linspace(-h / 2, h / 2, ny + 1)
    verts, uvs = [], []
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            verts.append((x, y, 0.0))
            uvs.append((i / nx, j / ny))
    faces = []
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    o = mesh_obj(name, verts, faces, coll, uvs, smooth=True)
    if mat:
        o.data.materials.append(mat)
    return o


def set_verts(obj, co):
    obj.data.vertices.foreach_set("co", np.asarray(co, np.float32).ravel())
    obj.data.update()


# ------------------------------------------------------------------ materials
def nodes_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    return m, nt, out


def principled(nt, **kw):
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    names = {"base": "Base Color", "rough": "Roughness", "metal": "Metallic", "coat": "Coat Weight",
             "coat_rough": "Coat Roughness", "sss": "Subsurface Weight", "trans": "Transmission Weight",
             "emit": "Emission Color", "emit_str": "Emission Strength", "spec": "Specular IOR Level",
             "ior": "IOR", "alpha": "Alpha", "sheen": "Sheen Weight"}
    for k, v in kw.items():
        p.inputs[names[k]].default_value = v
    return p


def image(nt, fname, colorspace="sRGB", extension="EXTEND"):
    t = nt.nodes.new("ShaderNodeTexImage")
    path = fname if os.path.isabs(fname) else os.path.join(TEX, fname)
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = colorspace
    t.image = img
    t.extension = extension
    t.interpolation = "Cubic"
    return t


def paper_mat(name, tex, back_tex=None, tone=1.0):
    """Paper: textured diffuse with a little sheen and real translucency."""
    m, nt, out = nodes_mat(name)
    L = nt.links
    t = image(nt, tex)
    uv = nt.nodes.new("ShaderNodeTexCoord")
    L.new(uv.outputs["UV"], t.inputs["Vector"])
    col = t.outputs["Color"]
    if back_tex:
        tb = image(nt, back_tex)
        mapn = nt.nodes.new("ShaderNodeMapping")       # mirror U for the back side
        mapn.inputs["Scale"].default_value = (-1, 1, 1)
        mapn.inputs["Location"].default_value = (1, 0, 0)
        L.new(uv.outputs["UV"], mapn.inputs["Vector"])
        L.new(mapn.outputs["Vector"], tb.inputs["Vector"])
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        L.new(geo.outputs["Backfacing"], mix.inputs["Factor"])
        L.new(t.outputs["Color"], mix.inputs[6])
        L.new(tb.outputs["Color"], mix.inputs[7])
        col = mix.outputs[2]
    if tone != 1.0:
        hsv = nt.nodes.new("ShaderNodeHueSaturation")
        hsv.inputs["Value"].default_value = tone
        L.new(col, hsv.inputs["Color"])
        col = hsv.outputs["Color"]
    p = principled(nt, rough=0.72, spec=0.35, sheen=0.15)
    L.new(col, p.inputs["Base Color"])
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    L.new(col, tr.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.22
    L.new(p.outputs[0], mix.inputs[1])
    L.new(tr.outputs[0], mix.inputs[2])
    # fibre bump
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 900.0
    nz.inputs["Detail"].default_value = 6.0
    L.new(uv.outputs["UV"], nz.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    bump.inputs["Distance"].default_value = 0.0002
    L.new(nz.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], p.inputs["Normal"])
    L.new(mix.outputs[0], out.inputs["Surface"])
    return m


def wood_mat(name, base=(0.075, 0.038, 0.02), scale=1.0, rough=0.38, coat=0.35):
    m, nt, out = nodes_mat(name)
    L = nt.links
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.35 * scale, 5.0 * scale, 5.0 * scale)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.6
    nz.inputs["Detail"].default_value = 3.0
    L.new(mp.outputs["Vector"], nz.inputs["Vector"])
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "Y"
    wave.inputs["Scale"].default_value = 2.2
    wave.inputs["Distortion"].default_value = 3.5
    wave.inputs["Detail"].default_value = 3.0
    wave.inputs["Detail Scale"].default_value = 1.5
    L.new(mp.outputs["Vector"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    b = np.array(base)
    ramp.color_ramp.elements[0].color = (*(b * 0.55), 1)
    ramp.color_ramp.elements[1].color = (*(b * 1.35), 1)
    L.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    fine = nt.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 260.0
    fine.inputs["Detail"].default_value = 2.0
    L.new(tc.outputs["Object"], fine.inputs["Vector"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value = rough - 0.1
    rr.inputs["To Max"].default_value = rough + 0.15
    L.new(nz.outputs["Fac"], rr.inputs["Value"])
    p = principled(nt, coat=coat, coat_rough=0.12, spec=0.5)
    L.new(ramp.outputs["Color"], p.inputs["Base Color"])
    L.new(rr.outputs["Result"], p.inputs["Roughness"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    bump.inputs["Distance"].default_value = 0.0005
    L.new(fine.outputs["Fac"], bump.inputs["Height"])
    L.new(bump.outputs["Normal"], p.inputs["Normal"])
    L.new(p.outputs[0], out.inputs["Surface"])
    return m


def simple_mat(name, base, rough=0.5, metal=0.0, emit=None, emit_str=0.0, spec=0.5, coat=0.0):
    m, nt, out = nodes_mat(name)
    p = principled(nt, base=(*base, 1), rough=rough, metal=metal, spec=spec, coat=coat)
    if emit:
        p.inputs["Emission Color"].default_value = (*emit, 1)
        p.inputs["Emission Strength"].default_value = emit_str
    nt.links.new(p.outputs[0], out.inputs["Surface"])
    return m


def emission_mat(name, color, strength):
    m, nt, out = nodes_mat(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*color, 1)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], out.inputs["Surface"])
    return m


def kelvin(k):
    """Approximate linear-RGB colour of a black body (Tanner Helland fit)."""
    t = k / 100
    r = 255 if t <= 66 else 329.7 * (t - 60) ** -0.1332
    g = 99.47 * math.log(t) - 161.12 if t <= 66 else 288.12 * (t - 60) ** -0.0755
    b = 255 if t >= 66 else (0 if t <= 19 else 138.52 * math.log(t - 10) - 305.04)
    c = np.clip(np.array([r, g, b]) / 255, 0, 1)
    return tuple((c ** 2.2) / max(c ** 2.2))


# ------------------------------------------------------------------ lights / camera
def area_light(name, loc, rot, size, energy, color=(1, 1, 1), shape="RECTANGLE", size_y=None, coll=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = shape
    ld.size = size
    ld.size_y = size_y or size
    ld.energy = energy
    ld.color = color
    o = link(bpy.data.objects.new(name, ld), coll)
    o.location, o.rotation_euler = loc, rot
    return o


def look_at_matrix(pos, target, roll=0.0, up_hint=(0, 1, 0)):
    """Camera matrix looking at target. Near-vertical views blend the up vector
    toward up_hint so a crane to top-down never spins the frame."""
    pos, target = Vector(pos), Vector(target)
    d = (target - pos).normalized()
    w = smooth((abs(d.z) - 0.75) / 0.2)
    up = (Vector((0, 0, 1)) * (1 - w) + Vector(up_hint) * w * (1 if d.z < 0 else -1)).normalized()
    right = d.cross(up).normalized()
    up = right.cross(d).normalized()
    m = Matrix((right, up, -d)).transposed().to_4x4()
    if roll:
        m = m @ Matrix.Rotation(roll, 4, "Z")
    m.translation = pos
    return m


def make_camera(name="Camera"):
    cd = bpy.data.cameras.new(name)
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 24.0 * 16 / 9 / 1.5      # Super35-ish height for a vertical frame
    cd.sensor_width = cd.sensor_height * 9 / 16
    cd.dof.use_dof = True
    cd.clip_start = 0.005
    cd.clip_end = 5000
    o = link(bpy.data.objects.new(name, cd))
    bpy.context.scene.camera = o
    return o


def set_camera(cam, pos, target, lens, focus, fstop, roll=0.0):
    cam.matrix_world = look_at_matrix(pos, target, roll)
    cam.data.lens = lens
    cam.data.dof.focus_distance = max(focus, 0.01)
    cam.data.dof.aperture_fstop = fstop
    cam.data.dof.aperture_blades = 9
    cam.data.dof.aperture_ratio = 1.0


class Track:
    """Monotone-cubic (PCHIP) interpolation of vector keys over time: smooth,
    no overshoot, holds at the ends. keys = [(t, (v0, v1, ...)), ...]"""

    def __init__(self, keys):
        self.t = np.array([k[0] for k in keys], float)
        self.v = np.array([np.atleast_1d(k[1]) for k in keys], float)
        self.f = PchipInterpolator(self.t, self.v, axis=0) if len(keys) > 1 else None

    def __call__(self, t):
        if self.f is None:
            return self.v[0]
        return self.f(np.clip(t, self.t[0], self.t[-1]))


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def smoother(x):
    x = np.clip(x, 0, 1)
    return x * x * x * (x * (6 * x - 15) + 10)


def link_move(obj, coll):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)
    return obj


def add_fog(mat, color, dist, power=1.0):
    """Aerial perspective inside the shader: blend toward a haze emission by
    camera distance (cheaper than a volume, and Blender 5 no longer writes the
    mist pass into multilayer EXRs)."""
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    if not out.inputs["Surface"].links:
        return
    src = out.inputs["Surface"].links[0].from_socket
    cam = nt.nodes.new("ShaderNodeCameraData")
    k = nt.nodes.new("ShaderNodeMath")
    k.operation = "DIVIDE"
    k.inputs[1].default_value = -dist
    nt.links.new(cam.outputs["View Distance"], k.inputs[0])
    e = nt.nodes.new("ShaderNodeMath")
    e.operation = "EXPONENT"
    nt.links.new(k.outputs[0], e.inputs[0])
    f = nt.nodes.new("ShaderNodeMath")
    f.operation = "SUBTRACT"
    f.inputs[0].default_value = 1.0
    nt.links.new(e.outputs[0], f.inputs[1])
    pw = nt.nodes.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = power
    nt.links.new(f.outputs[0], pw.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = 1.0
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(pw.outputs[0], mix.inputs["Fac"])
    nt.links.new(src, mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
