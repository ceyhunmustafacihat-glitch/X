#!/usr/bin/env python3
"""Synthesises the score and sound design for the William Golding film.

Each scene of animation/timeline.js gets its own musical mood (playful
pizzicato for childhood, a spooky cellar, a waltz for Oxford, drums for the
war, a woozy piano for the hard years, a fanfare for the honours) plus foley
placed on the same cues the animation uses. Everything is generated here:
additive piano, plucks, celesta, marimba, bells, brass-like pads, drums and
filtered noise, mixed through a synthetic hall.

    python3 golding/audio/compose.py   -> golding/output/soundtrack.wav (48 kHz, stereo, 24-bit)
"""
import json
import os
import re
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000

with open(os.path.join(ROOT, "animation", "timeline.js"), encoding="utf-8") as f:
    src = f.read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])
DUR = TL["duration"]
N = int(DUR * SR) + SR * 4
SC = {s["id"]: s for s in TL["scenes"]}

rng = np.random.default_rng(11)
music_dry, music_wet = np.zeros((2, N)), np.zeros((2, N))
fx_dry, fx_wet = np.zeros((2, N)), np.zeros((2, N))


def S(sid, key=None):
    """Absolute time of a scene start, or of one of its cues."""
    s = SC[sid]
    return s["start"] if key is None else s["start"] + s["cues"][key]


def hz(name):
    m = re.match(r"([A-G])(#|b)?(-?\d)", name)
    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[m.group(1)]
    midi = 12 * (int(m.group(3)) + 1) + base + {"#": 1, "b": -1, None: 0}[m.group(2)]
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(busd, busw, t, sig, gain=1.0, pan=0.0, wet=0.3):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    n = min(sig.shape[1], N - i)
    busd[:, i:i + n] += sig[:, :n] * gain * (1 - wet)
    busw[:, i:i + n] += sig[:, :n] * gain * wet


def M(t, sig, gain=1.0, pan=0.0, wet=0.4):
    place(music_dry, music_wet, t, sig, gain, pan, wet)


def FX(t, sig, gain=1.0, pan=0.0, wet=0.15):
    place(fx_dry, fx_wet, t, sig, gain, pan, wet)


def tt(n):
    return np.arange(n) / SR


# ---------------------------------------------------------------- instruments
def piano(f, dur, vel=0.6, wobble=0.0):
    n = int((dur + 2.2) * SR)
    t = tt(n)
    out = np.zeros(n)
    B = 0.00035 * (f / 220) ** 0.5
    T0 = np.clip(3.0 * (220 / f) ** 0.45, 0.5, 6.0)
    vib = 1 + wobble * np.sin(2 * np.pi * 0.7 * t + rng.random() * 6)
    for k in range(1, 13):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 14000:
            break
        amp = vel * k ** -1.1 * np.exp(-(k - 1) * (0.25 - 0.1 * vel))
        tau = T0 / (1 + 0.5 * (k - 1))
        e = 0.7 * np.exp(-t / tau) + 0.3 * np.exp(-t / (tau * 4))
        ph = rng.random() * 6.28
        out += amp * e * np.sin(2 * np.pi * fk * np.cumsum(vib) / SR + ph)
    off = t > dur
    out[off] *= np.exp(-(t[off] - dur) / 0.3)
    a = int(0.003 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return out


def pluck(f, vel=0.6, decay=0.35):
    """Pizzicato-like pluck: bright attack, fast-decaying upper partials."""
    n = int((decay * 4) * SR)
    t = tt(n)
    out = np.zeros(n)
    for k in range(1, 10):
        if k * f > 12000:
            break
        out += (k ** -1.2) * np.sin(2 * np.pi * k * f * t + rng.random()) * np.exp(-t * k * 1.4 / decay)
    a = int(0.002 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return out * vel


def marimba(f, vel=0.6):
    n = int(1.2 * SR)
    t = tt(n)
    out = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.06)
    a = int(0.002 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return out * vel


def celesta(f, vel=0.5, decay=1.4):
    n = int(decay * 2.5 * SR)
    t = tt(n)
    out = np.zeros(n)
    for ratio, amp, dk in [(1, 1, 1), (2.0, 0.25, 0.6), (3.0, 0.15, 0.5), (4.07, 0.32, 0.35)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (decay * dk))
    a = int(0.002 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return out * vel * 0.5


def bell(f, vel=0.5, decay=3.0):
    n = int(decay * 1.6 * SR)
    t = tt(n)
    out = np.zeros(n)
    for ratio, amp, dk in [(0.5, 0.5, 1.2), (1, 1, 1), (1.19, 0.5, 0.8), (1.5, 0.35, 0.6), (2.0, 0.4, 0.5), (2.74, 0.25, 0.35), (3.76, 0.15, 0.25)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (decay * dk))
    a = int(0.002 * SR)
    out[:a] *= np.linspace(0, 1, a)
    return out * vel * 0.4


def pad(freqs, dur, vel=0.3, attack=1.0, release=1.5, cutoff=1600, voices=3, bright_k=1.0):
    n = int((dur + release + 0.3) * SR)
    t = tt(n)
    out = np.zeros((2, n))
    for f in freqs:
        for v in range(voices):
            det = 1 + (v - (voices - 1) / 2) * 0.004
            vib = 1 + 0.002 * np.sin(2 * np.pi * (4.5 + v * 0.3) * t + v)
            phase = 2 * np.pi * np.cumsum(f * det * vib) / SR
            w = np.zeros(n)
            for k in range(1, 20):
                if k * f > 9000:
                    break
                w += np.sin(k * phase + rng.random() * 6.28) / k ** bright_k * np.exp(-((k * f) / cutoff) ** 2)
            pn = (v - (voices - 1) / 2) * 0.7
            out[0] += w * np.cos((pn + 1) * np.pi / 4)
            out[1] += w * np.sin((pn + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.5 * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(freqs) * voices) * 1.4


def brass(freqs, dur, vel=0.4, attack=0.06):
    return pad(freqs, dur, vel, attack=attack, release=0.5, cutoff=2600, voices=2, bright_k=0.85)


def noise_band(dur, lo, hi, order=2):
    n = max(16, int(dur * SR))
    x = rng.standard_normal(n)
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band")
    y = signal.lfilter(b, a, x)
    return y / (np.sqrt(np.mean(y ** 2)) * 3 + 1e-9)


def kick(f0=55, dur=0.6, punch=60):
    t = tt(int(dur * SR))
    return np.sin(2 * np.pi * np.cumsum(f0 + punch * np.exp(-t / 0.04)) / SR) * np.exp(-t / (dur / 3))


def timpani(f=82, dur=1.4, vel=0.8):
    t = tt(int(dur * SR))
    s = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.08 * np.exp(-t / 0.05))) / SR) * np.exp(-t / 0.5)
    s += 0.4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t / 0.3)
    s += noise_band(dur, 80, 900) * np.exp(-t / 0.03) * 0.5
    return s * vel


