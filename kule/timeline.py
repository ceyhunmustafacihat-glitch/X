"""Event times shared by the picture (blender/library.py) and the sound (score.py)."""
import numpy as np

COVER_OPEN = (6.1, 1.6)                       # start, duration
PAGE_STARTS = [7.75, 8.15, 8.45, 8.7, 8.9, 9.05, 9.25]
PAGE_DURS = [0.75, 0.6, 0.5, 0.45, 0.42, 0.4, 0.9]
SHEET_LIFT = 14.1
COUNTER = (9.15, 12.45)                       # counter runs from first to last
LIB_END = 23.6                                # cut from the library to the city
TOWER_DONE = 27.75                            # the tower reaches 175.64 m
WIDE_CUT = 28.16
SUMMIT_CUT = 35.86
SHEET_FLIGHT = (37.0, 2.55)
BLACK = 39.55                                 # the sheet covers the lens
LOGO_IN = 39.65
TEXT_176 = 29.7
TEXT_59 = 32.35


def sheet_arrivals():
    """Start times of the individually animated sheets (accelerating); each lands 0.42 s later."""
    ts, t, dt = [], 15.05, 0.78
    while t < 19.6:
        ts.append(t)
        t += dt
        dt = max(dt * 0.84, 0.045)
    return np.array(ts)


def counter_value(t):
    """1.756.396 SÖZCÜK: starts slowly, gathers speed, settles exactly on the value."""
    c0, c1 = COUNTER
    u = float(np.clip((t - c0) / (c1 - c0), 0, 1))
    return int(round(1_756_396 * (1 - (1 - u ** 2.2) ** 1.6)))
