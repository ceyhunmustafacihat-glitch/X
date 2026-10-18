#!/usr/bin/env python3
"""Original score, sound design and final mix for "Bir Kelimeden Gökdelene".

Everything is synthesised here (no samples): additive piano, bowed-string
ensembles, a low-string ostinato, brass and choir pads, membranes and sub
hits, wind, paper foley, city ambience, all placed on timeline.py and run
through a synthetic hall. The narration (voice.py) is mixed on top with the
music and effects ducked under it.

    python3 score.py   -> output/muzik.wav, output/efektler.wav, output/mix.wav
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy import signal

import config
import timeline as T

SR = 48000
DUR = config.DURATION
N = int((DUR + 4) * SR)
rng = np.random.default_rng(1756396)
ADIR = os.path.join(config.BUILD, "audio")


class Bus:
    def __init__(self):
        self.dry = np.zeros((2, N))
        self.wet = np.zeros((2, N))

    def add(self, t, sig, gain=1.0, pan=0.0, wet=0.3):
        i = int(t * SR)
        if i >= N or gain == 0:
            return
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.vstack([sig * l * 1.414, sig * r * 1.414])
        if i < 0:
            sig, i = sig[:, -i:], 0
        n = min(sig.shape[1], N - i)
        self.dry[:, i:i + n] += sig[:, :n] * gain * (1 - wet)
        self.wet[:, i:i + n] += sig[:, :n] * gain * wet


music, sfx = Bus(), Bus()


def hz(name):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    acc = 1 if "#" in name else (-1 if "b" in name[1:] else 0)
    octv = int(name[-1])
    return 440.0 * 2 ** ((12 * (octv + 1) + names[name[0]] + acc - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low", output="sos"), x)


def highpass(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc / (SR / 2), "high", output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band", output="sos"), x)


def norm(x):
    return x / (np.sqrt(np.mean(x ** 2)) * 4 + 1e-12)


def env(n, a, r, curve=2.0):
    """Attack / release envelope over n samples (seconds)."""
    t = np.arange(n) / SR
    d = n / SR
    e = np.minimum(np.clip(t / max(a, 1e-4), 0, 1), np.clip((d - t) / max(r, 1e-4), 0, 1))
    return e ** curve


def sweep_noise(dur, f0, f1, q=2.5, seg=0.02):
    n = int(dur * SR)
    x = rng.standard_normal(n + SR)
    out = np.zeros(n + SR)
    hop = int(seg * SR)
    win = np.hanning(hop * 2)
    for i in range(0, n, hop):
        u = i / max(n - 1, 1)
        fc = f0 * (f1 / f0) ** u
        lo, hi = max(30, fc * (1 - 0.5 / q)), min(SR / 2 - 200, fc * (1 + 0.5 / q))
        sos = signal.butter(2, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
        y = signal.sosfilt(sos, x[max(0, i - 2048):i + hop * 2])[-hop * 2:]
        out[i:i + hop * 2] += y * win
    return norm(out[:n])


# ------------------------------------------------------------------ instruments
def piano(f, dur, vel=0.6, bright=1.0):
    tail = 3.0
    n = int((dur + tail) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035 * (f / 220) ** 0.5
    T0 = np.clip(3.4 * (220 / f) ** 0.45, 0.6, 7.5)
    for k in range(1, 18):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 15000:
            break
        amp = vel * (k ** -1.1) * np.exp(-(k - 1) * (0.26 - 0.1 * vel * bright))
        tau = T0 / (1 + 0.55 * (k - 1))
        e = 0.7 * np.exp(-t / tau) + 0.3 * np.exp(-t / (tau * 4.5))
        ph = rng.random() * 6.283
        out += amp * e * (np.sin(2 * np.pi * fk * t + ph) + 0.6 * np.sin(2 * np.pi * fk * 1.0004 * t + ph * 1.3)) / 1.6
    off = t > dur
    out[off] *= np.exp(-(t[off] - dur) / 0.45)
    hn = int(0.01 * SR)
    out[:hn] += bandpass(rng.standard_normal(hn), 1200 + f, min(6000 + 2 * f, 16000)) * np.exp(-np.arange(hn) / (0.002 * SR)) * 0.05 * vel
    out[:int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))
    return out


def saw_partials(f, t, vib_rate=5.0, vib_depth=0.003, cutoff=4000.0, phase_seed=None):
    r = np.random.default_rng(phase_seed)
    vib = 1 + vib_depth * np.sin(2 * np.pi * vib_rate * t + r.random() * 6.28) * np.clip(t / 0.6, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    w = np.zeros_like(t)
    for k in range(1, 40):
        if k * f > min(cutoff * 3, 16000):
            break
        w += np.sin(k * ph + r.random() * 6.28) / k * np.exp(-((k * f) / cutoff) ** 2)
    return w


def strings(notes, dur, vel=0.3, attack=1.2, release=2.0, cutoff=2400, voices=4, bow=0.03):
    """Bowed ensemble: detuned partial-bank saws per player, bow noise, slow swell."""
    n = int((dur + release + 0.2) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for f in notes:
        for v in range(voices):
            det = 1 + (v - (voices - 1) / 2) * 0.0035
            w = saw_partials(f * det, t, 4.6 + 0.4 * v, 0.0035, cutoff, int(f * 10 + v))
            w += bow * bandpass(rng.standard_normal(n), f * 2, f * 6) * 3
            pan = (v - (voices - 1) / 2) / max(voices - 1, 1) * 1.2
            out[0] += w * np.cos((pan + 1) * np.pi / 4)
            out[1] += w * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.6
    e *= np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(notes) * voices) * 1.6


def spiccato(f, vel=0.5, length=0.16, cutoff=1400):
    n = int((length + 0.25) * SR)
    t = np.arange(n) / SR
    w = saw_partials(f, t, 5, 0.0, cutoff, int(f))
    w += 0.5 * saw_partials(f * 1.004, t, 5, 0.0, cutoff, int(f) + 1)
    e = np.clip(t / 0.008, 0, 1) * np.exp(-np.clip(t - 0.02, 0, None) / (length * 0.45))
    return w * e * vel * 0.5


def brass(notes, dur, vel=0.3, attack=0.35, release=1.0):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for i, f in enumerate(notes):
        for v in range(3):
            # brightness opens with the swell
            cut = 600 + 2600 * np.clip(t / (attack * 2.5), 0, 1)
            w = np.zeros(n)
            vib = 1 + 0.002 * np.sin(2 * np.pi * 5.2 * t + v)
            ph = 2 * np.pi * np.cumsum(f * (1 + (v - 1) * 0.003) * vib) / SR
            for k in range(1, 30):
                if k * f > 9000:
                    break
                w += np.sin(k * ph) / k * np.exp(-((k * f) / cut) ** 2)
            pan = ((i / max(len(notes) - 1, 1)) - 0.5) * 0.8 + (v - 1) * 0.15
            out[0] += w * np.cos((pan + 1) * np.pi / 4)
            out[1] += w * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.3 * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(notes) * 3) * 1.6


def choir(notes, dur, vel=0.25, attack=1.5, release=2.5):
    """'Ah' voices: saw sources through three formant band-passes."""
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for i, f in enumerate(notes):
        for v in range(4):
            src = saw_partials(f * (1 + (v - 1.5) * 0.004), t, 5.3 + v * 0.2, 0.004, 5000, int(f * 3) + v)
            y = (bandpass(src, 600, 850) * 1.0 + bandpass(src, 1000, 1250) * 0.6 + bandpass(src, 2400, 2800) * 0.25)
            pan = (v - 1.5) / 1.5 * 0.7
            out[0] += y * np.cos((pan + 1) * np.pi / 4)
            out[1] += y * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / attack, 0, 1) ** 1.5 * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    return out * e * vel / (len(notes) * 4) * 4


def membrane(f0=58, vel=0.8, decay=1.1, click=0.4):
    """Large drum (taiko / timpani-like): pitch-dropping body, skin noise, mallet click."""
    n = int((decay * 3) * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t / 0.03))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    body += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.58) / SR) * np.exp(-t / (decay * 0.5))
    skin = lowpass(rng.standard_normal(n), 900) * np.exp(-t / 0.08) * 0.8
    clk = bandpass(rng.standard_normal(n), 1500, 5000) * np.exp(-t / 0.006) * click
    return (body + skin + clk) * vel


def sub_boom(f0=70, f1=34, vel=1.0, decay=1.8):
    n = int(decay * 3 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay) * np.clip(t / 0.005, 0, 1) * vel


def cymbal_swell(dur, vel=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = highpass(rng.standard_normal(n), 3500) + 0.3 * bandpass(rng.standard_normal(n), 6000, 12000)
    return x * (t / dur) ** 3 * vel * 0.3


def celesta(f, vel=0.4, decay=2.0):
    n = int(decay * 2.5 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, dk in [(1, 1, 1), (2.0, 0.22, 0.6), (3.0, 0.15, 0.5), (4.07, 0.3, 0.35), (6.2, 0.06, 0.2)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / (decay * dk))
    out[:int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return out * vel * 0.5


# ------------------------------------------------------------------ foley
def crackle(dur, density, lo=1800, hi=9000, seed=None):
    """Paper fibre crackle: sparse random impulses through a band-pass."""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n)
    k = r.poisson(density * dur)
    idx = r.integers(0, n, k)
    x[idx] = r.standard_normal(k) * r.random(k) ** 2
    return bandpass(x, lo, hi) * 6


def rustle(dur, density=300, air=0.5, seed=None, lo=900, hi=7000):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    a = norm(bandpass(r.standard_normal(n), lo, hi))
    # irregular amplitude: crumpled movement
    m = np.abs(lowpass(r.standard_normal(n), 14)) * 6
    return (crackle(dur, density, seed=seed) + air * a * m) * env(n, 0.03, 0.08, 1.0)


def page_flip(dur, seed):
    n = int(dur * SR)
    w = sweep_noise(dur, 500, 2600, 1.6) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    c = crackle(dur, 400, seed=seed) * (np.exp(-np.arange(n) / (0.08 * SR)) + 0.3)
    slap = np.zeros(n)
    k = int(0.9 * n)
    m = n - k
    slap[k:] = lowpass(rng.standard_normal(m), 2200) * np.exp(-np.arange(m) / (0.012 * SR)) * 1.4
    return w * 0.7 + c * 0.6 + slap


def creak(dur, f_rate=(28, 60), res=(320, 900)):
    """Stick-slip friction of an old binding."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rate = f_rate[0] + (f_rate[1] - f_rate[0]) * (0.5 + 0.5 * np.sin(2 * np.pi * t / dur * 1.3))
    rate *= 1 + 0.25 * lowpass(rng.standard_normal(n), 6) * 8
    ph = np.cumsum(rate) / SR
    imp = np.diff(np.floor(ph), prepend=0) * (0.6 + 0.4 * rng.random(n))
    y = bandpass(imp, res[0] * 0.8, res[0] * 1.25, 2) * 1.0 + bandpass(imp, res[1] * 0.85, res[1] * 1.2, 2) * 0.5
    return norm(y) * env(n, 0.15, 0.25, 1.5)