def snare(vel=0.6, dur=0.25):
    t = tt(int(dur * SR))
    return (noise_band(dur, 1200, 9000) * np.exp(-t / 0.07) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04)) * vel


def boom(dur=2.0, vel=1.0):
    t = tt(int(dur * SR))
    return (kick(40, dur, 50) * 0.9 + noise_band(dur, 60, 1200) * np.exp(-t / 0.35) * 0.6) * vel


def whoosh(dur=0.5, lo=400, hi=4000):
    s = noise_band(dur, lo, hi)
    return s * np.sin(np.linspace(0, np.pi, len(s))) ** 2


def glide(f0, f1, dur, vel=0.5, shape="sine"):
    t = tt(int(dur * SR))
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if shape == "sine" else np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    return w * np.sin(np.linspace(0, np.pi, len(t))) ** 0.6 * vel


def pop_snd(f=900):
    t = tt(int(0.12 * SR))
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.03)


def chord(t, names, dur, vel=0.4, gain=1.0, spread=0.0, wet=0.45, wobble=0.0):
    for i, nm in enumerate(names):
        f = hz(nm)
        M(t + i * spread, piano(f, dur, vel, wobble), gain, np.clip(np.log2(f / 260) * 0.35, -0.6, 0.6), wet)


def mel(t, nm, dur, vel=0.5, gain=1.0, wet=0.45, wobble=0.0):
    f = hz(nm)
    M(t, piano(f, dur, vel, wobble), gain, np.clip(np.log2(f / 260) * 0.3, -0.5, 0.5), wet)


def bars(t0, t1, bpm, beats):
    """Yield (bar_index, bar_start, beat_len) for whole bars in [t0, t1)."""
    b = 60 / bpm
    i, t = 0, t0
    while t + b * beats <= t1 + 1e-6:
        yield i, t, b
        t += b * beats
        i += 1


# ================================================================= helpers for foley
def waves_bed(t, dur, gain=0.05):
    n = int(dur * SR)
    s_ = noise_band(dur, 150, 2500)
    sw = 0.55 + 0.45 * np.sin(2 * np.pi * tt(n) / 4.5)
    e = np.clip(tt(n) / 1.0, 0, 1) * np.clip((dur - tt(n)) / 1.0, 0, 1)
    FX(t, s_ * sw * e, gain, 0, 0.3)


def gull(t, pan=0.5):
    FX(t, glide(2400, 1500, 0.25, 0.5, "rich"), 0.05, pan, 0.4)
    FX(t + 0.3, glide(2300, 1600, 0.2, 0.5, "rich"), 0.04, pan, 0.4)


def paper(dur=0.35):
    s_ = noise_band(dur, 900, 7000)
    return s_ * np.sin(np.linspace(0, np.pi, len(s_))) ** 0.7


