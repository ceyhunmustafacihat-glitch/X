#!/usr/bin/env python3
"""Synthesises the score and sound design for the sözlükdeus "Uyanış" reel.

Everything is generated from scratch (additive piano, celesta, string pad,
filtered-noise foley) and placed on the same timeline the animation uses
(uyanis/timeline.js), then mixed through a synthetic hall reverb.

    python3 uyanis/compose.py           -> output/uyanis_soundtrack.wav (48 kHz, stereo, 24-bit)
"""
import json
import os
import re
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000

with open(os.path.join(ROOT, "uyanis", "timeline.js"), encoding="utf-8") as f:
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
        place(music_dry, music_wet, t + i * spread, piano(note_hz(nm), dur, vel, bright), gain, (i / max(1, len(names) - 1) - 0.5) * 0.5, wet)


def fx(t, sig, gain, pan=0.0, wet=0.15):
    place(fx_dry, fx_wet, t, sig, gain, pan, wet)


def choir(freqs, dur, vel=0.3, attack=1.5, release=2.0):
    """Soft 'ah' voices: detuned pad through two vowel formants."""
    p = pad(freqs, dur, vel, attack, release, cutoff=2600, voices=4)
    out = np.zeros_like(p)
    for fc, bw, g in [(700, 260, 1.0), (1150, 300, 0.6), (2600, 500, 0.2)]:
        b, a = signal.butter(2, [(fc - bw / 2) / (SR / 2), (fc + bw / 2) / (SR / 2)], "band")
        out += signal.lfilter(b, a, p, axis=1) * g
    return out * 2.2 + p * 0.25


def env_perc(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


# 1) the den: a cold, uneasy drone (D minor with a rubbing E-flat)
place(music_dry, music_wet, 0.0, pad([note_hz("D2"), note_hz("A2"), note_hz("Eb3")], 9.0, 0.32, attack=2.0, release=0.6, cutoff=700), 1.0, 0, 0.5)
low = noise_band(9.5, 30, 120) * 0.5
low *= np.clip(np.arange(len(low)) / SR / 2, 0, 1) * np.clip((9.4 - np.arange(len(low)) / SR) / 0.3, 0, 1)
fx(0, low, 0.5, 0, 0.2)
# slow, heavy heartbeat
for tb in np.arange(0.6, 9.0, 1.15):
    for d, gn in [(0, 1.0), (0.22, 0.6)]:
        n = int(0.25 * SR); tt = np.arange(n) / SR
        fx(tb + d, np.sin(2 * np.pi * (55 - 20 * tt) * tt) * env_perc(n, 0.06), 0.35 * gn, 0, 0.1)
# water drips in the den
for td in [0.8, 2.6, 4.9, 7.3]:
    n = int(0.12 * SR); tt = np.arange(n) / SR
    fx(td, np.sin(2 * np.pi * (1300 + 900 * tt / 0.12) * tt) * env_perc(n, 0.02), 0.06, -0.6, 0.6)
# flies around the bones
n = int(6.2 * SR); tt = np.arange(n) / SR
buzz = signal.sawtooth(2 * np.pi * (210 + 18 * np.sin(2 * np.pi * 3.1 * tt)) * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.37 * tt) ** 2)
b, a = signal.butter(2, [300 / (SR / 2), 2500 / (SR / 2)], "band")
fx(0, signal.lfilter(b, a, buzz) * np.clip(tt / 1.0, 0, 1) * np.clip((6.2 - tt) / 0.4, 0, 1), 0.035, -0.5, 0.2)