def thump(vel=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (85 + 40 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.09)
    noise = lowpass(rng.standard_normal(n), 900) * np.exp(-t / 0.03) * 0.5
    return (body + noise) * vel


def pat(vel=0.5):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return (lowpass(rng.standard_normal(n), 1800) * np.exp(-t / 0.012) + 0.4 * np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02)) * vel


def wind(dur, lo=150, hi=900, seed=None):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    x = r.standard_normal(n)
    a = bandpass(x, lo, hi)
    b = bandpass(r.standard_normal(n), lo * 2.5, hi * 2.5)
    m1 = 0.55 + 0.45 * np.sin(2 * np.pi * np.cumsum(0.11 + 0.05 * np.sin(np.arange(n) / SR * 0.7)) / SR)
    m2 = np.clip(0.5 + lowpass(r.standard_normal(n), 0.6) * 25, 0, 1.5)
    return norm(a * m1 + 0.4 * b * m2)


def city_ambience(dur, seed=4):
    n = int(dur * SR)
    r = np.random.default_rng(seed)
    rumble = norm(lowpass(r.standard_normal(n), 220, 3)) * 0.8
    out = rumble.copy()
    # passing cars: band-limited swells
    for _ in range(int(dur * 0.9)):
        L = r.uniform(2.5, 5.0)
        k = int(r.uniform(0, max(dur - L, 0.1)) * SR)
        m = int(L * SR)
        sw = sweep_noise(L, r.uniform(500, 900), r.uniform(250, 400), 1.2)
        out[k:k + m] += sw[:max(0, min(m, n - k))] * np.sin(np.linspace(0, np.pi, m))[:max(0, min(m, n - k))] ** 2 * r.uniform(0.1, 0.3)
    return out