def brawl_snd(t, dur):
    k = 0.0
    while k < dur:
        FX(t + k, kick(70, 0.2, 90), 0.22, rng.uniform(-0.4, 0.4), 0.1)
        FX(t + k + 0.06, noise_band(0.08, 600, 5000) * np.exp(-tt(int(0.08 * SR)) / 0.02), 0.2, rng.uniform(-0.5, 0.5), 0.1)
        if rng.random() < 0.3:
            FX(t + k, glide(300, 900, 0.18, 0.5), 0.1, rng.uniform(-0.5, 0.5), 0.2)
        k += 0.17 + rng.random() * 0.12


def nxt(sid):
    """Start of the scene after sid."""
    ids = [x["id"] for x in TL["scenes"]]
    i = ids.index(sid)
    return TL["scenes"][i + 1]["start"] if i + 1 < len(ids) else DUR


def playful(t_a, t_b, bpm, prog, tune, gain=1.0):
    for i, tb, b in bars(t_a, t_b, bpm, 4):
        root, tri = prog[i % len(prog)]
        M(tb, pluck(hz(root), 0.7, 0.45), 0.55 * gain, -0.3, 0.25)
        M(tb + 2 * b, pluck(hz(root) * 1.5, 0.6, 0.4), 0.45 * gain, -0.3, 0.25)
        for j in range(4):
            M(tb + j * b + b / 2, pluck(hz(tri[j % len(tri)]), 0.45, 0.25), 0.38 * gain, 0.25, 0.3)
        for j, nm in enumerate(tune[i % len(tune)]):
            if nm:
                M(tb + j * b / 2, marimba(hz(nm), 0.5), 0.48 * gain, 0.1, 0.35)


C_PROG = [("C3", ["E4", "G4", "C5"]), ("A2", ["E4", "A4", "C5"]), ("F2", ["F4", "A4", "C5"]), ("G2", ["D4", "G4", "B4"])]
C_TUNE = [["E5", None, "G5", None, "C6", "B5", "A5", "G5"], ["A5", None, "E5", None, "A5", "C6", "B5", None],
          ["A5", "G5", "F5", None, "A5", None, "C6", None], ["B5", "A5", "G5", "F5", "D5", None, "G5", None]]
G_PROG = [("G2", ["B4", "D5", "G5"]), ("E2", ["B4", "E5", "G5"]), ("C3", ["E5", "G5", "C5"]), ("D3", ["F#5", "A5", "D5"])]
G_TUNE = [["D6", None, "B5", None, "G5", "A5", "B5", None], ["E6", None, "B5", None, "G5", "B5", "E6", None],
          ["E6", "D6", "C6", None, "G5", None, "C6", None], ["D6", "C6", "B5", "A5", "F#5", None, "D6", None]]

# ================================================================= the score
# --- chapter pages: one soft chord and a page turn each
for sc_ in TL["scenes"]:
    if sc_.get("title"):
        t = sc_["start"]
        # the page turning in and out
        for tf in (t - 0.4, sc_["end"] - 0.4):
            FX(tf, paper(0.7) * np.linspace(0.4, 1, int(0.7 * SR)), 0.3, 0.2, 0.3)
            FX(tf + 0.45, noise_band(0.12, 200, 1500) * np.exp(-tt(int(0.12 * SR)) / 0.03), 0.12, 0.2, 0.2)
        for k, nm in enumerate(["C4", "G4", "E5"]):
            M(t + 0.15 + k * 0.05, bell(hz(nm), 0.35, 2.2), 0.4, -0.2 + k * 0.2, 0.6)
        # the nib scratching out the title, then the underline
        wd = 1.2
        n_ = int(wd * SR)
        scr = noise_band(wd, 2500, 7500) * np.clip(np.sin(2 * np.pi * 7 * tt(n_) + 1.2 * np.sin(2 * np.pi * 1.9 * tt(n_))), 0, 1) ** 0.6
        FX(t + 0.45, scr * np.clip(tt(n_) / 0.05, 0, 1) * np.clip((wd - tt(n_)) / 0.1, 0, 1), 0.06, 0.1, 0.1)

# --- title: warm, open
t0 = S("title")
for i, (bass, ch) in enumerate([("C3", ["E4", "G4", "C5"]), ("F2", ["F4", "A4", "C5"]), ("G2", ["D4", "G4", "B4"])]):
    tc = t0 + 0.3 + i * 1.7
    M(tc, piano(hz(bass), 1.7, 0.5), 0.6, -0.3)
    chord(tc + 0.02, ch, 1.6, 0.3, 0.8, spread=0.05)
for k, nm in enumerate(["E5", "G5", "C6", "B5", "G5", "E6"]):
    M(S("title", "name") + k * 0.4, celesta(hz(nm), 0.45), 0.75, 0.3, 0.6)
M(t0 + 0.2, pad([hz(x) for x in ["C3", "G3", "E4"]], 5.2, 0.24, attack=1.0, release=1.0), 1.0, 0, 0.6)

# --- birth and the family pages: playful pizzicato
playful(S("birth") + 0.1, nxt("birth") - 0.3, 104, C_PROG, C_TUNE)
playful(S("family") + 0.05, nxt("family") - 0.3, 104,
        [("F2", ["A4", "C5", "F5"]), ("D3", ["A4", "D5", "F5"]), ("Bb2", ["D5", "F5", "Bb4"]), ("C3", ["E5", "G5", "Bb4"])], C_TUNE, 0.9)

