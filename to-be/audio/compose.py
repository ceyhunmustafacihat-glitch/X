#!/usr/bin/env python3
"""Synthesises the music bed and the sound effects for the "to be" reel.

The sound effects are placed from animation/script.js (the same item times the
animation uses), so every pop, ding, buzz and whoosh lands on its visual.
Nothing is sampled: everything is generated here.

    python3 audio/compose.py            -> output/soundtrack.wav (48 kHz, stereo, 16-bit)
"""
import json
import os
import re
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000

with open(os.path.join(ROOT, "animation", "script.js"), encoding="utf-8") as f:
    src = f.read()
SCRIPT = json.loads(src[src.index("{", src.index("window.SCRIPT")): src.rindex("}") + 1])
DUR = SCRIPT["duration"]
N = int(DUR * SR) + SR * 2

rng = np.random.default_rng(11)
music = np.zeros((2, N))
fx_dry = np.zeros((2, N))
fx_wet = np.zeros((2, N))


def place(bus, t, sig, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    n = min(sig.shape[1], N - i)
    bus[:, i:i + n] += sig[:, :n] * gain


def fx(t, sig, gain=1.0, pan=0.0, wet=0.2):
    place(fx_dry, t, sig, gain * (1 - wet), pan)
    place(fx_wet, t, sig, gain * wet, pan)


def note_hz(name):
    m = re.match(r"([A-G])(#|b)?(-?\d)", name)
    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[m.group(1)]
    acc = {"#": 1, "b": -1, None: 0}[m.group(2)]
    return 440.0 * 2 ** ((12 * (int(m.group(3)) + 1) + base + acc - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def fade_edges(x, a=0.002, r=0.01):
    na, nr = int(a * SR), int(r * SR)
    x[:na] *= np.linspace(0, 1, na)
    x[-nr:] *= np.linspace(1, 0, nr)
    return x


def bandnoise(dur, lo, hi):
    x = rng.standard_normal(int(dur * SR))
    b, a = signal.butter(2, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def sweep_noise(dur, f0, f1, q=2.5, seg=0.01):
    """Noise through a band-pass whose centre glides f0 -> f1 (overlap-add)."""
    n = int(dur * SR)
    hop = int(seg * SR)
    x = rng.standard_normal(n + 4096 + hop * 2)
    out = np.zeros(n + hop * 2)
    win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        fc = f0 * (f1 / f0) ** (i / max(n - 1, 1))
        lo, hi = max(40, fc * (1 - 0.5 / q)), min(SR / 2 - 300, fc * (1 + 0.5 / q))
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band")
        y = signal.lfilter(b, a, x[i:i + 4096 + hop * 2])[4096:]
        out[i:i + hop * 2] += y * win
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


# ---------------------------------------------------------------- sound effects
def sfx_pop(pitch=1.0):
    t = tvec(0.14)
    f = (320 + 700 * np.exp(-t / 0.018)) * pitch
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.045)
    x[:int(0.004 * SR)] += bandnoise(0.004, 2000, 8000) * 0.15
    return fade_edges(x)


def sfx_tick():
    t = tvec(0.06)
    x = (np.sin(2 * np.pi * 2600 * t) * 0.6 + np.sin(2 * np.pi * 4100 * t) * 0.3) * np.exp(-t / 0.012)
    return fade_edges(x)


def sfx_click(pitch=1.0):
    t = tvec(0.09)
    x = (np.sin(2 * np.pi * 1150 * pitch * t) + 0.6 * np.sin(2 * np.pi * 1870 * pitch * t)) * np.exp(-t / 0.018)
    return fade_edges(x * 0.7)


def bell(f, dur=0.9):
    t = tvec(dur)
    x = np.zeros_like(t)
    for ratio, amp, dk in [(1, 1, 1), (2.0, 0.35, 0.55), (3.01, 0.18, 0.35), (4.2, 0.12, 0.25)]:
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (0.32 * dk))
    return fade_edges(x * 0.5)


def sfx_ding():
    out = np.zeros(int(1.0 * SR))
    a, b = bell(note_hz("E6")), bell(note_hz("B6"))
    out[:len(a)] += a
    k = int(0.085 * SR)
    out[k:k + len(b)] += b[:len(out) - k] * 0.9
    return out


def sfx_buzz():
    t = tvec(0.42)
    saw = lambda f: 2 * ((f * t) % 1) - 1
    x = (saw(110) + saw(116.5)) * 0.5
    b, a = signal.butter(2, 1400 / (SR / 2))
    x = signal.lfilter(b, a, x)
    gate = ((t < 0.16) | ((t > 0.21) & (t < 0.40))).astype(float)
    gate = np.convolve(gate, np.ones(200) / 200, mode="same")
    return fade_edges(x * gate * 0.9)


def sfx_whoosh(dur=0.7, f0=250, f1=4000):
    x = sweep_noise(dur, f0, f1)
    t = tvec(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    x = x * env
    # pan sweep left -> right
    p = np.linspace(-0.7, 0.7, len(x))
    return np.vstack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)]) * 1.3


