(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});
  var KEY = 'lcl.v1';
  var PROFILES = ['pinky', 'groentje'];
  var data = null;

  function fresh() {
    return {
      profiles: { pinky: { name: '', done: {} }, groentje: { name: '', done: {} } },
      settings: { strict: 'normaal', music: true }
    };
  }

  function clean(raw) {
    var d = fresh();
    try {
      if (raw && typeof raw === 'object') {
        PROFILES.forEach(function (k) {
          var p = raw.profiles && raw.profiles[k];
          if (!p) return;
          if (typeof p.name === 'string') d.profiles[k].name = p.name.slice(0, 20);
          if (p.done && typeof p.done === 'object') {
            Object.keys(p.done).forEach(function (g) {
              var n = p.done[g];
              if (LC.GLYPHS[g] && isFinite(n)) d.profiles[k].done[g] = Math.max(0, Math.min(9999, Math.floor(n)));
            });
          }
        });
        var s = raw.settings || {};
        if (['soepel', 'normaal', 'streng'].indexOf(s.strict) >= 0) d.settings.strict = s.strict;
        if (typeof s.music === 'boolean') d.settings.music = s.music;
      }
    } catch (e) { /* fall back to defaults */ }
    return d;
  }

  function get() {
    if (!data) {
      var raw = null;
      try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
      data = clean(raw);
    }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(get())); } catch (e) { /* private mode: keep in memory */ }
  }

  LC.store = {
    get: get,
    save: save,
    addDone: function (profile, glyph) {
      var d = get().profiles[profile].done;
      d[glyph] = (d[glyph] || 0) + 1;
      save();
    },
    total: function (profile) {
      var d = get().profiles[profile].done, t = 0;
      Object.keys(d).forEach(function (k) { t += d[k]; });
      return t;
    },
    resetProgress: function () {
      PROFILES.forEach(function (k) { get().profiles[k].done = {}; });
      save();
    }
  };
})();
