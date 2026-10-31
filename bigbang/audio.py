#!/usr/bin/env python3
"""Big Bang trial reel: the narration over a synthesized cosmic score.

Trims the recording to the usable take (bigbang/timeline.js "voice"), cleans it lightly,
lays a dark-to-wondrous ambient bed and a few hits under it (ducked under the voice),
then loudness-normalises the mix.

    python3 bigbang/audio.py      -> output/bigbang_audio.wav (48 kHz stereo)
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
with open(os.path.join(ROOT, "bigbang", "timeline.js"), encoding="utf-8") as f:
    src = f.read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])
DUR = TL["duration"]
N = int(DUR * SR) + SR * 3
rng = np.random.default_rng(11)


def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()).mean(axis=1)


# ---------------------------------------------------------------- voice
V = TL["voice"]
with tempfile.TemporaryDirectory() as tmp:
    raw = os.path.join(tmp, "voice.wav")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", os.path.join(ROOT, V["file"]),
                    "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", raw], check=True)
    voice = read_wav(raw)
voice = voice[int(V["start"] * SR): int(V["end"] * SR)]
voice[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
voice[-int(0.06 * SR):] *= np.linspace(1, 0, int(0.06 * SR)) ** 2
b, a = signal.butter(2, 75 / (SR / 2), "high")
voice = signal.lfilter(b, a, voice)
# gentle compression: smoothed level follower, 2.5:1 above the threshold
lvl = np.sqrt(signal.lfilter([0.002], [1, -0.998], voice ** 2) + 1e-12)
thr = np.percentile(lvl[lvl > 1e-3], 60)
gain = np.where(lvl > thr, (lvl / thr) ** (1 / 2.5 - 1), 1.0)
voice = voice * signal.lfilter([0.01], [1, -0.99], gain)
# a little presence
b, a = signal.butter(2, [2800 / (SR / 2), 5500 / (SR / 2)], "band")
voice = voice + 0.25 * signal.lfilter(b, a, voice)
voice /= np.abs(voice).max() + 1e-9
# envelope for ducking the bed
venv = np.sqrt(signal.lfilter([0.004], [1, -0.996], voice ** 2))
venv = venv / (np.percentile(venv, 95) + 1e-9)


# ---------------------------------------------------------------- instruments
def note_hz(n):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    p, o = (n[:2], n[2:]) if n[1:2] == "#" else (n[:1], n[1:])
    return 440 * 2 ** ((12 * (int(o) + 1) + names[p] - 69) / 12)


def pad(freqs, dur, vel=0.3, attack=1.0, release=1.5, cutoff=1500):
    n = int((dur + release + 0.3) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for f in freqs:
        for v in range(3):
            det = 1 + (v - 1) * 0.0045
            ph = 2 * np.pi * np.cumsum(f * det * (1 + 0.002 * np.sin(2 * np.pi * (0.3 + v * 0.17) * t))) / SR
            w = sum(np.sin(k * ph + rng.random() * 6.28) / k * np.exp(-((k * f) / cutoff) ** 2) for k in range(1, 18) if k * f < 9000)
            pan = (v - 1) * 0.7
            out[0] += w * np.cos((pan + 1) * np.pi / 4)
            out[1] += w * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.5 * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(freqs) * 3) * 1.4


def bell(f, vel=0.4, decay=1.8):
    n = int(decay * 2.5 * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (decay * d)) for r, a, d in
            [(1, 1, 1), (2, 0.3, 0.6), (3.01, 0.15, 0.4), (4.1, 0.25, 0.3)])
    s[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return s * vel * 0.5


def noise_band(dur, lo, hi):
    x = rng.standard_normal(int(dur * SR))
    b, a = signal.butter(2, [lo / (SR / 2), min(hi, SR / 2 - 200) / (SR / 2)], "band")
    y = signal.lfilter(b, a, x)
    return y / (np.sqrt(np.mean(y ** 2)) * 3 + 1e-9)


def sweep(dur, f0, f1, q=2.0, seg=0.02):
    n = int(dur * SR); hop = int(seg * SR); warm = 2048
    x = rng.standard_normal(n + warm + SR); out = np.zeros(n + SR); win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        fc = f0 * (f1 / f0) ** (i / max(n - 1, 1)); bw = fc / q
        b, a = signal.butter(2, [max(30, fc - bw / 2) / (SR / 2), min(SR / 2 - 200, fc + bw / 2) / (SR / 2)], "band")
        out[i:i + hop * 2] += signal.lfilter(b, a, x[i:i + warm + hop * 2])[warm:] * win
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def boom(dur=2.0, f_hi=90, f_lo=38, decay=0.55):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(f_lo + (f_hi - f_lo) * np.exp(-t / 0.08)) / SR) * np.exp(-t / decay)


bed_dry, bed_wet = np.zeros((2, N)), np.zeros((2, N))


def put(t, sig, gain=1.0, pan=0.0, wet=0.4):
    i = int(t * SR)
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.vstack([sig * l * 1.41, sig * r * 1.41])
    n = min(sig.shape[1], N - i)
    bed_dry[:, i:i + n] += sig[:, :n] * gain * (1 - wet)
    bed_wet[:, i:i + n] += sig[:, :n] * gain * wet


R0, R1 = TL["rewind"]
BURST = TL["burst"]
# deep space: a dark drone
put(0.0, pad([note_hz("D2"), note_hz("A2"), note_hz("F3")], BURST - 0.4, 0.34, attack=2.5, release=0.6, cutoff=650), 1.0, 0, 0.6)
air = noise_band(BURST, 4000, 12000)
put(0.0, air * np.clip(np.arange(len(air)) / SR / 2, 0, 1) * 0.06, 1.0, 0, 0.7)
put(0.45, bell(note_hz("A5"), 0.25, 2.2), 0.6, 0.3, 0.8)
put(1.35, bell(note_hz("D6"), 0.2, 2.2), 0.6, -0.3, 0.8)
# rewinding time: a long reversed swell pulling into one point
s = sweep(R1 - R0, 200, 7000, q=1.6)
put(R0, s * np.linspace(0, 1, len(s)) ** 2.2, 0.32, 0, 0.5)
t_ = np.arange(int((R1 - R0) * SR)) / SR
gl = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (-2.0 * t_ / (R1 - R0))) / SR) * (t_ / (R1 - R0)) * 0.5
put(R0, gl, 0.22, 0, 0.6)
put(R1 - 0.02, boom(1.4, 70, 40, 0.35), 0.5, 0, 0.3)
put(R1, bell(note_hz("D5"), 0.35, 2.5), 0.7, 0, 0.7)
# the point hangs in the dark: a slow heartbeat and a high, uneasy tone
for tb in (6.55, 7.3, 8.05, 8.8):
    put(tb, boom(0.8, 60, 42, 0.18), 0.45, 0, 0.2)
tt = np.arange(int((BURST - 6.4) * SR)) / SR
hi = np.sin(2 * np.pi * note_hz("A5") * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * tt)) * np.clip(tt / 0.8, 0, 1)
put(6.4, hi * 0.05, 1.0, 0.2, 0.7)
# approaching it: a riser into the burst
rise = sweep(BURST - 8.0, 300, 9000, q=1.4)
put(8.0, rise * np.linspace(0, 1, len(rise)) ** 3, 0.42, 0, 0.4)
tt = np.arange(int((BURST - 8.0) * SR)) / SR
fr = note_hz("D4") * 2 ** (2 * (tt / tt[-1]) ** 2)
put(8.0, np.sin(2 * np.pi * np.cumsum(fr) / SR) * (tt / tt[-1]) ** 2 * 0.3, 0.6, 0, 0.5)
# the burst
put(BURST, boom(2.6, 110, 34, 0.9), 0.95, 0, 0.25)
crash = noise_band(3.0, 2500, 15000) * np.exp(-np.arange(int(3.0 * SR)) / SR / 0.9)
put(BURST, crash, 0.3, 0, 0.7)
put(BURST, pad([note_hz(x) for x in ["D2", "A2", "D3", "F#3", "A3", "D4"]], 1.2, 0.5, attack=0.05, release=2.5, cutoff=2400), 1.0, 0, 0.6)
# wonder: the history of the universe unfolds
prog = [(BURST + 1.0, ["D3", "F#3", "A3", "C#4"]), (BURST + 2.3, ["B2", "D3", "F#3", "A3"]),
        (BURST + 3.6, ["G2", "B2", "D3", "F#3"]), (BURST + 4.9, ["A2", "C#3", "E3", "A3"])]
for tc, ch in prog:
    put(tc, pad([note_hz(x) for x in ch], 1.35, 0.3, attack=0.5, release=1.2, cutoff=1800), 1.0, 0, 0.6)
for tw, nm in zip(TL["walls"], ["F#6", "A6"]):
    put(tw, bell(note_hz(nm), 0.45, 2.0), 0.8, 0.2, 0.7)
put(TL["focusCMB"][0], pad([note_hz("A4"), note_hz("E5")], 1.0, 0.18, attack=0.4, release=1.0, cutoff=3000), 1.0, -0.2, 0.7)
# the theoretical limit: physics frays — granular glitches and a tritone shimmer
gl0 = TL["focusPlanck"][0]
for k in range(34):
    tk = gl0 + 0.05 + k * 0.03 + rng.random() * 0.02
    n = int(0.012 * SR)
    put(tk, noise_band(0.012, 3000, 12000) * np.exp(-np.arange(n) / SR / 0.003), 0.18, rng.uniform(-0.8, 0.8), 0.3)
put(gl0 + 0.1, bell(note_hz("G#5"), 0.2, 1.4) + bell(note_hz("D6"), 0.2, 1.4), 0.6, 0, 0.7)
# outro: an open, unresolved question
put(TL["outro"][0], pad([note_hz(x) for x in ["D3", "A3", "E4", "A4"]], DUR - TL["outro"][0], 0.34, attack=0.8, release=1.5, cutoff=2200), 1.0, 0, 0.6)
for tn, nm in [(TL["outro"][0] + 0.4, "A5"), (TL["outro"][0] + 0.75, "D6"), (TL["finalTitle"], "E6"), (TL["finalTitle"] + 0.45, "A6")]:
    put(tn, bell(note_hz(nm), 0.35, 2.2), 0.7, 0.25, 0.75)


# ---------------------------------------------------------------- mix
def hall(t60=2.6):
    n = int(t60 * SR); tt = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * tt / t60)
    b, a = signal.butter(1, 6500 / (SR / 2), "low")
    ir = signal.lfilter(b, a, ir, axis=1); ir[:, : int(0.02 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


ir = hall()
bed = bed_dry + np.vstack([signal.fftconvolve(bed_wet[c], ir[c])[:N] for c in range(2)]) * 0.9
b, a = signal.butter(2, 40 / (SR / 2), "high")
bed = signal.lfilter(b, a, bed, axis=1)
bed /= np.sqrt(np.mean(bed ** 2)) + 1e-9
# duck the bed under the voice
duck = np.ones(N)
duck[: len(venv)] = 1 - 0.55 * np.clip(venv, 0, 1)
duck = signal.lfilter([0.002], [1, -0.998], duck)  # smooth the gain changes
vbus = np.zeros((2, N))
vroom = np.vstack([signal.fftconvolve(voice, ir[c] * 0.05)[: len(voice)] for c in range(2)])
vbus[:, : len(voice)] = voice + vroom
vbus /= np.sqrt(np.mean(vbus[:, : len(voice)] ** 2)) + 1e-9
mix = vbus * 1.0 + bed * duck * 0.3
total = int(DUR * SR)
mix = mix[:, :total]
fade = int(0.65 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
mix /= np.abs(mix).max() + 1e-9
os.makedirs(os.path.join(ROOT, "output"), exist_ok=True)
out = os.path.join(ROOT, "output", "bigbang_audio.wav")
with tempfile.TemporaryDirectory() as tmp:
    pre = os.path.join(tmp, "pre.wav")
    with wave.open(pre, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix.T, -1, 1) * 32767 * 0.9).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", str(SR), "-c:a", "pcm_s24le", out], check=True)
print("wrote", out)