# --- house: spooky A minor
th, te_ = S("house"), nxt("house")
M(th, pad([hz("A2"), hz("E3"), hz("C4")], te_ - th - 0.4, 0.28, attack=1.6, release=1.2, cutoff=900), 1.0, 0, 0.6)
for k in range(int((te_ - th - 1) / 1.05)):
    M(th + 0.6 + k * 1.05, celesta(hz(["A5", "C6", "Eb6", "B5", "F6", "D6"][k % 6]), 0.32, 1.8), 0.55, -0.4 + (k % 3) * 0.4, 0.7)
for k in range(int((te_ - th) / 2.1)):
    M(th + 0.5 + k * 2.1, piano(hz(["A2", "A2", "F2", "E2", "A2", "D#2"][k % 6]), 2.0, 0.45), 0.6, -0.2, 0.5)

# --- school: bouncy G major, the classroom lighter
playful(S("school") + 0.1, S("school", "class") - 0.2, 112, G_PROG, G_TUNE, 0.9)
for i, tb, b in bars(S("school", "class"), nxt("school") - 0.3, 112, 4):
    root, tri = [("G2", ["B4", "D5", "G5"]), ("C3", ["C5", "E5", "G5"]), ("A2", ["C5", "E5", "A5"]), ("D3", ["D5", "F#5", "A5"])][i % 4]
    M(tb, pluck(hz(root), 0.6), 0.5, -0.3, 0.25)
    for j in range(4):
        M(tb + j * b, pluck(hz(tri[j % 3]), 0.4, 0.22), 0.33, 0.3, 0.3)
    M(tb + b * 0.5, celesta(hz(tri[2]) * 2, 0.25), 0.45, 0.2, 0.6)

# --- oxford: a waltz in D, brighter after the switch
to = S("oxford")
prog = [("D2", ["F#4", "A4", "D5"]), ("B1", ["F#4", "B4", "D5"]), ("G2", ["G4", "B4", "D5"]), ("A2", ["E4", "A4", "C#5"])]
tune = [["F#5", "A5", "D6"], ["D6", "C#6", "B5"], ["B5", "D6", "G5"], ["A5", "E5", "C#6"]]
for i, tb, b in bars(to + 0.2, nxt("oxford") - 0.3, 86, 3):
    root, tri = prog[i % 4]
    bright = tb > S("oxford", "poof")
    M(tb, piano(hz(root), b * 2.8, 0.5), 0.55, -0.3, 0.45)
    chord(tb + b, tri, b * 0.8, 0.22, 0.6)
    chord(tb + 2 * b, tri, b * 0.8, 0.2, 0.55)
    if bright or i % 2 == 0:
        for j, nm in enumerate(tune[i % 4]):
            mel(tb + j * b, nm, b * 0.95, 0.42 if bright else 0.32, 0.9, 0.5)

# --- the dark page: D minor drone, sparse piano
td = S("dark")
M(td, pad([hz("D2"), hz("A2"), hz("F3")], nxt("dark") - td - 0.4, 0.3, attack=1.4, release=1.0, cutoff=700), 1.0, 0, 0.6)
for dt, nm in [(0.6, "D4"), (1.8, "F4"), (3.0, "A3"), (4.2, "C#4"), (5.6, "D4"), (6.8, "Bb3")]:
    mel(td + dt, nm, 1.6, 0.34, 0.9, 0.6)

# --- love: tender F major, then wedding bells
tl = S("love")
prog = [("F2", ["A4", "C5", "F5"]), ("D2", ["A4", "D5", "F5"]), ("Bb1", ["Bb4", "D5", "F5"]), ("C2", ["G4", "C5", "E5"])]
tune = [["A5", "C6", "F6", "E6"], ["D6", "C6", "A5", "F5"], ["F5", "G5", "Bb5", "D6"], ["C6", "Bb5", "G5", "E5"]]
for i, tb, b in bars(tl + 0.2, nxt("love") - 0.3, 92, 4):
    root, tri = prog[i % 4]
    M(tb, piano(hz(root), b * 3.8, 0.5), 0.5, -0.3, 0.5)
    for j in range(8):
        mel(tb + j * b / 2, tri[j % 3], b * 0.45, 0.18, 0.6, 0.5)
    for j, nm in enumerate(tune[i % 4]):
        mel(tb + j * b, nm, b * 0.95, 0.4, 0.85, 0.5)

# --- teacher: curious staccato, E minor
prog = [("E2", ["E5", "G5", "B5"]), ("C3", ["E5", "G5", "C6"]), ("A2", ["E5", "A5", "C6"]), ("B2", ["D#5", "F#5", "B5"])]
for i, tb, b in bars(S("teacher") + 0.2, nxt("teacher") - 0.3, 120, 4):
    root, tri = prog[i % 4]
    M(tb, pluck(hz(root), 0.7, 0.4), 0.55, -0.3, 0.25)
    M(tb + 2 * b, pluck(hz(root), 0.6, 0.4), 0.45, -0.3, 0.25)
    for j in range(8):
        if j % 3 != 2:
            M(tb + j * b / 2, marimba(hz(tri[(j * 2) % 3]), 0.45), 0.42, 0.2, 0.3)
    if tb > S("teacher", "charge") - 0.5:
        for j in range(4):
            FX(tb + j * b, snare(0.3), 0.45, 0.1, 0.2)

