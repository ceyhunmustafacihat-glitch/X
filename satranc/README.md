# Satranç Tahtası

Instagram Reels / TikTok / Shorts için 9:16 dikey (1080 × 1920), 113 saniyelik (1:53), **döngülü (loop)** eğitim videosu.
Tüm yazılar **Montserrat** ile, tüm ses efektleri koddan sentezlendi (telif sorunu yok).

Videonun tamamı logonun iki rengi ve onların tonlarından oluşur: kahverengi (**#4E3220**) ve piyonun altını (**#E2C890 → #C9A86E**). Arka plan, geçiş kartları ve gölgeler kahve tonlarında; vurgular altın, karamel, krem ve koyu çikolata tonlarıyla, gerekirse tahtanın geri kalanı karartılarak yapılır (şah kanadı krem, vezir kanadı koyu çikolata).

**Video:** [`output/satranc_tahtasi.mp4`](output/satranc_tahtasi.mp4)
H.264 High, 1080×1920, 30 fps, yuv420p, AAC 48 kHz stereo.

![Storyboard](docs/storyboard.jpg)

Kapak fotoğrafı (9:16, 1080 × 1920): [`docs/kapak_foto.png`](docs/kapak_foto.png). Kaynağı `cover/cover.html`; yeniden üretmek için `node cover/render.mjs`.

## Akış

| Zaman | Bölüm | Görüntü | Ses |
|---|---|---|---|
| 0–3 sn | Kapak | **SATRANÇ TAHTASI**, bölüm geçişleriyle aynı başlık stilinde | Başlık vuruşu, ışıltı |
| 3–7 sn | Ara başlık | **TAHTANIN YAPISI**: kapak yazısı kayarak çıkarken bu başlık kayarak girer | Whoosh + vuruş |
| 7–13 sn | Tahtanın yapısı | Tahta kare kare çapraz dalga hâlinde kurulur. “Birbirini takip eden açık ve koyu renkli karelerden oluşan, kare biçiminde bir oyun alanı” | Ahşap “tok” sesleri |
| 13–20 sn | | 1’den 64’e sayaç, kareler tek tek numaralanır: **64 KARE** | Yükselen tıkırtılar, ding |
| 20–23 sn | | 8 yatay sıra (satır) alttan üste parlar | Swish + nota |
| 23–26 sn | | 8 dikey sütun soldan sağa parlar | Swish + nota |
| 26–29 sn | | Önce 32 açık, sonra 32 koyu kare öne çıkar: **32 + 32** | Pop sesleri |
| 29–34 sn | Ara başlık | **TAHTANIN KONUMLANDIRILMASI**: şah ve vezir çarpışır, kareler yayılır | Swish, tahta “tak”, vuruş |
| 34–39 sn | Konumlandırma | “Her karenin kendine özgü bir koordinatı vardır.” a–h harfleri ve 1–8 sayıları yerleşir | Tıklar |
| 39–44 sn | | Sütunlar harflerle (a–h), satırlar sayılarla (1–8) | Süpürme |
| 44–50 sn | | a1 → a2 → … → a8 yürüyüşü | Yükselen tok sesleri |
| 50–56 sn | | e sütunu × 4. satır = **e4** | Swish, ding |
| 56–61 sn | | Tüm 64 karenin adı dalga hâlinde görünür | Işıltı |
| 61–70 sn | Önemli kural | “Sağ alt köşedeki kare mutlaka açık renkli olmalıdır.” Tahta kararır, **h1** parlar, “SAĞ ALT = AÇIK KARE ✓” | Uyarı, onay sesi |
| 70–77 sn | Ara başlık | **TAHTANIN BÖLGELERİ**: şah ve vezir çarpışır, kareler yayılır | Swish, tahta “tak”, vuruş |
| 77–83 sn | Bölgeler | Merkez kareler: **d4, e4, d5, e5** (altın) | Pop, ding |
| 83–89 sn | | Genişletilmiş merkez: c6, c5, c4, c3, d3, e3, f3, f4, f5, f6, e6, d6 (karamel) | Pop dizisi |
| 89–96 sn | | **Şah kanadı**: e, f, g, h sütunları (krem), şah figürü, e1 f1 g1 h1 | Süpürme, akor |
| 96–108 sn | | **Vezir kanadı**: a, b, c, d sütunları (koyu çikolata), vezir figürü, a1 b1 c1 d1, ortadan ayıran çizgi | Süpürme, akor |
| 108–110 sn | Kapanış | “Tahta bu kadar! Artık satranç tahtasını tanıyorsun.” | Onay sesi |
| 110–112 sn | Döngü | Tahta dağılır, kapak başlığı geri gelir. Son kare = ilk kare | Whoosh → (başa dönünce) başlık vuruşu |

Ana başlık geçişlerinde (Tahtanın Yapısı, Konumlandırılması, Bölgeleri) iki satranç taşı (şah ve vezir) ekranın iki yanından gelip ortada çarpışır: ekran sarsılır, altın bir ışık ve şok halkası yayılır, kare kırıntıları saçılır ve kareler çarpışma noktasından dışa doğru dönerek yerine oturur (açılışta kapak kareleri ters yüz olur). Başlığın çıkışı ve döngü sonunda kapağın geri gelişi gibi diğer geçişler yumuşak kararma/açılmadır. Kapak yazısının altındaki çizgi kaldırıldı.

Her metin tamamen göründükten sonra okunabilmesi için ekranda bekletilir (toplam ~34 sn okuma payı); ara başlıklarda alt çizgi yoktur.

Döngü kusursuzdur: kapak başlığı tam 112,8. saniyede yerine oturur ve video 0. saniyedeki kareyle devam eder.
Arka plan deseni ve fon sesi tam olarak video süresiyle periyodiktir; ses efektlerinin ve yankının kuyrukları başa sarılır, bu yüzden geçişte çıt ya da boşluk duyulmaz.

## Not: koordinatlar

Satranç notasyonunda **sütunlar (dikey) a–h harfleriyle**, **satırlar (yatay) 1–8 sayılarıyla** adlandırılır; kare adı “sütun harfi + satır numarası” şeklinde okunur (a1, e4, h8…).
Videoda bu standart kullanıldı.

## Yapı

```
anim/
  index.html     önizleme oynatıcısı (oynat/duraklat, zaman çubuğu, ses, döngü)
  timeline.js    fps ve süre
  scene.js       tüm sahneler (zamanın saf fonksiyonu) + ses efekti işaretleri (buildCues)
  fonts/         Montserrat (latin + latin-ext, Türkçe karakterler)
audio/compose.py   ses efektleri ve fon sentezi (yalnızca numpy), döngüye uygun dairesel miks
render/render.mjs  işaretleri dışa aktarır, kareleri Chromium ile çizer, sesi üretir, ffmpeg ile MP4
render/stills.mjs  belirli saniyelerden PNG almak için
```

## Yeniden üretme

Gereksinimler: Node 22 + Playwright (Chromium), Python 3 + numpy, ffmpeg.

```bash
cd satranc
node render/render.mjs                  # kareler + ses + output/satranc_tahtasi.mp4
node render/render.mjs --encode-only 1  # yalnızca ses/kodlama değiştiyse
node render/stills.mjs 10 37.5 46       # tek tek kare önizlemesi
```

Önizleme: depo kökünden `npx http-server .` çalıştırıp `/satranc/anim/` adresini açın.

## Seslendirme eklemek isterseniz

Ekrandaki metinler seslendirme metni olarak kullanılabilir; zamanlamalar yukarıdaki tabloda.
Kendi sesinizi ekledikten sonra efektleri biraz kısmak için `audio/compose.py` içindeki `GAIN` değerlerini düşürebilirsiniz.
