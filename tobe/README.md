# TO BE: am · is · are (anlatıcısız illüstrasyonlu ders videosu)

İngilizcedeki **to be** fiilini olumlu, olumsuz, soru ve olumsuz soru yapılarıyla, örneklerle ve sık yapılan tuzaklarla anlatan
16:9 (1920 × 1080), 30 fps, yaklaşık 5,5 dakikalık ders videosu. Anlatıcı sesi yok. Her şey ekrandaki metin, renkli kelime
blokları ve animasyonla anlatılıyor. Arkada sakin bir fon müziği ve ses efektleri var.

**Video:** [`output/to_be_ders.mp4`](../output/to_be_ders.mp4)

## Renk kodu

Videodaki her kelime bloğu cümledeki görevine göre renklenir. Böylece kelimelerin yer değiştirmesi gözle takip edilebilir.

| Renk | Görev |
|---|---|
| Mavi | Özne (I, you, he, she...) |
| Turuncu | to be (am / is / are) |
| Kırmızı | not / n't |
| Yeşil | Cümlenin devamı |
| Mor | Soru kelimesi (where, what, who...) |

## Bölümler

| Zaman | Bölüm | İçerik |
|---|---|---|
| 0:00 | Giriş | TO BE, am · is · are, dört yapı |
| 0:09 | 1 · To be nedir? | Türkçedeki *-im, -sin, -dir* ekleri ile karşılaştırma. Meslek, duygu, yer, yaş örnekleri |
| 0:31 | 2 · Kim, hangisini alır? | I → am · he/she/it → is · you/we/they → are. İpuçları: *you* tek kişi için de *are* alır. Tekil isim *is*, çoğul isim *are* alır |
| 0:57 | 3 · Kısaltmalar | I'm, you're, he's, she's, it's, we're, they're |
| 1:14 | Olumlu (+) | Özne + am/is/are + devamı |
| 1:37 | Olumsuz (−) | *not* cümlenin içine düşer, *is not* → *isn't* olur. Tuzak: *amn't* yoktur, *I'm not* kullanılır |
| 2:05 | Soru (?) | *are* öznenin üstünden atlayıp başa geçer. Kısa cevaplar. Tuzak: *Yes, I'm.* olmaz |
| 2:37 | Olumsuz soru (−?) | *Is she not…?* → *Isn't she…?* Kısaltma özneden önce gelir. *Aren't I?* istisnası. Cevap gerçeğe göre verilir (*Isn't it cold? → Yes, it is.*) |
| 3:19 | Soru kelimeleriyle | Where / What / Who / How old + am/is/are |
| 3:36 | Bonus: question tags | *She is nice, isn't she?*  ·  *I am right, aren't I?* |
| 3:57 | Sık yapılan hatalar | *She happy*, *I have 20 years*, *I am agree*, *My friends is* |
| 4:19 | Özet | Dört yapı tek tabloda |
| 4:37 | Mini test | 6 boşluk doldurma sorusu, 4 saniyelik geri sayım, ardından cevap |
| 5:28 | Kapanış | Tebrikler! |

## Yapı

```
tobe/
  index.html   önizleme oynatıcısı (oynat/duraklat, zaman çubuğu, ses)
  engine.js    çizim motoru: kelime blokları ve dönüşüm animasyonları, zengin metin, karakterler, baykuş, ikonlar
  scenes.js    dersin kendisi: her sahnenin içeriği, zamanlaması ve ses efekti işaretleri
  compose.py   fon müziği ve ses efektleri sentezi (numpy)
  render.mjs   Chromium ile kare kare render, ses ve ffmpeg ile MP4
```

Bir cümlenin bir yapıdan diğerine dönüşmesi (`track` / `morph`) kelime kimliklerine göre hesaplanır. Örneğin
`'You:s|are:b|tired:r|.:p'` → `'Are:b!|you:s|tired:r|?:p'` geçişinde *are* bloğu (`!` işareti) öznenin üstünden atlayarak başa geçer.
`<n0` işareti, *not* bloğunun kısaltmaya karışarak *isn't* hâline gelmesini sağlar.

## Yeniden üretme

Gereksinimler: Node 22 ve Playwright (Chromium), Python 3 ve numpy, ffmpeg.

```bash
npm install
node tobe/render.mjs                       # kareler, ses ve output/to_be_ders.mp4
node tobe/render.mjs --stills 20,95,180    # yalnızca belirli saniyelerden PNG (tobe/build/)
node tobe/render.mjs --encode-only 1       # kareleri yeniden çizmeden sesi ve videoyu yeniden üret
```

Önizleme için depo kökünden bir sunucu başlatın (`npx http-server .`) ve `/tobe/` adresine gidin.
Müzik ve efektler bu proje için sentezlendi. Telif sorunu yoktur.
