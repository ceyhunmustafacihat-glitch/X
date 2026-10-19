"""Shared settings for the "Bir Kelimeden Gökdelene" reel.

Everything that both picture and sound depend on lives here: the brand
name, the frame rate, the narration script and the scene timeline.
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, ".cache")          # downloaded models, never committed
BUILD = os.path.join(ROOT, "build")           # intermediate renders, never committed
OUT = os.path.join(ROOT, "output")

# No brand lettering or spoken brand name: the film carries only the story.

FPS = 24

# The narration is synthesised and kept as a stem, but the final film carries only
# music and effects; the story is told by the on-screen text.
NARRATION_IN_MIX = False
DURATION = 42.0
W, H = 1080, 1920

# Scene boundaries in seconds (see README for the shot list).
SCENES = {
    "s1_word":    (0.0, 5.0),
    "s2_numbers": (5.0, 13.0),
    "s3_first":   (13.0, 19.0),
    "s4_rise":    (19.0, 28.0),
    "s5_176":     (28.0, 36.0),
    "s6_final":   (36.0, DURATION),
}

# Narration: (start time, [(phrase, length_scale, pause_after_s), ...]).
# CHECK holds the written form Whisper is expected to hear for phrases with numbers.
# Numbers are spelled out so the TTS reads them exactly; "dill" keeps the
# final consonant of "dil" from being swallowed by the voice model.
NARRATION = [
    (1.55, [("Bir sözlük...", 1.12, 0.55), ("ne kadar yükselebilir?", 1.10, 0.0)]),
    (5.2, [("Türk Dil Kurumunun iki bin yirmi üç yılında yayımladığı Türkçe Sözlük'ün metninde,", 1.0, 0.22),
            ("tam bir milyon yedi yüz elli altı bin üç yüz doksan altı sözcük bulunuyor.", 1.04, 0.0)]),
    (13.5, [("Şimdi hayal edin.", 1.12, 0.45), ("Her sözcüğü, ayrı bir kâğıda yazdığımızı düşünün.", 1.08, 0.0)]),
    (20.0, [("Her biri yalnızca onda bir milimetre kalınlığında olan", 1.10, 0.15),
            ("bu kâğıtları üst üste koyduğumuzda...", 1.12, 0.0)]),
    (29.15, [("Yaklaşık yüz yetmiş altı metreye ulaşırız.", 1.08, 0.4),
             ("Yani, elli dokuz katlı bir gökdelen kadar!", 1.04, 0.0)]),
    (37.2, [("Bir dill...", 1.15, 0.35), ("sandığınızdan çok daha büyük.", 1.1, 0.45),
            ("Her kelimede yeni bir dünya.", 1.1, 0.0)]),
]

CHECK = {
    "Türk Dil Kurumunun iki bin yirmi üç yılında yayımladığı Türkçe Sözlük'ün metninde,":
        "Türk Dil Kurumunun 2023 yılında yayımladığı Türkçe Sözlük'ün metninde",
    "tam bir milyon yedi yüz elli altı bin üç yüz doksan altı sözcük bulunuyor.": "tam 1.756.396 sözcük bulunuyor.",
    "Yaklaşık yüz yetmiş altı metreye ulaşırız.": "Yaklaşık 176 metreye ulaşırız.",
    "Yani, elli dokuz katlı bir gökdelen kadar!": "Yani 59 katlı bir gökdelen kadar.",
}

# Subtitle text per narration line (written form, for the SRT).
SUBTITLES = [
    "Bir sözlük... ne kadar yükselebilir?",
    "Türk Dil Kurumunun 2023 yılında yayımladığı Türkçe Sözlük'ün metninde, tam 1.756.396 sözcük bulunuyor.",
    "Şimdi hayal edin. Her sözcüğü, ayrı bir kâğıda yazdığımızı düşünün.",
    "Her biri yalnızca onda bir milimetre kalınlığında olan bu kâğıtları üst üste koyduğumuzda...",
    "Yaklaşık 176 metreye ulaşırız. Yani, 59 katlı bir gökdelen kadar!",
    "Bir dil... sandığınızdan çok daha büyük. Her kelimede yeni bir dünya.",
]

WORD_COUNT = 1_756_396
SHEET_MM = 0.1
TOWER_M = WORD_COUNT * SHEET_MM / 1000        # 175.64 m
FLOORS = 59
