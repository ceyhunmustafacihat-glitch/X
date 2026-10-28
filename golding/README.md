# William Golding — Bir Yazarın Hayatı

Instagram Reels için 9:16 dikey (1080 × 1920), **2 dakika 57 saniyelik** illüstrasyon tarzında biyografi animasyonu. Tüm yazılar Montserrat ile yazıldı.
Seslendirme yok; anlatımı kısa, okunaklı altyazı kartları taşıyor. Filigran, kullanıcı adı ya da logo yok.

**Video:** [`output/william_golding_reels.mp4`](output/william_golding_reels.mp4)
H.264 High, 1080×1920, 30 fps, yuv420p, AAC 48 kHz stereo.

![Storyboard](docs/storyboard.png)

## Sahne akışı

| Zaman | Bölüm | Görüntü ve anlatım |
|---|---|---|
| 0:00 | Açılış | Madalyon portre. Kurumsal yazı: WILLIAM GOLDING · 1911 – 1993 · NOBEL ÖDÜLLÜ İNGİLİZ YAZAR |
| 0:06 | Doğum | Britanya haritası (bölge adlarıyla), Cornwall'a yakınlaşma, "19 EYLÜL 1911" damgası, Newquay |
| 0:16 | Ailesi | Fen öğretmeni baba Alec, oy hakkı savunucusu anne Mildred, 5 yaş büyük ağabey Jose, bebek William |
| 0:30 | Çocukluk | Marlborough'daki 29 numaralı ev ve arkasındaki kilise mezarlığı; bahçe duvarına yaslanan mezar taşları; çimlere basmamak için kestane ağacına tırmanan William; ömür boyu kâbuslarına giren bodrum |
| 0:45 | Okul yılları | Kavga ve zorbalık, gururla taşınan hediye kitap, Marlborough Grammar School'da fen öğretmeni olan babası |
| 1:01 | Oxford | Brasenose Koleji, 1930'da doğa bilimleri, iki yıl sonra İngiliz edebiyatı; 1934'te ilk kitabı *Poems* |
| 1:14 | Karanlık bir itiraf | Eşi için yazdığı anılarına göre 18 yaşında, Oxford'daki ilk yılında Dora'ya tecavüz girişimi; 2009 biyografisiyle ortaya çıkışı. Olay canlandırılmıyor |
| 1:26 | Aşk | Molly Evans ile nişan, kimyager Ann Brookfield, iki nişanın bozulması ve 1939'daki evlilik |
| 1:38 | Öğretmenlik | Salisbury, Bishop Wordsworth's School; Figsbury Ring gezisinde suru savunan ve saldıran iki grup |
| 1:49 | İkinci Dünya Savaşı | 1940'ta er olarak Kraliyet Donanması'na katılış; teğmenliğe yükseliş; Bismarck'ın batırılışı; D-Day'de (6 Haziran 1944) roket atan çıkarma gemisinin komutanı; "İnsan, arının bal yapması gibi kötülük üretir." |
| 2:18 | Zor zamanlar | 1970'lerdeki yazma tıkanıklığı ve alkol; yazar arkadaşının evinde Bob Dylan kuklasını şeytan sanıp saldırması ve onu bahçeye gömmesi |
| 2:34 | Son yıllar | 1980 Booker, 1983 Nobel; 1988'de II. Elizabeth tarafından şövalye ilan edilişi |
| 2:47 | Veda | 19 Haziran 1993, Perranarworthal, kalp yetmezliği; kapanış portresi |

## Bilgilerin doğrulanması

Notlardaki bilgiler biyografi kaynaklarıyla karşılaştırıldı (John Carey'nin 2009 tarihli *William Golding: The Man Who Wrote Lord of the Flies* biyografisi ile bu kitap üzerine yazılan haber ve eleştiriler, Brasenose Koleji ve Bishop Wordsworth's School sayfaları, Golding vakfının sitesi).

