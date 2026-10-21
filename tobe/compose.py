"""Soundtrack for the "to be" lesson: a soft, light background loop
(marimba-like arpeggios, warm pad, bass, brushed hats) plus the sound cues
the scenes ask for (pop, whoosh, ding, tick...).

    python3 tobe/compose.py tobe/build/lesson.json output/to_be_soundtrack.wav
"""
import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r, sustain_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    hold = max(0, int(sustain_len * SR) - a - d)
    e = np.concatenate([np.linspace(0, 1, a, False), np.linspace(1, s, d, False), np.full(hold, s), np.linspace(s, 0, r)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def add(buf, start, sig, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    sig = sig[: buf.shape[1] - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


# ---------------------------------------------------------------- instruments
def marimba(freq, dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e1, e2 = np.exp(-t * 7), np.exp(-t * 22)
    s = np.sin(2 * np.pi * freq * t) * e1 + 0.35 * np.sin(2 * np.pi * freq * 4 * t) * e2 + 0.12 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t * 60)
    s *= np.minimum(1, t / 0.002)
    return s


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.12):
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * t + rng.uniform(0, 6)) + 0.3 * np.sin(2 * np.pi * 2 * ff * t)
    s *= env_adsr(n, 0.6, 0.4, 0.8, 0.8, dur - 0.8)
    return s / (len(freqs) * 2)


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * 2 * freq * t)
    return s * np.exp(-t * 3.2) * np.minimum(1, t / 0.006)


def hat(dur=0.05):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = rng.standard_normal(n)
    s = np.diff(np.concatenate([[0], s]))
    return s * np.exp(-t * 90) * 0.5


# ---------------------------------------------------------------- sound cues
def tone(f0, f1, dur, decay, harm=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = np.geomspace(f0, f1, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + harm * np.sin(2 * ph)
    return s * np.exp(-t * decay) * np.minimum(1, t / 0.002)


def noise_sweep(dur, lo, hi, peak=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 1024
    for i in range(0, n, seg):
        c = lo * (hi / lo) ** (i / n)
        out[i:i + seg] = fft_filter(s[i:i + seg], lo=c * 0.6, hi=c * 1.6)[: len(s[i:i + seg])]
    e = np.where(t < dur * peak, t / (dur * peak), (dur - t) / (dur * (1 - peak))) ** 1.6
    return out * e


def bell(freq, dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.5) + 0.45 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 6)
         + 0.25 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 10))
    return s * np.minimum(1, t / 0.002)


def sfx(kind):
    if kind == 'pop':
        return tone(520, 980, 0.09, 38) * 0.32
    if kind == 'popBig':
        return tone(300, 720, 0.16, 22, 0.25) * 0.42
    if kind == 'tick':
        return tone(1900, 1800, 0.035, 120) * 0.22
    if kind == 'whoosh':
        return noise_sweep(0.38, 400, 3200, 0.55) * 0.12
    if kind == 'drop':
        return tone(900, 260, 0.22, 14) * 0.35
    if kind == 'boing':
        n = int(0.32 * SR); t = np.arange(n) / SR
        f = 330 * (1 + 0.35 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6)) * np.geomspace(1, 1.6, n)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.3
    if kind == 'bubble':
        a = tone(400, 700, 0.08, 40) * 0.25
        b = tone(600, 1000, 0.08, 40) * 0.25
        return np.concatenate([a, np.zeros(int(0.03 * SR)), b])
    if kind == 'ding':
        return bell(1318.5, 1.2) * 0.22
    if kind == 'buzz':
        n = int(0.28 * SR); t = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.6 + np.sin(2 * np.pi * 151 * t)
        return fft_filter(s, hi=1400) * np.exp(-t * 7) * np.minimum(1, t / 0.01) * 0.16
    if kind == 'correct':
        out = np.zeros(int(1.6 * SR))
        for i, m in enumerate([72, 76, 79, 84]):
            b = bell(midi(m), 1.2) * 0.17
            j = int(i * 0.08 * SR)
            out[j:j + len(b)] += b[: len(out) - j]
        return out
    if kind == 'tada':
        out = np.zeros(int(2.6 * SR))
        for i, m in enumerate([60, 64, 67, 72, 76, 79, 84]):
            b = bell(midi(m), 2.0) * 0.14
            j = int(i * 0.06 * SR)
            out[j:j + len(b)] += b[: len(out) - j]
        return out
    raise ValueError(kind)


# ---------------------------------------------------------------- score
def music(duration):
    buf = np.zeros((2, int((duration + 3) * SR)))
    bpm = 98
    beat = 60 / bpm
    bar = beat * 4
    # I - vi - IV - V in C, voiced softly
    prog = [(48, [60, 64, 67, 71]), (45, [57, 60, 64, 67]), (41, [57, 60, 65, 69]), (43, [55, 59, 62, 67])]
    patterns = [[0, 1, 2, 3, 2, 1, 2, 3], [0, 2, 1, 3, 0, 2, 3, 2]]
    nbar = int(duration / bar) + 1
    for b in range(nbar):
        t0 = b * bar
        root, chord = prog[b % 4]
        add(buf, t0, pad([midi(n) for n in chord[:3]], bar + 0.6), 0, 0.10)
        add(buf, t0, bass(midi(root), beat * 1.8), 0, 0.30)
        add(buf, t0 + beat * 2, bass(midi(root + (7 if b % 2 else 0)), beat * 1.8), 0, 0.24)
        pat = patterns[(b // 4) % 2]
        for i, k in enumerate(pat):
            note = chord[k] + 12
            if (b + i) % 7 == 6:
                continue  # breathe
            vel = 0.13 if i % 2 == 0 else 0.09
            add(buf, t0 + i * beat / 2, marimba(midi(note)), -0.35 + 0.7 * (k / 3), vel)
        for i in range(4):
            add(buf, t0 + i * beat + beat / 2, hat(), 0.4, 0.05)
    # simple stereo echo on everything for space
    d = int(beat * 0.75 * SR)
    wet = np.zeros_like(buf)
    wet[0, d:] += buf[1, :-d] * 0.22
    wet[1, d:] += buf[0, :-d] * 0.22
    wet[:, 2 * d:] += buf[:, :-2 * d] * 0.08
    buf += wet
    n = int(duration * SR)
    buf = buf[:, :n]
    t = np.arange(n) / SR
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (duration - t) / 3.0)
    return buf * fade


def main(lesson_path, out_path):
    lesson = json.load(open(lesson_path))
    dur = lesson['duration']
    mus = music(dur)
    fx = np.zeros_like(mus)
    for t, kind, vol in lesson['sfx']:
        add(fx, t, sfx(kind), rng.uniform(-0.15, 0.15), vol)
    # duck the music slightly under cues
    env = np.abs(fx).max(axis=0)
    k = int(0.15 * SR)
    env = np.convolve(env, np.ones(k) / k, mode='same')
    duck = 1 - np.clip(env * 1.2, 0, 0.35)
    mix = mus * 0.85 * duck + fx
    peak = np.abs(mix).max()
    mix *= 0.89 / peak
    pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2').T.copy()
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'wrote {out_path} ({dur:.1f} s, {len(lesson["sfx"])} cues)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
