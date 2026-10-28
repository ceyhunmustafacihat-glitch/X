// Shared timeline (seconds). Read by the animation and by audio/compose.py,
// so keep this a plain JSON object literal. Caption and cue times are relative
// to the start of their scene; "*word*" marks a highlighted word. Scenes with
// a "title" are plain chapter pages.
window.TIMELINE = {
  "duration": 171.8,
  "fps": 30,
  "scenes": [
    {
      "id": "title",
      "start": 0.0,
      "end": 5.6,
      "caps": [],
      "cues": {
        "ink": 0.3,
        "name": 1.2,
        "years": 2.0,
        "tag": 2.6
      }
    },
    {
      "id": "birth",
      "start": 5.6,
      "end": 16.4,
      "caps": [
        [
          0.8,
          5.2,
          "William Golding, 19 Eylül 1911'de İngiltere'nin Cornwall bölgesindeki *Newquay*'de doğdu."
        ],
        [
          5.6,
          10.4,
          "Ancak çocukluğunun büyük bölümünü ailesiyle birlikte Wiltshire'daki *Marlborough*'da geçirdi."
        ]
      ],
      "cues": {
        "zoom": 0.6,
        "pin": 3.8,
        "baby": 4.5,
        "move": 5.8,
        "house": 7.6
      }
    },
    {
      "id": "family",
      "start": 16.4,
      "end": 31.0,
      "caps": [
        [
          0.6,
          5.2,
          "Babası *Alec Golding*, fen bilgisi öğretmeniydi. Bilime ve akılcı düşünceye sıkı sıkıya bağlıydı."
        ],
        [
          5.5,
          10.0,
          "Annesi *Mildred Golding*, kadınların oy hakkını savunan ve kadın hakları için çalışan biriydi."
        ],
        [
          10.3,
          14.2,
          "Bir de kendisinden *5 yaş* büyük, Jose adında bir ağabeyi vardı."
        ]
      ],
      "cues": {
        "alec": 0.5,
        "mildred": 5.4,
        "jose": 10.2,
        "baby": 11.6
      }
    },
    {
      "id": "ch_youth",
      "start": 31.0,
      "end": 33.4,
      "title": "ÇOCUKLUK VE|GENÇLİK YILLARI",
      "caps": [],
      "cues": {}
    },
    {
      "id": "house",
      "start": 33.4,
      "end": 45.8,
      "caps": [
        [
          0.5,
          5.4,
          "Ailenin evi bir kilise *mezarlığının* hemen yanındaydı. Küçük William bu mezarlıktan çok korkardı."
        ],
        [
          5.9,
          12.0,
          "Evin karanlık *bodrumu* ise onu en çok korkutan yerdi."
        ]
      ],
      "cues": {
        "owl": 1.6,
        "cellar": 5.6,
        "eyes": 7.6,
        "jump": 9.6
      }
    },
    {
      "id": "school",
      "start": 45.8,
      "end": 63.6,
      "caps": [
        [
          0.5,
          5.4,
          "İlkokulda sosyal açıdan rahat bir çocuk değildi. İletişim kurmakta zorlanır, sık sık *kavgalara* karışırdı."
        ],
        [
          5.8,
          11.4,
          "*8 yaşındayken* okul başarısı için aldığı kitabı gururla taşıdı. Onaylanmaya karşı çok hassastı."
        ],
        [
          11.8,
          17.5,
          "*10 yaşında* Marlborough Grammar School'a başladı. Babası da aynı okulda fen bilgisi öğretmeniydi."
        ]
      ],
      "cues": {
        "fight": 1.4,
        "book": 6.0,
        "proud": 6.9,
        "class": 11.6,
        "wink": 14.6
      }
    },
    {
      "id": "ch_oxford",
      "start": 63.6,
      "end": 65.8,
      "title": "OXFORD YILLARI",
      "caps": [],
      "cues": {}
    },
    {
      "id": "oxford",
      "start": 65.8,
      "end": 77.4,
      "caps": [
        [
          0.5,
          5.8,
          "Oxford'da doğa bilimleri okumaya başladı. Bu bölümü babasını memnun etmek için seçtiğini kendisi de kabul ediyordu."
        ],
        [
          6.2,
          11.3,
          "Bölümün kendisine uymadığını fark edince *İngiliz dili ve edebiyatına* geçti."
        ]
      ],
      "cues": {
        "bubble": 1.6,
        "poof": 6.6
      }
    },
    {
      "id": "dark",
      "start": 77.4,
      "end": 86.4,
      "caps": [
        [
          0.5,
          3.0,
          "Hayatının karanlık bir sayfası da var."
        ],
        [
          3.3,
          8.7,
          "Kendi yazdığı anılarına göre 18 yaşındayken, bir tatilde, 15 yaşındaki Dora adlı bir kıza *tecavüz etmeye çalıştı*."
        ]
      ],
      "cues": {
        "page": 0.4,
        "blot": 3.4
      }
    },
    {
      "id": "love",
      "start": 86.4,
      "end": 98.0,
      "caps": [
        [
          0.5,
          3.6,
          "Oxford'dan mezun olunca *Molly Evans* ile nişanlandı."
        ],
        [
          3.9,
          8.0,
          "Ardından kimyager *Ann Brookfield* ile tanıştı. Ann'in de bir nişanlısı vardı."
        ],
        [
          8.3,
          11.3,
          "İkisi de nişanını bozdu ve *1939*'da evlendiler."
        ]
      ],
      "cues": {
        "ring": 0.8,
        "meet": 3.9,
        "spark": 5.6,
        "break": 8.3,
        "wed": 9.4
      }
    },
    {
      "id": "ch_teacher",
      "start": 98.0,
      "end": 100.2,
      "title": "ÖĞRETMENLİK|YILLARI",
      "caps": [],
      "cues": {}
    },
    {
      "id": "teacher",
      "start": 100.2,
      "end": 110.8,
      "caps": [
        [
          0.5,
          4.4,
          "Golding, öğrencilerinin davranışlarını çok dikkatli gözlemleyen bir öğretmendi."
        ],
        [
          4.7,
          10.3,
          "Bir okul gezisinde öğrencileri ikiye ayırdı: Bir grup savunurken diğeri saldırdı. O ise *izledi*."
        ]
      ],
      "cues": {
        "write": 1.2,
        "split": 4.6,
        "charge": 6.0,
        "clash": 8.0
      }
    },
    {
      "id": "ch_war",
      "start": 110.8,
      "end": 113.0,
      "title": "İKİNCİ DÜNYA|SAVAŞI",
      "caps": [],
      "cues": {}
    },
    {
      "id": "war",
      "start": 113.0,
      "end": 133.8,
      "caps": [
        [
          0.5,
          4.5,
          "İngiliz *Kraliyet Donanması*'na er olarak katıldı."
        ],
        [
          4.8,
          9.0,
          "Subaylık için başvurdu ve *teğmenliğe* kadar yükseldi."
        ],
        [
          9.3,
          14.6,
          "Almanların dev savaş gemisi *Bismarck*'ın takip edilip batırıldığı operasyonda yer aldı."
        ],
        [
          14.9,
          20.4,
          "Gördükleri, insanın doğuştan iyi ve medeni olduğuna dair *iyimser düşünceyi* terk etmesine yol açtı."
        ]
      ],
      "cues": {
        "horn": 0.9,
        "rank1": 5.2,
        "rank2": 6.5,
        "rank3": 7.8,
        "chase": 9.3,
        "fire": [
          10.4,
          11.2,
          12.0,
          12.7
        ],
        "sink": 13.1,
        "ruins": 14.9
      }
    },
    {
      "id": "ch_hard",
      "start": 133.8,
      "end": 136.0,
      "title": "SAVAŞ SONRASI|ZOR ZAMANLAR",
      "caps": [],
      "cues": {}
    },
    {
      "id": "hard",
      "start": 136.0,
      "end": 149.8,
      "caps": [
        [
          0.5,
          3.9,
          "1970'lerde ciddi bir *yazma tıkanıklığı* yaşadı."
        ],
        [
          4.2,
          8.3,
          "Sağlık sorunlarıyla boğuşuyordu. Alkol kullanımı giderek arttı ve *alkolizme* dönüştü."
        ],
        [
          8.6,
          13.4,
          "Bir gece arkadaşının evinde uyandığında *Bob Dylan* kuklasını şeytan sandı ve ona saldırdı!"
        ]
      ],
      "cues": {
        "type": 0.8,
        "crumple": 2.8,
        "bottles": [
          4.6,
          5.2,
          5.8,
          6.4
        ],
        "wake": 8.8,
        "gasp": 10.4,
        "attack": 11.8
      }
    },
    {
      "id": "ch_last",
      "start": 149.8,
      "end": 152.0,
      "title": "SON YILLAR",
      "caps": [],
      "cues": {}
    },
    {
      "id": "honors",
      "start": 152.0,
      "end": 162.4,
      "caps": [
        [
          0.5,
          3.8,
          "*1983*'te Nobel Edebiyat Ödülü'nü kazandı."
        ],
        [
          4.2,
          10.0,
          "*1988*'de Kraliçe II. Elizabeth tarafından şövalye ilan edildi ve *Sir William Golding* unvanını aldı."
        ]
      ],
      "cues": {
        "medal": 0.6,
        "clap": 1.4,
        "kneel": 4.2,
        "tap1": 5.8,
        "tap2": 6.8,
        "sir": 7.8
      }
    },
    {
      "id": "end",
      "start": 162.4,
      "end": 171.8,
      "caps": [
        [
          0.5,
          5.4,
          "*81 yaşındayken*, 19 Haziran 1993'te Cornwall'daki evinde kalp yetmezliği nedeniyle hayatını kaybetti."
        ]
      ],
      "cues": {
        "card": 5.6
      }
    }
  ]
};