# 2) the phone: loud, violent, empty bursts (heard through a tiny speaker)
def phone_spk(x):
    b, a = signal.butter(2, [420 / (SR / 2), 4200 / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def burst(kind, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    if kind == 0:     # punches + crowd
        s = noise_band(dur, 300, 3000) * 0.4
        for k in range(4):
            i = int((0.05 + k * dur / 4) * SR); m = min(int(0.09 * SR), n - i)
            s[i:i + m] += np.sin(2 * np.pi * 140 * tt[:m]) * env_perc(m, 0.02) * 2 + noise_band(m / SR, 800, 5000)[:m] * env_perc(m, 0.01) * 2
    elif kind == 1:   # explosion
        s = noise_band(dur, 60, 2000) * env_perc(n, dur / 3) * 2.5
    elif kind == 2:   # scream
        s = sweep_noise(dur, 900, 1800, q=6) * 1.5 + np.sin(2 * np.pi * (600 + 200 * np.sin(2 * np.pi * 7 * tt)) * tt) * 0.4
    elif kind == 3:   # crash and glass
        s = noise_band(dur, 1500, 9000) * env_perc(n, 0.15) * 2 + noise_band(dur, 80, 600) * env_perc(n, 0.08) * 2
    elif kind == 4:   # crowd roar
        s = noise_band(dur, 400, 2500) * (0.7 + 0.3 * np.sin(2 * np.pi * 5 * tt))
    elif kind == 5:   # rage shouting
        s = sweep_noise(dur, 500, 1100, q=4) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 6 * tt)))
    elif kind == 6:   # siren
        f = np.where(np.sin(2 * np.pi * 2.6 * tt) > 0, 960, 720)
        s = signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.5
    else:             # smashing
        s = noise_band(dur, 200, 6000) * (np.sin(2 * np.pi * 3 * tt) > 0.6) * 2
    fade = np.clip(tt / 0.01, 0, 1) * np.clip((dur - tt) / 0.06, 0, 1)
    return phone_spk(s * fade)


flicks = TL["roomFlicks"] + TL["feedFlicks"]
starts = [0.4] + flicks
ends = flicks + [TL["postArrive"]]
for i, (a0, a1) in enumerate(zip(starts, ends)):
    near = 1.6 if a0 >= TL["pov"][0] - 0.1 else 1.0          # louder once we are inside the phone
    fx(a0, burst((i * 3) % 8, a1 - a0 + 0.02), 0.12 * near, (i % 3 - 1) * 0.2, 0.05)


def swipe(dur=0.18, f0=1800, f1=4200):
    s = sweep_noise(dur, f0, f1, q=2.2)
    return s * np.sin(np.linspace(0, np.pi, len(s))) ** 1.5


for f in flicks:
    fx(f - 0.05, swipe(0.16), 0.05, 0.3, 0.05)
# tension rises with the scrolling
r = sweep_noise(TL["postArrive"] - 6.0, 200, 1400, q=2)
fx(6.0, r * np.linspace(0, 1, len(r)) ** 2, 0.07, 0, 0.3)

# 3) the post: everything stops. a soft knock, then thin, curious notes
n = int(0.3 * SR); tt = np.arange(n) / SR
fx(TL["postStop"] - 0.05, np.sin(2 * np.pi * 180 * tt) * env_perc(n, 0.05) + noise_band(0.3, 200, 1500) * env_perc(n, 0.01) * 0.3, 0.4, 0, 0.3)
for i, (dt, nm) in enumerate([(0.15, "A5"), (0.75, "F5"), (1.35, "D6"), (2.0, "E5"), (2.6, "A5")]):
    place(music_dry, music_wet, TL["postStop"] + dt, celesta(note_hz(nm), 0.5, 1.8), 0.6, (i % 2 - 0.5) * 0.6, 0.6)
place(music_dry, music_wet, TL["postStop"], pad([note_hz("D3"), note_hz("A3"), note_hz("E4")], 4.6, 0.18, attack=1.5, release=1.5, cutoff=1500), 1.0, 0, 0.6)
# tap on the avatar, the profile slides in
def tick(freq=2600, dur=0.02):
    n = int(dur * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.004) + noise_band(dur, 2000, 9000) * np.exp(-tt / 0.002) * 0.4


