'use strict';
// The lesson, scene by scene. Every draw(t) is a pure function of the scene's
// local time t; sfx lists the sound cues in the same local time.

const CX = W / 2;
const PEOPLE = {
  ali: { skin: '#F2C6A0', hair: '#3B2A20', shirt: '#5B8DEF', pants: '#34405A', hairStyle: 'short' },
  ayse: { skin: '#E8B48C', hair: '#6B3A1E', shirt: '#F2789F', pants: '#3D3550', hairStyle: 'long', dress: true },
  zeynep: { skin: '#F5D0B0', hair: '#2B1B12', shirt: '#9B6EF3', pants: '#2F3A4F', hairStyle: 'bun', dress: true },
  mert: { skin: '#C98E66', hair: '#1E1612', shirt: '#2FB38A', pants: '#3A3F55', hairStyle: 'curly' },
  can: { skin: '#F0C09A', hair: '#A0622D', shirt: '#F2A33A', pants: '#2E4A6B', hairStyle: 'short' },
  teacher: { skin: '#EDBE98', hair: '#5A4636', shirt: '#4C6FA8', pants: '#2D3446', hairStyle: 'short', glasses: true, tie: true },
};
const P = (name, x, y, s, t, extra = {}) => person(x, y, s, { ...PEOPLE[name], t, seed: x * 0.01, ...extra });
const popIn = (t, at, d = 0.45) => { const q = prog(t, at, d); return { a: clamp(q * 2), s: eBack(q) }; };
function popDraw(t, at, x, y, fn) { const p = popIn(t, at); withA(p.a, () => around(x, y, p.s, fn)); }

// ------------------------------------------------------------------ 0 intro
const intro = {
  dur: 9, title: null,
  sfx: [...pops(0.3, 2, 0.28, 'popBig'), ...pops(1.5, 3, 0.25), ...pops(3.3, 4, 0.3, 'pop'), [4.4, 'bubble']],
  draw(t) {
    popSentence('TO:s|BE:b', t, 0.3, CX, 300, 190, { stagger: 0.28 });
    popSentence('am:b|is:b|are:b', t, 1.5, CX, 525, 78, { stagger: 0.25 });
    txt('İngilizcede “olmak” fiili', CX, 645, { size: 50, w: 600, fam: 'Montserrat', color: C.soft, alpha: prog(t, 2.6, 0.6) });
    const chips = [['+', 'Olumlu', BADGE.plus], ['−', 'Olumsuz', BADGE.minus], ['?', 'Soru', BADGE.q], ['−?', 'Olumsuz Soru', BADGE.nq]];
    setFont(34, 700, 'Montserrat');
    const ws = chips.map(c => ctx.measureText(c[1]).width + 110), gap = 28;
    let x = CX - (ws.reduce((a, b) => a + b, 0) + gap * 3) / 2;
    chips.forEach(([sym, label, col], i) => {
      const w = ws[i], cx = x + w / 2;
      popDraw(t, 3.3 + i * 0.3, cx, 760, () => {
        card(x, 726, w, 68, { r: 34 });
        ctx.fillStyle = col; circle(x + 36, 760, 24); ctx.fill();
        txt(sym, x + 36, 761, { size: sym.length > 1 ? 20 : 28, w: 900, fam: 'Montserrat', color: '#fff' });
        txt(label, x + 72, 761, { size: 34, w: 700, fam: 'Montserrat', align: 'left' });
      });
      x += w + gap;
    });
    OWL.wave = t > 0.8 && t < 4.2;
    tip(t, 4.4, 8.6, ['Merhaba! Bugün [b:to be] konusunu', 'örneklerle adım adım öğreniyoruz.'], { label: null });
  },
};

// ------------------------------------------------------------------ 1 what is it
const whatIs = {
  dur: 22, title: 'TO BE NEDİR?', badge: { sym: '1', c: BADGE.ink },
  sfx: [[0.5, 'pop'], [1.4, 'pop'], ...pops(1.8, 4), [3.4, 'pop'], [5.6, 'bubble'], [10.4, 'whoosh'], ...pops(11, 4, 1.3, 'popBig')],
  draw(t) {
    const aA = env(t, 0, 10, 0.4, 0.4);
    withA(aA, () => {
      popDraw(t, 0.5, 580, 360, () => {
        card(260, 250, 640, 220, { r: 32 });
        txt('TÜRKÇE', 580, 300, { size: 26, w: 800, fam: 'Montserrat', color: C.soft });
        rich('Ben öğrenci[b:yim].', 580, 390, { size: 62 });
      });
      popDraw(t, 1.4, 1340, 360, () => {
        card(1020, 250, 640, 220, { r: 32 });
        txt('İNGİLİZCE', 1340, 300, { size: 26, w: 800, fam: 'Montserrat', color: C.soft });
      });
      arrow(915, 360, 1005, C.soft, prog(t, 1.2, 0.4));
      popSentence('I:s|am:b|a student:r|.:p', t, 1.8, 1340, 390, 46, { glow: i => i === 1 ? 0.5 + 0.5 * Math.sin(t * 4) : 0 });
      const q = prog(t, 3.4, 0.6);
      rich('Türkçedeki [b:-im, -sin, -dir...] eklerinin yaptığı işi', CX, 580, { size: 44, alpha: q });
      rich('İngilizcede [b:am], [b:is] ve [b:are] kelimeleri yapar.', CX, 645, { size: 44, alpha: q });
      tip(t, 5.6, 9.7, ['Türkçede [b:ek], İngilizcede [b:ayrı bir kelime!]', 'Ben mutlu[b:yum].  →  I [b:am] happy.']);
    });
    withA(env(t, 10.3, null), () => {
      heading('Ne zaman kullanırız?', CX, 200, 56);
      const cards = [
        ['Meslek', briefcase, '[s:She] [b:is] a doctor.', 'O doktor.'],
        ['Duygu / durum', smiley, '[s:I] [b:am] happy.', 'Ben mutluyum.'],
        ['Yer', house, '[s:They] [b:are] at home.', 'Onlar evde.'],
        ['Yaş', cake, '[s:He] [b:is] ten years old.', 'O on yaşında.'],
      ];
      cards.forEach(([label, icon, en, tr], i) => {
        const cx = 300 + i * 440;
        popDraw(t, 11 + i * 1.3, cx, 480, () => {
          card(cx - 200, 270, 400, 430, { r: 32 });
          icon(cx, 380, 1.05);
          txt(label, cx, 485, { size: 38, w: 800, fam: 'Montserrat', color: K.r[0] });
          rich(en, cx, 575, { size: 33 });
          trLine(tr, cx, 635, 1, 30);
        });
      });
    });
  },
};

