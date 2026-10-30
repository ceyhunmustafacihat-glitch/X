#!/usr/bin/env python3
"""Günün kelimesi videosu için döngüye uygun müzik ve ses efektleri.

Her şey dairesel bir tampona yazılır: video sonundan taşan yankı ve notalar başa sarılır,
böylece Instagram videoyu tekrar başlattığında seste de kesinti olmaz.

    python3 kelime/audio.py [kelime]   -> kelime/out/soundtrack_<kelime>.wav (48 kHz, stereo, 16 bit)

Kelimenin dosyasından (words/<kelime>.js) yalnızca motif okunur: "water" ise su damlası sesi eklenir.
"""
import json
import os
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
with open(os.path.join(HERE, "timeline.js"), encoding="utf-8") as f:
    src = f.read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])
SLUG = sys.argv[1] if len(sys.argv) > 1 else "ab"
with open(os.path.join(HERE, "words", SLUG + ".js"), encoding="utf-8") as f:
    src = f.read()
WORD = json.loads(src[src.index("{"): src.rindex("}") + 1])
T = TL["duration"]
N = int(round(T * SR))
rng = np.random.default_rng(3)

dry = np.zeros((2, N))
wet = np.zeros((2, N))


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0, send=0.35):
    """Mono sinyali t anına (dairesel) yerleştirir."""
    i = int(t * SR) % N
    idx = (np.arange(len(sig)) + i) % N
    l, r = np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41
    for ch, g in ((0, l), (1, r)):
        np.add.at(dry[ch], idx, sig * gain * g * (1 - send))
        np.add.at(wet[ch], idx, sig * gain * g * send)


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def bell(f, dur=3.0, vel=0.5):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for ratio, amp, tau in ((1, 1, 1.4), (2.0, 0.35, 0.7), (3.01, 0.18, 0.4), (4.17, 0.08, 0.25)):
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    att = np.clip(t / 0.004, 0, 1)
    return out * att * vel


def pluck(f, dur=2.5, vel=0.5):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k in range(1, 9):
        out += (k ** -1.3) * np.sin(2 * np.pi * f * k * t + k) * np.exp(-t * (1.2 + 0.9 * k))
    return out * np.clip(t / 0.003, 0, 1) * vel


def noise_burst(dur, f_from, f_to, vel, attack=0.02):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # süpürülen bant geçiren: iki lowpass farkı, kesim frekansı zamanla değişir
    fc = np.geomspace(f_from, f_to, n)
    y = np.empty(n)
    a1 = a2 = 0.0
    for i in range(n):
        c1 = np.exp(-2 * np.pi * fc[i] / SR)
        c2 = np.exp(-2 * np.pi * fc[i] * 0.35 / SR)
        a1 = (1 - c1) * x[i] + c1 * a1
        a2 = (1 - c2) * x[i] + c2 * a2
        y[i] = a1 - a2
    env = np.clip(t / attack, 0, 1) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    return y * env * vel


def drop(vel=0.6):
    t = np.arange(int(0.35 * SR)) / SR
    f = 700 + 1300 * (1 - np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.06) * np.clip(t / 0.002, 0, 1) * vel


def thump(vel=0.6):
    t = np.arange(int(0.6 * SR)) / SR
    f = 55 + 60 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    click = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.012) * 0.6
    return (body + click) * vel


# ---------------------------------------------------------------- pad (dairesel)
# D minör çevresinde dört akor, her biri yumuşak geçişlerle; LFO periyotları süreye tam bölünür.
t = np.arange(N) / SR
chords = [  # (başlangıç, notalar)
    (0.0, [50, 57, 62, 65, 69]),     # Dm(add9 yok) — kapalı kitap
    (4.6, [46, 53, 58, 62, 65]),     # B♭
    (10.8, [43, 50, 55, 58, 62, 69]), # Gm9 rengi
    (15.2, [51, 58, 62, 67, 70]),     # E♭maj7
    (19.5, [45, 52, 57, 61, 64]),    # A — başa (Dm) çözülür
]
pad = np.zeros((2, N))
for ci, (st, notes) in enumerate(chords):
    en = chords[(ci + 1) % len(chords)][0] + (T if ci == len(chords) - 1 else 0)
    fade = 1.2
    tt = (t - st) % T
    length = (en - st) % T or T
    w = np.clip(tt / fade, 0, 1) * np.clip((length + fade - tt) / fade, 0, 1)
    w = np.where(tt < length + fade, w, 0)
    w = np.sin(w * np.pi / 2) ** 2
    for j, m in enumerate(notes):
        f0 = hz(m)
        for side, det in ((0, -0.12), (1, 0.12)):
            ph = 2 * np.pi * (f0 + det) * t + j
            tone = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
            pad[side] += tone * w * (0.9 if m < 50 else 0.55) / len(notes)
