#!/usr/bin/env python3
"""Turkish narration with a local neural TTS (Piper "fahrettin", male, via sherpa-onnx).

Each line is synthesised phrase by phrase so pauses are placed by hand, then
lowered ~1.3 semitones with formants preserved (rubberband), EQ'd and lightly
compressed into a documentary-style voice. Writes:

    build/voice/line_N.wav     one file per narration line (48 kHz)
    output/seslendirme.wav     the full narration on the video timeline
    build/voice/timing.json    actual start/end of every line (used by the mix and SRT)
"""
import json
import os
import subprocess
import tarfile
import urllib.request

import numpy as np
import soundfile as sf
from scipy import signal

import config

VOICE = "vits-piper-tr_TR-fahrettin-medium"
URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{VOICE}.tar.bz2"
ASR = "sherpa-onnx-whisper-small"
ASR_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{ASR}.tar.bz2"
TAKES = 14
SR = 48000
VDIR = os.path.join(config.BUILD, "voice")


def model_dir():
    d = os.path.join(config.CACHE, VOICE)
    if not os.path.isdir(d):
        os.makedirs(config.CACHE, exist_ok=True)
        tb = d + ".tar.bz2"
        print("downloading", URL)
        urllib.request.urlretrieve(URL, tb)
        with tarfile.open(tb) as t:
            t.extractall(config.CACHE, filter="data")
        os.remove(tb)
    return d


def engine(d, ls):
    import sherpa_onnx
    name = VOICE.replace("vits-piper-", "")
    vits = sherpa_onnx.OfflineTtsVitsModelConfig(
        model=f"{d}/{name}.onnx", tokens=f"{d}/tokens.txt", data_dir=f"{d}/espeak-ng-data",
        length_scale=ls, noise_scale=0.55, noise_scale_w=0.65)
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(vits=vits, num_threads=4)))


_ASR = None


def asr_score(audio, sr, text):
    """Similarity of a Whisper transcript to the intended phrase (takes are ranked by it)."""
    global _ASR
    import difflib
    import sherpa_onnx
    if _ASR is None:
        d = os.path.join(config.CACHE, ASR)
        if not os.path.isdir(d):
            tb = d + ".tar.bz2"
            urllib.request.urlretrieve(ASR_URL, tb)
            with tarfile.open(tb) as t:
                t.extractall(config.CACHE, filter="data")
            os.remove(tb)
        _ASR = sherpa_onnx.OfflineRecognizer.from_whisper(
            encoder=f"{d}/small-encoder.int8.onnx", decoder=f"{d}/small-decoder.int8.onnx",
            tokens=f"{d}/small-tokens.txt", language="tr", task="transcribe", num_threads=4)
    x = signal.resample_poly(audio, 16000, sr).astype(np.float32)
    st = _ASR.create_stream()
    st.accept_waveform(16000, x)
    _ASR.decode_stream(st)

    def clean(z):
        return "".join(c for c in z.lower().replace("ı", "i").replace("â", "a") if c.isalnum())
    return difflib.SequenceMatcher(None, clean(st.result.text), clean(text.replace("dill", "dil"))).ratio()


def trim(a, sr, thr=0.012):
    e = np.convolve(np.abs(a), np.ones(256) / 256, "same")
    idx = np.nonzero(e > thr)[0]
    if not len(idx):
        return a
    lo, hi = max(idx[0] - int(0.02 * sr), 0), min(idx[-1] + int(0.06 * sr), len(a))
    out = a[lo:hi].copy()
    f = int(0.008 * sr)
    out[:f] *= np.linspace(0, 1, f)
    out[-f:] *= np.linspace(1, 0, f)
    return out