# ------------------------------------------------------------------ reverb
def hall_ir(rt60=2.8, pre=0.025, seed=9):
    n = int(rt60 * 1.4 * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    out = np.zeros((2, n))
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-6.9 * t / rt60)
        x = lowpass(x, 7000) * 0.6 + lowpass(x, 2500) * 0.4      # darker tail
        out[c] = x
    p = int(pre * SR)
    out = np.concatenate([np.zeros((2, p)), out], axis=1)
    for d, g in [(0.011, 0.5), (0.017, 0.4), (0.023, 0.33), (0.031, 0.25)]:   # early reflections
        k = int(d * SR)
        out[0, k] += g
        out[1, k + int(0.002 * SR)] += g
    return out / np.sqrt(np.sum(out ** 2) / 2)


def reverb(bus, ir):
    wet = np.vstack([signal.fftconvolve(bus.wet[c], ir[c])[:N] for c in range(2)])
    return bus.dry + wet * 0.55


# ------------------------------------------------------------------ the score
def compose_music():
    m = music
    # 0-5: almost nothing - a breath of low strings and an airy harmonic
    m.add(0.8, strings([hz("D2"), hz("A2")], 4.6, 0.12, attack=2.5, release=2.0, cutoff=500, voices=3), 1.0, 0, 0.6)
    m.add(2.2, strings([hz("A5")], 2.6, 0.025, attack=1.6, release=1.6, cutoff=3000, voices=2), 1.0, 0.3, 0.8)

    # 5-13: piano and low strings - the dictionary opens
    chords = [(5.0, ["D3", "A3", "F4"]), (7.0, ["Bb2", "F3", "D4"]), (9.0, ["F2", "C3", "A3"]), (11.0, ["C3", "G3", "E4"])]
    for t0, ns in chords:
        m.add(t0, strings([hz(x) for x in ns], 2.2, 0.16, attack=0.9, release=1.6, cutoff=1300, voices=3), 1.0, 0, 0.5)
        m.add(t0 + 0.02, piano(hz(ns[0]) / 2, 1.9, 0.38), 0.55, -0.2, 0.45)
    motif = [(5.15, "D5"), (5.85, "F5"), (6.55, "A5"), (7.25, "G5"), (8.0, "F5"), (8.7, "D5"),
             (9.35, "C5"), (10.05, "F5"), (10.75, "A5"), (11.45, "G5"), (12.15, "E5")]
    for tn, nm in motif:
        m.add(tn, piano(hz(nm), 0.9, 0.3, 1.1), 0.62, 0.15, 0.55)

    # 13-19: pulse and deep bass - the sheets multiply
    beat = 60 / 96
    prog = [(13.0, "D2", ["D3", "A3", "F4"]), (14.25, "Bb1", ["Bb2", "F3", "D4"]), (15.5, "G1", ["G2", "D3", "Bb3"]),
            (16.75, "A1", ["A2", "E3", "C#4"]), (18.0, "D2", ["D3", "A3", "F4"])]
    for i, (t0, bass, ns) in enumerate(prog):
        m.add(t0, strings([hz(x) for x in ns], 1.3, 0.14 + 0.02 * i, attack=0.6, release=1.2, cutoff=1600, voices=3), 1.0, 0, 0.5)
        m.add(t0, sub_boom(hz(bass) * 2, hz(bass), 0.25 + 0.05 * i, 1.0), 1.0, 0, 0.1)
    t = 14.4
    k = 0
    while t < T.LIB_END:
        u = (t - 14.4) / (T.LIB_END - 14.4)
        root = "D2" if t < 16.75 else ("A1" if t < 18.0 else "D2")
        if t > 19.0:
            root = ["D2", "D2", "Bb1", "C2"][int((t - 19.0) / (beat * 2)) % 4]
        nm = root if k % 2 == 0 else root[:-1] + str(int(root[-1]) + 1)
        m.add(t, spiccato(hz(nm), 0.18 + 0.4 * u, 0.14, 900 + 1800 * u), 1.0, (-0.3 if k % 2 else 0.3), 0.3)
        step = beat / 2 if t < 21.0 else beat / 4
        t += step
        k += 1
    # 19-23.6: rising lines and controlled percussion
    rise = ["D4", "E4", "F4", "G4", "A4", "Bb4", "C5", "D5"]
    for i, nm in enumerate(rise):
        m.add(19.0 + i * 0.55, strings([hz(nm), hz(nm) / 2], 0.6, 0.12 + 0.02 * i, attack=0.2, release=0.5, cutoff=2600, voices=3), 1.0, 0, 0.45)
    for tt in [19.0, 20.25, 21.25, 22.0, 22.5, 22.85, 23.1, 23.3, 23.45]:
        m.add(tt, membrane(55, 0.35 + 0.25 * (tt - 19) / 4.5, 0.9), 1.0, 0, 0.35)
    m.add(21.6, cymbal_swell(2.0, 0.45), 1.0, 0, 0.5)
    m.add(T.LIB_END - 0.02, sub_boom(80, 32, 0.9, 1.6), 1.0, 0, 0.15)
    m.add(T.LIB_END - 0.02, membrane(48, 0.9, 1.4, 0.5), 1.0, 0, 0.35)

    # 23.6-27.75: the tower - orchestra gathers, percussion on the beat
    seq = [(23.6, ["D3", "A3", "D4", "F4"]), (24.85, ["Bb2", "F3", "Bb3", "D4"]), (26.1, ["C3", "G3", "C4", "E4"]),
           (27.0, ["A2", "E3", "A3", "C#4"])]
    for i, (t0, ns) in enumerate(seq):
        d = (seq[i + 1][0] if i + 1 < len(seq) else T.TOWER_DONE) - t0
        m.add(t0, brass([hz(x) for x in ns], d, 0.16 + 0.05 * i, attack=0.4, release=0.4), 1.0, 0, 0.4)
        m.add(t0, strings([hz(x) * 2 for x in ns], d, 0.14 + 0.03 * i, attack=0.35, release=0.4, cutoff=3200, voices=4), 1.0, 0, 0.45)
    t = 23.6 + beat
    while t < T.TOWER_DONE - 0.05:
        u = (t - 23.6) / (T.TOWER_DONE - 23.6)
        m.add(t, membrane(52, 0.4 + 0.4 * u, 0.8), 1.0, 0, 0.35)
        m.add(t + beat / 2, membrane(70, 0.15 + 0.2 * u, 0.5, 0.6), 1.0, 0.2, 0.35)
        t += beat
    t = 23.6
    while t < T.TOWER_DONE:
        u = (t - 23.6) / (T.TOWER_DONE - 23.6)
        m.add(t, spiccato(hz("D3"), 0.25 + 0.35 * u, 0.1, 2400), 1.0, 0.35, 0.3)
        m.add(t + beat / 8, spiccato(hz("D2"), 0.25 + 0.35 * u, 0.1, 1800), 1.0, -0.35, 0.3)
        t += beat / 4
    m.add(T.TOWER_DONE - 2.2, cymbal_swell(2.2, 0.6), 1.0, 0, 0.5)
    # climax hit, then a breath of silence
    m.add(T.TOWER_DONE, membrane(46, 1.2, 1.6, 0.6), 1.0, 0, 0.3)
    m.add(T.TOWER_DONE, sub_boom(75, 30, 1.1, 2.0), 1.0, 0, 0.1)
    m.add(T.TOWER_DONE, brass([hz("Bb2"), hz("F3"), hz("Bb3"), hz("D4")], 0.25, 0.55, attack=0.02, release=0.25), 1.0, 0, 0.35)

    # 28.35-35.8: the reveal - a wide, clean peak
    peak = [(28.35, 2.7, ["Bb2", "F3", "Bb3", "D4", "F4"]), (31.05, 2.0, ["A2", "F3", "A3", "C4", "F4"]),
            (33.05, 1.6, ["G2", "D3", "G3", "Bb3", "D4"]), (34.65, 1.3, ["C3", "G3", "C4", "D4", "G4"])]
    for t0, d, ns in peak:
        f = [hz(x) for x in ns]
        m.add(t0, strings(f, d, 0.3, attack=0.8 if t0 < 29 else 0.5, release=1.6, cutoff=3400, voices=5), 1.0, 0, 0.55)
        m.add(t0, choir(f[1:], d, 0.2, attack=1.0, release=1.8), 1.0, 0, 0.6)
        m.add(t0, brass(f[:3], d, 0.15, attack=0.9, release=1.2), 1.0, 0, 0.5)
        m.add(t0, piano(f[0] / 2, d, 0.4), 0.5, -0.2, 0.5)
    m.add(28.35, membrane(44, 0.6, 2.2, 0.2), 1.0, 0, 0.45)
    for tn, nm in [(29.0, "F5"), (29.7, "Bb5"), (31.2, "A5"), (32.4, "F5"), (33.3, "G5"), (34.8, "D5")]:
        m.add(tn, piano(hz(nm), 1.0, 0.26, 1.1), 0.6, 0.2, 0.6)

    # 35.86-42: the summit, the last sheet, the name - a calm close in D major
    m.add(35.86, strings([hz("Bb2"), hz("F3"), hz("D4")], 3.6, 0.16, attack=1.0, release=1.5, cutoff=2000, voices=4), 1.0, 0, 0.6)
    for tn, nm in [(36.2, "D5"), (36.9, "F5"), (37.6, "A5"), (38.4, "G5"), (39.1, "E5")]:
        m.add(tn, piano(hz(nm), 1.2, 0.24, 1.05), 0.6, 0.15, 0.6)
    m.add(T.BLACK - 0.6, cymbal_swell(0.62, 0.25), 1.0, 0, 0.5)
    fin = ["D2", "A2", "D3", "F#3", "A3", "D4"]
    m.add(T.LOGO_IN, strings([hz(x) for x in fin], DUR - T.LOGO_IN - 1.2, 0.2, attack=0.7, release=1.8, cutoff=2200, voices=4), 1.0, 0, 0.6)
    for i, nm in enumerate(["D3", "A3", "F#4", "A4", "D5"]):
        m.add(T.LOGO_IN + i * 0.06, piano(hz(nm), 1.8, 0.32, 1.0), 0.6, (i - 2) * 0.12, 0.6)
    for tn, nm in [(T.LOGO_IN + 0.02, "A6"), (T.LOGO_IN + 0.5, "F#6"), (T.LOGO_IN + 1.0, "D6")]:
        m.add(tn, celesta(hz(nm), 0.22), 1.0, 0.25, 0.7)