**Düzeltilenler**
- **Dora:** Golding 18 yaşındaydı ve olay Oxford'daki ilk yılında, eve döndüğü bir dönemde yaşandı. Olay, eşi Ann için yazdığı yayımlanmamış anılarda geçiyor ve 2009'daki biyografiyle ortaya çıktı. Dora'nın yaşı kaynaklarda 15 ile 16 arasında değiştiği için videoda yazılmadı.
- **Mezarlıklı ev:** Bu ev Newquay'de değil, Wiltshire'daki Marlborough'da, 29 The Green adresindeydi. Arkası St Mary's Kilisesi'nin mezarlığına bakıyordu. Golding doğduğunda Newquay'deydi, aile Marlborough'da yaşıyordu.
- **Yazımlar:** Doğru yazımlar Perranarworthal ve Ann Brookfield. Ağabeyin asıl adı Joseph, ailede "Jose" diye çağrılıyordu.
- **Kukla:** Olay yazar Andrew Sinclair'in evinde geçti. Golding sonunda kuklayı bahçeye gömdü.

**Eklenenler**
- Mezar taşlarının bahçe duvarına yaslanması ve çimlere basmamak için kestane ağacına tırmanması. Bodrum ömür boyu kâbuslarına girdi.
- Okulda kavgaların yanında akranlarına zorbalık ettiği de kayıtlı.
- Brasenose Koleji ve 1934'te çıkan ilk kitabı *Poems*.
- Bishop Wordsworth's School ve Figsbury Ring gezisi.
- D-Day'de roket atan bir çıkarma gemisine, yani LCT(R)'ye komuta etmesi.
- 1980 Booker Ödülü (*Rites of Passage*).

**Doğrulanamayanlar**
- Okul başarısı için hediye edilen kitap ve onaylanmaya olan hassasiyet notlarınızdan alındı; bulduğum kaynaklarda geçmiyor.
- Figsbury Ring gezisi tek bir anı yazısına dayanıyor.

## Yapı

Her kare koddan çiziliyor; hazır görsel ya da ses dosyası kullanılmadı. Karakterlerin ayaklarının altında gölge var, tabelalardaki yazılar sığacak şekilde ölçekleniyor. Çizgiler saniyede 8 kez hafifçe titriyor (“line boil”); el çizimi animasyon hissi buradan geliyor. Üstüne sabit bir kâğıt dokusu ekleniyor.

```
animation/
  index.html    önizleme oynatıcısı (oynat/duraklat, zaman çubuğu, ses)
  timeline.js   sahneler, altyazılar ve ses ipuçları (görüntü ve sesin ortak zaman çizelgesi)
  core.js       matematik, renk paleti, katmanlar, kâğıt dokusu, titreyen mürekkep çizgileri
  person.js     tek bir parametrik karakter: bebekten sakallı Nobel ödüllüsüne tüm kadro
  captions.js   bölüm etiketi, altyazı kartları (kelime kelime belirir), alıntı kartı, kurumsal isim bloğu
  scenes1.js    açılış, doğum (harita), aile, Marlborough'daki ev ve bodrum
  scenes2.js    okul, Oxford, itiraf, aşk, öğretmenlik
  scenes3.js    savaş (D-Day dahil), zor zamanlar, ödüller, veda
  main.js       sahne geçişleri, kâğıt dokusu, vinyet
audio/compose.py   sahne sahne müzik ve efekt sentezi
render/render.mjs  Chromium ile kare kare render ve ffmpeg ile MP4
render/stills.mjs  belirli saniyelerden PNG almak için
```

Altyazıları değiştirmek için `animation/timeline.js` dosyasını düzenlemeniz yeterli. `*kelime*` vurgulu yazılır, zamanlar sahnenin başına göredir.

## Yeniden üretme

Gereksinimler: Node 22 ve Playwright (Chromium), Python 3 (`pip install -r ../audio/requirements.txt`), ffmpeg. Komutlar depo kökünden çalıştırılır.

```bash
python3 golding/audio/compose.py                  # golding/output/soundtrack.wav
node golding/render/render.mjs                     # kareler ve golding/output/william_golding_reels.mp4
node golding/render/render.mjs --encode-only 1     # yalnızca sesi değiştirdiyseniz
```

Önizleme için depo kökünden bir sunucu başlatın (`npx http-server .`) ve `/golding/animation/` adresine gidin.

## Instagram notları

- Altyazı kartları ekranın orta-alt bölümünde (y ≈ 1260–1500) ve sağdaki Reels düğmelerinden uzak tutuldu. Alt %20'lik kısma önemli bir şey yerleştirilmedi.
- Süre 2:57, yani Reels'in 3 dakikalık sınırının altında.
- Müzik tamamen bu proje için sentezlendi; telif sorunu yoktur.
