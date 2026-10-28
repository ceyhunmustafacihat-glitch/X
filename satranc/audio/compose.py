#!/usr/bin/env python3
"""Synthesises every sound effect and the soft pad bed for the chess-board reel.

Cues come from the animation itself (anim/scene.js -> buildCues), exported by
render/render.mjs to build/cues.json, so sound and picture share one clock.
The whole mix is built circularly over the video length (cue tails and the
reverb wrap around to t = 0) so the video loops without a click or a gap.

    python3 audio/compose.py   -> output/sfx.wav (48 kHz, stereo, 16-bit)
"""
import json
import os
import re
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
with open(os.path.join(ROOT, "anim", "timeline.js"), encoding="utf-8") as f:
    src = f.read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])
D = TL["duration"]
L = int(D * SR)
rng = np.random.default_rng(11)


def note_hz(name):
    m = re.match(r"([A-G])(#|b)?(-?\d)", name)
    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[m.group(1)]
    acc = {"#": 1, "b": -1, None: 0}[m.group(2)]
    return 440.0 * 2 ** ((12 * (int(m.group(3)) + 1) + base + acc - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, fc):
    """One-pole low-pass; fc may be a scalar or a per-sample array."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def bandnoise(dur, f_lo, f_hi):
    """Noise band between two (possibly time-varying) corner frequencies."""
    n = rng.standard_normal(int(dur * SR))
    return lowpass(n, f_hi) - lowpass(n, f_lo)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


# ---------------------------------------------------------------- voices
def tock(pitch=1.0):
    t = tt(0.18)
    f0 = 820 * pitch
    body = (np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.035)
            + 0.5 * np.sin(2 * np.pi * f0 * 2.31 * t) * np.exp(-t / 0.018)
            + 0.25 * np.sin(2 * np.pi * f0 * 3.9 * t) * np.exp(-t / 0.01))
    click = bandnoise(0.18, 1500, 6000) * np.exp(-t / 0.0025) * 2.5
    return fade(body + click, 0.0005, 0.03)


def click(pitch=1.0):
    t = tt(0.08)
    s = np.sin(2 * np.pi * 2300 * pitch * t) * np.exp(-t / 0.009)
    s += bandnoise(0.08, 2500, 9000) * np.exp(-t / 0.0018) * 2.0
    return fade(s, 0.0003, 0.02)


def tick(pitch=1.0):
    t = tt(0.06)
    s = np.sin(2 * np.pi * 1650 * pitch * t) * np.exp(-t / 0.012)
    return fade(s, 0.0003, 0.02)


def pop(pitch=1.0):
    t = tt(0.16)
    f = (380 + 700 * np.exp(-t / 0.018)) * pitch
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05)
    s += bandnoise(0.16, 800, 4000) * np.exp(-t / 0.003) * 0.8
    return fade(s, 0.0005, 0.03)


def blip():
    t = tt(0.09)
    return fade(np.sin(2 * np.pi * 1180 * t) * np.exp(-t / 0.03), 0.003, 0.03)


def bell(f, dur=1.6, bright=1.0):
    t = tt(dur)
    s = np.zeros_like(t)
    for ratio, amp, tau in [(1, 1, 0.9), (2.0, 0.45 * bright, 0.45), (2.76, 0.3 * bright, 0.3), (5.4, 0.12 * bright, 0.12), (8.93, 0.05 * bright, 0.06)]:
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return fade(s, 0.001, 0.1)


def ding(note="A5"):
    return bell(note_hz(note))


def pluck(note="D5"):
    f = note_hz(note)
    t = tt(0.7)
    s = sum((1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (0.35 / k)) for k in range(1, 6))
    return fade(s, 0.002, 0.1)


def swish(dur=0.35, rev=0):
    t = tt(dur)
    x = t / dur
    if rev:
        x = 1 - x
    fc = 600 + 5500 * x ** 1.5
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return fade(bandnoise(dur, fc * 0.4, fc) * env * 2.2, 0.002, 0.02)


def whoosh(dur=0.8, rev=0):
    t = tt(dur)
    x = np.clip(t / dur, 0, 1)
    shape = x if not rev else 1 - x
    fc = 250 + 4200 * shape ** 2
    env = (np.sin(np.pi * x) ** 1.6)
    env *= (0.4 + 0.6 * (x if not rev else 1 - x))
    s = bandnoise(dur, fc * 0.35, fc) * env * 3.0
    return np.vstack([s, np.roll(s, 90)])  # tiny inter-channel delay = width


def sweep(dur=1.0):
    t = tt(dur)
    x = t / dur
    f = 300 * 2 ** (3 * x)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    s = (bandnoise(dur, 1200 * x + 200, 2500 * x + 600) * 1.6 + tone) * np.sin(np.pi * x) ** 2
    return fade(s, 0.005, 0.05)


def hit():
    t = tt(1.4)
    f = 48 + 90 * np.exp(-t / 0.05)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    knock = bandnoise(1.4, 200, 3000) * np.exp(-t / 0.02) * 1.2
    sparkle = 0.25 * bell(note_hz("D6"), 1.4, 0.6)
    return fade(boom * 1.2 + knock + sparkle, 0.0008, 0.2)


def thud():
    t = tt(0.6)
    f = 60 + 70 * np.exp(-t / 0.04)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    return fade(boom + bandnoise(0.6, 150, 1500) * np.exp(-t / 0.012) * 0.8, 0.0008, 0.1)


def arp(notes, gap, gain=1.0):
    out = np.zeros(int((gap * len(notes) + 1.6) * SR))
    for i, n in enumerate(notes):
        b = bell(note_hz(n), 1.5)
        i0 = int(i * gap * SR)
        out[i0:i0 + len(b)] += b * gain
    return out


def shimmer():
    return arp(["A5", "D6", "E6", "F#6", "A6", "B6", "D7", "E7"], 0.055, 0.45)


def success():
    return arp(["D5", "F#5", "A5", "D6"], 0.075)


def alert():
    return arp(["A5", "E6"], 0.14, 0.9)


def royal(key="D"):
    chord = {"D": ["D3", "A3", "D4", "F#4", "A4"], "G": ["G2", "D3", "G3", "B3", "D4"]}[key]
    t = tt(1.5)
    env = np.minimum(t / 0.06, 1) * np.exp(-t / 0.55)
    s = np.zeros_like(t)
    for n in chord:
        f = note_hz(n)
        for k in range(1, 9):
            s += (1 / k) * np.sin(2 * np.pi * f * k * t * 1.0007) * np.exp(-t * k * 0.6)
    return fade(lowpass(s * env, 2600) * 0.6, 0.002, 0.2)


VOICES = dict(tock=tock, click=click, tick=tick, pop=pop, blip=blip, ding=ding, pluck=pluck, swish=swish,
              whoosh=whoosh, sweep=sweep, hit=hit, thud=thud, shimmer=shimmer, success=success, alert=alert, royal=royal)
GAIN = dict(tock=0.5, click=0.35, tick=0.3, pop=0.45, blip=0.35, ding=0.32, pluck=0.35, swish=0.3, whoosh=0.38,
            sweep=0.3, hit=0.75, thud=0.6, shimmer=0.3, success=0.4, alert=0.4, royal=0.4)


# ---------------------------------------------------------------- mix (circular over the loop)
def place(bus, t, sig, gain, pan):
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    idx = (int(round(t * SR)) + np.arange(sig.shape[1])) % L
    np.add.at(bus[0], idx, sig[0] * gain)
    np.add.at(bus[1], idx, sig[1] * gain)


def pad_bed():
    """Soft chord pad. Every frequency is a whole multiple of 1/D Hz and the chord
    crossfades wrap around, so the bed is exactly periodic over the video."""
    t = np.arange(L) / SR
    chords = [["D3", "A3", "C#4", "F#4"], ["B2", "F#3", "A3", "D4"], ["G2", "D3", "F#3", "B3"], ["A2", "E3", "A3", "C#4"]] * 2 \
        + [["D3", "A3", "C#4", "F#4"], ["G2", "D3", "F#3", "B3"]]
    n = len(chords)
    seglen = D / n
    out = np.zeros((2, L))
    phase = (t / seglen) % n
    for ci, chord in enumerate(chords):
        d = (phase - ci + n / 2) % n - n / 2       # signed distance to this chord's start, in segments
        env = np.clip((d + 0.15) / 0.3, 0, 1) * np.clip((1.15 - d) / 0.3, 0, 1)
        env = np.sin(env * np.pi / 2) ** 2
        idx = np.nonzero(env)[0]
        if not len(idx):
            continue
        ti, ei = t[idx], env[idx]
        for note in chord:
            f = note_hz(note)
            for ch, det in ((0, 0.9985), (1, 1.0015)):
                v = np.zeros(len(idx))
                for k in range(1, 5):
                    fk = round(f * k * det * D) / D
                    v += (1 / k ** 1.8) * np.sin(2 * np.pi * fk * ti + ci + k)
                out[ch, idx] += v * ei
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * round(D / 5) / D * t)
    return out * lfo * 0.018


def reverb(x, secs=1.6, mix=0.22):
    n = int(secs * SR)
    tt_ = np.arange(n) / SR
    out = np.empty_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-tt_ / (secs / 6.9))
        ir = lowpass(ir, 5200)
        ir /= np.sqrt(np.sum(ir ** 2))
        h = np.zeros(L)
        h[:n] = ir
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch]) * np.fft.rfft(h), L)   # circular: tails wrap to the start
    return out * mix


def main():
    with open(os.path.join(ROOT, "build", "cues.json"), encoding="utf-8") as f:
        cues = json.load(f)
    fx = np.zeros((2, L))
    cache = {}
    for c in cues:
        kind = c["type"]
        args = {k: v for k, v in c.items() if k in ("pitch", "note", "dur", "rev", "key")}
        key = (kind, tuple(sorted(args.items())))
        if key not in cache or kind in ("swish", "whoosh", "tock", "click", "pop"):
            cache[key] = VOICES[kind](**args)
        pan = float(rng.uniform(-0.25, 0.25))
        place(fx, c["t"], cache[key], c.get("gain", 1.0) * GAIN[kind], pan)
    pad = pad_bed()
    mixed = fx + pad + reverb(fx * 0.9 + pad * 1.5)
    # bring the mix up to about -19.5 dBFS RMS, soft-limit the peaks below -3 dBFS
    mixed *= 10 ** (-19.5 / 20) / np.sqrt(np.mean(mixed ** 2))
    ceil = 10 ** (-3 / 20)
    mixed = np.tanh(mixed / ceil) * ceil
    os.makedirs(os.path.join(ROOT, "output"), exist_ok=True)
    path = os.path.join(ROOT, "output", "sfx.wav")
    pcm = (np.clip(mixed.T, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    rms = 20 * np.log10(np.sqrt(np.mean(mixed ** 2)) + 1e-9)
    print(f"wrote {path}  ({len(cues)} cues, {D}s, RMS {rms:.1f} dBFS)")


if __name__ == "__main__":
    main()