// ------------------------------------------------------------------ 2 subjects
const subjects = {
  dur: 26, title: 'KİM, HANGİSİNİ ALIR?', badge: { sym: '2', c: BADGE.ink },
  sfx: [...pops(0.4, 3, 0.3, 'popBig'), [1.8, 'pop'], ...pops(3.4, 3, 0.8), ...pops(6.6, 3, 0.8), ...pops(10, 3, 0.6), [12.5, 'bubble'], [19.2, 'bubble']],
  draw(t) {
    const cols = [[360, 'AM', 's'], [960, 'IS', 's'], [1560, 'ARE', 's']];
    cols.forEach(([cx, word], i) => {
      withA(prog(t, 0.3 + i * 0.3, 0.5), () => {
        ctx.fillStyle = 'rgba(242,140,40,.07)'; rr(cx - 260, 150, 520, 610, 36); ctx.fill();
        ctx.strokeStyle = 'rgba(242,140,40,.25)'; ctx.lineWidth = 3; rr(cx - 260, 150, 520, 610, 36); ctx.stroke();
      });
      popSentence(word + ':b', t, 0.4 + i * 0.3, cx, 222, 62);
    });
    const who = [
      [1.8, 360, 'I', 'ben', (x, s) => P('ali', x, 535, s, t, { point: true })],
      [3.4, 775, 'he', 'o (erkek)', (x, s) => P('mert', x, 535, s, t)],
      [4.2, 960, 'she', 'o (kadın)', (x, s) => P('ayse', x, 535, s, t)],
      [5.0, 1145, 'it', 'o (eşya, hayvan)', (x, s) => cat(x - 10, 535, s * 1.1, t)],
      [6.6, 1390, 'you', 'sen / siz', (x, s) => P('can', x, 535, s, t)],
      [7.4, 1560, 'we', 'biz', (x, s) => { P('zeynep', x - 34, 535, s * 0.85, t); P('ali', x + 34, 535, s * 0.85, t); }],
      [8.2, 1730, 'they', 'onlar', (x, s) => { P('mert', x - 34, 535, s * 0.85, t); P('ayse', x + 34, 535, s * 0.85, t); }],
    ];
    who.forEach(([at, x, en, tr, draw], i) => {
      const s = i === 0 ? 0.78 : 0.6;
      if (en === 'you' && t > 12.5 && t < 18.9) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 5);
        ctx.strokeStyle = `rgba(242,140,40,${0.4 + 0.5 * pulse})`; ctx.lineWidth = 6; ellipse(x, 440, 78 + pulse * 5, 118 + pulse * 5); ctx.stroke();
      }
      popDraw(t, at, x, 450, () => {
        draw(x, s);
        txt(en, x, 585, { size: 40, w: 800, fam: 'Montserrat', color: K.s[0] });
        trLine(tr, x, 628, 1, 24);
      });
    });
    const ex = [[360, '[s:I] [b:am] Ali.'], [960, '[s:It] [b:is] a cat.'], [1560, '[s:We] [b:are] friends.']];
    ex.forEach(([x, s], i) => popDraw(t, 10 + i * 0.6, x, 705, () => rich(s, x, 705, { size: 38 })));
    tip(t, 12.5, 18.9, ['Dikkat: [s:you] tek kişi bile olsa → [b:are]!', '[s:You] [b:are] my friend.  =  Sen benim arkadaşımsın.']);
    tip(t, 19.2, 25.6, ['Tekil isim → [b:is]:   My mother [b:is] kind.', 'Çoğul isim → [b:are]:   The kids [b:are] here.']);
  },
};

