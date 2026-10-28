// Video script: scenes, pages and items with their appear times (seconds,
// relative to the scene start). Read by the animation (engine.js) and by
// audio/compose.py for the sound effects, so keep this strict JSON.
// Rich text: {key|text} colours a span. Keys: am, is, are, y (highlight),
// r (red), g (green), m (muted), w (white bold).
window.SCRIPT = {
  "fps": 30,
  "duration": 127.0,
  "scenes": [
    { "kind": "intro", "start": 0.0, "end": 5.5 },

    { "kind": "content", "start": 5.5, "end": 16.0, "pill": "GİRİŞ", "title": "To be nedir?",
      "pages": [[
        { "type": "big", "at": 1.9, "text": "to be = {y|olmak}" },
        { "type": "note", "at": 3.0, "text": "Şimdiki zamanda Türkçedeki {y|-(y)ım, -sın, -dır} eklerinin karşılığıdır." },
        { "type": "example", "at": 5.0, "en": "I {am|am} tired.", "tr": "Ben yorgun{y|um}." },
        { "type": "example", "at": 6.8, "en": "It {is|is} a book.", "tr": "O bir kitap{y|tır}." }
      ]] },

    { "kind": "content", "start": 16.0, "end": 36.0, "section": 1, "title": "Özneler ve Kısaltmalar",
      "pages": [[
        { "type": "cols", "at": 1.9, "cols": ["ÖZNE", "FİİL", "KISALTMA"] },
        { "type": "conj", "at": 2.2, "subj": ["I"], "verb": "am", "short": ["I'm"] },
        { "type": "conj", "at": 3.2, "subj": ["He", "She", "It"], "verb": "is", "short": ["He's", "She's", "It's"] },
        { "type": "conj", "at": 4.2, "subj": ["You", "We", "They"], "verb": "are", "short": ["You're", "We're", "They're"] },
        { "type": "note", "at": 6.4, "text": "{am|am} yalnızca {w|I} ile kullanılır." }
      ], [
        { "type": "note", "at": 10.2, "text": "Tekil özne → {is|is}     Çoğul özne → {are|are}" },
        { "type": "example", "at": 11.6, "en": "It {is|is} a cat.", "tr": "O bir kedi." },
        { "type": "arrow", "at": 13.0 },
        { "type": "example", "at": 13.4, "en": "They {are|are} cat{y|s}.", "tr": "Onlar kedi(ler)." },
        { "type": "note", "at": 15.4, "text": "cat{y|s} → çoğul eki.   It{is|'s} → {is|is} kısaltması." }
      ]] },

    { "kind": "content", "start": 36.0, "end": 51.0, "section": 2, "title": "Olumlu Cümle",
      "pages": [[
        { "type": "chips", "at": 1.9, "parts": ["Özne", "{am|am} / {is|is} / {are|are}", "…"] },
        { "type": "example", "at": 3.6, "en": "I {am|am} a gamer.", "tr": "Ben bir oyuncuyum." },
        { "type": "example", "at": 5.6, "en": "She {is|is} happy.", "tr": "O mutlu." },
        { "type": "example", "at": 7.6, "en": "We {are|are} ready.", "tr": "Hazırız." },
        { "type": "note", "at": 9.8, "text": "Tekil isimden önce {y|a / an} unutma: I am {y|a} gamer." }
      ]] },

    { "kind": "content", "start": 51.0, "end": 70.0, "section": 3, "title": "Olumsuz Cümle",
      "pages": [[
        { "type": "chips", "at": 1.9, "parts": ["Özne", "{am|am} / {is|is} / {are|are}", "{r|not}"] },
        { "type": "swap", "at": 3.2, "move": 1.0,
          "tokens": [{ "a": "She", "b": "She", "o": 0 }, { "a": "is", "b": "is", "k": "is", "o": 1 },
                     { "b": "not", "k": "r", "o": 2 }, { "a": "happy.", "b": "happy.", "o": 3 }],
          "trA": "O mutlu.", "trB": "O mutlu değil." },
        { "type": "contract", "at": 6.0, "a": "I am not", "b": "I'm not", "k": "am", "mark": "ok" },
        { "type": "example", "at": 7.2, "en": "I amn't", "tr": "Böyle bir kısaltma yok!", "mark": "no" },
        { "type": "contract", "at": 8.4, "a": "is not", "b": "isn't", "k": "is" },
        { "type": "contract", "at": 9.2, "a": "are not", "b": "aren't", "k": "are" }
      ], [
        { "type": "example", "at": 11.6, "en": "I{am|'m not} hungry.", "tr": "Aç değilim." },
        { "type": "example", "at": 13.4, "en": "He {is|isn't} tired.", "tr": "O yorgun değil." },
        { "type": "example", "at": 15.2, "en": "They {are|aren't} at home.", "tr": "Onlar evde değil." }
      ]] },

    { "kind": "content", "start": 70.0, "end": 86.0, "section": 4, "title": "Soru Cümlesi",
      "pages": [[
        { "type": "chips", "at": 1.9, "parts": ["{am|Am} / {is|Is} / {are|Are}", "Özne", "… ?"] },
        { "type": "swap", "at": 3.2, "move": 1.0,
          "tokens": [{ "a": "She", "b": "she", "o": 1 }, { "a": "is", "b": "Is", "k": "is", "o": 0 },
                     { "a": "happy.", "b": "happy?", "o": 2 }],
          "trA": "O mutlu.", "trB": "O mutlu mu?" },
        { "type": "example", "at": 6.6, "en": "{am|Am} I late?", "tr": "Geç mi kaldım?" },
        { "type": "example", "at": 8.6, "en": "{is|Is} he happy?", "tr": "O mutlu mu?" },
        { "type": "example", "at": 10.6, "en": "{are|Are} they ready?", "tr": "Hazırlar mı?" }
      ]] },

    { "kind": "content", "start": 86.0, "end": 103.0, "section": 5, "title": "Kısa Cevaplar",
      "pages": [[
        { "type": "label", "at": 1.9, "text": "OLUMLU CEVAP", "k": "g" },
        { "type": "qa", "at": 2.2, "q": "Are you ready?", "en": "Yes, I {am|am}.", "tr": "Evet, hazırım.", "mark": "ok" },
        { "type": "example", "at": 3.9, "en": "Yes, I'm.", "mark": "no" },
        { "type": "qa", "at": 5.0, "q": "Is he a gamer?", "en": "Yes, he {is|is}.", "tr": "Evet, öyle.", "mark": "ok" },
        { "type": "note", "at": 6.4, "text": "Olumlu kısa cevapta {r|kısaltma yapılmaz}." }
      ], [
        { "type": "label", "at": 9.4, "text": "OLUMSUZ CEVAP", "k": "r" },
        { "type": "qa", "at": 9.7, "q": "Is she happy?", "en": "No, she {is|isn't}.", "tr": "Hayır, değil.", "mark": "ok" },
        { "type": "qa", "at": 11.3, "q": "Are you hungry?", "en": "No, I{am|'m not}.", "tr": "Hayır, değilim.", "mark": "ok" },
        { "type": "note", "at": 13.2, "text": "Olumsuz kısa cevapta {g|kısaltma kullanılır}: isn't, aren't, I'm not." }
      ]] },

    { "kind": "content", "start": 103.0, "end": 119.0, "section": 6, "title": "Olumsuz Soru",
      "pages": [[
        { "type": "chips", "at": 1.9, "parts": ["{is|Isn't} / {are|Aren't}", "Özne", "… ?"] },
        { "type": "swap", "at": 3.2, "move": 1.0,
          "tokens": [{ "a": "Is", "b": "Isn't", "k": "is", "o": 0 }, { "a": "she", "b": "she", "o": 1 },
                     { "a": "happy?", "b": "happy?", "o": 2 }],
          "trA": "O mutlu mu?", "trB": "O mutlu değil mi?" },
        { "type": "example", "at": 6.4, "en": "{are|Aren't} you ready?", "tr": "Hazır değil misin?" },
        { "type": "example", "at": 8.2, "en": "{am|Am} I {r|not} your friend?", "tr": "Arkadaşın değil miyim?" },
        { "type": "note", "at": 10.4, "text": "I ile {r|amn't I} olmaz → {am|Am I not…?}  Günlük dilde: {are|Aren't I…?}" }
      ]] },

    { "kind": "content", "start": 119.0, "end": 127.0, "pill": "ÖZET", "title": "Hepsi bir arada", "titleHold": 0.8, "gap": 14,
      "pages": [[
        { "type": "example", "at": 1.4, "en": "I {am|am} · He {is|is} · We {are|are}", "tr": "Olumlu cümle" },
        { "type": "example", "at": 1.9, "en": "{is|isn't} · {are|aren't} · I{am|'m not}", "tr": "Olumsuz cümle" },
        { "type": "example", "at": 2.4, "en": "{am|Am} I…? {is|Is} he…? {are|Are} they…?", "tr": "Soru cümlesi" },
        { "type": "example", "at": 2.9, "en": "Yes, I {am|am}. · No, she {is|isn't}.", "tr": "Kısa cevaplar" },
        { "type": "example", "at": 3.4, "en": "{is|Isn't} she…? · {are|Aren't} you…?", "tr": "Olumsuz soru" },
        { "type": "cta", "at": 4.3, "items": ["Kaydet", "Paylaş", "Takip et"] }
      ]] }
  ]
};
