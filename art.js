(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // Soft-3D furry cat colours. Fur is lit softly from above; Pinky has peach cheeks and lilac pads.
  var FUR = {
    roze: {
      furLicht: '#FFE4EE', fur: '#F5AFC8', furSchaduw: '#D97399',
      armLicht: '#FFDDE9', armSchaduw: '#DE7FA4', diep: '#B9587F',
      buik: ['#FFFFFF', '#FFEAF1', '#F6CADB'],
      iris: ['#D2EBFF', '#8DC2F0', '#4F86C6'],
      oorRand1: '#F0A6C1', oorRand2: '#E596B5', binnenoorRand: '#F7B9CF',
      blos: '#FF9A76', blosDekking: '0.7', kussens: '#B68AD9', zaad: 11
    },
    groen: {
      furLicht: '#E4F7DC', fur: '#AEDEA5', furSchaduw: '#70B46C',
      armLicht: '#DDF4D4', armSchaduw: '#78BC74', diep: '#4E9550',
      buik: ['#FFFFFF', '#EFF9EB', '#CAE8C3'],
      iris: ['#FFF0C2', '#F6C766', '#D4923A'],
      oorRand1: '#A6DA9D', oorRand2: '#93CC8C', binnenoorRand: '#F3BFCB',
      blos: '#F4A7A0', blosDekking: '0.6', kussens: '#F3A9BB', zaad: 29
    },
    blauw: {
      furLicht: '#DCF0FF', fur: '#89C4F0', furSchaduw: '#4A8FC4',
      armLicht: '#D0E8FF', armSchaduw: '#5A9FD4', diep: '#2F6FA0',
      buik: ['#FFFFFF', '#EAF4FF', '#C3DFFA'],
      iris: ['#FFF0C2', '#F6C766', '#D4923A'],
      oorRand1: '#7BBEE8', oorRand2: '#6AAED8', binnenoorRand: '#F3BFCB',
      blos: '#FF9A76', blosDekking: '0.6', kussens: '#B68AD9', zaad: 41
    },
    geel: {
      furLicht: '#FFFADC', fur: '#FFE066', furSchaduw: '#E0B800',
      armLicht: '#FFF5C0', armSchaduw: '#EACC00', diep: '#B89000',
      buik: ['#FFFFFF', '#FEFAE8', '#FFF0A0'],
      iris: ['#D2EBFF', '#8DC2F0', '#4F86C6'],
      oorRand1: '#FFD84D', oorRand2: '#FFCA2A', binnenoorRand: '#F7D8B0',
      blos: '#FF9A76', blosDekking: '0.6', kussens: '#E8A0D0', zaad: 17
    },
    oranje: {
      furLicht: '#FFEEDD', fur: '#FFB060', furSchaduw: '#E07A20',
      armLicht: '#FFE4C0', armSchaduw: '#EE8A30', diep: '#C06010',
      buik: ['#FFFFFF', '#FFF2E6', '#FFD9B0'],
      iris: ['#D2EBFF', '#8DC2F0', '#4F86C6'],
      oorRand1: '#FFA050', oorRand2: '#FF9040', binnenoorRand: '#FFC0A8',
      blos: '#FF6B6B', blosDekking: '0.6', kussens: '#CC88CC', zaad: 23
    },
    paars: {
      furLicht: '#F0E8FF', fur: '#C090E8', furSchaduw: '#8050B8',
      armLicht: '#EAD8FF', armSchaduw: '#9060C8', diep: '#603898',
      buik: ['#FFFFFF', '#F0E4FF', '#DBBAF5'],
      iris: ['#FFF0C2', '#F6C766', '#D4923A'],
      oorRand1: '#B880E0', oorRand2: '#A870D0', binnenoorRand: '#F3C0D8',
      blos: '#FF9A76', blosDekking: '0.6', kussens: '#FFB4D0', zaad: 31
    },
    regenboog: {
      furLicht: '#FFE4EE', fur: '#F5AFC8', furSchaduw: '#D97399',
      armLicht: '#FFDDE9', armSchaduw: '#DE7FA4', diep: '#B9587F',
      buik: ['#FFFFFF', '#FFEAF1', '#F6CADB'],
      iris: ['#D2EBFF', '#8DC2F0', '#4F86C6'],
      oorRand1: '#F0A6C1', oorRand2: '#E596B5', binnenoorRand: '#F7B9CF',
      blos: '#FF9A76', blosDekking: '0.7', kussens: '#B68AD9', zaad: 37
    }
  };
  var catSeq = 0;   // every cat drawing gets its own gradient ids

  // Pluizige vacht: getande randen (plukjes) die onder de gladde vormen uitsteken.
  var PLUIS = {
    hoofd: 'M162.1 86 Q171.2 90.7 168.1 95 Q166.9 100 160 99.1 Q167.8 106.1 163.3 109.6 Q160.6 114.1 153.8 111.2 Q158.9 119.9 153.6 122.2 Q149.6 126 143.9 121.7 Q145.6 130.5 139.9 131.7 Q135 134.4 131 129.7 Q129.4 137.1 123.8 137.4 Q118.3 138.9 116.1 134.7 Q113.7 139.8 107.8 139.4 Q102 139.7 100 136.4 Q98.4 140.9 92.2 139.4 Q86.2 138.6 83.9 134.7 Q82.3 140.7 76.2 137.4 Q70.4 135.3 69 129.7 Q64.9 136.7 60.1 131.7 Q55 128.3 56.1 121.7 Q49.4 128.3 46.4 122.2 Q42.5 117.8 46.2 111.2 Q37.7 116.1 36.7 109.6 Q34.2 104.4 40 99.1 Q31 101.5 31.9 95 Q31.1 89.6 37.9 86 Q29.2 86 31.8 80.1 Q32.8 74.8 40 72.9 Q32.1 70.8 36.3 65.8 Q38.9 60.9 46.2 60.8 Q39.8 57.1 45.3 53.2 Q49.3 49 56.1 50.3 Q51.7 45.9 57.9 43.2 Q63.1 40.1 69 42.3 Q66.4 37.8 73.1 36.5 Q79 34.6 83.9 37.3 Q84.4 32.8 90.8 32.9 Q96.8 32.5 100 35.6 Q103.6 31.4 109.2 32.9 Q115 33.8 116.1 37.3 Q122.4 33.6 126.9 36.5 Q132.1 38.6 131 42.3 Q138.7 39.2 142.1 43.2 Q146.4 46.4 143.9 50.3 Q152.8 48.4 154.7 53.2 Q158 57.3 153.8 60.8 Q163.5 60.7 163.7 65.8 Q165.6 70.5 160 72.9 Q169.6 75.2 168.2 80.1 Q168.5 85.1 162.1 86 Z',
    dijLinks: 'M91.3 180 Q96.9 184.9 93.9 189.7 Q91.2 194.7 86.8 193.1 Q88.4 200.4 83.1 202.5 Q77.8 205.1 75.2 201.2 Q74.4 207.7 68 206.8 Q61.9 206.2 60.8 201.2 Q58.5 206.9 52.9 202.5 Q48.1 198.7 49.2 193.1 Q44 196.3 42.1 189.7 Q40.5 183.8 44.7 180 Q38.6 179.6 41.1 173.1 Q43.4 167.5 49.2 166.9 Q44.5 163 50.5 159.2 Q55.8 155.9 60.8 158.8 Q61.6 152.3 68 153.2 Q74.1 153.8 75.2 158.8 Q81.7 154.9 85.5 159.2 Q89.7 163.2 86.8 166.9 Q94.4 167.5 94.9 173.1 Q95.7 178.7 91.3 180 Z',
    dijRechts: 'M155.3 180 Q160.9 184.9 157.9 189.7 Q155.2 194.7 150.8 193.1 Q152.4 200.4 147.1 202.5 Q141.8 205.1 139.2 201.2 Q138.4 207.7 132 206.8 Q125.9 206.2 124.8 201.2 Q122.5 206.9 116.9 202.5 Q112.1 198.7 113.2 193.1 Q108 196.3 106.1 189.7 Q104.5 183.8 108.7 180 Q102.6 179.6 105.1 173.1 Q107.4 167.5 113.2 166.9 Q108.5 163 114.5 159.2 Q119.8 155.9 124.8 158.8 Q125.6 152.3 132 153.2 Q138.1 153.8 139.2 158.8 Q145.7 154.9 149.5 159.2 Q153.7 163.2 150.8 166.9 Q158.4 167.5 158.9 173.1 Q159.7 178.7 155.3 180 Z',
    hoofdWaas: 'M162.1 86 Q175.4 91 171.2 95.5 Q169.9 100.7 160 99.1 Q172 107.6 166.3 110.9 Q163.5 115.7 153.8 111.2 Q162.4 122.3 156 124.2 Q151.8 128.1 143.9 121.7 Q147.9 133.3 141.5 133.9 Q136.3 136.7 131 129.7 Q130.6 139.6 124.6 139.3 Q118.8 140.9 116.1 134.7 Q114.1 141.7 108 140.9 Q102 141.2 100 136.4 Q98.4 142.9 92 140.9 Q85.8 140 83.9 134.7 Q81.6 143.4 75.4 139.3 Q69.4 137.1 69 129.7 Q63.1 139.8 58.5 133.9 Q53.2 130.3 56.1 121.7 Q46.4 131.3 44 124.2 Q39.9 119.5 46.2 111.2 Q33.9 118.4 33.7 110.9 Q31.1 105.5 40 99.1 Q27 102.6 28.8 95.5 Q28 89.8 37.9 86 Q25.3 86 28.9 79.8 Q30 74.2 40 72.9 Q28.5 69.9 33.7 64.8 Q36.5 59.6 46.2 60.8 Q37 55.4 43.3 51.7 Q47.5 47.4 56.1 50.3 Q49.6 43.9 56.6 41.6 Q61.9 38.4 69 42.3 Q65.2 35.8 72.4 34.9 Q78.4 32.9 83.9 37.3 Q83.9 31 90.6 31.5 Q96.8 31 100 35.6 Q103.7 29.4 109.4 31.5 Q115.3 32.4 116.1 37.3 Q123.2 31.4 127.6 34.9 Q132.9 37.1 131 42.3 Q140.3 36.9 143.4 41.6 Q147.9 44.9 143.9 50.3 Q155.4 46.3 156.7 51.7 Q160.1 56 153.8 60.8 Q166.8 59.1 166.3 64.8 Q168.2 69.8 160 72.9 Q173.5 74.5 171.1 79.8 Q171.4 85.1 162.1 86 Z',
    dijLinksWaas: 'M91.3 180 Q100 185.4 96.1 190.5 Q93.1 196 86.8 193.1 Q90.6 202.6 84.3 204.5 Q78.6 207.2 75.2 201.2 Q75.1 210.7 68 209.1 Q61.4 208.4 60.8 201.2 Q57.5 209.8 51.7 204.5 Q46.4 200.3 49.2 193.1 Q41.4 198.1 39.9 190.5 Q38.2 184.1 44.7 180 Q35.5 179.5 38.9 172.5 Q41.4 166.4 49.2 166.9 Q42 161.1 49 157.4 Q54.8 153.9 60.8 158.8 Q60.9 149.3 68 150.9 Q74.6 151.6 75.2 158.8 Q83.2 152.2 87 157.4 Q91.5 161.8 86.8 166.9 Q97.1 166.1 97.1 172.5 Q98 178.6 91.3 180 Z',
    dijRechtsWaas: 'M155.3 180 Q164 185.4 160.1 190.5 Q157.1 196 150.8 193.1 Q154.6 202.6 148.3 204.5 Q142.6 207.2 139.2 201.2 Q139.1 210.7 132 209.1 Q125.4 208.4 124.8 201.2 Q121.5 209.8 115.7 204.5 Q110.4 200.3 113.2 193.1 Q105.4 198.1 103.9 190.5 Q102.2 184.1 108.7 180 Q99.5 179.5 102.9 172.5 Q105.4 166.4 113.2 166.9 Q106 161.1 113 157.4 Q118.8 153.9 124.8 158.8 Q124.9 149.3 132 150.9 Q138.6 151.6 139.2 158.8 Q147.2 152.2 151 157.4 Q155.5 161.8 150.8 166.9 Q161.1 166.1 161.1 172.5 Q162 178.6 155.3 180 Z',
    kraag: 'M74 128 Q76 134.2 75.5 139 Q81 135.6 82 131.8 Q84 137.6 83.5 143.3 Q89 137.9 90 133.3 Q92 140.1 91.5 146.8 Q97 139.4 98 134 Q100 141.2 104.5 148.5 Q105 139.6 106 133.8 Q108 140 112.5 146.3 Q113 137.7 114 132.7 Q116 137.9 120.5 143.2 Q121 135 122 130.8 Q124 135.1 127.5 139.5 Q127 132.3 128 128.8 L128 118 L74 118 Z'
  };

  // ---------- Haren ----------
  // Een vaste "toevalsgenerator" met zaadje: de poes ziet er elke keer precies hetzelfde uit.
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  // Alle haren van een laag worden per kleur in 1 <path> gebundeld: weinig elementen, licht voor de tablet.
  function Bundel() { this.d = { donker: '', basis: '', licht: '', wit: '', streep: '', pluis: '' }; }
  Bundel.prototype.haar = function (rnd, tone, x, y, ang, len) {
    ang += 0.28 * Math.sin(x * 0.13 + y * 0.07) + 0.18 * Math.sin(y * 0.19 - x * 0.06);
    var curl = (rnd() - 0.5) * 0.8 + 0.25 * Math.sin(x * 0.09 - y * 0.11);
    var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    var mx = (x + ex) / 2 - Math.sin(ang) * len * curl * 0.5, my = (y + ey) / 2 + Math.cos(ang) * len * curl * 0.5;
    this.d[tone] += 'M' + r1(x) + ' ' + r1(y) + 'Q' + r1(mx) + ' ' + r1(my) + ' ' + r1(ex) + ' ' + r1(ey);
  };
  Bundel.prototype.svg = function (k) {
    // [kleur, dekking, dikte]: donkere wortels onderop, lichte punten bovenop = diepte in de vacht.
    var kl = { donker: [k.furSchaduw, 0.6, 0.6], basis: [k.fur, 0.8, 0.5], licht: [k.furLicht, 0.85, 0.42], wit: [k.buik[1], 0.85, 0.55], streep: [k.diep, 0.7, 0.7], pluis: ['#FFFFFF', 0.5, 0.4] };
    var out = '', d = this.d;
    Object.keys(d).forEach(function (t) {
      if (d[t]) out += '<path d="' + d[t] + '" fill="none" stroke="' + kl[t][0] + '" stroke-opacity="' + kl[t][1] + '" stroke-width="' + kl[t][2] + '" stroke-linecap="round"/>';
    });
    return out;
  };
  // Licht van linksboven: welke kleur krijgt een haar op deze plek?
  // Vacht: licht valt zacht van boven; de uiteinden van haren aan de rand vangen licht (glans-rand).
  function toon(nx, ny) { return ny < -0.35 ? 'licht' : ny > 0.55 ? 'donker' : 'basis'; }
  function randToon(rnd, ny) { return ny > 0.6 ? 'donker' : rnd() < 0.55 ? 'licht' : 'basis'; }
  // Richting mengen met "naar beneden" (vacht valt omlaag).
  function richting(ang, omlaag, rnd, wiebel) {
    var dx = Math.cos(ang) * (1 - omlaag), dy = Math.sin(ang) * (1 - omlaag) + omlaag;
    return Math.atan2(dy, dx) + (rnd() - 0.5) * wiebel;
  }
  // Haren op en in een ovaal: een pluizige rand plus korte haartjes erbinnen.
  function ovaalHaren(b, rnd, o) {
    var i, t, r, x, y, a, nx, ny;
    for (i = 0; i < o.rand; i++) {
      t = 2 * Math.PI * (i + rnd() * 0.8) / o.rand;
      r = 0.84 + rnd() * 0.14;
      x = o.cx + o.rx * r * Math.cos(t); y = o.cy + o.ry * r * Math.sin(t);
      if (o.skip && o.skip(x, y)) continue;
      a = Math.atan2(Math.sin(t) / o.ry, Math.cos(t) / o.rx);
      b.haar(rnd, o.toon || randToon(rnd, Math.sin(t)), x, y, richting(a, o.omlaag * (0.6 + 0.4 * rnd()), rnd, 0.4), o.lenRand(t) * (0.7 + rnd() * 0.5));
    }
    for (i = 0; i < o.binnen; i++) {
      t = rnd() * 2 * Math.PI; r = Math.sqrt(rnd()) * 0.82;
      nx = r * Math.cos(t); ny = r * Math.sin(t);
      x = o.cx + o.rx * nx; y = o.cy + o.ry * ny;
      if (o.skip && o.skip(x, y)) continue;
      a = Math.atan2(ny / o.ry, nx / o.rx);
      b.haar(rnd, o.toon || toon(nx, ny), x, y, richting(a, 0.55, rnd, 0.6), o.lenBinnen[0] + rnd() * (o.lenBinnen[1] - o.lenBinnen[0]));
    }
  }
  // Haren langs een staart (bezier-curve), naar buiten en een beetje richting de punt.
  function staartHaren(b, rnd, p, n, half, len) {
    for (var i = 0; i < n; i++) {
      var s = (i + rnd()) / n, u = 1 - s;
      var x = u*u*u*p[0] + 3*u*u*s*p[2] + 3*u*s*s*p[4] + s*s*s*p[6];
      var y = u*u*u*p[1] + 3*u*u*s*p[3] + 3*u*s*s*p[5] + s*s*s*p[7];
      var tx = 3*u*u*(p[2]-p[0]) + 6*u*s*(p[4]-p[2]) + 3*s*s*(p[6]-p[4]);
      var ty = 3*u*u*(p[3]-p[1]) + 6*u*s*(p[5]-p[3]) + 3*s*s*(p[7]-p[5]);
      var tl = Math.sqrt(tx*tx + ty*ty) || 1; tx /= tl; ty /= tl;
      var kant = i % 2 ? 1 : -1, nx = -ty * kant, ny = tx * kant;
      var off = half * (0.4 + rnd() * 0.6);
      var ang = Math.atan2(ny * 0.6 + ty * 0.4, nx * 0.6 + tx * 0.4) + (rnd() - 0.5) * 0.4;
      b.haar(rnd, randToon(rnd, ny), x + nx * off, y + ny * off, ang, len * (0.7 + rnd() * 0.6));
    }
  }
  // Haren langs de zijkanten van een pootje (rechthoek).
  function armHaren(b, rnd, x, y, w, h, n) {
    for (var i = 0; i < n; i++) {
      var links = i % 2 === 0, yy = y + 6 + rnd() * (h - 12);
      var xx = links ? x + 2 + rnd() * 3 : x + w - 2 - rnd() * 3;
      b.haar(rnd, rnd() < 0.6 ? 'licht' : 'basis', xx, yy, richting(links ? Math.PI : 0, 0.6, rnd, 0.4), 4 + rnd() * 3);
    }
    for (i = 0; i < n / 2; i++) {
      b.haar(rnd, 'basis', x + 5 + rnd() * (w - 10), y + 4 + rnd() * (h - 10), richting(Math.PI / 2, 0.2, rnd, 0.5), 3 + rnd() * 3);
    }
  }
  function aantal(n, dichtheid) { return Math.round(n * dichtheid); }

  // ---- Dichte vacht ----
  // Kies een tint: boven en aan de rand meer licht, onder meer donker.
  var plek = [0, 0];
  function diepte(x, y) {
    var nek = Math.max(0, 1 - Math.abs(y - 140) / 14) * Math.max(0, 1 - Math.abs(x - 100) / 55);
    var onder = Math.max(0, (y - 190) / 20), tussen = Math.max(0, 1 - Math.abs(x - 100) / 14) * Math.max(0, (y - 150) / 50);
    var kin = Math.max(0, Math.min(1, (y - 100) / 35)) * Math.max(0, 1 - Math.abs(x - 100) / 70) * (y < 140 ? 1 : 0);
    return Math.min(0.55, 0.5 * nek + 0.25 * onder + 0.35 * tussen + 0.22 * kin);
  }
  var straal = 0;
  function kiesToon(rnd, ny, rand) {
    var dd = diepte(plek[0], plek[1]) + (straal > 0.62 && straal < 0.88 ? 0.15 : 0);
    var l = Math.max(0, 0.08 + 0.26 * Math.max(0, -ny) + (rand ? 0.3 : 0) - dd), d = rand ? 0.08 + dd * 0.5 : 0.42 + 0.36 * Math.max(0, ny) + dd;
    var u = rnd();
    return u < l ? 'licht' : u < l + d ? 'donker' : 'basis';
  }
  // Haren over een heel ovaal: kort in het midden, lang aan de rand, plus fijne pluisjes die ver uitsteken.
  function vachtOvaal(b, rnd, o) {
    var i, r, t, nx, ny, x, y, a, len, e;
    for (i = 0; i < o.n; i++) {
      r = Math.sqrt(rnd()) * 1.02; t = rnd() * 2 * Math.PI;
      nx = Math.cos(t) * r; ny = Math.sin(t) * r;
      x = o.cx + o.rx * nx; y = o.cy + o.ry * ny;
      if (o.skip && o.skip(x, y)) continue;
      plek[0] = x; plek[1] = y; straal = r;
      a = r < 0.12 ? Math.PI / 2 : Math.atan2(ny / o.ry, nx / o.rx);
      e = o.rand ? o.rand(t) : 1;
      len = (o.kort + (o.lang * e - o.kort) * Math.pow(r, 2.2)) * (0.65 + rnd() * 0.7);
      b.haar(rnd, o.toon || kiesToon(rnd, Math.sin(t) * r, r > 0.85), x, y, richting(a, o.omlaag, rnd, 0.18), len);
    }
    for (i = 0; i < (o.pluis || 0); i++) {
      t = rnd() * 2 * Math.PI; r = 0.9 + rnd() * 0.1;
      x = o.cx + o.rx * Math.cos(t) * r; y = o.cy + o.ry * Math.sin(t) * r;
      if (o.skip && o.skip(x, y)) continue;
      a = Math.atan2(Math.sin(t) / o.ry, Math.cos(t) / o.rx);
      e = o.rand ? o.rand(t) : 1;
      b.haar(rnd, o.toon || (Math.sin(t) > 0.6 ? 'basis' : 'pluis'), x, y, richting(a, o.omlaag * 0.7, rnd, 0.2), o.lang * e * (i % 12 ? 0.5 + rnd() * 0.7 : 1.4 + rnd() * 0.8));
    }
  }
  // Haren over een staart (bezier): vanaf de middellijn naar buiten, richting de punt.
  // Streepjes in de vacht: donkere haren langs een lijntje.
  function streepHaren(b, rnd, lijnen, n) {
    lijnen.forEach(function (L) {
      for (var i = 0; i < n; i++) {
        var s = rnd(), x = L[0] + s * (L[2] - L[0]) + (rnd() - 0.5) * 4, y = L[1] + s * (L[3] - L[1]);
        b.haar(rnd, 'streep', x, y, Math.atan2(L[3] - L[1], L[2] - L[0]) + (rnd() - 0.5) * 0.5, 3 + rnd() * 4);
      }
    });
  }
  function vachtStaart(b, rnd, p, n, half, lang) {
    straal = 0;
    for (var i = 0; i < n; i++) {
      var s = rnd(), u = 1 - s;
      var x = u*u*u*p[0] + 3*u*u*s*p[2] + 3*u*s*s*p[4] + s*s*s*p[6];
      var y = u*u*u*p[1] + 3*u*u*s*p[3] + 3*u*s*s*p[5] + s*s*s*p[7];
      var tx = 3*u*u*(p[2]-p[0]) + 6*u*s*(p[4]-p[2]) + 3*s*s*(p[6]-p[4]);
      var ty = 3*u*u*(p[3]-p[1]) + 6*u*s*(p[5]-p[3]) + 3*s*s*(p[7]-p[5]);
      var tl = Math.sqrt(tx*tx + ty*ty) || 1; tx /= tl; ty /= tl;
      var kant = rnd() < 0.5 ? 1 : -1, nx = -ty * kant, ny = tx * kant, off = half * rnd();
      plek[0] = x + nx * off; plek[1] = y + ny * off;
      var w = off / half, ang = Math.atan2(ny * (0.3 + 0.5 * w) + ty * 0.5, nx * (0.3 + 0.5 * w) + tx * 0.5) + (rnd() - 0.5) * 0.5;
      var len = (2.5 + lang * w * w) * (0.7 + rnd() * 0.7);
      b.haar(rnd, w > 0.85 && rnd() < 0.5 ? 'pluis' : kiesToon(rnd, ny, w > 0.8), x + nx * off, y + ny * off, ang, len);
    }
  }
  // Haren over een pootje (rechthoek): naar buiten en omlaag.
  function vachtArm(b, rnd, x, y, w, h, n) {
    straal = 0;
    for (var i = 0; i < n; i++) {
      var fx = rnd(), xx = x + fx * w, yy = y + 4 + rnd() * (h - 6), side = (fx - 0.5) * 2;
      plek[0] = xx; plek[1] = yy;
      var ang = richting(side < 0 ? Math.PI : 0, 0.75 - 0.35 * Math.abs(side), rnd, 0.4);
      var len = (2.5 + 5.5 * Math.pow(Math.abs(side), 2)) * (0.7 + rnd() * 0.7);
      b.haar(rnd, Math.abs(side) > 0.8 && rnd() < 0.4 ? 'pluis' : kiesToon(rnd, 0.2, Math.abs(side) > 0.8), xx, yy, ang, len);
    }
  }
  // Haren over een oor (driehoek), weg van het hoofd.
  function vachtOor(b, rnd, A, B, C, n) {
    straal = 0;
    for (var i = 0; i < n; i++) {
      var u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      var x = A[0] + u * (B[0] - A[0]) + v * (C[0] - A[0]), y = A[1] + u * (B[1] - A[1]) + v * (C[1] - A[1]);
      var ang = Math.atan2(y - 95, x - 100) + (rnd() - 0.5) * 0.6;
      b.haar(rnd, u > 0.7 && rnd() < 0.5 ? 'pluis' : kiesToon(rnd, -0.6, u > 0.6), x, y, ang, (2 + rnd() * 3.5) * (u > 0.6 ? 1.8 : 1));
    }
  }
  // Pluisjes langs de buitenrand van een oor (van punt A naar punt B), naar buiten gericht.
  function oorRand(b, rnd, A, B, buiten, n) {
    for (var i = 0; i < n; i++) {
      var s = rnd(), x = A[0] + s * (B[0] - A[0]), y = A[1] + s * (B[1] - A[1]);
      plek[0] = x; plek[1] = y;
      b.haar(rnd, rnd() < 0.5 ? 'pluis' : 'licht', x, y, buiten + (rnd() - 0.5) * 0.7 - 0.25 * s * Math.sign(Math.cos(buiten)), 3 + rnd() * 6);
    }
  }
  function hoofdRand(t) { return 0.8 + 0.6 * Math.pow(Math.abs(Math.cos(t)), 1.5) * (0.5 + 0.5 * Math.max(0, Math.sin(t))); }
  var haarCache = {};
  function haarLaag(k, h, zaad, vul) {
    if (!h) return '';
    var sleutel = k.zaad + '/' + zaad + '/' + h;
    if (!haarCache[sleutel]) { var b = new Bundel(); vul(b, rng(k.zaad * 1000 + zaad), h); haarCache[sleutel] = '<g class="kat-haren">' + b.svg(k) + '</g>'; }
    return haarCache[sleutel];
  }
  function hoofdHaarLengte(t) { return 6.5 + 9 * Math.pow(Math.abs(Math.cos(t)), 1.5) * (0.5 + 0.5 * Math.max(0, Math.sin(t))); }
  function nietInGezicht(x, y) {
    var m = (x - 100) / 30, n = (y - 108) / 18, a = (x - 76) / 17, c = (y - 86) / 19, e = (x - 124) / 17;
    return m * m + n * n < 1;
  }


  function catDefs(p, k) {
    return '<defs>' +
      '<radialGradient id="' + p + '-rim" cx="0.5" cy="0.42" r="0.58"><stop offset="0" stop-color="' + k.furSchaduw + '" stop-opacity="0"/><stop offset="0.6" stop-color="' + k.furSchaduw + '" stop-opacity="0"/><stop offset="1" stop-color="' + k.furSchaduw + '" stop-opacity="0.45"/></radialGradient>' +
      '<radialGradient id="' + p + '-grond" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3D3355" stop-opacity="0.24"/><stop offset="1" stop-color="#3D3355" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + '-puf" cx="0.4" cy="0.35" r="0.6"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.32"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + '-neus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F49AB4"/><stop offset="1" stop-color="#D85F80"/></linearGradient>' +
      '<linearGradient id="' + p + '-oor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E88AAB"/><stop offset="1" stop-color="#FFD3E2"/></linearGradient>' +
      '<linearGradient id="' + p + '-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.furLicht + '"/><stop offset="0.35" stop-color="' + k.fur + '"/><stop offset="0.6" stop-color="' + k.fur + '"/><stop offset="1" stop-color="' + k.furSchaduw + '"/></linearGradient>' +
      '<linearGradient id="' + p + '-arm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + k.furLicht + '"/><stop offset="0.25" stop-color="' + k.fur + '"/><stop offset="0.75" stop-color="' + k.fur + '"/><stop offset="1" stop-color="' + k.furLicht + '"/></linearGradient>' +
      '<radialGradient id="' + p + '-buik" cx="0.42" cy="0.32" r="0.72"><stop offset="0" stop-color="' + k.buik[0] + '"/><stop offset="0.55" stop-color="' + k.buik[1] + '"/><stop offset="1" stop-color="' + k.buik[2] + '"/></radialGradient>' +
      '<radialGradient id="' + p + '-iris" cx="0.5" cy="0.85" r="0.75"><stop offset="0" stop-color="' + k.iris[0] + '"/><stop offset="0.5" stop-color="' + k.iris[1] + '"/><stop offset="1" stop-color="' + k.iris[2] + '"/></radialGradient>' +
      '</defs>';
  }

  function catBody(p, k, h) {
    var fur = 'url(#' + p + '-fur)', rim = 'url(#' + p + '-rim)', grond = 'url(#' + p + '-grond)';
    return ''+
      '<ellipse cx="104" cy="212" rx="82" ry="10" fill="' + grond + '"/>' +
      '<g class="tail kat-staart">' +
        '<path d="M138 188 C164 192 180 176 178 156" fill="none" stroke="' + k.fur + '" stroke-width="20" stroke-linecap="round"/>' +
        '<path d="M137 189 C163 193 179 177 178 158" fill="none" stroke="' + k.armSchaduw + '" stroke-width="9" stroke-linecap="round" opacity="0.18"/>' +
        haarLaag(k, h, 1, function (b, rnd, h) { vachtStaart(b, rnd, [138, 188, 164, 192, 180, 176, 178, 156], aantal(1300, h), 10, 8); }) +
        '<g class="kat-staartpunt">' +
          '<path d="M178 156 C177 138 170 126 180 110" fill="none" stroke="' + k.fur + '" stroke-width="18" stroke-linecap="round"/>' +
          '<path d="M179 156 C178 139 172 127 181 112" fill="none" stroke="' + k.armSchaduw + '" stroke-width="7" stroke-linecap="round" opacity="0.18"/>' +
          haarLaag(k, h, 2, function (b, rnd, h) { vachtStaart(b, rnd, [178, 156, 177, 138, 170, 126, 180, 110], aantal(1300, h), 9, 9); vachtOvaal(b, rnd, { cx: 180, cy: 109, rx: 9, ry: 9, n: aantal(260, h), pluis: aantal(90, h), kort: 2, lang: 7, omlaag: 0 }); }) +
        '</g>' +
      '</g>' +
      '<path d="M62 202 C52 166 68 126 100 124 C132 126 148 166 138 202 Z" fill="' + fur + '"/>' +
      '<path d="M62 202 C52 166 68 126 100 124 C132 126 148 166 138 202 Z" fill="' + rim + '"/>' +
      '<path d="' + PLUIS.dijLinksWaas + '" fill="' + fur + '" opacity="0.4"/>' +
      '<path d="' + PLUIS.dijRechtsWaas + '" fill="' + fur + '" opacity="0.4"/>' +
      '<path d="' + PLUIS.dijLinks + '" fill="' + fur + '"/>' +
      '<path d="' + PLUIS.dijRechts + '" fill="' + fur + '"/>' +
      '<ellipse cx="68" cy="180" rx="24" ry="23" fill="' + fur + '"/>' +
      '<ellipse cx="132" cy="180" rx="24" ry="23" fill="' + fur + '"/>' +
      '<ellipse cx="68" cy="180" rx="24" ry="23" fill="' + rim + '"/>' +
      '<ellipse cx="132" cy="180" rx="24" ry="23" fill="' + rim + '"/>' +
      haarLaag(k, h, 3, function (b, rnd, h) {
        [68, 132].forEach(function (cx) {
          vachtOvaal(b, rnd, { cx: cx, cy: 180, rx: 24, ry: 23, n: aantal(1800, h), pluis: aantal(650, h), kort: 2.2, lang: 8.5, omlaag: 0.35 });
        });
      }) +
      '<ellipse cx="100" cy="168" rx="22" ry="30" fill="url(#' + p + '-buik)"/>' +
      '<path d="' + PLUIS.kraag + '" fill="url(#' + p + '-buik)"/>' +
      haarLaag(k, h, 4, function (b, rnd, h) {
        vachtOvaal(b, rnd, { cx: 100, cy: 168, rx: 22, ry: 30, n: aantal(900, h), kort: 2, lang: 6, omlaag: 0.7, toon: 'wit' });
        for (var i = 0; i < aantal(210, h); i++) b.haar(rnd, 'wit', 76 + rnd() * 50, 128 + rnd() * 12, richting(Math.PI / 2, 0, rnd, 0.6), 8 + rnd() * 6);
      }) +
      '<ellipse cx="60" cy="203" rx="19" ry="10" fill="' + fur + '"/>' +
      '<ellipse cx="140" cy="203" rx="19" ry="10" fill="' + fur + '"/>' +
      haarLaag(k, h, 10, function (b, rnd, h) {
        [60, 140].forEach(function (cx) { vachtOvaal(b, rnd, { cx: cx, cy: 203, rx: 19, ry: 10, n: aantal(320, h), kort: 1.8, lang: 4.5, omlaag: 0.4 }); });
      }) +
      '<path d="M55 200 L55 207 M65 200 L65 207 M135 200 L135 207 M145 200 L145 207" stroke="' + k.diep + '" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>' +
      '<ellipse cx="100" cy="136" rx="50" ry="14" fill="' + grond + '"/>' +
      '<ellipse cx="100" cy="136" rx="34" ry="9" fill="' + grond + '"/>' +
      '';
  }

  function catHead(p, k, h) {
    var fur = 'url(#' + p + '-fur)', rim = 'url(#' + p + '-rim)', puf = 'url(#' + p + '-puf)', oor = 'url(#' + p + '-oor)';
    var vorm = 'M100 30 C142 30 166 56 166 88 C166 122 136 138 100 138 C64 138 34 122 34 88 C34 56 58 30 100 30 Z';
    return ''+
      '<path d="M48 78 L55 18 Q57 10 65 14 L100 46 Z" fill="' + fur + '" stroke="' + k.fur + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M152 78 L145 18 Q143 10 135 14 L100 46 Z" fill="' + fur + '" stroke="' + k.fur + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M61 60 L63 28 L84 47 Z" fill="' + oor + '" stroke="' + k.binnenoorRand + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M139 60 L137 28 L116 47 Z" fill="' + oor + '" stroke="' + k.binnenoorRand + '" stroke-width="6" stroke-linejoin="round"/>' +
      haarLaag(k, h, 5, function (b, rnd, h) {
        vachtOor(b, rnd, [48, 78], [56, 14], [100, 46], aantal(650, h));
        vachtOor(b, rnd, [152, 78], [144, 14], [100, 46], aantal(650, h));
        oorRand(b, rnd, [47, 76], [56, 13], Math.PI * 1.05, aantal(160, h));
        oorRand(b, rnd, [56, 13], [99, 45], -Math.PI * 0.3, aantal(160, h));
        oorRand(b, rnd, [153, 76], [144, 13], -0.05, aantal(160, h));
        oorRand(b, rnd, [144, 13], [101, 45], -Math.PI * 0.7, aantal(160, h));
      }) +
      '<path d="M70 56 q-2 -10 -9 -17 M75 53 q0 -9 -5 -15 M66 59 q-5 -7 -12 -10 M130 56 q2 -10 9 -17 M125 53 q0 -9 5 -15 M134 59 q5 -7 12 -10" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>' +
      '<path d="' + PLUIS.hoofdWaas + '" fill="' + fur + '" opacity="0.4"/>' +
      '<path d="' + PLUIS.hoofd + '" fill="' + fur + '"/>' +
      '<path d="' + vorm + '" fill="' + fur + '"/>' +
      '<path d="' + vorm + '" fill="' + rim + '"/>' +
      haarLaag(k, h, 6, function (b, rnd, h) {
        vachtOvaal(b, rnd, { cx: 100, cy: 86, rx: 64, ry: 52, n: aantal(6000, h), pluis: aantal(1800, h), kort: 2.2, lang: 9.5, rand: hoofdRand, omlaag: 0.25, skip: nietInGezicht });
      }) +
      haarLaag(k, h, 11, function (b, rnd, h) { streepHaren(b, rnd, [[87, 34, 90, 52], [100, 32, 100, 51], [113, 34, 110, 52]], aantal(90, h)); }) +
      '';
  }

  function catEye(p, cx) {
    return '<ellipse cx="' + cx + '" cy="86" rx="14" ry="16" fill="#3D3355"/>' +
      '<ellipse cx="' + cx + '" cy="87" rx="11.5" ry="13.5" fill="url(#' + p + '-iris)"/>' +
      '<ellipse cx="' + cx + '" cy="87" rx="6.5" ry="10" fill="#2B2340"/>' +
      '<ellipse cx="' + cx + '" cy="80" rx="12" ry="7" fill="#3D3355" opacity="0.25"/>' +
      '<circle cx="' + (cx - 6) + '" cy="79" r="5.5" fill="#FFFFFF"/>' +
      '<circle cx="' + (cx + 5) + '" cy="93" r="2.5" fill="#FFFFFF" opacity="0.85"/>';
  }

  function catFace(p, k) {
    var buik = 'url(#' + p + '-buik)';
    return '<g class="eyes-open kat-oog">' + catEye(p, 76) + catEye(p, 124) + '</g>' +
      // happy: closed smiling eyes
      '<path class="eyes-happy" d="M62 92 Q76 76 90 92 M110 92 Q124 76 138 92" fill="none" stroke="#3D3355" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="112" rx="11" ry="6.5" fill="' + k.blos + '" opacity="' + k.blosDekking + '"/>' +
      '<ellipse cx="140" cy="112" rx="11" ry="6.5" fill="' + k.blos + '" opacity="' + k.blosDekking + '"/>' +
      '<ellipse cx="91" cy="110" rx="12" ry="9" fill="' + buik + '"/>' +
      '<ellipse cx="109" cy="110" rx="12" ry="9" fill="' + buik + '"/>' +
      '<ellipse cx="100" cy="121" rx="8" ry="5" fill="' + buik + '"/>' +
      '<circle cx="87" cy="108" r="1.3" fill="' + k.diep + '" opacity="0.5"/><circle cx="84" cy="112" r="1.3" fill="' + k.diep + '" opacity="0.5"/>' +
      '<circle cx="113" cy="108" r="1.3" fill="' + k.diep + '" opacity="0.5"/><circle cx="116" cy="112" r="1.3" fill="' + k.diep + '" opacity="0.5"/>' +
      '<path d="M93 100 Q100 96 107 100 Q104 107 100 108 Q96 107 93 100 Z" fill="url(#' + p + '-neus)"/>' +
      '<ellipse cx="98" cy="100.5" rx="2.6" ry="1.3" fill="#FFFFFF" opacity="0.8"/>' +
      '<path class="mouth-smile" d="M100 108 L100 112 M90 112 Q95 118 100 112 Q105 118 110 112" fill="none" stroke="#3D3355" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path class="mouth-happy" d="M90 112 Q100 133 110 112 Z" fill="#C2456B" stroke="#3D3355" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M58 100 L30 94 M58 107 L28 108 M60 114 L33 122 M142 100 L170 94 M142 107 L172 108 M140 114 L167 122" stroke="#B9AACF" stroke-width="2.5" stroke-linecap="round"/>';
  }

  function catPaw(p, k, cx, h) {
    return '<ellipse cx="' + cx + '" cy="198" rx="15" ry="10" fill="url(#' + p + '-fur)"/>' +
      haarLaag(k, h, 20 + cx, function (b, rnd, h) { vachtOvaal(b, rnd, { cx: cx, cy: 198, rx: 15, ry: 10, n: aantal(260, h), kort: 1.8, lang: 4.5, omlaag: 0.4 }); }) +
      '<path d="M' + (cx - 5) + ' 195 L' + (cx - 5) + ' 202 M' + (cx + 5) + ' 195 L' + (cx + 5) + ' 202" stroke="' + k.diep + '" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>' ;
  }

  // front legs; the left one is the waving arm (shoulder, then elbow)
  function catPaws(p, k, h) {
    var arm = 'url(#' + p + '-arm)';
    return '<g class="paws-g">' +
      '<rect x="107" y="140" width="24" height="58" rx="12" fill="' + arm + '"/>' +
      haarLaag(k, h, 7, function (b, rnd, h) { vachtArm(b, rnd, 107, 140, 24, 58, aantal(1000, h)); }) +
      catPaw(p, k, 119, h) +
      '<g class="kat-bovenarm">' +
        '<rect x="69" y="140" width="24" height="36" rx="12" fill="' + arm + '"/>' +
        haarLaag(k, h, 8, function (b, rnd, h) { vachtArm(b, rnd, 69, 140, 24, 36, aantal(650, h)); }) +
        '<g class="kat-onderarm">' +
          '<rect x="69.5" y="162" width="23" height="38" rx="11.5" fill="' + arm + '"/>' +
          haarLaag(k, h, 9, function (b, rnd, h) { vachtArm(b, rnd, 69.5, 162, 23, 34, aantal(680, h)); }) +
          catPaw(p, k, 81, h) +
          '<g class="kat-kussens" opacity="0">' +
            '<ellipse cx="81" cy="196" rx="6" ry="4.2" fill="' + k.kussens + '"/>' +
            '<circle cx="73" cy="201" r="2.6" fill="' + k.kussens + '"/>' +
            '<circle cx="81" cy="204" r="2.6" fill="' + k.kussens + '"/>' +
            '<circle cx="89" cy="201" r="2.6" fill="' + k.kussens + '"/>' +
          '</g>' +
        '</g>' +
      '</g>' +
      '</g>';
  }
  LC.CATS = {
    roze:      { name: 'Roze' },
    groen:     { name: 'Groen' },
    blauw:     { name: 'Blauw' },
    geel:      { name: 'Geel' },
    oranje:    { name: 'Oranje' },
    paars:     { name: 'Paars' },
    regenboog: { name: 'Regenboog', special: true }
  };
  LC.BALLOON_COLORS = ['#ff8fab', '#8ecae6', '#ffd166', '#b5e48c', '#cdb4db', '#ffb4a2'];


  // Clothes for the cats, drawn in the cat's own coordinates (head centre 150,128).
  // where: back = behind the body, head = moves with the head, front = over the body.
  var ACC = {
    bow: { where: 'head', svg: '<g transform="translate(0 6)"><g transform="translate(98 58) rotate(-18)"><path d="M 0 0 L -28 -15 L -28 15 Z" fill="#ff5c8a"/><path d="M 0 0 L 28 -15 L 28 15 Z" fill="#ff5c8a"/><circle r="8" fill="#e6396b"/></g></g>' },
    flower: { where: 'head', svg: '<g transform="translate(0 6)"><g transform="translate(214 62)"><circle cx="0" cy="-15" r="11" fill="#fff"/><circle cx="14" cy="-5" r="11" fill="#fff"/><circle cx="9" cy="12" r="11" fill="#fff"/><circle cx="-9" cy="12" r="11" fill="#fff"/><circle cx="-14" cy="-5" r="11" fill="#fff"/><circle r="9" fill="#ffd23f"/></g></g>' },
    party: { where: 'head', svg: '<g transform="translate(0 8)"><path d="M 150 -14 L 108 56 L 192 56 Z" fill="#7c5cd6"/><path d="M 132 22 L 168 22 L 178 40 L 122 40 Z" fill="#ff8fab"/><circle cx="140" cy="48" r="5" fill="#ffd23f"/><circle cx="162" cy="46" r="5" fill="#ffd23f"/><circle cx="150" cy="-14" r="10" fill="#ffd23f"/></g>' },
    wizard: { where: 'head', svg: '<g transform="translate(0 8)"><path d="M 104 56 C 130 40 140 -10 160 -56 C 168 -20 184 30 196 56 Z" fill="#5b3fa6"/><ellipse cx="150" cy="58" rx="80" ry="15" fill="#4a3290"/><path d="M 150 14 L 154 24 L 165 24 L 156 31 L 160 41 L 150 35 L 140 41 L 144 31 L 135 24 L 146 24 Z" fill="#ffd23f"/></g>' },
    crown: { where: 'head', svg: '<g transform="translate(0 8)"><path d="M 108 54 L 106 14 L 128 34 L 150 4 L 172 34 L 194 14 L 192 54 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="5" stroke-linejoin="round"/><circle cx="150" cy="40" r="6" fill="#ff4f81"/><circle cx="124" cy="44" r="4.5" fill="#4cc9f0"/><circle cx="176" cy="44" r="4.5" fill="#4cc9f0"/></g>' },
    shades: { where: 'head', svg: '<g transform="translate(0 12)"><rect x="82" y="100" width="56" height="42" rx="16" fill="#2b2140"/><rect x="162" y="100" width="56" height="42" rx="16" fill="#2b2140"/><rect x="136" y="112" width="28" height="9" fill="#2b2140"/><path d="M 92 112 L 108 108 M 172 112 L 188 108" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.6"/></g>' },
    hearts: { where: 'head', svg: '<g transform="translate(0 12)"><g transform="translate(110 124) scale(1.55)"><path d="M 0 10 C -24 -6 -16 -28 0 -15 C 16 -28 24 -6 0 10 Z" fill="#ff4f81" opacity="0.92"/><path d="M -9 -10 C -13 -8 -13 -4 -12 -2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g><g transform="translate(190 124) scale(1.55)"><path d="M 0 10 C -24 -6 -16 -28 0 -15 C 16 -28 24 -6 0 10 Z" fill="#ff4f81" opacity="0.92"/><path d="M -9 -10 C -13 -8 -13 -4 -12 -2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></g><path d="M 134 118 L 166 118" stroke="#ff4f81" stroke-width="5"/></g>' },
    cape: { where: 'back', svg: '<path d="M 98 206 C 54 240 40 296 56 316 L 244 316 C 260 296 246 240 202 206 Z" fill="#ef476f"/><path d="M 56 316 L 244 316 L 240 304 L 60 304 Z" fill="#c9304f"/>' },
    scarf: { where: 'front', svg: '<path d="M 94 214 Q 150 246 206 214 L 212 238 Q 150 272 88 238 Z" fill="#4cc9f0"/><path d="M 118 232 L 126 252 M 150 240 L 150 262 M 182 232 L 174 252" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.7"/><rect x="170" y="238" width="26" height="60" rx="10" fill="#4cc9f0"/><path d="M 170 262 L 196 262 M 170 280 L 196 280" stroke="#fff" stroke-width="5" opacity="0.7"/>' }
  };

  LC.catSVG = function (key, opts) {
    opts = opts || {};
    var k = FUR[key], p = 'kt' + (catSeq++);
    // fur density: full for the big cats, lighter for small previews (shop, car, buttons)
    var h = opts.haren != null ? opts.haren : opts.cls === 'still' ? 0.3 : opts.head ? 0.5 : 1;
    var vb = opts.vb || (opts.head ? '33 -19 234 246' : '0 0 300 345');
    var o = opts.outfit || {}, back = '', onHead = '', front = '';
    ['head', 'face', 'body'].forEach(function (slot) {
      var a = o[slot] && ACC[o[slot]];
      if (!a) return;
      if (a.where === 'back') back += a.svg; else if (a.where === 'front') front += a.svg; else onHead += a.svg;
    });
    // the drawing is made in a 200 x 240 box; this puts the head centre at (150,128)
    var T = '<g transform="translate(0 2) scale(1.5)">';
    return '' +
      '<svg class="cat ' + (opts.cls || 'idle') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      catDefs(p, k) +
      back +
      '<g class="body-g">' + T + catBody(p, k, h) + '</g></g>' +
      '<g class="head-g">' + T + catHead(p, k, h) + catFace(p, k) + '</g>' + onHead + '</g>' +
      '<g transform="translate(0 2) scale(1.5)">' + catPaws(p, k, h) + '</g>' +
      front +
      '</svg>';
  };

  // One wave (2.7 s). Not in previews, not while happy or asleep, and a second tap does nothing.
  LC.catWave = function (svg) {
    var cl = svg && svg.classList;
    if (!cl || cl.contains('zwaait') || cl.contains('still') || cl.contains('happy') || cl.contains('sleep')) return;
    cl.add('zwaait');
    setTimeout(function () { cl.remove('zwaait'); }, 2700);
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
  LC.accessoryPreview = function (profileKey, id) {
    var a = LC.shopItem(id), o = {};
    o[a.slot] = id;
    var furKey = LC.carFurKey(profileKey);
    return LC.catSVG(furKey, { head: true, cls: 'still', vb: a.slot === 'body' ? '20 -4 260 354' : '40 -66 220 252', outfit: o });
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
    if (g.parts) {
      var g1 = LC.GLYPHS[g.parts[0]], g2 = LC.GLYPHS[g.parts[1]];
      var p1 = g1.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
      var p2 = g2.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
      var stroke = 'fill="none" stroke="' + g.color + '" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"';
      var at2 = pos ? ' x="' + pos[0] + '" y="' + pos[1] + '" width="' + pos[2] + '" height="' + pos[3] + '"' : '';
      return '<svg' + at2 + ' viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M 30 68 C 22 78 38 88 30 98" stroke="#b9a8d4" stroke-width="2" fill="none"/>' +
        '<ellipse cx="30" cy="32" rx="26" ry="31" fill="' + color + '"/>' +
        '<path d="M 30 62 L 23 71 L 37 71 Z" fill="' + color + '"/>' +
        '<ellipse cx="30" cy="32" rx="16.5" ry="21.5" fill="#ffffff" opacity="0.93"/>' +
        '<svg x="5" y="10" width="22" height="44" viewBox="' + g1.view.join(' ') + '" preserveAspectRatio="xMidYMid meet"><g ' + stroke + '>' + p1 + '</g></svg>' +
        '<svg x="31" y="10" width="22" height="44" viewBox="' + g2.view.join(' ') + '" preserveAspectRatio="xMidYMid meet"><g ' + stroke + '>' + p2 + '</g></svg>' +
        '</svg>';
    }
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
    if (g.parts) {
      var g1 = LC.GLYPHS[g.parts[0]], g2 = LC.GLYPHS[g.parts[1]];
      var p1 = g1.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
      var p2 = g2.strokes.map(function (d) { return '<path d="' + d + '"/>'; }).join('');
      var stroke = 'fill="none" stroke="' + col + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"';
      return '<svg class="glyph digraph" viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<svg x="0" y="0" width="120" height="160" viewBox="' + g1.view.join(' ') + '"><g ' + stroke + '>' + p1 + '</g></svg>' +
        '<svg x="120" y="0" width="120" height="160" viewBox="' + g2.view.join(' ') + '"><g ' + stroke + '>' + p2 + '</g></svg>' +
        '</svg>';
    }
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

  LC.lockSVG = function () {
    return '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="10" y="22" width="28" height="20" rx="4" fill="none" stroke="#7c5cd6" stroke-width="4"/>' +
      '<path d="M 16 22 L 16 16 C 16 9 32 9 32 16 L 32 22" fill="none" stroke="#7c5cd6" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';
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
    var furKey = LC.carFurKey(key);
    var inner = v.body(LC.CAR[furKey] || LC.CAR.roze);
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

  // The bonus car: body colours per fur colour.
  LC.CAR = {
    roze:      { body: '#ff6f91', dark: '#d94b72' },
    groen:     { body: '#4cc26b', dark: '#2f9a50' },
    blauw:     { body: '#4d96ff', dark: '#2a6dcc' },
    geel:      { body: '#ffd23f', dark: '#d4a800' },
    oranje:    { body: '#ff9f43', dark: '#d97216' },
    paars:     { body: '#b070d8', dark: '#7a3eb0' },
    regenboog: { body: '#ff6f91', dark: '#d94b72' }
  };

  // vehicleDef and carPreview accept either a fur key OR (legacy) a profile key;
  // the caller in game.js passes a profile key, so we resolve via LC.store when available.
  LC.carFurKey = function (key) {
    if (LC.CAR[key]) return key;
    if (window.LC && LC.store) return LC.store.getFur(key);
    return 'roze';
  };

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
    var cols = ['#ff6b9d', '#4dc9f0', '#ffd23f', '#7bdf90', '#b888f5'];
    for (var i = 0; i < 15; i++) {
      var x = 14 + i * 88;
      var y = 20 + Math.sin(i / 14 * Math.PI) * 30;
      flags += '<path d="M ' + x + ' ' + y + ' L ' + (x + 54) + ' ' + y + ' L ' + (x + 27) + ' ' + (y + 48) + ' Z" fill="' + cols[i % cols.length] + '" opacity="0.88"/>';
    }
    var planks = '';
    for (var j = 1; j < 9; j++) planks += '<path d="M ' + (j * 160) + ' 648 L ' + (j * 160 - 30 + (j - 4) * -10) + ' 800" stroke="#c0883a" stroke-width="2.5"/>';
    return '' +
      '<svg class="scene" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78b8e8"/><stop offset="1" stop-color="#c0e0f8"/></linearGradient>' +
      '<pattern id="wp" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="5" fill="#ffffff" opacity="0.38"/><circle cx="48" cy="48" r="5" fill="#ffffff" opacity="0.38"/></pattern>' +
      '</defs>' +
      // wall: sky gradient + polka dots
      '<rect width="1280" height="650" fill="url(#sky-g)"/><rect width="1280" height="650" fill="url(#wp)"/>' +
      // bunting string
      '<path d="M 0 22 Q 640 82 1280 22" stroke="#b0c8e0" stroke-width="2.5" fill="none"/>' +
      flags +
      // baseboard
      '<rect y="632" width="1280" height="18" fill="#ffffff" opacity="0.9"/>' +
      // floor: warm honey oak
      '<rect y="648" width="1280" height="152" fill="#e0b060"/>' + planks +
      // rug
      '<ellipse cx="640" cy="740" rx="450" ry="54" fill="#38a85c" opacity="0.35"/>' +
      '<ellipse cx="640" cy="740" rx="390" ry="42" fill="#50bc74" opacity="0.55"/>' +
      // window frame
      '<rect x="996" y="116" width="208" height="258" rx="16" fill="#ffffff"/>' +
      '<rect x="1010" y="130" width="180" height="230" rx="8" fill="#5ab4e8"/>' +
      // sun with rays
      '<circle cx="1122" cy="198" r="30" fill="#ffd700"/>' +
      '<g stroke="#ffd700" stroke-width="5.5" stroke-linecap="round">' +
      '<line x1="1122" y1="154" x2="1122" y2="146"/>' +
      '<line x1="1152" y1="168" x2="1158" y2="162"/>' +
      '<line x1="1166" y1="198" x2="1174" y2="198"/>' +
      '<line x1="1152" y1="228" x2="1158" y2="234"/>' +
      '<line x1="1122" y1="242" x2="1122" y2="250"/>' +
      '<line x1="1092" y1="228" x2="1086" y2="234"/>' +
      '<line x1="1078" y1="198" x2="1070" y2="198"/>' +
      '<line x1="1092" y1="168" x2="1086" y2="162"/>' +
      '</g>' +
      // cloud in window
      '<ellipse cx="1048" cy="272" rx="38" ry="16" fill="#ffffff" opacity="0.75"/>' +
      '<ellipse cx="1072" cy="260" rx="28" ry="17" fill="#ffffff" opacity="0.75"/>' +
      // window cross + curtains
      '<path d="M 1100 130 L 1100 360 M 1010 248 L 1190 248" stroke="#ffffff" stroke-width="8" opacity="0.85"/>' +
      '<path d="M 988 108 L 1068 108 Q 1050 244 1074 370 L 988 370 Z" fill="#f9b0cc" opacity="0.9"/>' +
      '<path d="M 1212 108 L 1132 108 Q 1150 244 1126 370 L 1212 370 Z" fill="#f9b0cc" opacity="0.9"/>' +
      '<rect x="972" y="98" width="256" height="13" rx="6.5" fill="#d98ab0"/>' +
      // pictures on wall
      '<rect x="128" y="126" width="154" height="116" rx="12" fill="#ffffff" opacity="0.95"/><rect x="140" y="138" width="130" height="92" rx="6" fill="#ffe0f0"/>' +
      '<path d="M 205 206 C 158 174 168 146 192 154 C 200 156 205 166 205 166 C 205 166 210 156 218 154 C 242 146 252 174 205 206 Z" fill="#f580b8"/>' +
      '<rect x="316" y="156" width="108" height="108" rx="12" fill="#ffffff" opacity="0.95"/><rect x="328" y="168" width="84" height="84" rx="6" fill="#e0f8dc"/>' +
      '<path d="M 370 181 L 378 203 L 402 203 L 384 217 L 391 239 L 370 226 L 349 239 L 356 217 L 338 203 L 362 203 Z" fill="#fde068"/>' +
      // plant
      '<path d="M 1116 558 L 1180 558 L 1170 642 L 1126 642 Z" fill="#d4925a"/>' +
      '<ellipse cx="1148" cy="526" rx="20" ry="46" fill="#7ec884" transform="rotate(-26 1148 538)"/>' +
      '<ellipse cx="1148" cy="518" rx="20" ry="50" fill="#56b468"/>' +
      '<ellipse cx="1148" cy="526" rx="20" ry="46" fill="#7ec884" transform="rotate(26 1148 538)"/>' +
      '<g id="decor"></g>' +
      '</svg>';
  };
})();
