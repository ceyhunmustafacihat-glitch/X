#!/usr/bin/env python3
"""William Golding sample reel: a quiet, literary score.

Additive piano in A minor resolving to C major, the sea under the island scene,
typewriter keys under the typed subtitle and soft swells on each cut.

    python3 golding/audio.py      -> output/golding_audio.wav (48 kHz stereo)
"""
import json
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
with open(os.path.join(ROOT, "golding", "timeline.js"), encoding="utf-8") as f:
    src = f.read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])
DUR = TL["duration"]
N = int(DUR * SR) + SR * 4
rng = np.random.default_rng(5)
dry, wet = np.zeros((2, N)), np.zeros((2, N))


def hz(n):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    p, o = (n[:2], n[2:]) if n[1:2] == "#" else (n[:1], n[1:])
    return 440 * 2 ** ((12 * (int(o) + 1) + names[p] - 69) / 12)


def put(t, sig, gain=1.0, pan=0.0, w=0.4):
    i = int(t * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    n = min(sig.shape[1], N - i)
    dry[:, i:i + n] += sig[:, :n] * gain * (1 - w)
    wet[:, i:i + n] += sig[:, :n] * gain * w


def piano(f, dur, vel=0.5):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR; out = np.zeros(n)
    B = 0.00035 * (f / 220) ** 0.5; T0 = np.clip(3.2 * (220 / f) ** 0.45, 0.6, 7.0)
    for k in range(1, 15):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 15000:
            break
        amp = vel * k ** -1.05 * np.exp(-(k - 1) * (0.24 - 0.1 * vel))
        tau = T0 / (1 + 0.55 * (k - 1))
        e = 0.72 * np.exp(-t / tau) + 0.28 * np.exp(-t / (tau * 4.2))
        ph = rng.random() * 6.28
        out += amp * e * (np.sin(2 * np.pi * fk * t + ph) + 0.6 * np.sin(2 * np.pi * fk * (1.00035 if k % 2 else 0.99965) * t + ph * 1.3)) / 1.6
    off = t > dur
    out[off] *= np.exp(-(t[off] - dur) / 0.35)
    a = int(0.003 * SR); out[:a] *= np.linspace(0, 1, a)
    return out


def note(t, n, dur, vel=0.45, gain=1.0, w=0.45):
    f = hz(n)
    put(t, piano(f, dur, vel), gain, float(np.clip(np.log2(f / 260) * 0.3, -0.5, 0.5)), w)


def noise_band(dur, lo, hi):
    x = rng.standard_normal(int(dur * SR))
    b, a = signal.butter(2, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], "band")
    y = signal.lfilter(b, a, x)
    return y / (np.sqrt(np.mean(y ** 2)) * 3 + 1e-9)


# ---- piano: arpeggiated chords that follow the scenes ----
step = 0.36
chords = [
    (0.25, TL["portrait"][0], "A2", ["E3", "A3", "C4", "E4"]),
    (TL["portrait"][0], TL["cards"][1][0], "F2", ["C3", "F3", "A3", "C4"]),
    (TL["cards"][1][0], TL["book"][0], "C2", ["G2", "C3", "E3", "G3"]),
    (TL["book"][0], TL["book"][0] + 2.4, "A2", ["E3", "A3", "C4", "E4"]),
    (TL["book"][0] + 2.4, TL["house"][0], "E2", ["B2", "E3", "G#3", "B3"]),
    (TL["house"][0], TL["house"][0] + 2.9, "F2", ["C3", "F3", "A3", "C4"]),
    (TL["house"][0] + 2.9, TL["awards"][0], "C2", ["G2", "C3", "E3", "G3"]),
    (TL["awards"][0], TL["awards"][0] + 1.5, "D2", ["A2", "D3", "F3", "C4"]),
    (TL["awards"][0] + 1.5, TL["outro"][0], "G2", ["D3", "G3", "B3", "D4"]),
]
for t0, t1, bass, arp in chords:
    note(t0, bass, t1 - t0 + 0.3, 0.42, 0.7, 0.5)
    k, tt = 0, t0 + 0.02
    while tt < t1 - 0.05:
        seq = arp + arp[-2:0:-1]
        note(tt, seq[k % len(seq)], step * 1.6, 0.26 + 0.04 * (k % 4 == 0), 0.75, 0.5)
        k += 1; tt += step
