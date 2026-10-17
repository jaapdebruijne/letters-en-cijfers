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

  // Clothes for the cats, drawn in the cat's own coordinates (head centre 150,128).
  // where: back = behind the body, head = moves with the head, front = over the body.
  var ACC = {
    bow: { where: 'head', svg: '<g transform="translate(98 58) rotate(-18)"><path d="M 0 0 L -28 -15 L -28 15 Z" fill="#ff5c8a"/><path d="M 0 0 L 28 -15 L 28 15 Z" fill="#ff5c8a"/><circle r="8" fill="#e6396b"/></g>' },
    flower: { where: 'head', svg: '<g transform="translate(214 62)"><circle cx="0" cy="-15" r="11" fill="#fff"/><circle cx="14" cy="-5" r="11" fill="#fff"/><circle cx="9" cy="12" r="11" fill="#fff"/><circle cx="-9" cy="12" r="11" fill="#fff"/><circle cx="-14" cy="-5" r="11" fill="#fff"/><circle r="9" fill="#ffd23f"/></g>' },
    party: { where: 'head', svg: '<path d="M 150 -14 L 108 56 L 192 56 Z" fill="#7c5cd6"/><path d="M 132 22 L 168 22 L 178 40 L 122 40 Z" fill="#ff8fab"/><circle cx="140" cy="48" r="5" fill="#ffd23f"/><circle cx="162" cy="46" r="5" fill="#ffd23f"/><circle cx="150" cy="-14" r="10" fill="#ffd23f"/>' },
    wizard: { where: 'head', svg: '<path d="M 104 56 C 130 40 140 -10 160 -56 C 168 -20 184 30 196 56 Z" fill="#5b3fa6"/><ellipse cx="150" cy="58" rx="80" ry="15" fill="#4a3290"/><path d="M 150 14 L 154 24 L 165 24 L 156 31 L 160 41 L 150 35 L 140 41 L 144 31 L 135 24 L 146 24 Z" fill="#ffd23f"/>' },
    crown: { where: 'head', svg: '<path d="M 108 54 L 106 14 L 128 34 L 150 4 L 172 34 L 194 14 L 192 54 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="5" stroke-linejoin="round"/><circle cx="150" cy="40" r="6" fill="#ff4f81"/><circle cx="124" cy="44" r="4.5" fill="#4cc9f0"/><circle cx="176" cy="44" r="4.5" fill="#4cc9f0"/>' },
    shades: { where: 'head', svg: '<rect x="82" y="100" width="56" height="42" rx="16" fill="#2b2140"/><rect x="162" y="100" width="56" height="42" rx="16" fill="#2b2140"/><rect x="136" y="112" width="28" height="9" fill="#2b2140"/><path d="M 92 112 L 108 108 M 172 112 L 188 108" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.6"/>' },
    hearts: { where: 'head', svg: '<g transform="translate(110 124) scale(1.55)"><path d="M 0 10 C -24 -6 -16 -28 0 -15 C 16 -28 24 -6 0 10 Z" fill="#ff4f81" opacity="0.92"/><path d="M -9 -10 C -13 -8 -13 -4 -12 -2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g><g transform="translate(190 124) scale(1.55)"><path d="M 0 10 C -24 -6 -16 -28 0 -15 C 16 -28 24 -6 0 10 Z" fill="#ff4f81" opacity="0.92"/><path d="M -9 -10 C -13 -8 -13 -4 -12 -2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g><path d="M 134 118 L 166 118" stroke="#ff4f81" stroke-width="5"/>' },
    cape: { where: 'back', svg: '<path d="M 98 214 C 52 270 40 330 62 346 L 238 346 C 260 330 248 270 202 214 Z" fill="#ef476f"/><path d="M 62 346 L 238 346 L 232 334 L 68 334 Z" fill="#c9304f"/>' },
    scarf: { where: 'front', svg: '<path d="M 94 214 Q 150 246 206 214 L 212 238 Q 150 272 88 238 Z" fill="#4cc9f0"/><path d="M 118 232 L 126 252 M 150 240 L 150 262 M 182 232 L 174 252" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/><rect x="170" y="238" width="26" height="60" rx="10" fill="#4cc9f0"/><path d="M 170 262 L 196 262 M 170 280 L 196 280" stroke="#fff" stroke-width="5" opacity="0.7"/>' }
  };

  LC.catSVG = function (key, opts) {
    opts = opts || {};
    var c = PAL[key];
    var vb = opts.vb || (opts.head ? '45 5 210 215' : '0 0 300 345');
    var o = opts.outfit || {}, back = '', onHead = '', front = '';
    ['head', 'face', 'body'].forEach(function (slot) {
      var a = o[slot] && ACC[o[slot]];
      if (!a) return;
      if (a.where === 'back') back += a.svg; else if (a.where === 'front') front += a.svg; else onHead += a.svg;
    });
    return '' +
      '<svg class="cat ' + (opts.cls || 'idle') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      back +
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
      onHead +
      '</g>' +
      front +
      '</svg>';
  };

  // Doll house things. Drawn around (0,0) = middle of the bottom edge; `at` is where
  // they stand in the room (room is 1280 x 800), `vb` is the crop used for shop pictures.
  var DECOR = {
    teddy: { at: [440, 664], vb: '-70 -140 140 150', svg:
      '<ellipse cx="0" cy="-34" rx="38" ry="40" fill="#c68642"/><ellipse cx="0" cy="-30" rx="22" ry="26" fill="#e8c39e"/>' +
      '<circle cx="-24" cy="-6" r="14" fill="#c68642"/><circle cx="24" cy="-6" r="14" fill="#c68642"/>' +
      '<ellipse cx="-38" cy="-44" rx="11" ry="16" fill="#c68642" transform="rotate(25 -38 -44)"/><ellipse cx="38" cy="-44" rx="11" ry="16" fill="#c68642" transform="rotate(-25 38 -44)"/>' +
      '<circle cx="0" cy="-90" r="30" fill="#c68642"/><circle cx="-24" cy="-114" r="12" fill="#c68642"/><circle cx="24" cy="-114" r="12" fill="#c68642"/>' +
      '<circle cx="-24" cy="-114" r="6" fill="#e8c39e"/><circle cx="24" cy="-114" r="6" fill="#e8c39e"/>' +
      '<ellipse cx="0" cy="-82" rx="14" ry="10" fill="#e8c39e"/><circle cx="-11" cy="-95" r="3.6" fill="#3b2f55"/><circle cx="11" cy="-95" r="3.6" fill="#3b2f55"/>' +
      '<ellipse cx="0" cy="-86" rx="4.5" ry="3.4" fill="#3b2f55"/><path d="M -6 -66 L 0 -60 L 6 -66 L 6 -58 L 0 -62 L -6 -58 Z" fill="#ef476f"/>' },
    lamp: { at: [1235, 650], vb: '-60 -350 120 360', svg:
      '<ellipse cx="0" cy="-4" rx="34" ry="8" fill="#b9a8d4"/><rect x="-4" y="-270" width="8" height="266" fill="#b9a8d4"/>' +
      '<circle cx="0" cy="-290" r="100" fill="#fff3b0" opacity="0.2"/><path d="M -42 -258 L 42 -258 L 28 -318 L -28 -318 Z" fill="#ffe27a"/>' +
      '<path d="M -42 -258 L 42 -258 L 38 -270 L -38 -270 Z" fill="#ffd23f"/>' },
    fishbowl: { at: [1048, 650], vb: '-70 -200 140 210', svg:
      '<rect x="-34" y="-86" width="8" height="82" fill="#d9a7bd"/><rect x="26" y="-86" width="8" height="82" fill="#d9a7bd"/><ellipse cx="0" cy="-90" rx="46" ry="9" fill="#f4c7a3"/>' +
      '<circle cx="0" cy="-140" r="46" fill="#bfe9ff" opacity="0.75"/><path d="M -40 -128 A 46 46 0 0 0 40 -128 Z" fill="#7cc8f0" opacity="0.6"/>' +
      '<ellipse cx="-8" cy="-140" rx="14" ry="9" fill="#ff8a3d"/><path d="M 4 -140 L 18 -149 L 18 -131 Z" fill="#ff8a3d"/><circle cx="-14" cy="-143" r="2.4" fill="#3b2f55"/>' +
      '<path d="M 24 -96 C 18 -112 30 -120 24 -134" stroke="#5bbf72" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-184" rx="46" ry="6" fill="none" stroke="#fff" stroke-width="3" opacity="0.6"/>' },
    horse: { at: [850, 672], vb: '-100 -190 200 200', svg:
      '<path d="M -90 -6 C -70 12 70 12 90 -6" stroke="#b9774a" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<path d="M -50 -8 L -40 -80 M 50 -8 L 40 -80" stroke="#c68642" stroke-width="10" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="-92" rx="58" ry="30" fill="#f2c18d"/><path d="M 34 -100 L 50 -150 L 78 -160 L 88 -140 L 62 -120 Z" fill="#f2c18d"/>' +
      '<ellipse cx="80" cy="-146" rx="20" ry="14" fill="#f2c18d" transform="rotate(-15 80 -146)"/><circle cx="76" cy="-152" r="3.4" fill="#3b2f55"/>' +
      '<path d="M 46 -150 L 40 -176 L 58 -160 Z" fill="#c68642"/><path d="M 40 -138 C 20 -150 20 -120 36 -110" stroke="#ef476f" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M -56 -100 C -80 -96 -84 -70 -72 -52" stroke="#ef476f" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M -10 -118 L 28 -108" stroke="#ef476f" stroke-width="8" stroke-linecap="round"/>' },
    train: { at: [540, 782], vb: '-30 -90 330 100', svg:
      '<rect x="0" y="-52" width="70" height="40" rx="8" fill="#ef476f"/><rect x="42" y="-72" width="30" height="24" rx="5" fill="#ef476f"/><rect x="8" y="-64" width="22" height="12" rx="3" fill="#4a3f63"/>' +
      '<rect x="48" y="-90" width="12" height="20" fill="#4a3f63"/><circle cx="54" cy="-98" r="9" fill="#fff" opacity="0.8"/>' +
      '<circle cx="16" cy="-10" r="12" fill="#4a3f63"/><circle cx="54" cy="-10" r="12" fill="#4a3f63"/>' +
      '<rect x="84" y="-46" width="66" height="34" rx="8" fill="#4d96ff"/><circle cx="102" cy="-10" r="11" fill="#4a3f63"/><circle cx="134" cy="-10" r="11" fill="#4a3f63"/>' +
      '<rect x="164" y="-46" width="66" height="34" rx="8" fill="#ffd23f"/><circle cx="182" cy="-10" r="11" fill="#4a3f63"/><circle cx="214" cy="-10" r="11" fill="#4a3f63"/>' +
      '<path d="M 70 -30 L 84 -30 M 150 -30 L 164 -30" stroke="#4a3f63" stroke-width="5"/>' },
    rainbow: { at: [640, 330], vb: '-160 -150 320 160', svg:
      '<g fill="none" stroke-width="16" stroke-linecap="round">' +
      '<path d="M -140 0 A 140 140 0 0 1 140 0" stroke="#ff6f91"/><path d="M -124 0 A 124 124 0 0 1 124 0" stroke="#ffa62b"/>' +
      '<path d="M -108 0 A 108 108 0 0 1 108 0" stroke="#ffd23f"/><path d="M -92 0 A 92 92 0 0 1 92 0" stroke="#7bd88f"/>' +
      '<path d="M -76 0 A 76 76 0 0 1 76 0" stroke="#4d96ff"/></g>' +
      '<ellipse cx="-142" cy="-2" rx="30" ry="16" fill="#fff"/><ellipse cx="142" cy="-2" rx="30" ry="16" fill="#fff"/>' +
      '<ellipse cx="-118" cy="-10" rx="22" ry="14" fill="#fff"/><ellipse cx="118" cy="-10" rx="22" ry="14" fill="#fff"/>' }
  };

  // The things a child owns, drawn into the room behind every screen.
  LC.decorMarkup = function (ids, newId) {
    return ids.filter(function (id) { return DECOR[id]; }).map(function (id) {
      var d = DECOR[id];
      return '<g transform="translate(' + d.at[0] + ' ' + d.at[1] + ')"><g class="' + (id === newId ? 'decor-in' : '') + '">' + d.svg + '</g></g>';
    }).join('');
  };
  LC.decorPreview = function (id) {
    var d = DECOR[id];
    return '<svg class="gp" viewBox="' + d.vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + d.svg + '</svg>';
  };
  LC.accessoryPreview = function (key, id) {
    var a = LC.shopItem(id), o = {};
    o[a.slot] = id;
    return LC.catSVG(key, { head: true, cls: 'still', vb: a.slot === 'body' ? '20 -4 260 354' : '40 -66 220 252', outfit: o });
  };

  LC.balloonSVG = function (color) {
    return '<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 30 68 C 22 78 38 88 30 98" stroke="#b9a8d4" stroke-width="2" fill="none"/>' +
      '<ellipse cx="30" cy="32" rx="24" ry="30" fill="' + color + '"/>' +
      '<path d="M 30 61 L 23 70 L 37 70 Z" fill="' + color + '"/>' +
      '<ellipse cx="20" cy="20" rx="5" ry="9" fill="#fff" opacity="0.45" transform="rotate(-20 20 20)"/>' +
      '</svg>';
  };

  LC.balloonLetterSVG = function (color, key, pos) {
    var g = LC.GLYPHS[key];
    var paths = g.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    var at = pos ? ' x="' + pos[0] + '" y="' + pos[1] + '" width="' + pos[2] + '" height="' + pos[3] + '"' : '';
    return '<svg' + at + ' viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 30 68 C 22 78 38 88 30 98" stroke="#b9a8d4" stroke-width="2" fill="none"/>' +
      '<ellipse cx="30" cy="32" rx="26" ry="31" fill="' + color + '"/>' +
      '<path d="M 30 62 L 23 71 L 37 71 Z" fill="' + color + '"/>' +
      '<ellipse cx="30" cy="32" rx="16.5" ry="21.5" fill="#ffffff" opacity="0.93"/>' +
      '<svg x="16" y="12" width="28" height="40" viewBox="' + g.view.join(' ') + '" preserveAspectRatio="xMidYMid meet">' +
      '<g fill="none" stroke="' + g.color + '" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>' +
      '</svg>';
  };

  // Big illustrated artwork for the three game buttons.
  function sparkle(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="tw" d="M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z" fill="#fff"/></g>';
  }
  function glyphIn(key, x, y, w, h, sw, color) {
    var g = LC.GLYPHS[key];
    var paths = g.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    return '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + g.view.join(' ') + '">' +
      '<g fill="none" stroke="' + (color || g.color) + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>';
  }

  // lower = true shows small letters (a, m, p) instead of capitals on the pictures
  LC.gameCardSVG = function (kind, lower) {
    var head = '<svg class="gart" viewBox="0 0 240 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="40" cy="250" r="36" fill="#fff" opacity="0.18"/><circle cx="208" cy="58" r="46" fill="#fff" opacity="0.18"/>';
    var body = '', L = lower ? ['a', 'm', 'p'] : ['A', 'M', 'P'];
    if (kind === 'trace') {
      var G0 = LC.GLYPHS[L[0]], v = G0.view;
      var guide = G0.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
      var ink = lower ? G0.strokes[0] : 'M 18 148 L 60 14';
      var tipAt = lower ? [84, 112] : [60, 14];
      var sc = Math.min(140 / v[2], 190 / v[3]);
      var tipX = 50 + (140 - v[2] * sc) / 2 + (tipAt[0] - v[0]) * sc, tipY = 70 + (190 - v[3] * sc) / 2 + (tipAt[1] - v[1]) * sc;
      body = sparkle(34, 52, 1.3) + sparkle(205, 215, 1.1) + sparkle(190, 30, 0.8) +
        '<svg x="50" y="70" width="140" height="190" viewBox="' + v.join(' ') + '">' +
        '<g fill="none" stroke="#fff" stroke-width="28" opacity="0.6" stroke-linecap="round" stroke-linejoin="round">' + guide + '</g>' +
        '<g fill="none" stroke="#7c5cd6" stroke-width="7" stroke-linecap="round" stroke-dasharray="0.1 11">' + guide + '</g>' +
        '<path d="' + ink + '" fill="none" stroke="#ff4f81" stroke-width="20" stroke-linecap="round"/></svg>' +
        '<g transform="translate(' + tipX.toFixed(1) + ' ' + tipY.toFixed(1) + ') rotate(32)"><g class="pencil">' +
        '<path d="M 0 0 L -9 -24 L 9 -24 Z" fill="#f5d6a3"/><path d="M 0 0 L -3.2 -8.5 L 3.2 -8.5 Z" fill="#3b2f55"/>' +
        '<rect x="-9" y="-108" width="18" height="84" fill="#ffcf3f"/><rect x="-2.5" y="-108" width="5" height="84" fill="#ffb300"/>' +
        '<rect x="-9.5" y="-119" width="19" height="11" fill="#b8c0cc"/><rect x="-9" y="-133" width="18" height="15" rx="6" fill="#ff8fab"/>' +
        '</g></g>';
    } else if (kind === 'find') {
      body = sparkle(34, 52, 1.2) + sparkle(205, 40, 1.4) + sparkle(30, 262, 0.9) +
        '<rect x="12" y="92" width="68" height="112" rx="18" fill="#fff"/>' + glyphIn(L[0], 22, 106, 48, 84, 15) +
        '<rect x="86" y="92" width="68" height="112" rx="18" fill="#fff"/>' + glyphIn(L[1], 96, 106, 48, 84, 15) +
        '<rect x="160" y="92" width="68" height="112" rx="18" fill="#fff"/>' + glyphIn(L[2], 170, 106, 48, 84, 15) +
        '<g class="mag"><circle cx="122" cy="156" r="56" fill="#ffffff" fill-opacity="0.28" stroke="#ff7a59" stroke-width="13"/>' +
        '<path d="M 164 198 L 212 258" stroke="#ff7a59" stroke-width="20" stroke-linecap="round"/>' +
        '<path d="M 88 128 C 96 112 110 104 124 102" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.9"/></g>';
    } else if (kind === 'math') {
      var dotRow = function (x, y, n, col) {
        var o = '';
        for (var i = 0; i < n; i++) o += '<circle cx="' + (x + i * 30) + '" cy="' + y + '" r="12" fill="' + col + '" stroke="#fff" stroke-width="4"/>';
        return o;
      };
      body = sparkle(34, 48, 1.2) + sparkle(206, 44, 1.0) + sparkle(120, 272, 1.1) +
        '<rect x="28" y="64" width="184" height="88" rx="22" fill="#fff"/>' +
        dotRow(52, 108, 2, '#ff6f91') + '<path d="M 112 108 L 128 108 M 120 100 L 120 116" stroke="#7c5cd6" stroke-width="7" stroke-linecap="round"/>' + dotRow(150, 108, 3, '#4d96ff') +
        '<g class="mag"><circle cx="120" cy="210" r="40" fill="#fff"/></g>' + glyphIn('5', 98, 182, 44, 56, 14);
    } else if (kind === 'count') {
      var star = function (x, y, s, n) {
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="cstar">' +
          '<polygon points="0,-44 11,-14 43,-14 17,5 27,37 0,17 -27,37 -17,5 -43,-14 -11,-14" fill="#ffd23f" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></g></g>' +
          '<circle cx="' + x + '" cy="' + (y + 56 * s) + '" r="' + (21 * s) + '" fill="#fff"/>' + glyphIn(String(n), x - 13 * s, y + 56 * s - 18 * s, 26 * s, 36 * s, 17);
      };
      body = sparkle(34, 44, 1.2) + sparkle(206, 38, 1.0) + sparkle(120, 270, 1.1) +
        '<circle cx="120" cy="70" r="42" fill="#fff"/>' + glyphIn('3', 96, 40, 48, 60, 14) +
        star(52, 168, 0.8, 1) + star(120, 150, 0.9, 2) + star(188, 168, 0.8, 3);
    } else {
      body = sparkle(30, 40, 1.3) + sparkle(212, 36, 1.0) + sparkle(120, 270, 1.2) +
        '<g class="bb b1">' + LC.balloonLetterSVG(LC.BALLOON_COLORS[0], L[0], [10, 76, 80, 133]) + '</g>' +
        '<g class="bb b2">' + LC.balloonLetterSVG(LC.BALLOON_COLORS[2], L[1], [74, 22, 94, 157]) + '</g>' +
        '<g class="bb b3">' + LC.balloonLetterSVG(LC.BALLOON_COLORS[1], L[2], [152, 88, 76, 127]) + '</g>';
    }
    return head + body + '</svg>';
  };

  // A number as a picture; 10 is drawn as a 1 and a 0 next to each other.
  LC.numberSVG = function (n, opts) {
    if (n < 10) return LC.glyphSVG(String(n), opts);
    var sw = (opts && opts.sw) || 14;
    return '<svg class="glyph" viewBox="0 0 250 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      glyphIn('1', 0, 0, 110, 160, sw) + glyphIn('0', 130, 0, 110, 160, sw) + '</svg>';
  };

  // The things a child counts in the counting game.
  LC.countItemSVG = function (kind, color) {
    if (kind === 'balloon') return LC.balloonSVG(color);
    var shape;
    if (kind === 'star') shape = '<polygon points="50,5 62,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 38,38" fill="' + color + '" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>';
    else if (kind === 'heart') shape = '<path d="M 50 92 C 8 62 6 24 31 19 C 44 17 50 28 50 28 C 50 28 56 17 69 19 C 94 24 92 62 50 92 Z" fill="' + color + '" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>';
    else shape = '<g fill="' + color + '" stroke="#fff" stroke-width="3"><circle cx="50" cy="23" r="18"/><circle cx="74" cy="37" r="18"/><circle cx="74" cy="63" r="18"/><circle cx="50" cy="77" r="18"/><circle cx="26" cy="63" r="18"/><circle cx="26" cy="37" r="18"/></g><circle cx="50" cy="50" r="14" fill="#ffd23f" stroke="#fff" stroke-width="3"/>';
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + shape + '</svg>';
  };

  LC.balloonIconSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<ellipse cx="24" cy="19" rx="13" ry="15" fill="none" stroke="#7c5cd6" stroke-width="4"/>' +
      '<path d="M 24 34 L 20 39 L 28 39 Z M 24 39 C 20 43 28 45 24 48" fill="none" stroke="#7c5cd6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  };

  LC.glyphSVG = function (key, opts) {
    var g = LC.GLYPHS[key];
    var sw = (opts && opts.sw) || 14, col = (opts && opts.color) || g.color;
    var paths = g.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
    return '<svg class="glyph" viewBox="' + g.view.join(' ') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>';
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

  // The vehicles of the bonus ride. All drawn around the car's centre point, with the
  // ground 28 units below it. The cat's head is drawn first (behind the body), so it
  // shows through the glass; wheels are added separately because they turn.
  var GL = 'rgba(196,232,255,0.42)';
  function hole(x, y, w, h) { return ' M ' + x + ' ' + y + ' h ' + w + ' v ' + h + ' h ' + (-w) + ' Z'; }

  var VEH = {
    '': { vb: [-72, -48, 144, 80], wheels: [{ x: -38, r: 18 }, { x: 38, r: 18 }], head: [-30, -92, 62, 74], stats: { v: 1, a: 1, p: 1 },
      body: function (c) {
        return '<rect x="-62" y="-20" width="124" height="32" rx="11" fill="' + c.body + '"/>' +
          '<rect x="-62" y="-4" width="124" height="6" rx="3" fill="#fff" opacity="0.7"/>' +
          '<rect x="26" y="-36" width="34" height="18" rx="8" fill="' + c.dark + '"/>' +
          '<circle cx="58" cy="-4" r="6" fill="#fff3a8"/>';
      } },
    taxi: { vb: [-72, -70, 144, 102], wheels: [{ x: -40, r: 18 }, { x: 40, r: 18 }], head: [-22, -70, 46, 54], stats: { v: 1.05, a: 1, p: 1 },
      body: function () {
        var chk = '';
        for (var i = 0; i < 11; i++) chk += '<rect x="' + (-60 + i * 11) + '" y="-8" width="11" height="6" fill="' + (i % 2 ? '#3b2f55' : '#fff') + '"/>';
        return '<rect x="-66" y="-18" width="132" height="32" rx="12" fill="#ffd23f"/>' + chk +
          '<path d="M -34 -18 L -22 -54 L 24 -54 L 38 -18 Z" fill="' + GL + '" stroke="#e0a800" stroke-width="5" stroke-linejoin="round"/>' +
          '<rect x="-12" y="-66" width="24" height="12" rx="4" fill="#fff" stroke="#3b2f55" stroke-width="3"/>' +
          '<circle cx="60" cy="-6" r="5" fill="#fff3a8"/><rect x="-68" y="6" width="136" height="6" rx="3" fill="#c99a00"/>';
      } },
    police: { vb: [-72, -70, 144, 102], wheels: [{ x: -40, r: 18 }, { x: 40, r: 18 }], head: [-22, -70, 46, 54], stats: { v: 1.1, a: 1.05, p: 1 },
      body: function () {
        return '<rect x="-66" y="-18" width="132" height="32" rx="12" fill="#f4f7ff"/><rect x="-66" y="-6" width="132" height="12" fill="#2f5fd0"/>' +
          '<polygon points="-30,-16 -26,-8 -18,-8 -24,-3 -22,5 -30,0 -38,5 -36,-3 -42,-8 -34,-8" fill="#ffd23f" transform="translate(0 -1)"/>' +
          '<path d="M -34 -18 L -22 -54 L 24 -54 L 38 -18 Z" fill="' + GL + '" stroke="#2f5fd0" stroke-width="5" stroke-linejoin="round"/>' +
          '<rect x="-20" y="-64" width="20" height="10" rx="3" fill="#e63946"/><rect x="0" y="-64" width="20" height="10" rx="3" fill="#3b82f6"/>' +
          '<circle cx="60" cy="-6" r="5" fill="#fff3a8"/>';
      } },
    truck: { vb: [-98, -74, 182, 106], wheels: [{ x: -62, r: 21 }, { x: 50, r: 21 }], head: [14, -78, 44, 52], stats: { v: 0.92, a: 0.95, p: 0.7 },
      body: function () {
        return '<rect x="-96" y="-6" width="172" height="20" rx="6" fill="#4a5568"/>' +
          '<rect x="-96" y="-66" width="88" height="62" rx="8" fill="#ff9f43"/><rect x="-96" y="-40" width="88" height="8" fill="#fff" opacity="0.8"/>' +
          '<path fill-rule="evenodd" fill="#3d8bfd" d="M -2 -6 L -2 -52 L 36 -52 L 60 -22 L 78 -22 L 78 -6 Z M 8 -44 L 34 -44 L 50 -26 L 8 -26 Z"/>' +
          '<path d="M 8 -44 L 34 -44 L 50 -26 L 8 -26 Z" fill="' + GL + '"/>' +
          '<circle cx="76" cy="-14" r="5" fill="#fff3a8"/><rect x="-8" y="-72" width="6" height="30" fill="#333"/>';
      } },
    fire: { vb: [-100, -82, 190, 114], wheels: [{ x: -60, r: 21 }, { x: 52, r: 21 }], head: [10, -78, 44, 52], stats: { v: 1, a: 1, p: 0.8 },
      body: function () {
        var rungs = '';
        for (var i = 0; i < 8; i++) rungs += '<rect x="' + (-90 + i * 11) + '" y="-58" width="3" height="12" fill="#c0c6cf"/>';
        return '<rect x="-98" y="-6" width="188" height="20" rx="6" fill="#b3202c"/>' +
          '<rect x="-98" y="-44" width="92" height="40" rx="6" fill="#e5383b"/><rect x="-98" y="-26" width="92" height="7" fill="#fff" opacity="0.85"/>' +
          '<rect x="-94" y="-58" width="84" height="4" fill="#c0c6cf"/><rect x="-94" y="-50" width="84" height="4" fill="#c0c6cf"/>' + rungs +
          '<path fill-rule="evenodd" fill="#e5383b" d="M -4 -6 L -4 -52 L 34 -52 L 54 -22 L 88 -22 L 88 -6 Z M 6 -44 L 32 -44 L 46 -26 L 6 -26 Z"/>' +
          '<path d="M 6 -44 L 32 -44 L 46 -26 L 6 -26 Z" fill="' + GL + '"/>' +
          '<rect x="8" y="-62" width="22" height="10" rx="4" fill="#ffd23f"/><rect x="62" y="-10" width="28" height="8" fill="#c0c6cf"/>' +
          '<circle cx="86" cy="-14" r="5" fill="#fff3a8"/>';
      } },
    bus: { vb: [-100, -70, 198, 102], wheels: [{ x: -60, r: 21 }, { x: 58, r: 21 }], head: [42, -74, 44, 52], stats: { v: 0.95, a: 0.95, p: 0.75 },
      body: function () {
        var d = 'M -98 -6 L -98 -58 Q -98 -66 -90 -66 L 84 -66 Q 94 -66 94 -56 L 94 -6 Z';
        var wins = [[-84, -52, 24, 24], [-54, -52, 24, 24], [-24, -52, 24, 24], [6, -52, 24, 24], [40, -54, 42, 28]];
        var glass = '';
        wins.forEach(function (w) { d += hole(w[0], w[1], w[2], w[3]); glass += '<rect x="' + w[0] + '" y="' + w[1] + '" width="' + w[2] + '" height="' + w[3] + '" fill="' + GL + '"/>'; });
        return '<path fill-rule="evenodd" fill="#ffd23f" d="' + d + '"/>' + glass +
          '<rect x="-98" y="-14" width="192" height="6" fill="#3b2f55"/><circle cx="90" cy="-16" r="5" fill="#fff3a8"/>';
      } },
    f1: { vb: [-96, -64, 202, 96], wheels: [{ x: -56, r: 22 }, { x: 62, r: 19 }], head: [-14, -60, 44, 52], stats: { v: 1.3, a: 1.2, p: 1 },
      body: function () {
        return '<rect x="-88" y="-44" width="26" height="7" rx="2" fill="#2d3142"/><rect x="-80" y="-38" width="4" height="26" fill="#2d3142"/>' +
          '<rect x="-88" y="-48" width="4" height="16" fill="#2d3142"/>' +
          '<path d="M -78 14 L -78 -6 L -60 -12 L -30 -14 L -8 -14 L 22 -8 L 66 4 L 96 8 L 96 14 Z" fill="#e5383b"/>' +
          '<path d="M -52 -14 L -42 -32 L -30 -32 L -26 -14 Z" fill="#c1121f"/>' +
          '<ellipse cx="8" cy="-12" rx="25" ry="5" fill="#2d3142"/>' +
          '<rect x="-20" y="0" width="60" height="6" fill="#fff" opacity="0.85"/>' +
          '<circle cx="54" cy="0" r="7" fill="#fff"/><path d="M 51 -2 L 55 -5 L 55 5" fill="none" stroke="#e5383b" stroke-width="2.4" stroke-linecap="round"/>' +
          '<rect x="76" y="10" width="30" height="6" rx="2" fill="#2d3142"/>';
      } }
  };

  // Everything the ride (and the shop pictures) need for one vehicle.
  LC.vehicleDef = function (id, key) {
    var v = VEH[id] || VEH[''];
    var inner = v.body(LC.CAR[key]);
    return {
      id: id || '', vb: v.vb, wheels: v.wheels, head: v.head, stats: v.stats, inner: inner,
      bodySvg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + v.vb[2] + '" height="' + v.vb[3] + '" viewBox="' + v.vb.join(' ') + '">' + inner + '</svg>'
    };
  };

  // A picture of a vehicle with the cat in it, for the shop.
  LC.carPreview = function (id, key, outfit) {
    var d = LC.vehicleDef(id, key), hd = d.head;
    var minX = Math.min(d.vb[0], hd[0]) - 6, minY = Math.min(d.vb[1], hd[1]) - 40;
    var maxX = Math.max(d.vb[0] + d.vb[2], hd[0] + hd[2]) + 6, maxY = d.vb[1] + d.vb[3] + 4;
    var cat = LC.catSVG(key, { head: true, cls: 'still', vb: '30 -62 240 285', outfit: outfit || {} })
      .replace('<svg class="cat', '<svg x="' + hd[0] + '" y="' + hd[1] + '" width="' + hd[2] + '" height="' + hd[3] + '" class="cat');
    var wheels = d.wheels.map(function (w) {
      return '<circle cx="' + w.x + '" cy="' + (28 - w.r) + '" r="' + w.r + '" fill="#3b2f55"/><circle cx="' + w.x + '" cy="' + (28 - w.r) + '" r="' + (w.r * 0.45) + '" fill="#cfd6e4"/>';
    }).join('');
    return '<svg class="gp" viewBox="' + [minX, minY, maxX - minX, maxY - minY].join(' ') + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      cat + d.inner + wheels + '</svg>';
  };

  // The bonus car: body colours per cat, and a small icon of it.
  LC.CAR = { pinky: { body: '#ff6f91', dark: '#d94b72' }, groentje: { body: '#4cc26b', dark: '#2f9a50' } };

  LC.carIconSVG = function () {
    return '<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="31" cy="14" r="9" fill="#f8a5c2"/><path d="M 24 8 L 25 1 L 30 6 Z M 38 8 L 37 1 L 32 6 Z" fill="#f8a5c2"/>' +
      '<rect x="6" y="20" width="52" height="16" rx="7" fill="#ff7a59"/><rect x="6" y="28" width="52" height="3" fill="#fff" opacity="0.6"/>' +
      '<circle cx="19" cy="38" r="7" fill="#3b2f55"/><circle cx="45" cy="38" r="7" fill="#3b2f55"/>' +
      '<circle cx="19" cy="38" r="3" fill="#cfd6e4"/><circle cx="45" cy="38" r="3" fill="#cfd6e4"/></svg>';
  };

  LC.hourglassSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 14 6 L 34 6 M 14 42 L 34 42" stroke="#7c5cd6" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M 16 8 C 16 20 24 22 24 24 C 24 26 16 28 16 40 L 32 40 C 32 28 24 26 24 24 C 24 22 32 20 32 8 Z" fill="#ffe9a8" stroke="#7c5cd6" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M 19 38 L 29 38 L 24 31 Z" fill="#ffb347"/></svg>';
  };

  LC.swapSVG = function () {
    return '<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M 8 18 L 48 18 M 40 8 L 50 18 L 40 28" fill="none" stroke="#7c5cd6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M 56 32 L 16 32 M 24 22 L 14 32 L 24 42" fill="none" stroke="#ff7aa8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  LC.giftSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="8" y="20" width="32" height="22" rx="3" fill="none" stroke="#7c5cd6" stroke-width="4"/>' +
      '<rect x="6" y="14" width="36" height="8" rx="3" fill="none" stroke="#7c5cd6" stroke-width="4"/>' +
      '<path d="M 24 14 L 24 42 M 24 14 C 18 4 10 8 14 13 M 24 14 C 30 4 38 8 34 13" fill="none" stroke="#7c5cd6" stroke-width="4" stroke-linecap="round"/></svg>';
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
      '<g id="decor"></g>' +
      '</svg>';
  };
})();
