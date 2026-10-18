"""Draw the drifting Turkish letters into sozlukdeus_bilge.svg as plain paths.

Glyphs come from Cormorant Garamond Italic (animation/fonts), so the SVG needs
no font at all. Edit LETTERS and run:  python3 logo/letters.py
"""
import pathlib, re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = [TTFont(ROOT.parent / 'animation/fonts' / f) for f in
         ('CormorantGaramond-italic-latin.woff2', 'CormorantGaramond-italic-latin-ext.woff2')]

# char, baseline x, baseline y, size, opacity, rotation (deg)
# Rising from the book along an arc up-left and down-right; two faint echoes on the left.
LETTERS = [
    ('ş', 562, 172, 60, 0.34, -8),
    ('ö', 480, 116, 46, 0.24, -12),
    ('ğ', 836, 340, 54, 0.3, 10),
    ('ü', 858, 470, 40, 0.22, 6),
    ('ç', 188, 300, 48, 0.18, -6),
    ('ı', 206, 474, 42, 0.15, 4),
]

def glyph_path(ch, x, y, size):
    for font in FONTS:
        cmap = font.getBestCmap()
        if ord(ch) in cmap:
            gs = font.getGlyphSet()
            name = cmap[ord(ch)]
            k = size / font['head'].unitsPerEm
            w = gs[name].width * k
            pen = SVGPathPen(gs, lambda v: f'{v:.1f}'.rstrip('0').rstrip('.'))
            gs[name].draw(TransformPen(pen, (k, 0, 0, -k, x - w / 2, y)))
            return pen.getCommands()
    raise KeyError(ch)

rows = ['    <g fill="#c8c8c8">']
for ch, x, y, size, op, rot in LETTERS:
    rows.append(f'      <path d="{glyph_path(ch, x, y, size)}" opacity="{op}" transform="rotate({rot} {x} {y - size * 0.25:.0f})"><title>{ch}</title></path>')
rows.append('    </g>')

svg = ROOT / 'sozlukdeus_bilge.svg'
text = svg.read_text()
text = re.sub(r'(<!-- letters:start -->\n).*?(\s*<!-- letters:end -->)',
              lambda m: m.group(1) + '\n'.join(rows) + m.group(2), text, flags=re.S)
svg.write_text(text)
