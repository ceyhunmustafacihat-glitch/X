#!/usr/bin/env python3
"""Synthesises the score and sound design for the sözlükdeus reel.

Everything is generated from scratch (additive piano, celesta, string pad,
filtered-noise foley) and placed on the same timeline the animation uses
(animation/timeline.js), then mixed through a synthetic hall reverb.

    python3 audio/compose.py            -> output/soundtrack.wav (48 kHz, stereo, 24-bit)
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
N = int(DUR * SR) + SR * 4          # room for the last reverb tail, trimmed later

rng = np.random.default_rng(7)


def bus():
    return np.zeros((2, N))


music_dry, music_wet = bus(), bus()   # piano/pads: send to the hall
fx_dry, fx_wet = bus(), bus()         # foley: mostly dry


def note_hz(name):
    m = re.match(r"([A-G])(#|b)?(-?\d)", name)
    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[m.group(1)]
    acc = {"#": 1, "b": -1, None: 0}[m.group(2)]
    midi = 12 * (int(m.group(3)) + 1) + base + acc
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(busd, busw, t, sig, gain=1.0, pan=0.0, wet=0.3):
    """Add a mono or stereo signal at time t (s) with equal-power pan."""
    i = int(t * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    n = min(sig.shape[1], N - i)
    busd[:, i:i + n] += sig[:, :n] * gain * (1 - wet)
    busw[:, i:i + n] += sig[:, :n] * gain * wet


def env_adsr(n, a, d, s, r_start, r):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - r_start) / max(r, 1e-4), 0, 1)
    return e * np.where(t > r_start, np.exp(-rel * 5), 1)


# ---------------------------------------------------------------- instruments
def piano(f, dur, vel=0.7, bright=1.0):
    """Additive piano: inharmonic partials, two-stage decay, unison detune, hammer noise."""
    tail = 2.5
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035 * (f / 220) ** 0.5
    T0 = np.clip(3.2 * (220 / f) ** 0.45, 0.6, 7.0)
    for k in range(1, 16):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        amp = vel * (k ** -1.05) * np.exp(-(k - 1) * (0.22 - 0.1 * vel * bright))
        tau = T0 / (1 + 0.55 * (k - 1))
        e = 0.72 * np.exp(-t / tau) + 0.28 * np.exp(-t / (tau * 4.2))
        det = 1 + 0.00035 * (1 if k % 2 else -1)
        ph = rng.random() * 2 * np.pi
        out += amp * e * (np.sin(2 * np.pi * fk * t + ph) + 0.6 * np.sin(2 * np.pi * fk * det * t + ph * 1.3)) / 1.6
    # damper after note-off
    off = t > dur
    out[off] *= np.exp(-(t[off] - dur) / 0.35)
    # hammer
    hn = int(0.012 * SR)
    h = rng.standard_normal(hn) * np.exp(-np.arange(hn) / (0.0025 * SR))
    b, a = signal.butter(2, [min(1500 + f, 9000) / (SR / 2), min(6000 + 2 * f, 20000) / (SR / 2)], "band")
    out[:hn] += signal.lfilter(b, a, h) * 0.04 * vel
    a_n = int(0.003 * SR)
    out[:a_n] *= np.linspace(0, 1, a_n)
    return out


def celesta(f, vel=0.5, decay=1.6):
    n = int((decay * 2.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, dk in [(1, 1, 1), (2.0, 0.25, 0.6), (3.0, 0.18, 0.5), (4.07, 0.35, 0.35), (6.2, 0.08, 0.2)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (decay * dk))
    a_n = int(0.002 * SR)
    out[:a_n] *= np.linspace(0, 1, a_n)
    return out * vel * 0.5


def pad(freqs, dur, vel=0.3, attack=1.2, release=1.8, cutoff=1800, voices=3):
    """Warm string pad: detuned band-limited saws shaped by a soft spectral low-pass."""
    n = int((dur + release + 0.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for f in freqs:
        for v in range(voices):
            det = 1 + (v - (voices - 1) / 2) * 0.004
            vib = 1 + 0.0025 * np.sin(2 * np.pi * (4.6 + v * 0.3) * t + v)
            phase = 2 * np.pi * np.cumsum(f * det * vib) / SR
            w = np.zeros(n)
            for k in range(1, 24):
                if k * f > 9000:
                    break
                w += np.sin(k * phase + rng.random() * 6.28) / k * np.exp(-((k * f) / cutoff) ** 2)
            pan = (v - (voices - 1) / 2) * 0.7
            out[0] += w * np.cos((pan + 1) * np.pi / 4)
            out[1] += w * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.5
    e *= np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(freqs) * voices) * 1.4


def noise_band(dur, f_lo, f_hi, order=2):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    b, a = signal.butter(order, [f_lo / (SR / 2), min(f_hi, SR / 2 - 100) / (SR / 2)], "band")
    y = signal.lfilter(b, a, x)
    return y / (np.sqrt(np.mean(y ** 2)) * 3 + 1e-9)


def sweep_noise(dur, f0, f1, q=3.0, seg=0.02):
    """Noise through a band-pass whose centre glides f0 -> f1 (overlap-add)."""
    n = int(dur * SR)
    warm = 2048
    x = rng.standard_normal(n + warm + SR)
    out = np.zeros(n + SR)
    hop = int(seg * SR)
    win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        u = i / max(n - 1, 1)
        fc = f0 * (f1 / f0) ** u
        bw = fc / q
        lo, hi = max(30, fc - bw / 2), min(SR / 2 - 200, fc + bw / 2)
        b, a = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band")
        y = signal.lfilter(b, a, x[i:i + warm + hop * 2])[warm:]
        out[i:i + hop * 2] += y * win
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


# ---------------------------------------------------------------- score
def chord(t, names, dur, vel=0.5, spread=0.0, gain=1.0, wet=0.45, bright=1.0):
    for i, nm in enumerate(names):
        f = note_hz(nm)
        pan = np.clip((np.log2(f / 260)) * 0.35, -0.6, 0.6)
        place(music_dry, music_wet, t + i * spread, piano(f, dur, vel, bright), gain, pan, wet)


def mel(t, nm, dur, vel=0.55, gain=1.0, wet=0.45):
    f = note_hz(nm)
    place(music_dry, music_wet, t, piano(f, dur, vel, 1.15), gain, np.clip(np.log2(f / 260) * 0.3, -0.5, 0.5), wet)


# 1) melancholic, slow, monotonous piano (0 - 8.6 s)
beat = 60 / 66
pattern = ["E4", "A4", "C5", "A4"]
bars = [("A2", ["A3"]), ("F2", ["A3"]), ("A2", ["G3"]), ("F2", ["A3"])]
t = 0.35
bi = 0
while t < TL["postArrive"] - 0.2:
    bass, inner = bars[bi % 4]
    place(music_dry, music_wet, t, piano(note_hz(bass), beat * 3.6, 0.42), 0.5, -0.25, 0.5)
    for j in range(4):
        tj = t + j * beat
        if tj >= TL["postArrive"] - 0.15:
            break
        nm = pattern[j] if bi % 4 != 1 else ["F4", "A4", "C5", "A4"][j]
        mel(tj, nm, beat * 0.95, 0.32 + 0.05 * (j == 0), 1.05, 0.55)
    t += beat * 4
    bi += 1
# cold drone under it
place(music_dry, music_wet, 0.2, pad([note_hz("A2"), note_hz("E3")], 8.4, 0.16, attack=3.0, release=1.5, cutoff=700), 1.0, 0, 0.6)

# 2) the post: thin, mysterious notes (celesta), the piano stops
for tn, nm in [(9.3, "E6"), (9.72, "B5"), (10.15, "F#6"), (10.55, "E6"), (10.95, "A6")]:
    place(music_dry, music_wet, tn, celesta(note_hz(nm), 0.5), 0.8, 0.25, 0.65)
place(music_dry, music_wet, 9.2, pad([note_hz("A2"), note_hz("E3"), note_hz("B3")], 2.6, 0.25, attack=1.4, release=1.2, cutoff=900), 1.0, 0, 0.6)

# 3) curiosity grows (face close-up)
for tn, nm, v in [(11.45, "A3", 0.38), (11.75, "C4", 0.36), (12.05, "E4", 0.38), (12.35, "B4", 0.4), (12.75, "F3", 0.38),
                  (13.0, "A3", 0.36), (13.25, "C4", 0.38)]:
    mel(tn, nm, 1.4, v, 0.85, 0.55)
place(music_dry, music_wet, 11.4, pad([note_hz("A2"), note_hz("C4"), note_hz("E4")], 2.2, 0.22, attack=1.5, release=1.0, cutoff=1300), 1.0, 0, 0.6)
for tn, nm in [(11.6, "B5"), (12.5, "E6")]:
    place(music_dry, music_wet, tn, celesta(note_hz(nm), 0.35), 0.7, -0.2, 0.7)

# 4) letters take flight: harp-like rising arpeggios, strings opening
prog = [(13.3, ["F2", "C3"], ["F4", "A4", "C5", "G5", "A5"]),
        (14.25, ["G2", "D3"], ["G4", "B4", "D5", "A5", "B5"]),
        (15.2, ["A2", "E3"], ["A4", "C5", "E5", "B5", "C6"]),
        (16.15, ["C3", "G3"], ["E4", "G4", "C5", "G5", "E6"])]
for tc, bass, arp in prog:
    for b in bass:
        place(music_dry, music_wet, tc, piano(note_hz(b), 1.4, 0.45), 0.55, -0.3, 0.5)
    for k, nm in enumerate(arp):
        place(music_dry, music_wet, tc + k * 0.11, celesta(note_hz(nm), 0.32, 1.3), 0.8, 0.4 - k * 0.15, 0.6)
        mel(tc + k * 0.11 + 0.02, nm, 0.6, 0.22, 0.6, 0.55)
place(music_dry, music_wet, 13.3, pad([note_hz(x) for x in ["F3", "A3", "C4", "E4"]], 1.0, 0.26, attack=0.8, release=0.6, cutoff=1500), 1.0, 0, 0.55)
place(music_dry, music_wet, 14.25, pad([note_hz(x) for x in ["G3", "B3", "D4"]], 0.95, 0.28, attack=0.4, release=0.6, cutoff=1700), 1.0, 0, 0.55)
place(music_dry, music_wet, 15.2, pad([note_hz(x) for x in ["A3", "C4", "E4"]], 0.95, 0.3, attack=0.4, release=0.6, cutoff=1900), 1.0, 0, 0.55)
place(music_dry, music_wet, 16.15, pad([note_hz(x) for x in ["G3", "C4", "E4"]], 1.0, 0.32, attack=0.4, release=0.8, cutoff=2100), 1.0, 0, 0.55)

# 5) the mind lights up: pulse + crescendo into the burst
p_beat = 0.25
tp = 16.95
k = 0
while tp < TL["burst"] - 0.12:
    v = 0.18 + 0.32 * (tp - 16.95) / (TL["burst"] - 16.95)
    nm = ["C4", "C5", "G4", "C5"][k % 4] if tp < 18.2 else ["E4", "E5", "C5", "G5"][k % 4]
    mel(tp, nm, 0.22, v, 0.8, 0.45)
    tp += p_beat
    k += 1
place(music_dry, music_wet, 17.0, pad([note_hz(x) for x in ["C3", "F3", "A3", "C4", "E4"]], 2.45, 0.38, attack=2.2, release=0.3, cutoff=2600), 1.0, 0, 0.5)

# 6) hopeful, strong: the room fills with light
t_end = TL["logo"][0] + 0.3
bar = (t_end - 0.3 - TL["burst"]) / 6
hope = [("C2", ["C3", "G3", "C4", "E4", "G4"]), ("B1", ["G3", "B3", "D4", "G4"]), ("A1", ["A3", "C4", "E4", "G4"]),
        ("F1", ["F3", "A3", "C4", "E4"]), ("E2", ["G3", "C4", "E4"]), ("F2", ["A3", "C4", "F4", "G4"])]
melody = [
    (0.0, "E5", 0.8), (0.8, "G5", 0.4), (1.2, "C6", 0.8),             # C
    (1.6, "B5", 0.4), (2.0, "G5", 0.4), (2.4, "D5", 0.8),             # G/B
    (3.2, "C5", 0.4), (3.6, "E5", 0.4), (4.0, "A5", 0.8),             # Am
    (4.8, "G5", 0.4), (5.2, "F5", 0.4), (5.6, "E5", 0.4), (6.0, "C5", 0.4),  # F
    (6.4, "D5", 0.4), (6.8, "E5", 0.4), (7.2, "G5", 0.8),             # C/E
    (8.0, "A5", 0.6), (8.6, "G5", 0.6),                               # F
]
t0 = TL["burst"]
for i, (bass, ch) in enumerate(hope):
    tc = t0 + i * bar
    place(music_dry, music_wet, tc, piano(note_hz(bass), bar * 1.05, 0.55), 0.35, -0.3, 0.45)
    place(music_dry, music_wet, tc, piano(note_hz(bass) * 2, bar * 1.05, 0.55), 0.75, -0.2, 0.45)
    chord(tc + 0.02, ch, bar * 0.98, 0.34, spread=0.03, gain=0.8)
    # gentle eighth-note motion in the middle register
    for j in range(4):
        mel(tc + j * bar / 4 + bar / 8, ch[(j + 1) % len(ch)], bar / 4, 0.2, 0.55, 0.5)
    place(music_dry, music_wet, tc, pad([note_hz(x) for x in ch], bar, 0.34, attack=0.25, release=0.9, cutoff=2600), 1.0, 0, 0.5)
ks = bar / 1.6
for off, nm, d in melody:
    mel(t0 + off * ks, nm, d * 1.1 * ks, 0.62, 1.0, 0.45)
# celesta echoes of the melody
for off, nm, d in melody[::3]:
    place(music_dry, music_wet, t0 + off * ks + 0.02, celesta(note_hz(nm) * 2, 0.25, 1.2), 0.6, 0.35, 0.65)

# 7) suspension before the end card, then resolution
t_sus = t0 + len(hope) * bar          # ~29.05
chord(t_sus - 0.25, ["G2", "D3", "G3", "C4", "D4"], 0.6, 0.38, spread=0.02, gain=0.8)
place(music_dry, music_wet, t_sus - 0.25, pad([note_hz(x) for x in ["G3", "C4", "D4"]], 0.55, 0.3, attack=0.2, release=0.5), 1.0, 0, 0.5)
tf = t_end
chord(tf, ["C3", "G3", "C4", "E4", "G4", "D5"], 2.6, 0.5, spread=0.04, gain=0.72, wet=0.55)
place(music_dry, music_wet, tf, piano(note_hz("C2"), 2.6, 0.5), 0.35, -0.3, 0.5)
place(music_dry, music_wet, tf, pad([note_hz(x) for x in ["C3", "G3", "C4", "E4", "G4"]], 2.4, 0.36, attack=0.6, release=2.0, cutoff=2200), 1.0, 0, 0.6)
for tn, nm in [(TL["logoText"], "E6"), (TL["logoText"] + 0.18, "G6"), (TL["slogan"], "C7"), (TL["slogan"] + 0.35, "G6")]:
    place(music_dry, music_wet, tn, celesta(note_hz(nm), 0.4, 1.8), 0.7, 0.2, 0.7)

# ---------------------------------------------------------------- sound design
def fx(t, sig, gain, pan=0.0, wet=0.15):
    place(fx_dry, fx_wet, t, sig, gain, pan, wet)


def swipe(dur=0.18, f0=1800, f1=4200):
    s = sweep_noise(dur, f0, f1, q=2.2)
    e = np.sin(np.linspace(0, np.pi, len(s))) ** 1.5
    return s * e


def tick(freq=2600, dur=0.02):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.004) + noise_band(dur, 2000, 9000) * np.exp(-tt / 0.002) * 0.4


# room tone
place(fx_dry, fx_wet, 0, noise_band(9.0, 60, 400) * np.clip(np.linspace(0, 6, int(9 * SR)), 0, 1) * np.clip(np.linspace(6, 0, int(9 * SR)), 0, 1) * 0.02, 1, 0, 0.1)
# racing clock
tc, rate = 0.25, 3.0
while tc < 5.6:
    fx(tc, tick(3200 if int(tc * rate) % 2 else 2800), 0.06 * min(1, tc / 1.5), -0.5, 0.2)
    rate = 3.0 + tc * 1.6
    tc += 1 / rate
# scrolling flicks
for tf_ in TL["flicksRoom"]:
    fx(tf_, swipe(0.16), 0.18, 0.15)
    fx(tf_ + 0.01, tick(4200, 0.012), 0.04, 0.15)
for i, tf_ in enumerate(TL["flicksFeed"]):
    fx(tf_, swipe(0.2 + i * 0.01, 1600 + i * 120, 4800), 0.22, 0.1)
    fx(tf_ + 0.01, tick(4400, 0.012), 0.05, 0.1)
fx(TL["postArrive"], swipe(0.45, 1400, 3800), 0.26, 0.05)
# push into the phone
s = sweep_noise(0.9, 300, 6000, q=1.5)
fx(4.85, s * np.linspace(0, 1, len(s)) ** 2, 0.22, 0, 0.3)
# the post stops: a soft thud and a glassy ping
n = int(0.4 * SR); tt = np.arange(n) / SR
fx(TL["postStop"], np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / 0.08), 0.35, 0, 0.1)
fx(TL["postStop"] + 0.01, celesta(note_hz("E6"), 0.6, 1.2), 0.25, 0.1, 0.5)
# shimmer into the eye
s = sweep_noise(0.7, 2000, 12000, q=2)
fx(10.85, s * np.linspace(0, 1, len(s)) ** 2, 0.14, 0, 0.5)
# letters: chimes and an airy shimmer bed
for i, tch in enumerate(TL["chimeLetters"]):
    nm = ["A5", "C6", "E6", "G6", "A6", "C7", "E7"][i % 7]
    fx(tch, celesta(note_hz(nm), 0.3, 0.9), 0.35, -0.5 + i * 0.16, 0.6)
air = noise_band(4.2, 5000, 14000)
e = np.sin(np.linspace(0, np.pi, len(air))) ** 2
fx(13.2, air * e, 0.035, 0, 0.5)
for i, ts in enumerate(TL["shapes"]):
    fx(ts + 0.35, celesta(note_hz(["E5", "G5", "B5", "D6"][i]), 0.35, 1.5), 0.3, [-0.4, 0, 0.4, 0.2][i], 0.6)
# streams into his head (converging whoosh)
s = sweep_noise(0.95, 6000, 900, q=2)
fx(16.8, s * np.sin(np.linspace(0, np.pi, len(s))), 0.16, 0, 0.4)
# synaptic sparkles
for k in range(46):
    tk = 17.3 + (k / 46) ** 0.8 * 2.0 + rng.random() * 0.05
    fx(tk, celesta(note_hz("C6") * 2 ** (rng.integers(0, 12) / 12), 0.12, 0.35), 0.25, rng.uniform(-0.7, 0.7), 0.5)
# riser + impact at the burst
s = sweep_noise(1.2, 400, 9000, q=1.4)
fx(TL["burst"] - 1.2, s * np.linspace(0, 1, len(s)) ** 3, 0.3, 0, 0.4)
n = int(2.2 * SR); tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * (52 + 40 * np.exp(-tt / 0.06)) * tt) * np.exp(-tt / 0.38)
fx(TL["burst"], boom, 0.3, 0, 0.25)
bright = noise_band(2.2, 3000, 14000) * np.exp(-tt / 0.6)
fx(TL["burst"], bright, 0.08, 0, 0.7)
# morning birds
for k in range(9):
    tb = 19.9 + k * 0.42 + rng.random() * 0.25
    if tb > 24.5:
        break
    n = int(0.12 * SR); tt = np.arange(n) / SR
    f = 3800 + rng.random() * 1500
    chirp = np.sin(2 * np.pi * np.cumsum(f + 1800 * np.sin(np.pi * tt / 0.12)) / SR) * np.sin(np.pi * tt / 0.12) ** 2
    fx(tb, chirp, 0.035, 0.7, 0.5)
# phone set down, chair rolls, notebook opens
n = int(0.12 * SR); tt = np.arange(n) / SR
fx(TL["phoneDown"], (noise_band(0.12, 200, 2500) * 0.5 + np.sin(2 * np.pi * 180 * tt)) * np.exp(-tt / 0.02), 0.28, 0.2)
fx(21.0, noise_band(0.35, 80, 600) * np.sin(np.linspace(0, np.pi, int(0.35 * SR))), 0.16, -0.1)


def paper(dur=0.35):
    n = int(dur * SR)
    s = noise_band(dur, 900, 7000)
    s /= np.abs(s).max() + 1e-9
    b, a = signal.butter(1, 30 / (SR / 2), "low")
    am = np.abs(signal.lfilter(b, a, rng.standard_normal(n)))
    am /= am.max() + 1e-9
    e = np.sin(np.linspace(0, np.pi, n)) ** 0.7
    crackle = (rng.random(n) < 0.003) * rng.standard_normal(n) * 1.5
    return (s * (0.35 + 0.65 * am) + crackle) * e


fx(TL["notebookOpen"], paper(0.3), 0.22, 0.25, 0.2)
# pen on paper
wd = TL["writeEnd"] + 0.62 - TL["writeStart"]
scr = noise_band(wd, 2500, 7000)
tt = np.arange(len(scr)) / SR
strokes = np.clip(np.sin(2 * np.pi * 6.5 * tt + 1.4 * np.sin(2 * np.pi * 1.7 * tt)), 0, 1) ** 0.6
fx(TL["writeStart"], scr * strokes * np.clip(tt / 0.1, 0, 1) * np.clip((wd - tt) / 0.15, 0, 1), 0.09, 0.15, 0.1)
# page turns
fx(TL["pageTurn"], paper(0.45), 0.3, 0.2, 0.25)
for pt in TL["readPageTurns"]:
    fx(pt, paper(0.38), 0.18, 0.15, 0.3)
# end card: a soft gust as the light gathers
s = sweep_noise(1.2, 600, 3000, q=1.5)
fx(TL["logo"][0] - 0.2, s * np.sin(np.linspace(0, np.pi, len(s))), 0.08, 0, 0.6)


# ---------------------------------------------------------------- hall reverb + master
def hall_ir(t60=2.8, pre=0.02):
    n = int(t60 * SR)
    tt = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * tt / t60)
    b, a = signal.butter(1, 7000 / (SR / 2), "low")
    ir = signal.lfilter(b, a, ir, axis=1)
    ir[:, : int(pre * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return ir


def convolve(x, ir):
    return np.vstack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


music = music_dry + convolve(music_wet, hall_ir(3.0)) * 0.9
fxmix = fx_dry + convolve(fx_wet, hall_ir(1.6)) * 0.7
mix = music * 0.9 + fxmix

# clean up the low end: high-pass + ~-6 dB low shelf below ~110 Hz
b, a = signal.butter(2, 42 / (SR / 2), "high")
mix = signal.lfilter(b, a, mix, axis=1)
b, a = signal.butter(2, 110 / (SR / 2), "low")
mix = mix - 0.5 * signal.lfilter(b, a, mix, axis=1)
# a little presence for small phone speakers
b, a = signal.butter(2, [2500 / (SR / 2), 7500 / (SR / 2)], "band")
mix = mix + 0.18 * signal.lfilter(b, a, mix, axis=1)
# section balance: lift the quiet opening so it carries on phone speakers
tt = np.arange(mix.shape[1]) / SR
lift = np.interp(tt, [0, 8.8, 9.6, 13.0, 13.8, 28.5, 29.2, 40], [1.45, 1.45, 1.3, 1.3, 1.0, 1.0, 0.85, 0.85])
mix = mix * lift
# trim to duration with a short fade
total = int(DUR * SR)
mix = mix[:, :total]
fade = int(0.8 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
mix[:, : int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
# loudness: about -13 LUFS integrated (close to Instagram's playback level), soft-limit peaks
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