# a small melody over the second half of each scene
melody = [(TL["portrait"][0] + 1.0, "E5", 1.0), (TL["portrait"][0] + 2.1, "F5", 0.8), (TL["portrait"][0] + 2.9, "E5", 1.2),
          (TL["cards"][1][0] + 0.4, "G5", 1.2), (TL["cards"][1][0] + 1.6, "E5", 1.0),
          (TL["book"][0] + 0.8, "C6", 1.0), (TL["book"][0] + 1.9, "B5", 0.8), (TL["book"][0] + 2.7, "G#5", 1.4),
          (TL["house"][0] + 1.0, "A5", 1.0), (TL["house"][0] + 2.0, "C6", 0.8), (TL["house"][0] + 3.2, "G5", 1.5),
          (TL["awardItems"][0], "D6", 0.6), (TL["awardItems"][1], "F6", 0.6), (TL["awardItems"][2], "G6", 0.9)]
for t0, n, d in melody:
    note(t0, n, d, 0.42, 0.9, 0.45)
# resolution for the end card
for n in ["C2", "C3", "G3", "C4", "E4", "G4", "D5"]:
    note(TL["outro"][0] + 0.05, n, 2.4, 0.4, 0.75, 0.55)
note(TL["outro"][0] + 0.9, "E5", 1.6, 0.36, 0.8, 0.6)
note(TL["outro"][0] + 1.4, "G5", 1.4, 0.32, 0.8, 0.6)

# ---- the sea: rolling surf under the island scene, faint elsewhere ----
sea = np.vstack([noise_band(DUR, 120, 1600), noise_band(DUR, 120, 1600)])
tt = np.arange(sea.shape[1]) / SR
swell = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 5.2) ** 2
level = 0.05 + 0.2 * np.clip((tt - TL["book"][0] + 0.5) / 0.8, 0, 1) * np.clip((TL["book"][1] + 0.6 - tt) / 0.8, 0, 1) \
        + 0.06 * np.clip((tt - TL["outro"][0]) / 1.0, 0, 1)
put(0, sea * swell * level, 1.0, 0, 0.3)

# ---- typewriter keys under the typed subtitle ----
sub = "Sineklerin Tanrısı'nın yazarı"
a, b = TL["subtitleType"]
for i in range(len(sub)):
    if sub[i] == " ":
        continue
    tk = a + (b - a) * (i + 1) / len(sub)
    n = int(0.03 * SR)
    click = noise_band(0.03, 1800, 7000) * np.exp(-np.arange(n) / SR / 0.004) + \
        np.sin(2 * np.pi * 160 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR / 0.008) * 0.6
    put(tk, click, 0.32 * (0.8 + 0.4 * rng.random()), rng.uniform(-0.2, 0.2), 0.15)

# ---- soft swells on each cut ----
for key in ["portrait", "book", "house", "awards", "outro"]:
    t0 = TL[key][0]
    s = noise_band(0.9, 300, 4000)
    e = np.sin(np.linspace(0, np.pi, len(s))) ** 2
    put(t0 - 0.45, s * e, 0.16, 0, 0.6)


# ---- hall, master ----
def hall(t60=2.4):
    n = int(t60 * SR); t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * t / t60)
    b2, a2 = signal.butter(1, 6500 / (SR / 2), "low")
    ir = signal.lfilter(b2, a2, ir, axis=1); ir[:, : int(0.02 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


ir = hall()
mix = dry + np.vstack([signal.fftconvolve(wet[c], ir[c])[:N] for c in range(2)]) * 0.9
b2, a2 = signal.butter(2, 45 / (SR / 2), "high")
mix = signal.lfilter(b2, a2, mix, axis=1)
mix = mix[:, : int(DUR * SR)]
fade = int((TL["fadeOut"][1] - TL["fadeOut"][0] + 0.2) * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.4
mix /= np.abs(mix).max() + 1e-9
out = os.path.join(ROOT, "output", "golding_audio.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    pre = os.path.join(tmp, "pre.wav")
    with wave.open(pre, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix.T, -1, 1) * 32767 * 0.9).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11",
                    "-ar", str(SR), "-c:a", "pcm_s24le", out], check=True)
print("wrote", out)