fx(TL["tap"], tick(1900, 0.03), 0.25, 0, 0.1)
s = sweep_noise(0.4, 800, 3000, q=1.5)
fx(TL["profileIn"][0], s * np.sin(np.linspace(0, np.pi, len(s))), 0.05, 0.3, 0.2)
place(music_dry, music_wet, TL["profileIn"][1], celesta(note_hz("F#5"), 0.6, 2.2), 0.7, 0, 0.6)   # the first major colour

# 4) curiosity: a slow rising piano arpeggio
for i, nm in enumerate(["D3", "A3", "D4", "F#4", "A4", "E5"]):
    place(music_dry, music_wet, TL["face2"][0] + 0.1 + i * 0.33, piano(note_hz(nm), 1.5, 0.42 + i * 0.03), 0.8, (i / 5 - 0.5) * 0.6, 0.5)

# 5) the guide appears: voices, warm strings, bells
place(music_dry, music_wet, TL["wizardIn"][0] - 0.3, choir([note_hz("D3"), note_hz("A3"), note_hz("F#4"), note_hz("D4")], 6.5, 0.5, attack=1.8, release=2.5), 1.0, 0, 0.7)
place(music_dry, music_wet, 14.4, pad([note_hz("D2"), note_hz("A2"), note_hz("D3")], 3.0, 0.3, attack=1.6, release=1.2, cutoff=900), 1.0, 0, 0.5)
s = sweep_noise(2.0, 2000, 8000, q=2)
fx(TL["wizardIn"][0], s * np.sin(np.linspace(0, np.pi, len(s))) ** 2, 0.05, 0.5, 0.7)
# transformation: chord walk D - G - Bm - A - D with harp-like arpeggios
prog = [(16.7, ["D3", "A3", "D4", "F#4"], ["D4", "F#4", "A4", "D5", "F#5", "A5"]),
        (17.9, ["G2", "D3", "G3", "B3"], ["G4", "B4", "D5", "G5", "B5", "D6"]),
        (19.0, ["B2", "F#3", "B3", "D4"], ["B4", "D5", "F#5", "B5", "D6", "F#6"]),
        (20.0, ["A2", "E3", "A3", "C#4"], ["A4", "C#5", "E5", "A5", "C#6", "E6"]),
        (21.0, ["D2", "A2", "D3", "F#3", "A3"], ["D5", "F#5", "A5", "D6"])]
for i, (t0, low_c, arp) in enumerate(prog):
    dur = (prog[i + 1][0] - t0) if i + 1 < len(prog) else 3.0
    place(music_dry, music_wet, t0, pad([note_hz(x) for x in low_c], dur + 0.3, 0.32 + i * 0.05, attack=0.5, release=1.4, cutoff=2400), 1.0, 0, 0.55)
    for j, nm in enumerate(arp):
        place(music_dry, music_wet, t0 + j * dur / len(arp), piano(note_hz(nm), 0.8, 0.35 + 0.05 * i, 1.3), 0.6, (j / len(arp) - 0.5) * 0.9, 0.6)
# sparkles: sword dissolving, bones turning to dust, the blade becoming a quill
rng2 = np.random.default_rng(3)
for t0, t1, cnt in [(TL["sword"][0], TL["sword"][1], 14), (TL["bones"][0], TL["bones"][1], 8), (TL["blade"][0], TL["blade"][1], 10)]:
    for k in range(cnt):
        tk = t0 + (t1 - t0) * rng2.random()
        place(music_dry, music_wet, tk, celesta(note_hz(rng2.choice(["D6", "F#6", "A6", "E6", "B6"])), 0.25, 0.7), 0.4, rng2.uniform(-0.8, 0.8), 0.7)
