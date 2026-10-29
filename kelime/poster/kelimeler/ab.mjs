// Ab: su. Simge: içinden dalgalar geçen altın su damlası.
export const kelime = 'Ab';
export const koken = 'Farsça kökenli';
export const anlam = [{ t: 'Su.' }];
export const ornek = [
  { t: '“Kelâm, gönülden doğmadıkça dudaklarda kurur; gönülden doğarsa, çorak ruhlara ' },
  { t: 'âb', b: true },
  { t: ' olur.”' },
];

export const simge = (c) => {
  const cx = 150, cy = 190, r = 106;
  const damla = `M${cx} 0C${cx} 0 ${cx - r} 110 ${cx - r} ${cy}A${r} ${r} 0 0 0 ${cx + r} ${cy}C${cx + r} 110 ${cx} 0 ${cx} 0Z`;
  const dalga = (y) => `M20 ${y}c27 -14 53 -14 80 0s53 14 80 0s53 -14 80 0s53 14 80 0`;
  return `<defs><clipPath id="damla"><path d="${damla}"/></clipPath></defs>
  <path d="${damla}" fill="url(#altin)"/>
  <g clip-path="url(#damla)" fill="none" stroke="${c.zemin}" stroke-width="7" stroke-linecap="round">
    <path d="${dalga(cy + 6)}"/><path d="${dalga(cy + 46)}" opacity="0.75"/><path d="${dalga(cy + 86)}" opacity="0.5"/>
  </g>
  <path d="M${cx - 60} ${cy - 30}A66 66 0 0 1 ${cx - 22} ${cy - 86}" fill="none" stroke="#fbf3e2" stroke-width="8" stroke-linecap="round" opacity="0.9"/>`;
};