// ------------------------------------------------------------------ 3 contractions
const CONTR = [
  ['I:s|am:b', "I+'m:s+b<b0"], ['you:s|are:b', "you+'re:s+b<b0"], ['he:s|is:b', "he+'s:s+b<b0"], ['she:s|is:b', "she+'s:s+b<b0"],
  ['it:s|is:b', "it+'s:s+b<b0"], ['we:s|are:b', "we+'re:s+b<b0"], ['they:s|are:b', "they+'re:s+b<b0"],
];
const contractions = {
  dur: 17, title: 'KISALTMALAR', badge: { sym: '3', c: BADGE.ink },
  sfx: [...CONTR.flatMap((_, i) => [[0.8 + i * 1.0, 'pop'], [1.35 + i * 1.0, 'whoosh', 0.6]]), [9, 'bubble']],
  draw(t) {
    CONTR.forEach(([a, b], i) => {
      const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
      const cx = col ? 1360 : 560, y = 250 + row * 125, at = 0.8 + i * 1.0;
      popSentence(a, t, at, cx - 190, y, 46, { stagger: 0.1 });
      arrow(cx - 40, y, cx + 50, C.soft, prog(t, at + 0.3, 0.3), 6);
      withA(prog(t, at + 0.35, 0.2), () => morph(toks(a), toks(b), prog(t, at + 0.55, 0.8), cx + 200, y, 46));
    });
    tip(t, 9, 16.5, ['Konuşmada çoğunlukla kısaltma kullanılır:', "[s:I][b:'m] fine.  ·  [s:She][b:'s] here.  ·  [s:They][b:'re] late."]);
  },
};

// ------------------------------------------------------------------ 4 positive
const POS = [
  { at: 2.2, end: 8.6, spec: 'I:s|am:b|a teacher:r|.:p', tr: 'Ben bir öğretmenim.' },
  { at: 8.9, end: 15.3, spec: 'She:s|is:b|happy:r|.:p', tr: 'O mutlu.' },
  { at: 15.6, end: 22.6, spec: 'We:s|are:b|friends:r|.:p', tr: 'Biz arkadaşız.' },
];
const positive = {
  dur: 23, title: 'OLUMLU CÜMLE', badge: { sym: '+', c: BADGE.plus }, legend: true,
  sfx: [...pops(0.4, 6, 0.12, 'tick'), ...POS.flatMap(e => [[e.at - 0.1, 'whoosh', 0.5], ...pops(e.at + 0.3, tokCount(e.spec), 0.22)])],
  draw(t) {
    formula('Özne:s|+:o|am / is / are:b|+:o|devamı:r|.:p', t, 0.4);
    POS.forEach((e, i) => {
      const a = env(t, e.at, e.end);
      if (a <= 0) return;
      withA(a, () => {
        const ix = 360, iy = 780;
        if (i === 0) { board(ix + 70, iy - 260, 0.85); P('teacher', ix - 60, iy, 1.0, t, { wave: true }); }
        if (i === 1) {
          P('ayse', ix, iy, 1.0, t);
          for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; heart(ix + 80 + k * 30, iy - 330 - ph * 120, 1.2, `rgba(229,72,77,${(1 - ph) * 0.9})`); }
        }
        if (i === 2) { P('zeynep', ix - 70, iy, 0.95, t); P('mert', ix + 70, iy, 0.95, t, { wave: true }); }
        popSentence(e.spec, t, e.at + 0.3, 1120, 500, 76, { stagger: 0.22 });
        trLine(e.tr, 1120, 630, prog(t, e.at + 1.4, 0.5), 44);
      });
    });
  },
};

