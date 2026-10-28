# To Be: am · is · are (Instagram Reels)

İngilizce sayfası için 9:16 dikey (1080 × 1920) eğitim videosu. Süre 2:07 (127 sn), yazı tipi Montserrat.

**Video:** [`output/to_be_reels.mp4`](output/to_be_reels.mp4)
H.264, 1080×1920, 30 fps, AAC 48 kHz stereo, yaklaşık −16 LUFS.

## Bölümler

| Zaman | Bölüm | İçerik |
|---|---|---|
| 0:00–0:05 | Açılış | “TO BE” ve am · is · are |
| 0:05–0:16 | Giriş: To be nedir? | to be = olmak. Şimdiki zamanda Türkçedeki -(y)ım, -sın, -dır eklerinin karşılığı. *I am tired. / It is a book.* |
| 0:16–0:36 | Bölüm 1: Özneler ve Kısaltmalar | I → am → I'm · He/She/It → is → 's · You/We/They → are → 're. am yalnızca I ile kullanılır. Tekil/çoğul: *It is a cat. → They are cats.* (cats'teki -s çoğul eki, It's'teki 's ise is'in kısaltması) |
| 0:36–0:51 | Bölüm 2: Olumlu Cümle | Özne + am/is/are + … · *I am a gamer. She is happy. We are ready.* Tekil isimden önce a/an. |
| 0:51–1:10 | Bölüm 3: Olumsuz Cümle | Özne + am/is/are + not · *She is happy → She is not happy* animasyonu · I'm not ✓, amn't ✗, isn't, aren't · *I'm not hungry. He isn't tired. They aren't at home.* |
| 1:10–1:26 | Bölüm 4: Soru Cümlesi | Am/Is/Are + özne + …? · *She is happy → Is she happy?* (fiil başa uçar) · *Am I late? Is he happy? Are they ready?* |
| 1:26–1:43 | Bölüm 5: Kısa Cevaplar | Olumluda kısaltma yok (*Yes, I am.* ✓, *Yes, I'm.* ✗). Olumsuzda kısaltma kullanılır (*No, she isn't. No, I'm not.*) |
| 1:43–1:59 | Bölüm 6: Olumsuz Soru | Isn't/Aren't + özne + …? · *Isn't she happy? Aren't you ready? Am I not your friend?* · amn't I yok; *Am I not…?*, günlük dilde *Aren't I…?* |
| 1:59–2:07 | Özet | Tüm kalıplar tek ekranda, Kaydet · Paylaş · Takip et |

Renk kodu video boyunca sabit: **am** turuncu, **is** yeşil, **are** pembe.

## Ses

Müzik ve tüm efektler `audio/compose.py` ile sıfırdan sentezlenir (telif sorunu yok):
bölüm geçişlerinde whoosh, her kart için pop, formül parçalarında tık, doğru örneklerde “ding”, yanlış örneklerde (amn't, Yes I'm) buzzer,
soru dönüşümünde swoosh, açılışta riser ve impact, kapanışta çan. Efektler `animation/script.js` içindeki zamanlardan yerleştirilir ve görüntüyle tam eşleşir.

## Yapı

```
animation/script.js   senaryo: sahneler, sayfalar, öğeler ve görünme zamanları (JSON)
animation/engine.js   tuval çizimi (kartlar, formül çipleri, kelime yer değiştirme animasyonu, başlıklar)
animation/index.html  önizleme oynatıcısı
audio/compose.py      müzik ve ses efektleri
render/render.mjs     Chromium ile kare kare render ve ffmpeg ile MP4
render/stills.mjs     belirli saniyelerden PNG
```

Metni değiştirmek için yalnızca `animation/script.js` dosyasını düzenleyin. Ses efektleri yeni zamanlara kendiliğinden uyar.

## Yeniden üretme

```bash
python3 audio/compose.py        # output/soundtrack.wav
node render/render.mjs          # output/to_be_reels.mp4
```

Önizleme: depo kökünden `npx http-server .` çalıştırıp `/to-be/animation/` adresini açın.

## Instagram notları

- Başlıklar üstte, içerik ekranın ortasında. Reels arayüzünün kapladığı alt bölüme önemli yazı konmadı.
- Kapak önerisi: [`docs/poster.jpg`](docs/poster.jpg) (0:03, TO BE ekranı).
