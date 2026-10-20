(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  LC.KERNS = [
    { id: 'start', label: 'Start',  letters: ['i', 'k', 'm', 's'] },
    { id: 'kern1', label: 'Kern 1', letters: ['p', 'aa', 'r', 'e', 'v'] },
    { id: 'kern2', label: 'Kern 2', letters: ['n', 't', 'ee', 'b', 'oo'] },
    { id: 'kern3', label: 'Kern 3', letters: ['d', 'oe', 'z', 'ij', 'h'] },
    { id: 'kern4', label: 'Kern 4', letters: ['w', 'o', 'a', 'u', 'j'] },
    { id: 'kern5', label: 'Kern 5', letters: ['eu', 'ie', 'l', 'ou', 'uu'] },
    { id: 'kern6', label: 'Kern 6', letters: ['g', 'au', 'ui', 'f', 'ei'] },
    { id: 'extra', label: 'Extra',  letters: ['c', 'q', 'x', 'y'] }
  ];

  var FREE = { start: true, kern1: true };

  // Whether a kern is accessible from a payment perspective.
  // IMPORTANT: FREE is the only check here. Real purchase verification must come from
  // Google Play billing - anything stored on-device can be edited by a technical user.
  LC.kernPurchased = function (kernId) {
    // Dev override: ?dev=1 in the URL unlocks all kerns for testing.
    // Never part of the installed Android app's launch intent.
    if (typeof location !== 'undefined' && /[?&]dev=1/.test(location.search)) return true;
    return !!FREE[kernId];
  };

  // A kern is reachable when it is purchased AND the previous kern is mastered.
  LC.kernReachable = function (profile, kernId) {
    if (!LC.kernPurchased(kernId)) return false;
    var idx = -1;
    for (var i = 0; i < LC.KERNS.length; i++) { if (LC.KERNS[i].id === kernId) { idx = i; break; } }
    if (idx <= 0) return true;
    return LC.kernMastered(profile, LC.KERNS[idx - 1].id);
  };

  LC.kernMastered = function (profile, kernId) {
    var kern = null;
    for (var i = 0; i < LC.KERNS.length; i++) { if (LC.KERNS[i].id === kernId) { kern = LC.KERNS[i]; break; } }
    if (!kern) return false;
    return kern.letters.every(function (letter) { return LC.masteryOf(profile, letter) === 'good'; });
  };

  LC.activeKern = function (profile) {
    var active = LC.KERNS[0];
    for (var i = 0; i < LC.KERNS.length; i++) {
      if (LC.kernReachable(profile, LC.KERNS[i].id)) active = LC.KERNS[i];
      else break;
    }
    return active;
  };

  LC.availableLetters = function (profile) {
    var letters = [];
    for (var i = 0; i < LC.KERNS.length; i++) {
      if (!LC.kernReachable(profile, LC.KERNS[i].id)) break;
      LC.KERNS[i].letters.forEach(function (l) { if (letters.indexOf(l) < 0) letters.push(l); });
    }
    return letters;
  };

  // Mastery of one letter for one child (rolling last-5 window from find+pop first-try results).
  LC.masteryOf = function (profile, key) {
    var p = LC.store.get().profiles[profile];
    var recent = (p.recent && p.recent[key]) || [];
    var threshold = (p.masteryThreshold !== undefined) ? p.masteryThreshold : 4;
    if (recent.length === 0) return 'new';
    var correct = 0;
    for (var i = 0; i < recent.length; i++) if (recent[i]) correct++;
    if (recent.length >= 5 && correct >= threshold) return 'good';
    if (recent.length >= 3 && correct / recent.length < 0.35) return 'practice';
    return 'busy';
  };
})();