// ------------------------------------------------------------------ 5 negative
const NEG_STATES = [
  { at: 2.0, spec: 'She:s|is:b|happy:r|.:p' },
  { at: 4.2, spec: 'She:s|is:b|not:n^|happy:r|.:p' },
  { at: 6.8, spec: "She:s|is+n't:b+n<n0|happy:r|.:p" },
];
const NEG_ROWS = [
  ['[s:I] [b:am] [n:not]', "I+'m:s+b|not:n", "[s:I][b:'m] [n:not] tired."],
  ['[s:he / she / it] [b:is] [n:not]', "is+n't:b+n", "[s:It] [b:is][n:n't] cold."],
  ['[s:you / we / they] [b:are] [n:not]', "are+n't:b+n", "[s:They] [b:are][n:n't] here."],
];
const negative = {
  dur: 28, title: 'OLUMSUZ CÜMLE', badge: { sym: '−', c: BADGE.minus }, legend: true,
  sfx: [...pops(0.4, 8, 0.12, 'tick'), ...trackSfx(NEG_STATES), [4.5, 'drop'], [7.9, 'pop'], [10.8, 'whoosh', 0.5], ...pops(11.2, 3, 1.4, 'popBig'),
    [19.9, 'whoosh', 0.5], [20.4, 'buzz'], [21.4, 'ding'], [22.2, 'bubble']],
  draw(t) {
    formula('Özne:s|+:o|am / is / are:b|+:o|not:n|+:o|devamı:r|.:p', t, 0.4);
    withA(env(t, 1.8, 10.4), () => {
      P('ayse', 330, 790, 1.0, t, { mood: t > 4.5 ? 'sad' : 'happy' });
      track(t, NEG_STATES, 1120, 470, 76);
      trLine('O mutlu.', 1120, 600, env(t, 2.6, 4.3, 0.4, 0.2), 44);
      trLine('O mutlu değil.', 1120, 600, prog(t, 4.6, 0.4), 44);
      rich("Aynı anlam:  [s:She][b:'s] [n:not] happy.", 1120, 700, { size: 40, alpha: prog(t, 7.9, 0.5) });
    });
    withA(env(t, 10.8, 19.6), () => {
      heading('Olumsuz kısaltmalar', CX, 300, 50);
      NEG_ROWS.forEach(([long, short, ex], i) => {
        const y = 420 + i * 120, at = 11.2 + i * 1.4;
        popDraw(t, at, CX, y, () => {
          card(150, y - 50, 1620, 100, { r: 26 });
          rich(long, 200, y, { size: 40, align: 'left' });
          arrow(800, y, 880, C.soft, 1, 6);
          popSentence(short, 1e9, 0, 920, y, 40, { align: 'left' });
          rich(ex, 1340, y, { size: 38, align: 'left' });
        });
      });
    });
    withA(env(t, 19.9, null), () => {
      popDraw(t, 20.4, 620, 450, () => {
        card(330, 330, 580, 240, { r: 32, border: '#F6C2C3' });
        rich('[x:I amn\'t]', 620, 450, { size: 76 });
        crossIcon(880, 350, 34);
      });
      popDraw(t, 21.4, 1300, 450, () => {
        card(1010, 330, 580, 240, { r: 32, border: '#BFE6D3' });
        popSentence("I+'m:s+b|not:n", 1e9, 0, 1300, 450, 64);
        checkIcon(1560, 350, 34);
      });
      tip(t, 22.2, 27.6, ["Tuzak! [n:amn't] diye bir kısaltma yok.", "Doğrusu her zaman:  [s:I][b:'m] [n:not] sad."]);
    });
  },
};

// ------------------------------------------------------------------ 6 question
const Q_STATES = [{ at: 2.0, spec: 'You:s|are:b|tired:r|.:p' }, { at: 4.6, spec: 'Are:b!|you:s|tired:r|?:p' }];
const Q_EX = [
  ['Is:b|he:s|a student:r|?:p', 'O öğrenci mi?'],
  ['Am:b|I:s|late:r|?:p', 'Geç mi kaldım?'],
  ['Are:b|they:s|at home:r|?:p', 'Onlar evde mi?'],
];
const Q_ANS = [
  ['Are:b|you:s|tired:r|?:p', 'Yes, [s:I] [b:am].', "No, [s:I][b:'m] [n:not]."],
  ['Is:b|he:s|a student:r|?:p', 'Yes, [s:he] [b:is].', "No, [s:he] [b:is][n:n't]."],
];
const question = {
  dur: 32, title: 'SORU CÜMLESİ', badge: { sym: '?', c: BADGE.q }, legend: true,
  sfx: [...pops(0.4, 6, 0.12, 'tick'), ...trackSfx(Q_STATES), [5.0, 'boing'], [10.4, 'whoosh', 0.5], ...Q_EX.flatMap((e, i) => pops(10.9 + i * 1.3, tokCount(e[0]), 0.1)),
    [17.6, 'whoosh', 0.5], ...Q_ANS.flatMap((_, i) => [[18.0 + i * 2.2, 'pop'], [18.6 + i * 2.2, 'ding', 0.5], [19.1 + i * 2.2, 'pop']]), [24.2, 'bubble']],
  draw(t) {
    formula('Am / Is / Are:b|+:o|Özne:s|+:o|devamı:r|?:p', t, 0.4);
    withA(env(t, 1.8, 10.2), () => {
      P('can', 330, 790, 1.0, t, { mood: 'tired' });
      track(t, Q_STATES, 1120, 470, 76);
      trLine('Sen yorgunsun.', 1120, 600, env(t, 2.6, 4.7, 0.4, 0.2), 44);
      trLine('Yorgun musun?', 1120, 600, prog(t, 5.2, 0.4), 44);
      rich('[b:to be] başa geçer, cümlenin sonuna [h:?] gelir.', 1120, 700, { size: 40, alpha: prog(t, 6.6, 0.5) });
    });
    withA(env(t, 10.4, 17.4), () => {
      Q_EX.forEach(([spec, tr], i) => {
        const y = 360 + i * 140;
        popSentence(spec, t, 10.9 + i * 1.3, 700, y, 56, { stagger: 0.1 });
        trLine(tr, 1240, y, prog(t, 11.5 + i * 1.3, 0.4), 42, 'left');
      });
    });
    withA(env(t, 17.6, null), () => {
      heading('Kısa cevaplar', CX, 300, 48);
      Q_ANS.forEach(([q, yes, no], i) => {
        const y = 420 + i * 140, at = 18.0 + i * 2.2;
        popSentence(q, t, at, 470, y, 44, { stagger: 0.08 });
        popDraw(t, at + 0.6, 1060, y, () => { card(850, y - 50, 420, 100, { r: 26 }); checkIcon(898, y, 24); rich(yes, 940, y, { size: 40, align: 'left' }); });
        popDraw(t, at + 1.1, 1530, y, () => { card(1300, y - 50, 460, 100, { r: 26 }); crossIcon(1348, y, 24); rich(no, 1390, y, { size: 40, align: 'left' }); });
      });
      rich('[s:you] ile sorulan soruya [s:I] ile cevap verilir.', CX, 720, { size: 36, color: C.soft, alpha: prog(t, 22.4, 0.5) });
      tip(t, 24.2, 31.6, ['Olumlu kısa cevapta kısaltma [n:yok!]', "[x:Yes, I'm.]   →   [r:Yes, I am.]"]);
    });
  },
};