# --- war
tw = S("war")
M(tw + 0.2, brass([hz("C3"), hz("G3"), hz("C4")], 2.3, 0.45, attack=0.4), 1.0, 0, 0.45)
M(tw + 2.6, brass([hz("Ab2"), hz("Eb3"), hz("C4")], 2.0, 0.45, attack=0.4), 1.0, 0, 0.45)
for k in range(8):
    FX(tw + 0.2 + k * 0.55, timpani(hz("C2"), 0.8, 0.5 + 0.2 * (k % 2 == 0)), 0.45, -0.1, 0.3)
for key, ch in [("rank1", ["C3", "G3", "C4"]), ("rank2", ["Eb3", "Bb3", "Eb4"]), ("rank3", ["G3", "D4", "G4", "B4"])]:
    M(S("war", key) + 0.35, brass([hz(x) for x in ch], 1.0, 0.5), 1.0, 0, 0.4)
    FX(S("war", key) + 0.35, timpani(hz("G2"), 1.0, 0.7), 0.45, 0, 0.3)
    FX(S("war", key) + 0.1, glide(400, 1000, 0.2), 0.08, 0, 0.2)
tc_ = S("war", "chase")
for k in range(int(5.0 / 0.2)):
    M(tc_ + k * 0.2, pluck(hz(["C3", "C3", "Eb3", "C3", "D3", "C3", "G2", "C3"][k % 8]), 0.7, 0.3), 0.55, -0.2, 0.25)
    if k % 2 == 0:
        FX(tc_ + k * 0.2, kick(50, 0.35), 0.22, 0, 0.1)
M(tc_, pad([hz("C2"), hz("G2"), hz("Db3")], 5.0, 0.33, attack=0.5, release=0.8, cutoff=900), 1.0, 0, 0.5)
tr = S("war", "ruins")
M(tr - 0.1, pad([hz("C3"), hz("Eb3"), hz("G3")], nxt("war") - tr - 0.3, 0.28, attack=0.8, release=1.0, cutoff=900), 1.0, 0, 0.6)
for dt, nm in [(0.3, "G4"), (1.5, "Eb4"), (2.7, "D4"), (3.9, "C4"), (5.0, "G3")]:
    mel(tr + dt, nm, 1.3, 0.34, 0.9, 0.6)

# --- hard times: a woozy, detuned piano
tha = S("hard")
prog = [("Bb1", ["D4", "F4", "Ab4"]), ("Eb2", ["G4", "Bb4", "Db5"]), ("F2", ["A4", "C5", "Eb5"]), ("Bb1", ["D4", "F4", "Ab4"])]
for i, tb, b in bars(tha + 0.2, S("hard", "wake") - 0.2, 76, 4):
    root, tri = prog[i % 4]
    wob = 0.004 + 0.01 * min(1, (tb - tha) / 8)
    M(tb, piano(hz(root), b * 3.6, 0.45, wob), 0.5, -0.3, 0.5)
    for j in range(4):
        mel(tb + j * b, tri[j % 3], b * 0.9, 0.27, 0.8, 0.5, wob)
M(S("hard", "wake"), pad([hz("B2"), hz("F3")], 3.0, 0.24, attack=1.2, release=0.6, cutoff=700), 1.0, 0, 0.6)
for k in range(4):
    M(S("hard", "wake") + 0.3 + k * 0.6, celesta(hz(["F6", "B5", "E6", "A#5"][k]), 0.3), 0.55, 0.4, 0.7)
ta = S("hard", "attack")
for k in range(8):
    FX(ta + 0.2 + k * 0.12, timpani(hz("E2") * (1 + 0.06 * (k % 3)), 0.4, 0.6), 0.38, 0, 0.2)
M(ta + 1.3, brass([hz("C3"), hz("E3"), hz("G3"), hz("C4")], 0.3, 0.4), 0.9, 0, 0.3)

# --- honours: fanfare, then a hush for the knighting
tho = S("honors")
for dt, ch, d in [(0.6, ["C3", "G3", "C4", "E4"], 0.5), (1.2, ["F3", "C4", "F4", "A4"], 0.3), (1.55, ["G3", "D4", "G4", "B4"], 0.3), (1.9, ["C3", "G3", "C4", "E4", "G4"], 1.8)]:
    M(tho + dt, brass([hz(x) for x in ch], d, 0.5), 1.0, 0, 0.45)
    FX(tho + dt, timpani(hz("C2"), 1.2, 0.6), 0.42, 0, 0.3)
