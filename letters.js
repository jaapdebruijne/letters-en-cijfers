(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // Every shape is a list of strokes. A stroke is one continuous line in the
  // "ideal" school order. Children may lift their finger anywhere.
  LC.GLYPHS = {
    A: { view: [0, 0, 120, 160], color: '#ff6f91', sound: 'a',
      strokes: ['M 18 148 L 60 14 L 102 148', 'M 36 102 L 84 102'] },
    M: { view: [0, 0, 120, 160], color: '#4d96ff', sound: 'm',
      strokes: ['M 16 148 L 16 14 L 60 104 L 104 14 L 104 148'] },
    P: { view: [0, 0, 120, 160], color: '#ffa62b', sound: 'p',
      strokes: ['M 28 152 L 28 14 L 62 14 C 106 14 106 92 62 92 L 28 92'] },
    a: { view: [0, 30, 120, 130], color: '#ff6f91', sound: 'a',
      strokes: ['M 84 70 C 62 42 18 55 18 98 C 18 148 70 158 84 112', 'M 84 62 L 84 148'] },
    m: { view: [0, 30, 120, 130], color: '#4d96ff', sound: 'm',
      strokes: ['M 15 55 L 15 145 L 15 85 C 15 45 62 45 62 85 L 62 145 L 62 85 C 62 45 108 45 108 85 L 108 145'] },
    p: { view: [0, 30, 120, 160], color: '#ffa62b', sound: 'p',
      strokes: ['M 25 55 L 25 175 L 25 70 C 50 45 100 55 100 98 C 100 140 55 150 25 120'] },
    1: { view: [0, 0, 120, 160], color: '#4cc26b', sound: '1',
      strokes: ['M 34 44 L 66 14 L 66 148'] },
    2: { view: [0, 0, 120, 160], color: '#9b72ff', sound: '2',
      strokes: ['M 22 55 C 22 -5 100 -5 100 50 C 100 85 55 105 22 145 L 105 145'] },
    3: { view: [0, 0, 120, 160], color: '#12b5a6', sound: '3',
      strokes: ['M 22 30 C 35 -2 98 5 90 45 C 85 70 55 75 45 75 C 100 75 105 115 85 138 C 65 160 30 150 18 125'] }
  };

  LC.ORDER = ['A', 'M', 'P', 'a', 'm', 'p', '1', '2', '3'];
})();