// ------------------------------------------------------------------ 7 negative question
const NQ_STATES = [
  { at: 2.0, spec: 'Is:b|she:s|happy:r|?:p' },
  { at: 4.0, spec: 'Is:b|she:s|not:n^|happy:r|?:p' },
  { at: 6.4, spec: "Is+n't:b+n<n0|she:s|happy:r|?:p" },
];
const NQ_T1 = [
  [false, '[x:Is not she happy?]', 'yanlış'],
  [true, "[b:Is][n:n't] [s:she] happy?", 'günlük dil'],
  [true, '[b:Is] [s:she] [n:not] happy?', 'resmi'],
];
const NQ_T2 = [
  [true, '[b:Am] [s:I] [n:not] late?', 'resmi'],
  [true, "[b:Are][n:n't] [s:I] late?", 'günlük dil'],
  [false, "[x:Amn't I late?]", 'böyle bir kelime yok'],
];
function checklist(rows, t, at, y0 = 420) {
  rows.forEach(([ok, s, note], i) => {
    const y = y0 + i * 115, a = at + i * 1.4;
    popDraw(t, a, CX, y, () => {
      card(330, y - 48, 1260, 96, { r: 26, border: ok ? '#BFE6D3' : '#F6C2C3' });
      (ok ? checkIcon : crossIcon)(390, y, 26);
      rich(s, 445, y, { size: 46, align: 'left' });
      trLine(note, 1550, y, 1, 32, 'right');
    });
  });
}
const negQuestion = {
  dur: 42, title: 'OLUMSUZ SORU', badge: { sym: '−?', c: BADGE.nq }, legend: true,
  sfx: [...pops(0.4, 6, 0.12, 'tick'), ...trackSfx(NQ_STATES), [4.3, 'drop'], [11.4, 'whoosh', 0.5], ...NQ_T1.map((r, i) => [12 + i * 1.4, r[0] ? 'ding' : 'buzz', 0.6]),
    [19, 'whoosh', 0.5], ...NQ_T2.map((r, i) => [19.6 + i * 1.4, r[0] ? 'ding' : 'buzz', 0.6]), [23.6, 'bubble'],
    [28.4, 'whoosh', 0.5], ...pops(28.8, 4, 0.15), [30.4, 'popBig'], [31.8, 'popBig'], [33.6, 'bubble']],
  draw(t) {
    formula("Is+n't+ / Are+n't:b+n|+:o|Özne:s|+:o|devamı:r|?:p", t, 0.4);
    withA(env(t, 1.8, 11), () => {
      P('zeynep', 330, 790, 1.0, t, { mood: 'surprised' });
      track(t, NQ_STATES, 1120, 450, 76);
      trLine('O mutlu mu?', 1120, 580, env(t, 2.6, 4.1, 0.4, 0.2), 44);
      trLine('O mutlu değil mi?', 1120, 580, prog(t, 4.4, 0.4), 44);
      const label = t < 6.4 ? 'uzun / resmi hâli' : 'kısaltılmış / günlük hâli';
      txt(label, 1120, 345, { size: 28, w: 700, fam: 'Montserrat', color: BADGE.nq, alpha: env(t, 4.6, 6.3, 0.3, 0.2) + prog(t, 7.2, 0.3) });
      rich('Anlamı: “...değil mi?”  →  şaşkınlık ya da onay bekleme', 1120, 690, { size: 38, alpha: prog(t, 8.0, 0.5) });
    });
    withA(env(t, 11.4, 18.6), () => {
      heading('Kısaltma her zaman özneden ÖNCE gelir', CX, 300, 46);
      checklist(NQ_T1, t, 12);
    });
    withA(env(t, 19, 28), () => {
      rich('[s:I] ile olumsuz soru: [b:Are][n:n\'t] [s:I]?', CX, 300, { size: 46 });
      checklist(NQ_T2, t, 19.6);
      tip(t, 23.6, 27.8, ["“I” ile bile [b:Are][n:n't] [s:I]...? denir.", 'Bu, kuralın meşhur istisnası!']);
    });
    withA(env(t, 28.4, null), () => {
      heading('Cevap, gerçeğe göre verilir!', CX, 292, 46);
      popSentence("Is+n't:b+n|it:s|cold:r|?:p", t, 28.8, CX, 392, 58, { stagger: 0.15 });
      trLine('Soğuk değil mi?', CX, 472, prog(t, 29.6, 0.4), 38);
      popDraw(t, 30.4, 640, 640, () => {
        card(340, 525, 600, 235, { r: 30, border: '#CFE4FA' });
        snowflake(430, 610, 0.9, t * 0.4);
        txt('Hava soğuksa:', 510, 590, { size: 32, w: 700, fam: 'Montserrat', color: C.soft, align: 'left' });
        rich('[r:Yes], [s:it] [b:is].', 510, 650, { size: 50, align: 'left' });
        trLine('Evet, soğuk.', 510, 712, 1, 32, 'left');
      });
      popDraw(t, 31.8, 1280, 640, () => {
        card(980, 525, 600, 235, { r: 30, border: '#FBE3B0' });
        sun(1070, 610, 0.85, t * 0.3);
        txt('Hava soğuk değilse:', 1150, 590, { size: 32, w: 700, fam: 'Montserrat', color: C.soft, align: 'left' });
        rich("[n:No], [s:it] [b:is][n:n't].", 1150, 650, { size: 50, align: 'left' });
        trLine('Hayır, soğuk değil.', 1150, 712, 1, 32, 'left');
      });
      tip(t, 33.6, 41.6, ['Türkçedeki “Evet, değil” mantığını unut!', 'Gerçek ne ise: [r:Yes] = soğuk,  [n:No] = soğuk değil.']);
    });
  },
};

