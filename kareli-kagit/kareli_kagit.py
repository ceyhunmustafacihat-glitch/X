"""A4 kareli kâğıt üretici.

Sayfanın tamamı (kenardan kenara) kareyle doludur.
Varsayılan: 5 mm kare, 0,25 mm kalınlığında simsiyah çizgi.

Kullanım:
    python3 kareli_kagit.py                 # kareli_kagit_A4.pdf
    python3 kareli_kagit.py --kare 6 --kalinlik 0.3 --sayfa 10
"""
import argparse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def ciz(c, kare_mm, kalinlik_mm):
    w, h = A4  # 210 x 297 mm (pt cinsinden)
    s = kare_mm * mm
    c.setStrokeColorRGB(0, 0, 0)          # simsiyah
    c.setLineWidth(kalinlik_mm * mm)
    c.setLineCap(0)

    # Izgarayı sayfaya ortala: kenarlarda kalan yarım kareler iki tarafta eşit olsun.
    # (mm cinsinden hesapla; pt'de kayan nokta hatası 210/5 gibi tam bölünmeleri bozar)
    ox = (round(210 % kare_mm, 6) % kare_mm) / 2 * mm
    oy = (round(297 % kare_mm, 6) % kare_mm) / 2 * mm

    x = ox
    while x <= w + 0.01:
        c.line(x, 0, x, h)
        x += s
    y = oy
    while y <= h + 0.01:
        c.line(0, y, w, y)
        y += s


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--kare", type=float, default=5.0, help="kare kenarı (mm)")
    p.add_argument("--kalinlik", type=float, default=0.25, help="çizgi kalınlığı (mm)")
    p.add_argument("--sayfa", type=int, default=1, help="sayfa sayısı")
    p.add_argument("--cikti", default="kareli_kagit_A4.pdf")
    a = p.parse_args()

    c = canvas.Canvas(a.cikti, pagesize=A4)
    c.setTitle("A4 Kareli Kâğıt")
    for _ in range(a.sayfa):
        ciz(c, a.kare, a.kalinlik)
        c.showPage()
    c.save()
    print(f"{a.cikti}: {a.sayfa} sayfa, {a.kare} mm kare, {a.kalinlik} mm çizgi")


if __name__ == "__main__":
    main()
