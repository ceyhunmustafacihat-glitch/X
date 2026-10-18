# SÖZLÜKDEUS · Bir Kelimeden Gökdelene

Instagram Reels için 9:16, 42 saniyelik, Türkçe seslendirmeli sinematik kısa film.
Bir sözlüğün metnindeki **1.756.396 sözcük**, her biri 0,1 mm kalınlığındaki ayrı kâğıtlara yazılıp üst üste konursa
**175,64 m** yükseklikte, yani yaklaşık **59 katlı** bir gökdelen boyunda bir kule oluşur.

| Dosya | İçerik |
|---|---|
| `output/sozlukdeus_bir_kelimeden_gokdelene.mp4` | Nihai video. 1080 × 1920, 24 fps, H.264 High, AAC 320 kb/s, −14 LUFS, açılıp kapatılabilen Türkçe altyazı izi |
| `output/seslendirme.wav` | Yalnızca anlatım, video zaman çizelgesine hizalı (48 kHz, 24 bit) |
| `output/muzik.wav`, `output/efektler.wav` | Müzik ve ses efekti stem'leri |
| `output/altyazi_tr.srt` | Anlatımın altyazısı (SRT) |
| `docs/storyboard.jpg` | Her sahneden kareler |

## Nasıl üretildi (gerçekten kullanılan araçlar)

Bu ortamda GPU ya da metinden video veya müzik üreten bir yapay zekâ servisi yok. Bu yüzden film baştan sona koddan üretildi:

- **Görüntü:** Blender 5.2 (Python `bpy` modülü), Cycles yol izleme (CPU). Fiziksel ışık, hacimsel ay ışığı huzmeleri, gerçek alan derinliği (diyafram, odak mesafesi), 180° obtüratörle hareket bulanıklığı ve OpenImageDenoise kullanıldı. Bütün sahneler `kule/blender/` içinde prosedürel olarak kuruluyor. Kâğıt bükülmesi, sayfa çevirme ve kapak açılması her alt-karede hesaplanıyor, bu yüzden hareket bulanıklığı da doğru.
- **Yazılar:** Görüntüdeki bütün okunabilir metinler (sözlük sayfaları, kâğıtlardaki kelimeler, cilt yaldızı, sayaç, ölçü yazıları, logo) gerçek fontlarla (EB Garamond, Cormorant Garamond, Montserrat, OFL lisanslı) ve doğru Türkçe karakterlerle dizildi. Hiçbiri yapay zekâ tarafından "çizilmedi". Sözlük maddeleri bu film için yazıldı ve Türk alfabesi sırasına göre dizildi.
- **Seslendirme:** Yerel sinirsel TTS, Piper `tr_TR-fahrettin-medium` (erkek ses, sherpa-onnx ile). Cümleler öbek öbek sentezlendi, duraklamalar elle yerleştirildi, sayılar yazıyla verildi. Ses perdesi formantlar korunarak 1,3 yarım ton kalınlaştırıldı, ardından EQ ve kompresyon uygulandı. Doğruluk Whisper (small) ile geri okunarak denetlendi.
- **Müzik ve efektler:** `kule/score.py` her şeyi sıfırdan sentezliyor: piyano, yaylılar, alçak yaylı ostinato, bakır ve koro, davullar, rüzgâr, kâğıt foley'si (hışırtı, sayfa, kapak gıcırtısı, kâğıt konması) ve şehir ambiyansı. Örnek (sample) kullanılmadı, telif sorunu yok. Anlatım her zaman önde, müzik ve efektler onun altında yaklaşık −6 dB bastırılıyor (ducking).
- **Kurgu ve renk:** `kule/post/compose.py` kareleri lineer EXR'dan okuyor. Pozlama, bloom, ACES ton eşleme, siyah-antrasit-kırık beyaz palet ve altın vurgulu renk düzenleme, toz zerreleri, vinyet ve film greni ekliyor. Ardından tipografiyi bindiriyor ve ffmpeg ile kodluyor.

## Sahneler