def sfx_swoosh():
    return sfx_whoosh(0.5, 2600, 500)


def sfx_swipe():
    return sfx_whoosh(0.35, 900, 3500) * 0.7


def sfx_impact():
    t = tvec(1.2)
    f = 45 + 90 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    n = bandnoise(1.2, 80, 6000) * np.exp(-t / 0.06) * 0.35
    return fade_edges(np.tanh((x + n) * 1.6))


def sfx_riser(dur=0.6):
    t = tvec(dur)
    x = sweep_noise(dur, 400, 7000) * (t / dur) ** 2
    f = 200 * (8 ** (t / dur))
    x += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2
    return fade_edges(x, r=0.004)


def sfx_chime():
    out = np.zeros(int(1.6 * SR))
    for i, nm in enumerate(["C6", "E6", "G6", "C7"]):
        b = bell(note_hz(nm), 1.2)
        k = int(i * 0.09 * SR)
        out[k:k + len(b)] += b * (0.8 - 0.08 * i)
    return out


def sfx_blip():
    t = tvec(0.1)
    return fade_edges(np.sin(2 * np.pi * 660 * t) * np.exp(-t / 0.03))


# ---------------------------------------------------------------- cue sheet
cues = []   # (time, name)


def cue(t, name):
    cues.append((t, name))


for sc in SCRIPT["scenes"]:
    s0 = sc["start"]
    if sc["kind"] == "intro":
        cue(0.0, "riser")
        cue(0.6, "impact")
        for i in range(3):
            cue(1.5 + i * 0.3, f"pop{i}")
        cue(2.7, "tick")
        cue(3.4, "tick")
        cue(sc["end"] - 0.45, "swipe")
        continue
    cue(s0 + 0.02, "whoosh")
    cue(s0 + sc.get("titleHold", 1.25), "swish")
    for pi, page in enumerate(sc["pages"]):
        if pi > 0:
            cue(s0 + page[0]["at"] - 0.4, "swipe")
        for it in page:
            t = s0 + it["at"]
            ty = it["type"]
            if ty == "chips":
                for i in range(len(it["parts"])):
                    cue(t + i * 0.18, f"click{i}")
            elif ty in ("note", "label", "cols"):
                cue(t, "tick")
            elif ty == "arrow":
                cue(t, "blip")
            elif ty == "big":
                cue(t, "popbig")
            elif ty == "swap":
                cue(t, "pop0")
                cue(t + it["move"], "swoosh")
            elif ty == "cta":
                for i in range(len(it["items"])):
                    cue(t + i * 0.2, f"pop{i}")
                cue(t + 0.7, "chime")
            elif ty == "conj":
                cue(t, "pop0")
                for i in range(len(it["subj"])):
                    cue(t + 0.35 + i * 0.12, "tick")
            else:   # example, qa, contract
                cue(t, "pop1")
                mark = it.get("mark")
                delay = {"qa": 0.3, "contract": 0.5}.get(ty, 0.25)
                if mark == "ok":
                    cue(t + delay, "ding")
                elif mark == "no":
                    cue(t + delay, "buzz")
    if sc is not SCRIPT["scenes"][-1]:
        cue(sc["end"] - 0.45, "swipe")

SFX = {
    "pop0": (lambda: sfx_pop(1.0), 0.55), "pop1": (lambda: sfx_pop(1.12), 0.5), "pop2": (lambda: sfx_pop(1.26), 0.5),
    "popbig": (lambda: sfx_pop(0.8), 0.7),
    "click0": (lambda: sfx_click(1.0), 0.45), "click1": (lambda: sfx_click(1.12), 0.45),
    "click2": (lambda: sfx_click(1.26), 0.45), "click3": (lambda: sfx_click(1.4), 0.45),
    "tick": (sfx_tick, 0.25), "blip": (sfx_blip, 0.3),
    "ding": (sfx_ding, 0.38), "buzz": (sfx_buzz, 0.42),
    "whoosh": (sfx_whoosh, 0.42), "swish": (lambda: sfx_whoosh(0.4, 1500, 5000), 0.18),
    "swoosh": (sfx_swoosh, 0.4), "swipe": (sfx_swipe, 0.28),
    "impact": (sfx_impact, 0.6), "riser": (sfx_riser, 0.4), "chime": (sfx_chime, 0.45),
}
cache = {}
for t, name in cues:
    if name not in cache:
        cache[name] = SFX[name][0]()
    pan = rng.uniform(-0.15, 0.15)
    fx(t, cache[name], SFX[name][1], pan, wet=0.35 if name in ("ding", "chime", "impact") else 0.15)

