(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  var PAL = {
    pinky: { main: '#f8a5c2', dark: '#e57ba4', light: '#ffe6f0', inner: '#ffc5da' },
    groentje: { main: '#9fdca4', dark: '#69bb78', light: '#e6f8e4', inner: '#c8efcb' }
  };
  LC.CATS = { pinky: { name: 'Pinky' }, groentje: { name: 'Groentje' } };
  LC.BALLOON_COLORS = ['#ff8fab', '#8ecae6', '#ffd166', '#b5e48c', '#cdb4db', '#ffb4a2'];

  var EYE = '#3b2f55';

  LC.catSVG = function (key, opts) {
    opts = opts || {};
    var c = PAL[key];
    var vb = opts.head ? '45 5 210 215' : '0 0 300 345';
    return '' +
      '<svg class="cat ' + (opts.cls || 'idle') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path class="tail" d="M 215 296 C 290 300 300 215 262 196" fill="none" stroke="' + c.main + '" stroke-width="26" stroke-linecap="round"/>' +
      '<g class="body-g">' +
      '<ellipse cx="150" cy="262" rx="84" ry="76" fill="' + c.main + '"/>' +
      '<ellipse cx="150" cy="278" rx="52" ry="52" fill="' + c.light + '"/>' +
      '<ellipse cx="112" cy="326" rx="30" ry="17" fill="' + c.main + '" stroke="' + c.dark + '" stroke-width="3"/>' +
      '<ellipse cx="188" cy="326" rx="30" ry="17" fill="' + c.main + '" stroke="' + c.dark + '" stroke-width="3"/>' +
      '<path d="M 104 322 L 104 332 M 120 322 L 120 332 M 180 322 L 180 332 M 196 322 L 196 332" stroke="' + c.dark + '" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="head-g">' +
      '<path d="M 62 108 L 74 20 L 132 66 Z" fill="' + c.main + '" stroke="' + c.main + '" stroke-width="10" stroke-linejoin="round"/>' +
      '<path d="M 238 108 L 226 20 L 168 66 Z" fill="' + c.main + '" stroke="' + c.main + '" stroke-width="10" stroke-linejoin="round"/>' +
      '<path d="M 80 90 L 84 46 L 114 68 Z" fill="' + c.inner + '"/>' +
      '<path d="M 220 90 L 216 46 L 186 68 Z" fill="' + c.inner + '"/>' +
      '<ellipse cx="150" cy="128" rx="104" ry="90" fill="' + c.main + '"/>' +
      '<path d="M 150 40 L 150 66 M 128 44 L 133 66 M 172 44 L 167 66" stroke="' + c.dark + '" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<circle cx="82" cy="150" r="17" fill="#ff9db8" opacity="0.45"/>' +
      '<circle cx="218" cy="150" r="17" fill="#ff9db8" opacity="0.45"/>' +
      '<g class="eyes-open">' +
      '<ellipse cx="110" cy="122" rx="14" ry="18" fill="' + EYE + '"/><ellipse cx="190" cy="122" rx="14" ry="18" fill="' + EYE + '"/>' +
      '<circle cx="115" cy="115" r="5" fill="#fff"/><circle cx="195" cy="115" r="5" fill="#fff"/>' +
      '</g>' +
      '<g class="eyes-happy" fill="none" stroke="' + EYE + '" stroke-width="7" stroke-linecap="round">' +
      '<path d="M 94 128 Q 110 106 126 128"/><path d="M 174 128 Q 190 106 206 128"/>' +
      '</g>' +
      '<path d="M 141 146 Q 150 142 159 146 Q 155 156 150 158 Q 145 156 141 146 Z" fill="#ff7f9f"/>' +
      '<path class="mouth-smile" d="M 150 158 L 150 166 M 150 166 Q 138 178 124 168 M 150 166 Q 162 178 176 168" stroke="' + EYE + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path class="mouth-happy" d="M 128 164 Q 150 200 172 164 Z" fill="#c2456b" stroke="' + EYE + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M 70 158 L 28 150 M 70 168 L 26 172 M 72 178 L 34 192 M 230 158 L 272 150 M 230 168 L 274 172 M 228 178 L 266 192" stroke="#8a7aa6" stroke-width="3.5" stroke-linecap="round" opacity="0.55"/>' +
      '</g>' +
      '</svg>';
  };

  LC.balloonSVG = function (color) {
    return '<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 30 68 C 22 78 38 88 30 98" stroke="#b9a8d4" stroke-width="2" fill="none"/>' +
      '<ellipse cx="30" cy="32" rx="24" ry="30" fill="' + color + '"/>' +
      '<path d="M 30 61 L 23 70 L 37 70 Z" fill="' + color + '"/>' +
      '<ellipse cx="20" cy="20" rx="5" ry="9" fill="#fff" opacity="0.45" transform="rotate(-20 20 20)"/>' +
      '</svg>';
  };

  LC.glyphSVG = function (key, opts) {
    var g = LC.GLYPHS[key];
    var sw = (opts && opts.sw) || 14;
    var paths = g.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    return '<svg class="glyph" viewBox="' + g.view.join(' ') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g fill="none" stroke="' + g.color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>';
  };

  LC.homeSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 8 24 L 24 9 L 40 24 M 13 21 L 13 40 L 35 40 L 35 21" fill="none" stroke="#7c5cd6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  LC.pencilSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 10 38 L 12 29 L 32 9 L 39 16 L 19 36 Z M 28 13 L 35 20" fill="none" stroke="#7c5cd6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };

  LC.searchSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="21" cy="21" r="12" fill="none" stroke="#7c5cd6" stroke-width="5"/>' +
      '<path d="M 30 30 L 41 41" stroke="#7c5cd6" stroke-width="6" stroke-linecap="round"/></svg>';
  };

  LC.playSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M 15 8 L 40 24 L 15 40 Z" fill="#7c5cd6" stroke="#7c5cd6" stroke-width="4" stroke-linejoin="round"/></svg>';
  };

  LC.arrowSVG = function (dir) {
    var d = dir < 0 ? 'M 30 8 L 14 24 L 30 40' : 'M 18 8 L 34 24 L 18 40';
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#7c5cd6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  LC.pawSVG = function () {
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="#7c5cd6">' +
      '<ellipse cx="32" cy="42" rx="14" ry="11"/><ellipse cx="14" cy="28" rx="6" ry="8"/><ellipse cx="25" cy="17" rx="6" ry="8"/>' +
      '<ellipse cx="39" cy="17" rx="6" ry="8"/><ellipse cx="50" cy="28" rx="6" ry="8"/></svg>';
  };

  // The doll house room that sits behind every screen.
  LC.sceneSVG = function () {
    var flags = '';
    var cols = ['#ffc8dd', '#bde0fe', '#fff1a8', '#c7f0d2', '#e4c9f5'];
    for (var i = 0; i < 14; i++) {
      var x = 20 + i * 92;
      var y = 24 + Math.sin(i / 13 * Math.PI) * 26;
      flags += '<path d="M ' + x + ' ' + y + ' L ' + (x + 46) + ' ' + y + ' L ' + (x + 23) + ' ' + (y + 40) + ' Z" fill="' + cols[i % cols.length] + '"/>';
    }
    var planks = '';
    for (var j = 1; j < 9; j++) planks += '<path d="M ' + (j * 160) + ' 644 L ' + (j * 160 - 30 + (j - 4) * -10) + ' 800" stroke="#f8d6bc" stroke-width="3"/>';
    return '' +
      '<svg class="scene" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><pattern id="wp" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="5" fill="#eed9f5"/><circle cx="48" cy="48" r="5" fill="#eed9f5"/></pattern></defs>' +
      '<rect width="1280" height="640" fill="#f7ebfb"/><rect width="1280" height="640" fill="url(#wp)"/>' +
      '<path d="M 0 30 Q 640 90 1280 30" stroke="#d9c3ea" stroke-width="3" fill="none"/>' +
      flags +
      '<rect y="620" width="1280" height="26" fill="#ffffff"/>' +
      '<rect y="646" width="1280" height="154" fill="#fde7d4"/>' + planks +
      '<ellipse cx="640" cy="738" rx="440" ry="52" fill="#e6f5ec"/><ellipse cx="640" cy="738" rx="380" ry="40" fill="#f1fbf4"/>' +
      // window
      '<rect x="1000" y="120" width="200" height="250" rx="14" fill="#ffffff"/>' +
      '<rect x="1014" y="134" width="172" height="222" rx="8" fill="#d9f0ff"/>' +
      '<circle cx="1120" cy="190" r="26" fill="#fff3b0"/>' +
      '<ellipse cx="1060" cy="260" rx="34" ry="14" fill="#ffffff"/><ellipse cx="1082" cy="250" rx="24" ry="14" fill="#ffffff"/>' +
      '<path d="M 1100 134 L 1100 356 M 1014 245 L 1186 245" stroke="#ffffff" stroke-width="8"/>' +
      '<path d="M 990 112 L 1070 112 Q 1052 240 1076 366 L 990 366 Z" fill="#f9c6da"/>' +
      '<path d="M 1210 112 L 1130 112 Q 1148 240 1124 366 L 1210 366 Z" fill="#f9c6da"/>' +
      '<rect x="975" y="102" width="250" height="12" rx="6" fill="#d9a7bd"/>' +
      // pictures
      '<rect x="130" y="130" width="150" height="112" rx="10" fill="#ffffff"/><rect x="142" y="142" width="126" height="88" rx="6" fill="#ffe6f0"/>' +
      '<path d="M 205 205 C 160 175 170 150 190 156 C 198 158 205 166 205 166 C 205 166 212 158 220 156 C 240 150 250 175 205 205 Z" fill="#f7a6c4"/>' +
      '<rect x="320" y="160" width="104" height="104" rx="10" fill="#ffffff"/><rect x="332" y="172" width="80" height="80" rx="6" fill="#e6f8e4"/>' +
      '<path d="M 372 184 L 380 206 L 402 206 L 384 220 L 391 242 L 372 229 L 353 242 L 360 220 L 342 206 L 364 206 Z" fill="#fde68a"/>' +
      // plant
      '<path d="M 1120 560 L 1180 560 L 1170 640 L 1130 640 Z" fill="#f4c7a3"/>' +
      '<ellipse cx="1150" cy="530" rx="18" ry="44" fill="#a8dfb0" transform="rotate(-25 1150 540)"/>' +
      '<ellipse cx="1150" cy="522" rx="18" ry="48" fill="#8fd39b"/>' +
      '<ellipse cx="1150" cy="530" rx="18" ry="44" fill="#a8dfb0" transform="rotate(25 1150 540)"/>' +
      '</svg>';
  };
})();