breath = 0.75 + 0.25 * np.sin(2 * np.pi * 2 * t / T)
pad *= breath * 0.16
for ch in range(2):
    # dairesel lowpass: iki tur çalıştırıp ikinci turu al
    pad[ch] = lowpass(np.concatenate([pad[ch], pad[ch]]), 1400)[N:]
dry += pad * 0.7
wet += pad * 0.3

# ---------------------------------------------------------------- olaylar
co, cc = TL["coverOpen"], TL["coverClose"]
place(noise_burst(co[1] - co[0] + 0.2, 300, 2500, 0.10), co[0] - 0.05, pan=0.1, send=0.25)
for a, b in TL["leaves"]:
    place(noise_burst(b - a, 1200, 5000, 0.07, attack=0.01), a, pan=-0.2, send=0.2)
# kelime yükselişi: çelesta arpeji
lift = TL["lift"][0]
for k, m in enumerate([74, 77, 81, 86, 89]):
    place(bell(hz(m), 2.6, 0.16), lift - 0.15 + k * 0.11, pan=-0.4 + 0.2 * k, send=0.55)
place(noise_burst(1.1, 800, 9000, 0.05, attack=0.4), lift - 0.2, send=0.6)
# bölümler
s1, s2, s3 = TL["sections"]
place(pluck(hz(69), 2.5, 0.22), s1 + 0.25, pan=-0.2, send=0.45)
place(pluck(hz(74), 2.5, 0.18), s1 + 0.55, pan=0.2, send=0.45)
place(pluck(hz(70), 2.5, 0.22), s2 + 0.05, pan=-0.2, send=0.45)
if WORD.get("motif") == "water":
    place(drop(0.32), s2 + 0.68, pan=0.0, send=0.5)
    place(bell(hz(86), 2.2, 0.07), s2 + 0.72, pan=0.3, send=0.7)
else:
    place(pluck(hz(77), 2.5, 0.15), s2 + 0.35, pan=0.2, send=0.45)
place(pluck(hz(67), 2.5, 0.2), s3 + 0.05, pan=0.2, send=0.45)
place(pluck(hz(74), 2.5, 0.16), s3 + 0.35, pan=-0.2, send=0.45)
# dönüş: inen arpej, sayfalar, kapanış
sink = TL["sink"][0]
for k, m in enumerate([89, 86, 81, 77, 74]):
    place(bell(hz(m), 2.4, 0.13), sink - 0.4 + k * 0.13, pan=0.4 - 0.2 * k, send=0.55)
for a, b in TL["leavesBack"]:
    place(noise_burst(b - a, 1200, 5000, 0.06, attack=0.01), a, pan=0.2, send=0.2)
place(noise_burst(cc[1] - cc[0], 2500, 400, 0.09), cc[0], pan=-0.1, send=0.25)
place(thump(0.32), cc[1] - 0.04, send=0.15)
place(bell(hz(62), 3.5, 0.09), cc[1] + 0.02, send=0.6)

# ---------------------------------------------------------------- dairesel yankı
ir_len = int(2.6 * SR)
ti = np.arange(ir_len) / SR
mix = dry.copy()
for ch in range(2):
    ir = rng.standard_normal(ir_len) * np.exp(-ti / 0.55)
    ir = lowpass(ir, 5000)
    ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    irp = np.zeros(N)
    irp[:ir_len] = ir
    mix[ch] += np.real(np.fft.ifft(np.fft.fft(wet[ch]) * np.fft.fft(irp))) * 0.9

mix -= mix.mean(axis=1, keepdims=True)
rms = np.sqrt(np.mean(mix ** 2))
mix *= 0.11 / rms
peak = np.max(np.abs(mix))
if peak > 0.89:
    mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89

os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
path = os.path.join(HERE, "out", f"soundtrack_{SLUG}.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype("<i2").tobytes())
print("wrote", path, f"{T:.1f}s")
