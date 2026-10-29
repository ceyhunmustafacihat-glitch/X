// Abadi: ipekten, saman renginde yazı kâğıdı. Simge: köşesi kıvrık, satırlı altın kâğıt ve üstünde kalem.
export const kelime = 'Abadi';
export const koken = 'Farsça kökenli';
export const anlam = [
  { t: 'Açık saman renginde, ipekten yapılan, yarı mat, kalınca bir ' },
  { t: 'yazı kâğıdı', b: true },
  { t: ' türü. Adını Hindistan’ın ' },
  { t: 'Devletâbâd', b: true },
  { t: ' şehrinden alan bu kâğıt, geçmişte yazı yazmak ve hat sanatında kullanılmıştır.' },
];
export const ornek = [
  { t: '“Hattat, özenle hazırladığı ' },
  { t: 'abadi', b: true },
  { t: ' kâğıdının üzerine zarif harfler işledi.”' },
];

export const simge = (c) => `
  <path d="M60 30H196L250 84V276H60Z" fill="url(#altin)"/>
  <path d="M196 30V84H250Z" fill="${c.altinK}"/><path d="M196 30L250 84H196Z" fill="#b8925a" opacity="0.6"/>
  <g stroke="${c.zemin}" stroke-width="7" stroke-linecap="round" opacity="0.8">
    <path d="M94 116H210"/><path d="M94 152H216"/><path d="M94 188H180"/><path d="M94 224H200"/>
  </g>`;
