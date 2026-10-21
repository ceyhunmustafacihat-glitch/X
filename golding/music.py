#!/usr/bin/env python3
"""Soft instrumental bed for the William Golding film (no voice-over).

Additive piano + string pad, synthesised from scratch. The war section
(107-133 s) turns darker; the rest stays warm and calm.
    python3 golding/music.py  -> output/william_golding_music.wav
"""
import os
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, DUR = 48000, 171.0
N = int(SR * (DUR + 4))
rng = np.random.default_rng(3)
L, R = np.zeros(N), np.zeros(N)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(t, sig, gain, pan=0.0):
    i = int(t * SR)
    n = min(len(sig), N - i)
    if n <= 0:
        return
    L[i:i + n] += sig[:n] * gain * np.cos((pan + 1) * np.pi / 4)
    R[i:i + n] += sig[:n] * gain * np.sin((pan + 1) * np.pi / 4)


def piano(m, dur=3.5):
    t = np.arange(int(SR * dur)) / SR
    f = hz(m)
    s = sum(a * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.2 + k * 0.9)) for k, a in [(1, 1), (2, .45), (3, .22), (4, .1), (5, .05)])
    att = np.minimum(1, t / 0.006)
    return s * att


def pad(ms, dur):
    t = np.arange(int(SR * dur)) / SR
    s = np.zeros_like(t)
    for m in ms:
        for d in (-0.08, 0.0, 0.08):
            f = hz(m + d)
            ph = rng.uniform(0, 6.28)
            s += np.sin(2 * np.pi * f * t + ph) + 0.3 * np.sin(4 * np.pi * f * t + ph)
    env = np.minimum(1, t / 1.6) * np.minimum(1, (dur - t) / 1.6)
    b, a = signal.butter(2, 1800 / (SR / 2))
    return signal.lfilter(b, a, s) * env / (len(ms) * 3)


# chords as midi notes (root, third, fifth...), each lasts one bar of 4 s
calm = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 48, 53, 57], [48, 55, 60, 64]]      # Dm Bb F C
dark = [[50, 57, 62, 65], [46, 53, 58, 61], [45, 52, 57, 61], [50, 56, 62, 65]]      # Dm Bbm A Ddim-ish
bar = 4.0
t = 0.0
i = 0
while t < DUR:
    war = 107 <= t < 133
    ch = (dark if war else calm)[i % 4]
    add(t, pad([m - 12 for m in ch[:2]] + ch[1:], bar + 1.6), 0.10 if not war else 0.12, 0.0)
    # gentle arpeggio, sparser in the darkest moments
    notes = [ch[0] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 24, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12]
    step = bar / len(notes)
    for j, m in enumerate(notes):
        if war and j % 2:
            continue
        add(t + j * step + rng.uniform(0, 0.01), piano(m), 0.16 * (0.8 if j % 2 else 1.0), pan=-0.3 + 0.6 * (j / len(notes)))
    if war:  # low heartbeat pulse
        for k in (0, 2):
            tt = np.arange(int(SR * 0.6)) / SR
            add(t + k, np.sin(2 * np.pi * 55 * tt * (1 - 0.3 * tt)) * np.exp(-tt * 9), 0.35)
    t += bar
    i += 1

# simple hall reverb
ir_t = np.arange(int(SR * 2.4)) / SR
for ch_ in (0, 1):
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.6)
    ir[0] = 0
    src = L if ch_ == 0 else R
    wet = signal.fftconvolve(src, ir)[:N] * 0.025
    if ch_ == 0:
        L = src + wet
    else:
        R = src + wet

n = int(SR * DUR)
mix = np.vstack([L[:n], R[:n]])
tt = np.arange(n) / SR
mix *= np.minimum(1, tt / 2.0) * np.minimum(1, (DUR - tt) / 3.0)
mix *= 0.5 / np.max(np.abs(mix))  # about -6 dBFS peak, a quiet bed
out = os.path.join(ROOT, 'output', 'william_golding_music.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('wrote', out)