| Zaman | Görüntü |
|---|---|
| 0–5 sn | Karanlıktan beliren kütüphane. Ay ışığı şeridinde masadaki tek kâğıt ve üzerinde "sözcük" yazısı. Yavaş dolly-in, ardından iki ciltlik **TÜRKÇE SÖZLÜK**'e tilt eşliğinde rack focus. |
| 5–13 sn | Kamera sözlüğe yaklaşır, cilt ağır ağır açılır, sayfalar çevrilir, Türkçe maddeler ışıkta belirir. Vinç hareketiyle kuş bakışı plana geçilir. **1.756.396 SÖZCÜK** sayacı önce yavaş, sonra hızlanarak sayar ve gerçek değerde durur. |
| 13–19 sn | Kamera masaya iner. İlk kâğıt hafif bir esintiyle havalanır, altına her biri ayrı bir sözcük taşıyan kâğıtlar süzülür. Masa seviyesinden yan takip. |
| 19–23,6 sn | Yığın hızlanarak büyür: santimetreler, bir metre, birkaç metre. Önce alçak açı, sonra geri çekilen geniş plan. Kule tavana ulaşır ve karanlıkta şehre geçilir. |
| 23,6–28 sn | Gece şehri. Kule meydanda katman katman yükselir, kamera yanından tırmanır, sokak, araçlar ve ağaçlar küçülür. Müziğin zirvesinde durulur ve bir an sessizlik olur. |
| 28–36 sn | Nehir üzerinden geniş açı: kâğıt kulesi ile 59 katlı gökdelen yan yana. Kamera tabandan tepeye eğilir, yavaş bir orbit yapar. İki çatıyı bağlayan ince altın ölçü çizgisi görünür, ardından **176 METRE** ve **YAKLAŞIK 59 KAT** yazıları gelir. |
| 36–42 sn | Kulenin zirvesi. En üstteki "sözcük" kâğıdı rüzgârla ayrılır, ağır çekimde kameraya süzülür, objektifi kapatır. Siyah zeminde altın **SÖZLÜKDEUS** yazısı ve "Her kelimede yeni bir dünya." sözü belirir. |

## Dürüst notlar ve sınırlamalar

- **Marka adı:** Brifte hem "Sözcükdeus" hem "SÖZLÜKDEUS" geçiyor. Sayfa @sozlukdeus olduğu için yazıda ve anlatımda **Sözlükdeus** kullanıldı. Değiştirmek için `kule/config.py` içindeki `BRAND` ve `BRAND_SPOKEN` satırlarını düzenleyip yeniden üretmek yeter. Projede yüklenmiş bir logo dosyası bulunmadığı için brifteki gibi sade bir yazı-logo kullanıldı.
- **Kulenin tabanı:** Yükseklik birebir doğru (1.756.396 × 0,1 mm = 175,64 m). Kütüphanedeki yığın gerçek A4 boyutunda. Şehirdeki kulenin tabanı ise A4'ün 20 katı (4,2 × 5,9 m) olarak büyütüldü. Gerçek A4 genişliğinde bir sütun, iki yapının birlikte göründüğü mesafeden birkaç pikselden ince kalırdı. Brifte de belirtildiği gibi bu görsel bir düşünce deneyi.
- **Kat yüksekliği:** 59 kat × 2,98 m = 176 m. Gökdelen bu ölçüyle modellendi.
- **Çözünürlük:** Sahneler 648 × 1152'de path-trace edilip 1080 × 1920'ye Lanczos ile büyütüldü. GPU'suz, 4 çekirdekli bu ortamda bir kare 25–50 saniye sürüyor, yani 1000 kare saatler alıyor. 2160 × 3840 ana render bu donanımda pratik değildi. Daha güçlü bir makinede `--scale` değeri artırılarak (1.0 = 1080p, 2.0 = 4K) aynı proje doğrudan yüksek çözünürlükte render edilebilir.
- **Ses:** Anlatım yerel bir TTS modeliyle üretildi. Doğal ve anlaşılır, ancak profesyonel bir seslendirme sanatçısının nüansını taşımıyor. Yayından önce dinlenmesi önerilir. `output/seslendirme.wav` gerçek bir sesle kolayca değiştirilebilir (zaman çizelgesi `kule/config.py` içinde).
- **Rakam:** 1.756.396, TDK *Türkçe Sözlük* 12. baskısının (2023) metnindeki toplam sözcük sayısıdır, farklı madde sayısı değildir. Sözlükte 82.135 madde başı vardır. Video bu ayrımı korur ve sayacın altında "SÖZCÜK" yazar.

## Yeniden üretme

Gereksinimler: Python 3.13, ffmpeg (rubberband filtresiyle) ve şu paketler:
`pip install bpy sherpa-onnx soundfile scipy numpy pillow fonttools OpenEXR opencv-python-headless`.
Ses modeli ilk çalıştırmada GitHub'dan indirilir.

```bash
cd kule
python3 voice.py                                   # seslendirme  -> output/seslendirme.wav
python3 assets/textures.py                         # yazılı dokular
python3 blender/render.py library --scale 0.6 --spp 12
python3 blender/render.py city    --scale 0.6 --spp 12
python3 score.py                                   # müzik, efekt, ön-miks
python3 post/compose.py                            # renk, yazılar, MP4
```

Hızlı deneme için: `python3 blender/render.py city --scale 0.2 --spp 8 --frames 700,800 --out build/test`