// ------------------------------------------------------------------ 8 wh-questions
const WH = [
  ['Where:w|are:b|you:s|?:p', 'Neredesin?'],
  ['What:w|is:b|this:s|?:p', 'Bu ne?'],
  ['Who:w|is:b|she:s|?:p', 'O kim?'],
  ['How old:w|are:b|you:s|?:p', 'Kaç yaşındasın?'],
];
const wh = {
  dur: 17, title: 'SORU KELİMELERİYLE', badge: { sym: 'W', c: BADGE.wh }, legend: 'wh',
  sfx: [...pops(0.4, 8, 0.1, 'tick'), ...WH.flatMap((e, i) => pops(1.6 + i * 1.3, tokCount(e[0]), 0.12)), [8, 'bubble']],
  draw(t) {
    formula('Soru kelimesi:w|+:o|am / is / are:b|+:o|Özne:s|+:o|...:r|?:p', t, 0.4);
    WH.forEach(([spec, tr], i) => {
      const y = 330 + i * 118;
      popSentence(spec, t, 1.6 + i * 1.3, 720, y, 54, { stagger: 0.12 });
      trLine(tr, 1180, y, prog(t, 2.1 + i * 1.3, 0.4), 42, 'left');
    });
    tip(t, 8, 16.6, ['Konuşmada kısaltılır:', "[w:Where][b:'s] Ali?  ·  [w:What][b:'s] this?  ·  [w:Who][b:'s] she?"]);
  },
};

// ------------------------------------------------------------------ 9 question tags
const TAGS = [
  ["She:s|is:b|nice:r|,:p|is+n't:b+n|she:s|?:p", 'O iyi, değil mi?'],
  ["You:s|are+n't:b+n|busy:r|,:p|are:b|you:s|?:p", 'Meşgul değilsin, değil mi?'],
  ["I:s|am:b|right:r|,:p|are+n't:b+n|I:s|?:p", 'Haklıyım, değil mi?'],
];
const tags = {
  dur: 21, title: 'BONUS: “...DEĞİL Mİ?”', badge: { sym: '★', c: BADGE.star }, legend: true,
  sfx: [[0.5, 'pop'], [1.0, 'pop'], ...TAGS.flatMap((e, i) => pops(2.4 + i * 1.8, tokCount(e[0]), 0.12)), [8.5, 'bubble']],
  draw(t) {
    txt('Question tags', CX, 175, { size: 30, w: 700, fam: 'Montserrat', color: C.soft, alpha: prog(t, 0.3) });
    rich('[r:Olumlu] cümle  →  [n:olumsuz] kuyruk', CX, 235, { size: 42, alpha: prog(t, 0.5) });
    rich('[n:Olumsuz] cümle  →  [r:olumlu] kuyruk', CX, 295, { size: 42, alpha: prog(t, 1.0) });
    TAGS.forEach(([spec, tr], i) => {
      const y = 420 + i * 125, at = 2.4 + i * 1.8;
      const L = popSentence(spec, t, at, 780, y, 46, { stagger: 0.12, glow: k => (k >= 4 && t > at + 1.2 ? 0.45 + 0.35 * Math.sin(t * 4) : 0) });
      withA(prog(t, at + 1.2, 0.4), () => {
        const a = L[4], b = L[6];
        ctx.strokeStyle = BADGE.star; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x - a.w / 2, y + 46); ctx.lineTo(b.x + b.w / 2, y + 46); ctx.stroke();
      });
      trLine(tr, 1360, y, prog(t, at + 0.9, 0.4), 36, 'left');
    });
    tip(t, 8.5, 20.6, ["Tuzak yine burada:  [s:I] [b:am] right, [b:are][n:n't] [s:I]?", "[x:amn't I] yok  →  [b:are][n:n't] [s:I] kullanılır."]);
  },
};