s = noise_band(1.8, 1500, 7000)
fx(TL["bones"][0], s * np.sin(np.linspace(0, np.pi, len(s))) ** 2 * 0.6, 0.06, -0.5, 0.5)
# the nod: a deep, soft bell
n = int(4 * SR); tt = np.arange(n) / SR
bell = sum(a * np.sin(2 * np.pi * note_hz("D3") * r * tt) * np.exp(-tt / d) for r, a, d in [(1, 1, 2.2), (2.0, 0.4, 1.4), (2.76, 0.3, 0.9), (5.4, 0.15, 0.4)])
place(music_dry, music_wet, TL["nod"], bell, 0.25, 0.3, 0.7)
# he leaves: an upward shimmer
s = sweep_noise(1.8, 1500, 9000, q=2)
fx(TL["wizardOut"][0], s * np.sin(np.linspace(0, np.pi, len(s))) ** 2, 0.06, 0.4, 0.8)
for j, nm in enumerate(["A5", "D6", "F#6", "A6"]):
    place(music_dry, music_wet, TL["wizardOut"][0] + 0.3 + j * 0.3, celesta(note_hz(nm), 0.4, 1.6), 0.5, 0.4, 0.7)

# 6) morning: a warm piano theme in D major
theme = [(0.0, "F#5", 0.6), (0.6, "E5", 0.3), (0.9, "D5", 0.6), (1.5, "A4", 0.9), (2.4, "B4", 0.5), (2.9, "D5", 0.5), (3.4, "E5", 1.2),
         (4.8, "F#5", 0.6), (5.4, "A5", 0.6), (6.0, "G5", 0.5), (6.5, "F#5", 0.5), (7.0, "E5", 1.0)]
T0 = TL["medium"][0] - 0.3
for dt, nm, d in theme:
    place(music_dry, music_wet, T0 + dt, piano(note_hz(nm), d, 0.5), 0.75, 0.15, 0.45)
for dt, names in [(0.0, ["D3", "A3", "F#4"]), (2.4, ["G2", "D3", "B3"]), (4.8, ["D3", "A3", "F#4"]), (6.0, ["A2", "E3", "C#4"])]:
    chord(T0 + dt, names, 2.2, 0.35, 0.05, 0.7, 0.5)
place(music_dry, music_wet, T0, pad([note_hz("D3"), note_hz("A3"), note_hz("F#4")], 7.5, 0.2, attack=1.5, release=1.5, cutoff=1800), 1.0, 0, 0.5)
# the follow tap, a bright little "ding"
fx(TL["follow"], tick(2200, 0.03), 0.3, 0, 0.1)
place(music_dry, music_wet, TL["follow"] + 0.05, celesta(note_hz("A6"), 0.6, 1.8), 0.6, 0, 0.6)
place(music_dry, music_wet, TL["follow"] + 0.2, celesta(note_hz("D7"), 0.45, 1.8), 0.5, 0.2, 0.6)
# final resolution
chord(TL["end"][0] + 0.1, ["D2", "A2", "D3", "F#3", "A3", "D4"], 3.0, 0.5, 0.03, 0.8, 0.55)
place(music_dry, music_wet, TL["end"][0], pad([note_hz("D3"), note_hz("A3"), note_hz("D4"), note_hz("F#4")], 2.4, 0.3, attack=0.6, release=2.0, cutoff=2200), 1.0, 0, 0.6)
for j, nm in enumerate(["D6", "A5", "F#6"]):
    place(music_dry, music_wet, TL["end"][0] + 0.8 + j * 0.45, celesta(note_hz(nm), 0.35, 1.8), 0.5, (j - 1) * 0.5, 0.7)

# morning birds once the window is open
for k in range(14):
    tb = 19.6 + k * 0.85 + rng2.random() * 0.4
    if tb > DUR - 1.2:
        break
    n = int(0.16 * SR); tt = np.arange(n) / SR
    f0 = 3200 + 1200 * rng2.random()
    chirp = np.sin(2 * np.pi * np.cumsum(f0 + 900 * np.sin(2 * np.pi * 18 * tt)) / SR) * np.sin(np.pi * tt / 0.16) ** 2
    fx(tb, chirp, 0.025, -0.7 + 0.3 * rng2.random(), 0.5)

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
lift = np.interp(tt, [0, 6.0, 9.1, 9.3, 14.0, 15.0, 40], [1.2, 1.15, 1.0, 1.3, 1.3, 1.0, 1.0])
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
out = os.path.join(ROOT, "output", "uyanis_soundtrack.wav")
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