M(S("honors", "kneel"), pad([hz(x) for x in ["C3", "G3", "E4"]], 3.4, 0.24, attack=1.0, release=1.0), 1.0, 0, 0.6)
for i, tb, b in bars(S("honors", "kneel"), S("honors", "sir") - 0.1, 96, 4):
    chord(tb, ["E4", "G4", "C5"], b * 3.6, 0.22, 0.55, spread=0.04)
ts_ = S("honors", "sir")
for dt, ch, d in [(0.0, ["G3", "D4", "G4", "B4"], 0.35), (0.4, ["C3", "G3", "C4", "E4", "G4"], 2.0)]:
    M(ts_ + dt, brass([hz(x) for x in ch], d, 0.5), 1.0, 0, 0.45)
FX(ts_ + 0.4, timpani(hz("C2"), 1.6, 0.8), 0.45, 0, 0.3)

# --- farewell: quiet piano, then the closing chord on the last card
te = S("end")
for dt, nm, d in [(0.3, "E5", 0.9), (1.2, "G5", 0.9), (2.1, "C6", 1.6), (3.8, "B5", 0.8), (4.6, "A5", 1.0)]:
    mel(te + dt, nm, d, 0.38, 0.9, 0.55)
for dt, bass, ch in [(0.3, "C2", ["G3", "C4", "E4"]), (2.1, "A1", ["A3", "C4", "E4"]), (3.8, "F1", ["F3", "A3", "C4"])]:
    M(te + dt, piano(hz(bass) * 2, 1.8, 0.45), 0.5, -0.3, 0.5)
    chord(te + dt + 0.03, ch, 1.8, 0.22, 0.6, spread=0.05)
tcard = S("end", "card")
chord(tcard, ["C3", "G3", "C4", "E4", "G4"], 3.4, 0.42, 0.75, spread=0.06, wet=0.6)
M(tcard, piano(hz("C2"), 3.4, 0.5), 0.4, -0.3, 0.5)
M(tcard, pad([hz(x) for x in ["C3", "G3", "C4", "E4"]], 2.6, 0.3, attack=0.8, release=1.6), 1.0, 0, 0.6)
for dt, nm in [(0.4, "E6"), (0.7, "G6"), (1.2, "C7")]:
    M(tcard + dt, celesta(hz(nm), 0.4, 1.8), 0.7, 0.2, 0.7)

# ================================================================= sound design
FX(S("title", "ink"), pop_snd(600), 0.18, 0, 0.3)
waves_bed(0.0, 5.6, 0.03)
# birth
waves_bed(S("birth"), nxt("birth") - S("birth"), 0.05)
gull(S("birth") + 1.4, 0.5)
FX(S("birth", "pin"), glide(300, 1200, 0.35), 0.13, 0, 0.2)
FX(S("birth", "pin") + 0.35, glide(900, 300, 0.4), 0.13, 0, 0.2)
for k in range(5):
    FX(S("birth", "baby") + k * 0.12, celesta(hz("C6") * 2 ** (k * 2 / 12), 0.35), 0.35, 0.2, 0.5)
for k in range(8):
    FX(S("birth", "move") + 0.8 + k * 0.22, pop_snd(900 + k * 40) * 0.4, 0.08, -0.3 + k * 0.08, 0.2)
FX(S("birth", "house"), pop_snd(700), 0.16, 0.2, 0.2)
# family pages
for key in ["alec", "mildred", "jose"]:
    FX(S("family", key), pop_snd(760), 0.16, 0, 0.2)
for k in range(10):
    FX(S("family", "alec") + 0.6 + k * 0.4 + rng.random() * 0.1, glide(500 + rng.random() * 400, 900 + rng.random() * 500, 0.06, 0.5), 0.06, 0.3, 0.2)
for k in range(4):
    FX(S("family", "mildred") + 0.6 + k * 0.9, noise_band(0.5, 400, 3000) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))), 0.035, 0.2, 0.4)
FX(S("family", "baby"), pop_snd(1000), 0.16, 0.3, 0.2)
# house
hd = nxt("house") - S("house")
n = int(hd * SR)
FX(S("house"), noise_band(hd, 200, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * tt(n) / 3.0)) * np.clip(tt(n), 0, 1), 0.05, 0, 0.4)
for dt in [0, 0.5]:
    FX(S("house", "owl") + dt, glide(420, 360, 0.4), 0.13, -0.3, 0.5)
FX(S("house", "cellar") - 0.5, glide(220, 180, 0.8, 0.5, "rich"), 0.05, 0, 0.4)
FX(S("house", "eyes"), glide(80, 70, 1.2, 0.5, "rich"), 0.12, 0.4, 0.4)
M(S("house", "jump"), brass([hz("D#3"), hz("A3"), hz("D4")], 0.5, 0.6, attack=0.01), 1.0, 0, 0.4)
for k in range(8):
    FX(S("house", "jump") + 0.45 + k * 0.13, kick(110, 0.08, 40), 0.16, -0.3 + k * 0.05, 0.2)