// ------------------------------------------------------------------ 10 common mistakes
const MIST = [
  ['[x:She happy.]', '[s:She] [b:is] happy.', 'To be\'yi unutma! Türkçede ek var, İngilizcede kelime şart.'],
  ['[x:I have 20 years.]', '[s:I] [b:am] 20 years old.', 'Yaş [h:have] ile değil, [b:to be] ile söylenir.'],
  ['[x:I am agree.]', '[s:I] agree.', '[h:agree] zaten bir fiil; yanına to be gelmez.'],
  ['[x:My friends is here.]', '[s:My friends] [b:are] here.', 'Çoğul özne → [b:are].'],
];
const mistakes = {
  dur: 22, title: 'SIK YAPILAN HATALAR', badge: { sym: '!', c: BADGE.warn },
  sfx: MIST.flatMap((_, i) => [[0.8 + i * 3.8, 'popBig'], [1.1 + i * 3.8, 'buzz', 0.5], [2.3 + i * 3.8, 'ding', 0.6]]),
  draw(t) {
    MIST.forEach(([bad, good, why], i) => {
      const cx = i % 2 ? 1400 : 520, cy = i < 2 ? 330 : 640, at = 0.8 + i * 3.8;
      popDraw(t, at, cx, cy, () => {
        card(cx - 410, cy - 135, 820, 270, { r: 32 });
        mark(false, cx - 340, cy - 62, 24, t, at + 0.3);
        rich(bad, cx - 300, cy - 62, { size: 44, align: 'left' });
        mark(true, cx - 340, cy + 12, 24, t, at + 1.5);
        rich(good, cx - 300, cy + 12, { size: 44, align: 'left', alpha: prog(t, at + 1.5, 0.4) });
        rich(why, cx - 370, cy + 88, { size: 27, align: 'left', color: C.soft, alpha: prog(t, at + 2.1, 0.4) });
      });
    });
  },
};

// ------------------------------------------------------------------ 11 summary
const SUM = [
  ['+', BADGE.plus, 'Özne + [b:am/is/are]', '[s:She] [b:is] a doctor.', 'O doktor.'],
  ['−', BADGE.minus, 'Özne + [b:am/is/are] + [n:not]', "[s:She] [b:is][n:n't] a doctor.", 'O doktor değil.'],
  ['?', BADGE.q, '[b:Am/Is/Are] + Özne', '[b:Is] [s:she] a doctor?', 'O doktor mu?'],
  ['−?', BADGE.nq, "[b:Is][n:n't] / [b:Are][n:n't] + Özne", "[b:Is][n:n't] [s:she] a doctor?", 'O doktor değil mi?'],
];
const summary = {
  dur: 18, title: 'ÖZET', badge: { sym: '≡', c: BADGE.ink }, legend: true,
  sfx: pops(0.6, 4, 1.2, 'popBig'),
  draw(t) {
    const hy = 200;
    withA(prog(t, 0.3), () => {
      txt('Yapı', 270, hy, { size: 28, w: 800, fam: 'Montserrat', color: C.soft, align: 'left' });
      txt('Örnek', 870, hy, { size: 28, w: 800, fam: 'Montserrat', color: C.soft, align: 'left' });
      txt('Türkçesi', 1440, hy, { size: 28, w: 800, fam: 'Montserrat', color: C.soft, align: 'left' });
    });
    SUM.forEach(([sym, c, form, ex, tr], i) => {
      const y = 300 + i * 145;
      popDraw(t, 0.6 + i * 1.2, CX, y, () => {
        card(140, y - 58, 1640, 116, { r: 28 });
        ctx.fillStyle = c; circle(205, y, 34); ctx.fill();
        txt(sym, 205, y + 1, { size: sym.length > 1 ? 26 : 36, w: 900, fam: 'Montserrat', color: '#fff' });
        rich(form, 270, y, { size: 32, align: 'left' });
        rich(ex, 870, y, { size: 44, align: 'left' });
        trLine(tr, 1440, y, 1, 34, 'left');
      });
    });
  },
};