def compose_sfx():
    s = sfx
    # library: wind first, then old paper
    s.add(0.0, wind(T.LIB_END, 120, 700, 1) * np.clip(np.linspace(-0.2, 1.4, int(T.LIB_END * SR)), 0, 1), 0.05, -0.4, 0.4)
    s.add(0.0, norm(lowpass(rng.standard_normal(int(T.LIB_END * SR)), 300)) * 0.4, 0.04, 0, 0.5)       # room tone
    s.add(0.65, rustle(1.3, 220, 0.4, 2), 0.16, 0.1, 0.25)
    s.add(3.2, rustle(0.6, 120, 0.25, 3), 0.06, 0.0, 0.3)
    # cover: creak while it swings, thump when it lands
    co, cd = T.COVER_OPEN
    s.add(co - 0.05, creak(cd * 0.9), 0.2, -0.15, 0.25)
    s.add(co, rustle(cd, 350, 0.5, 4), 0.12, -0.1, 0.25)
    s.add(co + cd - 0.06, thump(0.55), 1.0, -0.2, 0.25)
    for k, (t0, d) in enumerate(zip(T.PAGE_STARTS, T.PAGE_DURS)):
        s.add(t0, page_flip(d, 10 + k), 0.24, -0.25 + k * 0.06, 0.25)
    # counter: fine ticks, quick then slowing to the real value
    c0, c1 = T.COUNTER
    tt_ = np.linspace(c0, c1, 2000)
    vals = np.array([T.counter_value(x) for x in tt_])
    ticks = [tt_[np.searchsorted(vals, v)] for v in np.linspace(20000, 1_756_396, 40)]
    for tt in ticks:
        n = int(0.01 * SR)
        click = bandpass(rng.standard_normal(n), 3000, 9000) * np.exp(-np.arange(n) / (0.0012 * SR))
        s.add(tt, click, 0.035, 0.0, 0.2)
    s.add(c1, celesta(hz("A6"), 0.12, 1.2), 1.0, 0, 0.6)
    # the first sheet lifts
    s.add(T.SHEET_LIFT - 0.1, sweep_noise(1.2, 300, 1100, 1.4) * env(int(1.2 * SR), 0.4, 0.6), 0.07, 0.1, 0.3)
    s.add(T.SHEET_LIFT, rustle(1.0, 160, 0.35, 5), 0.12, 0.1, 0.25)
    # each sheet: slides in, lands
    for i, ta in enumerate(T.sheet_arrivals()):
        g = 0.9 ** max(i - 6, 0)
        s.add(ta, rustle(0.42, 260, 0.45, 20 + i), 0.13 * g, -0.6 + 0.08 * (i % 6), 0.25)
        s.add(ta + 0.42, pat(0.35), 0.5 * g, 0.0, 0.2)
    # the stack races up: rustle thickens into a roar, air moves
    d = T.LIB_END - 19.3
    n = int(d * SR)
    ramp = np.linspace(0, 1, n) ** 2
    s.add(19.3, rustle(d, 2500, 1.0, 40, 700, 6000) * ramp, 0.22, 0, 0.3)
    s.add(19.3, wind(d, 80, 400, 41) * ramp, 0.25, 0, 0.3)
    s.add(T.LIB_END - 0.45, sweep_noise(0.7, 400, 4000, 1.2) * env(int(0.7 * SR), 0.4, 0.15), 0.3, 0, 0.2)
    # city: ambience below, wind growing with altitude, paper storm at the top
    d = T.WIDE_CUT - T.LIB_END
    n = int(d * SR)
    alt = np.clip(np.linspace(0, 1.2, n), 0, 1)
    s.add(T.LIB_END, city_ambience(d, 6) * (1 - 0.7 * alt), 0.3, 0, 0.2)
    s.add(T.LIB_END, wind(d, 200, 1400, 7) * (0.3 + 0.7 * alt), 0.2, 0.2, 0.3)
    s.add(T.LIB_END, rustle(d, 1800, 0.9, 8, 600, 5000) * np.clip(1.2 - alt, 0, 1), 0.14, -0.2, 0.3)
    s.add(T.LIB_END, sweep_noise(d, 120, 600, 1.0) * alt * env(n, 0.5, 0.4), 0.18, 0, 0.3)
    # wide shot: the city far away, water
    d = T.SUMMIT_CUT - T.WIDE_CUT
    s.add(T.WIDE_CUT + 0.25, city_ambience(d, 9) * env(int(d * SR), 1.2, 0.5, 1), 0.16, 0, 0.35)
    s.add(T.WIDE_CUT + 0.25, norm(bandpass(rng.standard_normal(int(d * SR)), 300, 1200)) * env(int(d * SR), 1.5, 0.5), 0.04, 0.3, 0.3)
    for tt in (T.TEXT_176, T.TEXT_59):
        s.add(tt, sweep_noise(0.9, 3000, 9000, 2.0) * env(int(0.9 * SR), 0.3, 0.5), 0.05, 0.2, 0.6)
    # summit: high wind, the sheet tears free and glides past the lens
    d = T.BLACK - T.SUMMIT_CUT
    s.add(T.SUMMIT_CUT, wind(d, 250, 1600, 11) * env(int(d * SR), 0.3, 0.1, 1), 0.24, 0.1, 0.3)
    f0, fd = T.SHEET_FLIGHT
    s.add(f0 - 0.2, sweep_noise(1.0, 250, 900, 1.2) * env(int(SR), 0.3, 0.6), 0.18, -0.2, 0.3)
    flut = rustle(fd, 500, 0.8, 12, 400, 3500)
    s.add(f0, lowpass(flut, 2500) * np.linspace(0.3, 1.0, len(flut)) ** 2, 0.2, 0, 0.3)
    s.add(T.BLACK - 0.45, sweep_noise(0.6, 2500, 300, 1.3) * env(int(0.6 * SR), 0.35, 0.12), 0.32, 0.4, 0.2)
    s.add(T.LOGO_IN, sweep_noise(1.6, 5000, 11000, 2.5) * env(int(1.6 * SR), 0.5, 1.0), 0.05, 0, 0.7)