# school
brawl_snd(S("school", "fight") + 0.4, 2.4)
FX(S("school", "book") + 0.5, pop_snd(1000), 0.18, 0, 0.2)
for k in range(10):
    FX(S("school", "proud") + k * 0.06, celesta(hz("C6") * 2 ** ([0, 2, 4, 7, 9, 12, 14, 16, 19, 24][k] / 12), 0.3, 0.9), 0.45, -0.3 + k * 0.06, 0.5)
for k in range(12):
    FX(S("school", "proud") + 0.4 + k * 0.18, noise_band(0.07, 1500, 6000) * np.exp(-tt(int(0.07 * SR)) / 0.015), 0.07, 0.5, 0.3)
FX(S("school", "wink"), celesta(hz("E7"), 0.5, 0.8), 0.45, 0.3, 0.3)
# oxford
FX(S("oxford", "bubble"), pop_snd(800), 0.16, 0.3, 0.2)
FX(S("oxford", "poof") - 0.1, whoosh(0.5, 800, 8000), 0.18, 0, 0.3)
FX(S("oxford", "poof"), pop_snd(500), 0.22, 0, 0.2)
for k in range(8):
    FX(S("oxford", "poof") + 0.25 + k * 0.07, celesta(hz("D6") * 2 ** ([0, 4, 7, 12, 16, 19, 24, 28][k] / 12), 0.28, 1.0), 0.42, 0.3, 0.5)
# dark
dd = nxt("dark") - S("dark")
n = int(dd * SR)
FX(S("dark"), noise_band(dd, 1500, 9000) * np.clip(tt(n), 0, 1) * np.clip((dd - tt(n)) / 0.6, 0, 1), 0.045, 0, 0.3)
FX(S("dark", "page"), paper(0.4), 0.18, 0.1, 0.2)
FX(S("dark", "blot"), kick(45, 1.2, 20), 0.3, 0, 0.3)
# love
FX(S("love", "ring"), bell(hz("E6"), 0.4, 1.2), 0.28, -0.2, 0.4)
FX(S("love", "meet") + 0.8, bell(hz("G6"), 0.4, 1.2), 0.28, 0.3, 0.4)
FX(S("love", "spark"), glide(200, 2400, 0.35, 0.5, "rich"), 0.07, 0, 0.3)
for k in range(10):
    FX(S("love", "spark") + 0.1 + k * 0.05, celesta(hz("F5") * 2 ** ([0, 2, 4, 5, 7, 9, 11, 12, 14, 16][k] / 12), 0.24, 1.0), 0.42, -0.4 + k * 0.08, 0.5)
FX(S("love", "break"), noise_band(0.3, 3000, 12000) * np.exp(-tt(int(0.3 * SR)) / 0.06), 0.16, 0, 0.3)
for k in range(5):
    FX(S("love", "wed") + k * 0.42, bell(hz(["C5", "G4", "A4", "E4"][k % 4]), 0.45, 2.5), 0.28, -0.3 + (k % 2) * 0.6, 0.6)
# teacher
pw = S("teacher", "split") - S("teacher", "write")
scr = noise_band(pw, 2500, 7000) * np.clip(np.sin(2 * np.pi * 6 * tt(int(pw * SR))), 0, 1) ** 0.6
FX(S("teacher", "write"), scr * np.clip(tt(len(scr)) / 0.2, 0, 1) * np.clip((pw - tt(len(scr))) / 0.3, 0, 1), 0.035, -0.4, 0.1)
for k in range(10):
    FX(S("teacher", "charge") + k * 0.2, kick(140, 0.08, 30), 0.1, 0.3 * np.sin(k), 0.2)
brawl_snd(S("teacher", "clash"), 2.0)
# war
waves_bed(S("war"), 4.8, 0.06)
FX(S("war", "horn"), brass([hz("A1"), hz("A2")], 1.4, 0.6, attack=0.08), 0.55, 0.3, 0.5)
waves_bed(S("war", "chase"), 5.6, 0.07)
for ft in SC["war"]["cues"]["fire"]:
    tf = S("war") + ft
    FX(tf, boom(1.6, 0.9), 0.36, -0.4, 0.3)
    FX(tf + 1.0, noise_band(1.0, 200, 4000) * np.exp(-tt(int(1.0 * SR)) / 0.3), 0.15, 0.3, 0.3)
FX(S("war", "sink"), boom(3.0, 1.0), 0.4, 0.2, 0.4)
rd = nxt("war") - S("war", "ruins")
n = int(rd * SR)
FX(S("war", "ruins"), noise_band(rd, 1500, 9000) * np.clip(tt(n) / 0.5, 0, 1) * np.clip((rd - tt(n)) / 0.5, 0, 1), 0.045, 0, 0.3)
# hard times
for k in range(int(1.9 / 0.11)):
    FX(S("hard", "type") + k * 0.11 + rng.random() * 0.03, noise_band(0.03, 1500, 8000) * np.exp(-tt(int(0.03 * SR)) / 0.006), 0.16, 0.05, 0.1)