// ------------------------------------------------------------------ 12 quiz
const QUIZ = [
  { q: 'They:s|___:x|at school:r|.:p', a: 'They:s|are:b#x0|at school:r|.:p', hint: 'olumlu (+)', c: BADGE.plus, tr: 'Onlar okulda.' },
  { q: 'I:s|___:x|not:n|hungry:r|.:p', a: 'I:s|am:b#x0|not:n|hungry:r|.:p', hint: 'olumsuz (−)', c: BADGE.minus, tr: 'Ben aç değilim.' },
  { q: '___:x|he:s|your brother:r|?:p', a: 'Is:b#x0|he:s|your brother:r|?:p', hint: 'soru (?)', c: BADGE.q, tr: 'O senin erkek kardeşin mi?' },
  { q: 'She:s|___:x|a doctor:r|.:p', a: "She:s|is+n't:b+n#x0|a doctor:r|.:p", hint: 'olumsuz · kısaltma', c: BADGE.minus, tr: 'O doktor değil.' },
  { q: '___:x|you:s|tired:r|?:p', a: "Are+n't:b+n#x0|you:s|tired:r|?:p", hint: 'olumsuz soru (−?)', c: BADGE.nq, tr: 'Yorgun değil misin?' },
  { pre: '[b:Are] [s:you] ready?', q: 'Yes,:p|I:s|___:x|.:p', a: 'Yes,:p|I:s|am:b#x0|.:p', hint: 'kısa cevap', c: BADGE.ok || C.ok, tr: 'Evet, hazırım.' },
];
const QZ0 = 3.2, QZD = 8;
const quiz = {
  dur: QZ0 + QUIZ.length * QZD, title: 'MİNİ TEST', badge: { sym: '✎', c: BADGE.star },
  sfx: [[0.3, 'popBig'], ...QUIZ.flatMap((qq, i) => {
    const q = QZ0 + i * QZD;
    return [[q + 0.1, 'whoosh', 0.5], ...pops(q + 0.3, tokCount(qq.q), 0.12), [q + 1, 'tick'], [q + 2, 'tick'], [q + 3, 'tick'], [q + 4, 'tick'], [q + 5, 'correct']];
  })],
  draw(t) {
    withA(env(t, 0.2, QZ0 - 0.2), () => {
      popDraw(t, 0.3, CX, 430, () => heading('Sıra sende!', CX, 430, 110, K.b[0]));
      txt('Boşluğu doldur — cevap 4 saniye sonra geliyor.', CX, 560, { size: 42, w: 500, color: C.soft, alpha: prog(t, 0.9, 0.5) });
    });
    QUIZ.forEach((qq, i) => {
      const q = QZ0 + i * QZD, a = env(t, q, q + QZD - 0.05, 0.35, 0.35);
      if (a <= 0) return;
      withA(a, () => {
        txt(`Soru ${i + 1} / ${QUIZ.length}`, CX, 200, { size: 34, w: 700, fam: 'Montserrat', color: C.soft });
        setFont(32, 700, 'Montserrat');
        const hw = ctx.measureText(qq.hint).width + 60;
        ctx.fillStyle = qq.c; rr(CX - hw / 2, 252, hw, 58, 29); ctx.fill();
        txt(qq.hint, CX, 282, { size: 32, w: 700, fam: 'Montserrat', color: '#fff' });
        if (qq.pre) rich(qq.pre, CX, 375, { size: 50, alpha: prog(t, q + 0.2, 0.4) });
        const y = qq.pre ? 480 : 450;
        if (t < q + 5) popSentence(qq.q, t, q + 0.3, CX, y, 80, { stagger: 0.12 });
        else morph(toks(qq.q), toks(qq.a), (t - q - 5) / 0.5, CX, y, 80);
        // countdown ring
        const ct = t - (q + 1);
        if (ct > -0.3 && ct < 4.1) withA(clamp((ct + 0.3) / 0.3) * clamp((4.1 - ct) / 0.2), () => {
          const cx = CX, cy = 680, r = 62;
          ctx.lineWidth = 12; ctx.strokeStyle = '#EDE3D2'; circle(cx, cy, r); ctx.stroke();
          ctx.strokeStyle = K.b[0]; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - clamp(ct / 4))); ctx.stroke();
          const n = Math.max(1, 4 - Math.floor(Math.max(0, ct)));
          const ph = Math.max(0, ct) % 1;
          around(cx, cy, 1 + 0.25 * Math.max(0, 1 - ph * 4), () => txt(String(n), cx, cy + 2, { size: 64, w: 900, fam: 'Montserrat' }));
        });
        if (t >= q + 5) {
          mark(true, CX, 670, 48, t, q + 5.1);
          trLine(qq.tr, CX, 770, prog(t, q + 5.5, 0.4), 42);
          confetti(t - (q + 5), CX, y, 26, i * 13);
        }
      });
    });
  },
};
function confetti(dt, x, y, n, seed, spread = 1) {
  if (dt < 0 || dt > 2.6) return;
  const cols = ['#3A7BEA', '#F28C28', '#E5484D', '#20A36B', '#8B5CF6', '#FFD166'];
  for (let i = 0; i < n; i++) {
    const a = rand(seed + i) * Math.PI * 2, v = (300 + rand(seed + i * 7) * 500) * spread;
    const px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt * 0.7 + 520 * dt * dt;
    withA(clamp(1 - dt / 2.6), () => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(dt * 8 + i);
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-8, -4, 16, 8); ctx.restore();
    });
  }
}

// ------------------------------------------------------------------ 13 outro
const outro = {
  dur: 9, title: null,
  sfx: [[0.3, 'tada'], [3, 'bubble']],
  draw(t) {
    popDraw(t, 0.3, CX, 360, () => heading('Tebrikler!', CX, 360, 130, K.b[0]));
    rich('Artık [b:am] · [b:is] · [b:are] senin!', CX, 510, { size: 58, alpha: prog(t, 1.0, 0.5) });
    txt('Tekrar izle, kendi cümlelerini kur, bol bol pratik yap.', CX, 600, { size: 38, color: C.soft, alpha: prog(t, 1.6, 0.5) });
    popSentence('I:s|am:b|ready:r|!:p', t, 2.2, CX, 735, 64, { stagger: 0.15 });
    for (let k = 0; k < 3; k++) confetti(t - 0.3 - k * 0.5, 480 + k * 480, 300, 30, 90 + k * 17, 1.2);
    OWL.wave = t > 0.5;
    tip(t, 3, 8.4, ['Görüşürüz!  [s:See] [b:you] [r:soon!]'], { label: null });
  },
};

defineScenes([intro, whatIs, subjects, contractions, positive, negative, question, negQuestion, wh, tags, mistakes, summary, quiz, outro]);
