// Big Bang trial reel: timeline in video seconds (video t = recording t - 1.85).
// Read by the scene and by bigbang/audio.py, so keep this a plain JSON object literal.
window.TIMELINE = {
  "duration": 18.0,
  "fps": 30,
  "voice": { "file": "bigbang/voice/anlatim.m4a", "start": 1.85, "end": 16.5 },
  "phrases": [
    { "t": [0.40, 2.40], "text": "Big Bang'den önce ne vardı?", "syl": [1, 3, 2, 1, 2] },
    { "t": [2.60, 6.15], "text": "Bu soruya cevap vermek aslında biraz zor.", "syl": [1, 3, 2, 2, 3, 2, 1] },
    { "t": [6.70, 7.90], "text": "Peki, sebebi ne?", "syl": [2, 3, 1] },
    { "t": [8.05, 9.25], "text": "Gelin inceleyelim.", "syl": [2, 5] },
    { "t": [9.84, 10.86], "text": "Neden bilemiyoruz?", "syl": [2, 5] },
    { "t": [10.90, 12.44], "text": "Karşımızda iki büyük sınır var:", "syl": [4, 2, 2, 2, 1] },
    { "t": [12.47, 13.57], "text": "Gözlemsel sınır", "syl": [3, 2] },
    { "t": [13.60, 14.57], "text": "Kuramsal sınır", "syl": [3, 2] }
  ],
  "rewind": [2.8, 6.3],
  "burst": 9.4,
  "coneDraw": [9.75, 11.0],
  "walls": [11.55, 12.0],
  "focusCMB": [12.4, 13.6],
  "focusPlanck": [13.55, 14.6],
  "outro": [14.6, 18.0],
  "finalTitle": 15.75,
  "fadeOut": [17.35, 18.0]
};