def peq(x, f0, gain_db, q, kind="peak"):
    """RBJ biquad (peak / lowshelf / highshelf)."""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    c = np.cos(w)
    if kind == "peak":
        b = [1 + al * A, -2 * c, 1 - al * A]
        a = [1 + al / A, -2 * c, 1 - al / A]
    else:
        s = 1 if kind == "low" else -1
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) - s * (A - 1) * c + sq), s * 2 * A * ((A - 1) - s * (A + 1) * c), A * ((A + 1) - s * (A - 1) * c - sq)]
        a = [(A + 1) + s * (A - 1) * c + sq, -s * 2 * ((A - 1) + s * (A + 1) * c), (A + 1) + s * (A - 1) * c - sq]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def compress(x, thr_db=-20, ratio=2.6, att=0.004, rel=0.12):
    env = np.abs(x)
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    e = np.zeros_like(env)
    prev = 0.0
    for i, v in enumerate(env):          # fine for ~40 s of audio
        k = a_a if v > prev else a_r
        prev = k * prev + (1 - k) * v
        e[i] = prev
    db = 20 * np.log10(e + 1e-9)
    gain = np.where(db > thr_db, (thr_db - db) * (1 - 1 / ratio), 0)
    return x * 10 ** (gain / 20)


def deepen(path_in, path_out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path_in, "-af",
                    f"aresample={SR},rubberband=pitch={2 ** (-1.3 / 12):.5f}:formant=preserved:pitchq=quality",
                    "-ar", str(SR), path_out], check=True)


def main():
    os.makedirs(VDIR, exist_ok=True)
    d = model_dir()
    engines = {}
    timing = []
    track = np.zeros(int((config.DURATION + 1) * SR))
    for li, (t0, phrases) in enumerate(config.NARRATION):
        parts = []
        sr = 22050
        for text, ls, pause in phrases:
            if ls not in engines:
                engines[ls] = engine(d, ls)
            takes = []
            for _ in range(TAKES):                 # the model is stochastic: keep the clearest take
                g = engines[ls].generate(text, sid=0, speed=1.0)
                sr = g.sample_rate
                a = trim(np.array(g.samples, dtype=np.float32), sr)
                takes.append((asr_score(a, sr, config.CHECK.get(text, text)), a))
                if takes[-1][0] > 0.985:
                    break
            score, best = max(takes, key=lambda k: k[0])
            print(f"  {score:.2f}  {text}")
            parts.append(best)
            parts.append(np.zeros(int(pause * sr), dtype=np.float32))
        raw = np.concatenate(parts)
        rp = os.path.join(VDIR, f"raw_{li}.wav")
        sf.write(rp, raw, sr)
        dp = os.path.join(VDIR, f"deep_{li}.wav")
        deepen(rp, dp)
        x, _ = sf.read(dp)
        # documentary voice chain: rumble cut, chest warmth, less box, presence, soft top
        x = signal.sosfilt(signal.butter(2, 70 / (SR / 2), "high", output="sos"), x)
        x = peq(x, 140, 2.5, 0.7, "low")
        x = peq(x, 380, -2.5, 1.2)
        x = peq(x, 3200, 2.0, 0.9)
        x = peq(x, 7500, -3.0, 2.5)          # tame Piper's sibilance
        x = peq(x, 11000, -2.0, 0.7, "high")
        x = compress(x)
        x = x / np.abs(x).max() * 0.89
        sf.write(os.path.join(VDIR, f"line_{li}.wav"), x, SR, subtype="PCM_24")
        i0 = int(t0 * SR)
        track[i0:i0 + len(x)] += x
        timing.append({"line": li, "start": t0, "end": round(t0 + len(x) / SR, 3), "text": config.SUBTITLES[li]})
        print(f"line {li}: {t0:6.2f} - {t0 + len(x) / SR:6.2f}  ({len(x) / SR:.2f} s)")
    track = track[:int(config.DURATION * SR)]
    os.makedirs(config.OUT, exist_ok=True)
    sf.write(os.path.join(config.OUT, "seslendirme.wav"), track, SR, subtype="PCM_24")
    with open(os.path.join(VDIR, "timing.json"), "w", encoding="utf-8") as f:
        json.dump(timing, f, ensure_ascii=False, indent=1)
    for a, b in zip(timing, timing[1:]):
        if a["end"] > b["start"] - 0.2:
            print("WARNING: line", a["line"], "runs into the next one")


if __name__ == "__main__":
    main()
