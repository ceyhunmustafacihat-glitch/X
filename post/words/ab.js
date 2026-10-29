window.KELIME = {
  kelime: 'ab',
  koken: { dil: 'Farsça', asil: 'āb' },
  tur: 'isim',
  anlam: ['Su.', 'Parlaklık, ışıltı; değer, itibar.'],
  cumle: 'Çölün ortasındaki pınarın serin *abı*, yorgun kervana yeniden hayat verdi.',
  // Çağrışım: suya düşen damla ve yayılan halkalar
  gorsel: `
<svg viewBox="0 0 860 470" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#f0dcaa"/><stop offset=".55" stop-color="#dcbd84"/><stop offset="1" stop-color="#c4a26a"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#f0dcaa" stop-opacity=".28"/><stop offset="1" stop-color="#f0dcaa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="430" cy="372" rx="300" ry="70" fill="url(#glow)"/>
  <!-- damla -->
  <path d="M430 52 C 448 98, 486 140, 486 182 A 56 56 0 0 1 374 182 C 374 140, 412 98, 430 52 Z" fill="url(#g)"/>
  <path d="M404 176 C 404 160, 412 146, 420 136" stroke="#9b1b27" stroke-width="6" opacity=".55"/>
  <!-- sıçrayan küçük damlalar -->
  <circle cx="356" cy="300" r="7" fill="url(#g)"/>
  <circle cx="508" cy="292" r="9" fill="url(#g)"/>
  <circle cx="470" cy="270" r="5" fill="url(#g)"/>
  <circle cx="388" cy="276" r="4.5" fill="url(#g)"/>
  <path d="M430 344 C 422 328, 424 314, 430 302 C 436 314, 438 328, 430 344 Z" fill="url(#g)"/>
  <!-- halkalar -->
  <g stroke="url(#g)">
    <ellipse cx="430" cy="372" rx="62"  ry="14" stroke-width="4"/>
    <ellipse cx="430" cy="372" rx="132" ry="30" stroke-width="3" opacity=".8"/>
    <ellipse cx="430" cy="372" rx="212" ry="48" stroke-width="2.4" opacity=".55"/>
    <ellipse cx="430" cy="372" rx="298" ry="68" stroke-width="1.8" opacity=".32"/>
    <ellipse cx="430" cy="372" rx="390" ry="90" stroke-width="1.4" opacity=".16"/>
  </g>
</svg>`
};