def voice_env(voice):
    e = np.abs(voice).max(axis=0) if voice.ndim > 1 else np.abs(voice)
    e = signal.sosfiltfilt(signal.butter(2, 6 / (SR / 2), output="sos"), e)
    e = np.clip(e / (np.percentile(e[e > 1e-4], 70) + 1e-9), 0, 1)
    # hold through the short gaps between words, then smooth
    e = signal.sosfiltfilt(signal.butter(1, 1.5 / (SR / 2), output="sos"), e)
    return np.clip(e * 2.5, 0, 1)


def main():
    os.makedirs(ADIR, exist_ok=True)
    print("composing music...")
    compose_music()
    print("designing effects...")
    compose_sfx()
    ir = hall_ir()
    mus = reverb(music, ir)
    fx = reverb(sfx, hall_ir(1.6, 0.012, 3))
    n = int(DUR * SR)
    mus, fx = mus[:, :n], fx[:, :n]
    # the breath of silence after the climax, before the wide reveal
    tt = np.arange(n) / SR
    gate = 1 - (np.clip((tt - (T.TOWER_DONE + 0.12)) / 0.12, 0, 1) * np.clip((T.WIDE_CUT + 0.22 - tt) / 0.1, 0, 1)) * 0.97
    mus *= gate
    fx *= 1 - (1 - gate) * 0.9
    # gentle end fade
    fade = np.ones(n)
    k0 = int((DUR - 1.4) * SR)
    fade[k0:] = np.linspace(1, 0, n - k0) ** 1.5
    mus *= fade
    fx *= fade
    voice, vsr = sf.read(os.path.join(config.OUT, "seslendirme.wav"))
    assert vsr == SR
    voice = voice[:n]
    voice = np.pad(voice, (0, n - len(voice)))
    ve = voice_env(voice)
    duck = 1 - 0.5 * ve                                  # about -6 dB under the narration
    duck_fx = 1 - 0.45 * ve
    mus_n = mus / (np.abs(mus).max() + 1e-9)
    fx_n = fx / (np.abs(fx).max() + 1e-9)
    mix = np.vstack([voice, voice]) * 1.0 + mus_n * 0.42 * duck + fx_n * 0.3 * duck_fx
    # soft-knee peak safety
    pk = np.abs(mix).max()
    mix = np.tanh(mix / pk * 1.1) / np.tanh(1.1) * 0.95
    sf.write(os.path.join(config.OUT, "muzik.wav"), (mus_n * 0.9).T, SR, subtype="PCM_24")
    sf.write(os.path.join(config.OUT, "efektler.wav"), (fx_n * 0.9).T, SR, subtype="PCM_24")
    sf.write(os.path.join(ADIR, "mix_premaster.wav"), mix.T, SR, subtype="PCM_24")
    print("done")


if __name__ == "__main__":
    main()
