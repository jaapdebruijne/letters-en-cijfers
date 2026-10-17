(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // Every shape is a list of strokes in the "ideal" school order. Each stroke is one
  // line. Children may lift their finger anywhere and may draw strokes in any order.
  var VA = [0, 0, 120, 160];     // full height (capitals, digits, tall small letters)
  var VX = [0, 30, 120, 130];    // small letters without tall or low parts
  var VD = [0, 30, 120, 160];    // small letters that go below the line

  var UPPER = {
    A: ['M 18 148 L 60 14 L 102 148', 'M 36 102 L 84 102'],
    B: ['M 28 14 L 28 148', 'M 28 14 L 62 14 C 100 14 100 80 62 80 L 28 80', 'M 28 80 L 62 80 C 110 80 110 148 62 148 L 28 148'],
    C: ['M 98 40 C 84 8 24 8 24 80 C 24 152 84 150 98 120'],
    D: ['M 26 14 L 26 148', 'M 26 14 L 50 14 C 112 14 112 148 50 148 L 26 148'],
    E: ['M 26 14 L 26 148', 'M 26 14 L 96 14', 'M 26 81 L 82 81', 'M 26 148 L 96 148'],
    F: ['M 26 14 L 26 148', 'M 26 14 L 96 14', 'M 26 81 L 82 81'],
    G: ['M 98 40 C 84 8 24 8 24 80 C 24 152 96 152 98 100 L 62 100'],
    H: ['M 26 14 L 26 148', 'M 94 14 L 94 148', 'M 26 81 L 94 81'],
    I: ['M 60 14 L 60 148'],
    J: ['M 78 14 L 78 108 C 78 150 24 152 22 112'],
    K: ['M 28 14 L 28 148', 'M 94 14 L 28 84', 'M 52 58 L 96 148'],
    L: ['M 28 14 L 28 148 L 94 148'],
    M: ['M 16 148 L 16 14 L 60 104 L 104 14 L 104 148'],
    N: ['M 26 148 L 26 14 L 94 148 L 94 14'],
    O: ['M 60 14 C 6 14 6 148 60 148 C 114 148 114 14 60 14'],
    P: ['M 28 152 L 28 14 L 62 14 C 106 14 106 92 62 92 L 28 92'],
    Q: ['M 60 14 C 6 14 6 148 60 148 C 114 148 114 14 60 14', 'M 66 108 L 100 150'],
    R: ['M 28 14 L 28 148', 'M 28 14 L 62 14 C 104 14 104 84 62 84 L 28 84', 'M 58 84 L 98 148'],
    S: ['M 96 36 C 88 8 26 4 26 42 C 26 78 98 74 98 112 C 98 156 30 156 20 124'],
    T: ['M 20 14 L 100 14', 'M 60 14 L 60 148'],
    U: ['M 26 14 L 26 100 C 26 160 94 160 94 100 L 94 14'],
    V: ['M 18 14 L 60 148 L 102 14'],
    W: ['M 8 14 L 34 148 L 60 50 L 86 148 L 112 14'],
    X: ['M 22 14 L 98 148', 'M 98 14 L 22 148'],
    Y: ['M 20 14 L 60 86', 'M 100 14 L 60 86 L 60 148'],
    Z: ['M 22 14 L 98 14 L 22 148 L 98 148']
  };

  // [view, strokes]
  var LOWER = {
    a: [VX, ['M 84 70 C 62 42 18 55 18 98 C 18 148 70 158 84 112', 'M 84 62 L 84 148']],
    b: [VA, ['M 28 14 L 28 146', 'M 28 104 C 46 60 106 64 104 106 C 102 150 44 156 28 120']],
    c: [VX, ['M 98 78 C 84 52 24 56 24 102 C 24 150 84 150 98 122']],
    d: [VA, ['M 92 76 C 70 54 18 62 18 106 C 18 152 74 158 92 118', 'M 92 14 L 92 146']],
    e: [VX, ['M 22 100 L 98 100 C 98 56 24 54 24 104 C 24 152 80 156 98 124']],
    f: [VA, ['M 84 30 C 60 12 50 30 50 60 L 50 146', 'M 24 70 L 84 70']],
    g: [VD, ['M 84 70 C 62 42 18 55 18 98 C 18 148 70 158 84 112', 'M 84 62 L 84 150 C 84 188 40 186 24 164']],
    h: [VA, ['M 28 14 L 28 146', 'M 28 90 C 36 60 96 56 96 100 L 96 146']],
    i: [[0, 15, 120, 145], ['M 60 62 L 60 146', 'M 60 33 L 60 40']],
    j: [[0, 15, 120, 175], ['M 70 62 L 70 150 C 70 188 30 184 18 164', 'M 70 33 L 70 40']],
    k: [VA, ['M 28 14 L 28 146', 'M 90 62 L 28 108', 'M 52 90 L 94 146']],
    l: [VA, ['M 60 14 L 60 146']],
    m: [VX, ['M 15 55 L 15 145 L 15 85 C 15 45 62 45 62 85 L 62 145 L 62 85 C 62 45 108 45 108 85 L 108 145']],
    n: [VX, ['M 24 58 L 24 146 L 24 98 C 24 56 98 56 98 100 L 98 146']],
    o: [VX, ['M 60 58 C 12 58 12 148 60 148 C 108 148 108 58 60 58']],
    p: [VD, ['M 25 55 L 25 175 L 25 70 C 50 45 100 55 100 98 C 100 140 55 150 25 120']],
    q: [VD, ['M 92 76 C 70 54 18 62 18 106 C 18 152 74 158 92 118', 'M 92 62 L 92 178']],
    r: [VX, ['M 28 58 L 28 146 L 28 100 C 32 62 70 54 92 66']],
    s: [VX, ['M 90 74 C 80 52 28 52 28 84 C 28 112 92 100 92 126 C 92 158 36 156 24 134']],
    t: [VA, ['M 52 24 L 52 120 C 52 146 76 150 94 138', 'M 24 66 L 82 66']],
    u: [VX, ['M 26 58 L 26 112 C 26 158 94 158 94 112', 'M 94 58 L 94 146']],
    v: [VX, ['M 18 58 L 60 146 L 102 58']],
    w: [VX, ['M 6 58 L 32 146 L 60 76 L 88 146 L 114 58']],
    x: [VX, ['M 24 58 L 96 146', 'M 96 58 L 24 146']],
    y: [[0, 30, 120, 170], ['M 22 58 L 60 146', 'M 98 58 L 60 148 C 52 168 40 176 26 176']],
    z: [VX, ['M 24 58 L 96 58 L 24 146 L 96 146']]
  };

  var DIGITS = {
    0: ['M 60 14 C 22 14 22 148 60 148 C 98 148 98 14 60 14'],
    1: ['M 34 44 L 66 14 L 66 148'],
    2: ['M 22 55 C 22 -5 100 -5 100 50 C 100 85 55 105 22 145 L 105 145'],
    3: ['M 22 30 C 35 -2 98 5 90 45 C 85 70 55 75 45 75 C 100 75 105 115 85 138 C 65 160 30 150 18 125'],
    4: ['M 76 14 L 18 108 L 104 108', 'M 76 14 L 76 148'],
    5: ['M 92 14 L 34 14 L 28 78 C 54 60 102 66 102 106 C 102 150 44 160 20 130'],
    6: ['M 88 20 C 50 30 22 70 22 108 C 22 160 100 160 100 112 C 100 72 40 64 24 112'],
    7: ['M 20 14 L 100 14 L 46 148'],
    8: ['M 60 14 C 20 14 20 76 60 80 C 104 84 104 148 60 148 C 16 148 16 84 60 80 C 104 76 100 14 60 14'],
    9: ['M 96 52 C 96 6 24 6 24 52 C 24 94 96 98 96 52 C 96 104 80 142 34 148']
  };

  var COLORS = ['#ff6f91', '#4d96ff', '#ffa62b', '#4cc26b', '#9b72ff', '#12b5a6', '#f25f5c', '#c79100'];

  LC.GLYPHS = {};
  LC.CATEGORIES = { upper: [], lower: [], digit: [] };

  Object.keys(UPPER).forEach(function (k, i) {
    LC.GLYPHS[k] = { view: VA, color: COLORS[i % COLORS.length], sound: k.toLowerCase(), strokes: UPPER[k] };
    LC.CATEGORIES.upper.push(k);
  });
  Object.keys(LOWER).forEach(function (k, i) {
    LC.GLYPHS[k] = { view: LOWER[k][0], color: COLORS[i % COLORS.length], sound: k + '-klein', strokes: LOWER[k][1] };
    LC.CATEGORIES.lower.push(k);
  });
  Object.keys(DIGITS).forEach(function (k, i) {
    LC.GLYPHS[k] = { view: VA, color: COLORS[(i + 3) % COLORS.length], sound: k, strokes: DIGITS[k] };
    LC.CATEGORIES.digit.push(k);
  });

  // Digits sort first as object keys, so build the lists in a clear order.
  LC.CATEGORIES.digit.sort();
  LC.ORDER = [].concat(LC.CATEGORIES.upper, LC.CATEGORIES.lower, LC.CATEGORIES.digit);

  LC.categoryOf = function (key) {
    return /[A-Z]/.test(key) ? 'upper' : /[a-z]/.test(key) ? 'lower' : 'digit';
  };
})();