# ---------------------------------------------------------------- music bed
# Light, bouncy loop at 100 BPM: I - V - vi - IV in C, plucks + pad + soft drums.
BPM = 100
beat = 60 / BPM
bar = beat * 4
M0 = 0.6                     # the beat drops with the "TO BE" impact
CH = [("C3", ["C4", "E4", "G4"]), ("G2", ["B3", "D4", "G4"]), ("A2", ["A3", "C4", "E4"]), ("F2", ["A3", "C4", "F4"])]


def pluck(f, dur=0.35, vel=0.5):
    t = tvec(dur + 0.3)
    x = np.zeros_like(t)
    for k, amp in [(1, 1), (2, 0.45), (3, 0.2), (4, 0.1)]:
        x += amp * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (0.18 / k ** 0.6))
    return fade_edges(x * vel)


def pad(freqs, dur):
    t = tvec(dur + 0.6)
    x = np.zeros_like(t)
    for f in freqs:
        for d in (-0.003, 0, 0.003):
            ph = 2 * np.pi * f * (1 + d) * t
            x += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    env = np.clip(t / 0.5, 0, 1) * np.where(t > dur, np.exp(-(t - dur) / 0.25), 1)
    return x * env / (len(freqs) * 3)


def kick():
    t = tvec(0.35)
    f = 48 + 110 * np.exp(-t / 0.03)
    return fade_edges(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13))


def hat():
    t = tvec(0.05)
    b, a = signal.butter(2, 7000 / (SR / 2), "high")
    return fade_edges(signal.lfilter(b, a, rng.standard_normal(len(t))) * np.exp(-t / 0.012))


def snap():
    t = tvec(0.18)
    return fade_edges(bandnoise(0.18, 1200, 5000) * np.exp(-t / 0.04) * 0.8)


def bass(f, dur):
    t = tvec(dur)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return fade_edges(np.tanh(x * 1.3) * np.exp(-t / 0.6), r=0.03)


K, Hh, Sn = kick(), hat(), snap()
arp_pattern = [0, 1, 2, 1, 0, 2, 1, 2]
n_bars = int((DUR - M0) / bar) + 1
# intro before the drop: a soft pad swell
place(music, 0.0, pad([note_hz(n) for n in CH[0][1]], 0.6), 0.25)
for b_i in range(n_bars):
    tb = M0 + b_i * bar
    if tb >= DUR - 0.5:
        break
    root, triad = CH[b_i % 4]
    last = tb + bar > DUR - 2.5
    place(music, tb, pad([note_hz(n) for n in triad], bar), 0.22)
    place(music, tb, bass(note_hz(root), beat * 1.9), 0.32)
    place(music, tb + beat * 2, bass(note_hz(root), beat * 1.9), 0.26)
    for j in range(8):
        tj = tb + j * beat / 2
        if tj >= DUR - 1.5:
            break
        nm = triad[arp_pattern[j]]
        f = note_hz(nm) * 2
        place(music, tj, pluck(f, vel=0.32 if j % 2 == 0 else 0.24), 1.0, 0.35 if j % 2 else -0.35)
        if not last:
            place(music, tj + beat / 4, hat(), 0.08 + 0.04 * (j % 2), 0.2)
    if not last:
        for j in range(4):
            if j in (0, 2):
                place(music, tb + j * beat, K, 0.45)
            else:
                place(music, tb + j * beat, Sn, 0.13, -0.1)

# final resolving chord
place(music, DUR - 2.4, pad([note_hz(n) for n in ["C4", "E4", "G4", "C5"]], 1.8), 0.28)

# sidechain-ish dip of the music under section whooshes so titles land clearly
duck = np.ones(N)
for t, name in cues:
    if name in ("whoosh", "impact"):
        i = int(t * SR)
        L = int(0.9 * SR)
        seg = 1 - 0.45 * np.sin(np.pi * np.linspace(0, 1, L))
        duck[i:i + L] = np.minimum(duck[i:i + L], seg[:max(0, min(L, N - i))])
music *= duck

# ---------------------------------------------------------------- reverb + master
def reverb(x, rt=1.1):
    n = int(rt * SR)
    t = np.arange(n) / SR
    ir = np.vstack([rng.standard_normal(n), rng.standard_normal(n)]) * np.exp(-t * 6.9 / rt)
    b, a = signal.butter(1, 5000 / (SR / 2))
    ir = signal.lfilter(b, a, ir)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return np.vstack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)])


mix = music * 0.45 + reverb(music) * 0.1 + fx_dry + reverb(fx_wet) * 0.9
# fade in / out
nT = int(DUR * SR)
mix = mix[:, :nT]
fo = int(0.8 * SR)
mix[:, -fo:] *= np.linspace(1, 0, fo) ** 2
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix *= 0.89 / np.abs(mix).max()

out = os.path.join(ROOT, "output", "soundtrack.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {out}  ({DUR:.1f} s, {len(cues)} sound effects)")
