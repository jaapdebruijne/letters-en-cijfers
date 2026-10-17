(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});
  var KEY = 'lcl.v1';
  var PROFILES = ['pinky', 'groentje'];
  var SLOTS = ['head', 'face', 'body'];
  var data = null;

  function freshProfile() {
    return { name: '', done: {}, stars: 0, owned: [], avatar: { head: '', face: '', body: '' } };
  }

  function fresh() {
    return {
      profiles: { pinky: freshProfile(), groentje: freshProfile() },
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
          var out = d.profiles[k];
          if (typeof p.name === 'string') out.name = p.name.slice(0, 20);
          if (p.done && typeof p.done === 'object') {
            Object.keys(p.done).forEach(function (g) {
              var n = p.done[g];
              if (LC.GLYPHS[g] && isFinite(n)) out.done[g] = Math.max(0, Math.min(9999, Math.floor(n)));
            });
          }
          if (isFinite(p.stars)) out.stars = Math.max(0, Math.min(99999, Math.floor(p.stars)));
          if (Array.isArray(p.owned)) {
            p.owned.forEach(function (id) {
              if (LC.shopItem(id) && out.owned.indexOf(id) < 0) out.owned.push(id);
            });
          }
          if (p.avatar && typeof p.avatar === 'object') {
            SLOTS.forEach(function (s) {
              var id = p.avatar[s], it = LC.shopItem(id);
              if (it && it.slot === s && out.owned.indexOf(id) >= 0) out.avatar[s] = id;
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
    stars: function (profile) { return get().profiles[profile].stars; },
    addStars: function (profile, n) {
      var p = get().profiles[profile];
      p.stars = Math.min(99999, p.stars + n);
      save();
    },
    owns: function (profile, id) { return get().profiles[profile].owned.indexOf(id) >= 0; },
    buy: function (profile, id) {
      var p = get().profiles[profile], it = LC.shopItem(id);
      if (!it || p.owned.indexOf(id) >= 0 || p.stars < it.cost) return false;
      p.stars -= it.cost;
      p.owned.push(id);
      if (it.slot) p.avatar[it.slot] = id;
      save();
      return true;
    },
    equip: function (profile, slot, id) {
      var p = get().profiles[profile];
      if (id && p.owned.indexOf(id) < 0) return;
      p.avatar[slot] = id || '';
      save();
    },
    resetProgress: function () {
      PROFILES.forEach(function (k) {
        var p = get().profiles[k];
        p.done = {}; p.stars = 0; p.owned = []; p.avatar = { head: '', face: '', body: '' };
      });
      save();
    }
  };
})();