FX(S("hard", "crumple"), paper(0.4), 0.26, 0, 0.2)
for bt in SC["hard"]["cues"]["bottles"]:
    FX(S("hard") + bt, pop_snd(1300), 0.13, 0, 0.2)
    FX(S("hard") + bt + 0.05, bell(hz("E7"), 0.35, 0.6), 0.13, rng.uniform(-0.4, 0.4), 0.3)
FX(S("hard", "gasp") - 0.2, glide(90, 60, 2.0, 0.5, "rich"), 0.14, 0.4, 0.4)
M(S("hard", "gasp"), brass([hz("C#3"), hz("G3"), hz("C4")], 0.6, 0.6, attack=0.01), 1.0, 0, 0.4)
FX(S("hard", "attack") - 0.1, glide(300, 1500, 0.5, 0.5), 0.1, 0, 0.3)
brawl_snd(S("hard", "attack") + 0.3, 1.0)
# the burial: spade thuds and a pleased little tune
tbu = S("hard", "bury")
for k in range(8):
    FX(tbu + 0.2 + k * 0.42, kick(90, 0.15, 30), 0.25, 0.2, 0.2)
    FX(tbu + 0.22 + k * 0.42, noise_band(0.15, 300, 3000) * np.exp(-tt(int(0.15 * SR)) / 0.05), 0.1, 0.2, 0.2)
for k, nm in enumerate(["C5", "E5", "G5", "C6", "G5", "C6"]):
    M(tbu + 0.4 + k * 0.4, marimba(hz(nm), 0.5), 0.5, 0.2, 0.35)
# honours
FX(S("honors", "medal"), bell(hz("C6"), 0.5, 2.5), 0.28, 0, 0.5)
for k in range(220):
    FX(S("honors", "clap") + rng.random() * 2.6, noise_band(0.04, 800, 6000) * np.exp(-tt(int(0.04 * SR)) / 0.01), 0.045, rng.uniform(-0.8, 0.8), 0.3)
for key in ["tap1", "tap2"]:
    n = int(1.0 * SR)
    clink = sum(np.sin(2 * np.pi * f * tt(n)) * np.exp(-tt(n) / d) for f, d in [(2600, 0.4), (3900, 0.25), (5300, 0.15)])
    FX(S("honors", key), clink, 0.07, -0.2, 0.4)
for k in range(150):
    FX(S("honors", "sir") + 0.4 + rng.random() * 2.0, noise_band(0.04, 800, 6000) * np.exp(-tt(int(0.04 * SR)) / 0.01), 0.035, rng.uniform(-0.8, 0.8), 0.3)
# farewell
waves_bed(S("end"), S("end", "card") - S("end") + 0.5, 0.055)
gull(S("end") + 1.6, 0.4)


# ================================================================= hall + master
def hall_ir(t60=2.6, pre=0.02):
    n = int(t60 * SR)
    t = tt(n)
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * t / t60)
    ir = signal.lfilter(*signal.butter(1, 7000 / (SR / 2), "low"), ir, axis=1)
    ir[:, : int(pre * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def convolve(x, ir):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


music = music_dry + convolve(music_wet, hall_ir(2.6)) * 0.85
fxmix = fx_dry + convolve(fx_wet, hall_ir(1.4)) * 0.7
mix = music * 0.85 + fxmix * 1.1

mix = signal.lfilter(*signal.butter(2, 38 / (SR / 2), "high"), mix, axis=1)
lows = signal.lfilter(*signal.butter(2, 110 / (SR / 2), "low"), mix, axis=1)
mix = mix - 0.4 * lows
mix = mix + 0.15 * signal.lfilter(*signal.butter(2, [2500 / (SR / 2), 7500 / (SR / 2)], "band"), mix, axis=1)

# slow loudness ride so quiet scenes still carry on a phone speaker
total = int(DUR * SR)
mix = mix[:, :total]
win_n = int(1.5 * SR)
env = np.sqrt(signal.fftconvolve((mix ** 2).mean(axis=0), np.ones(win_n) / win_n, mode="same") + 1e-9)
target = np.sqrt(np.mean(mix ** 2))
ride = np.clip(target / env, 0.6, 2.2) ** 0.5
mix = mix * ride

fade = int(1.0 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
mix[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
rms = np.sqrt(np.mean(mix ** 2))
mix *= 10 ** (-17 / 20) / max(rms, 1e-9)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
peak = np.abs(mix).max()
if peak > 0.93:
    mix *= 0.93 / peak

os.makedirs(os.path.join(ROOT, "output"), exist_ok=True)
out = os.path.join(ROOT, "output", "soundtrack.wav")
pcm = (np.clip(mix.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
raw = np.zeros((pcm.shape[0], 2, 3), dtype=np.uint8)
for c in range(2):
    v = pcm[:, c].astype(np.uint32)
    raw[:, c, 0] = v & 0xFF
    raw[:, c, 1] = (v >> 8) & 0xFF
    raw[:, c, 2] = (v >> 16) & 0xFF
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(raw.tobytes())
print(f"wrote {out}  ({DUR:.1f}s, rms {20 * np.log10(np.sqrt(np.mean(mix ** 2))):.1f} dBFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS)")
