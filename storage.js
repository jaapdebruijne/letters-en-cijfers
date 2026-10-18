(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});
  var KEY = 'lcl.v1';
  var PROFILES = ['pinky', 'groentje'];
  var SLOTS = ['head', 'face', 'body', 'car'];
  var GAMES = ['trace', 'find', 'pop', 'count', 'math'];
  var data = null, dirty = false;

  function freshProfile() {
    return { name: '', done: {}, stats: {}, time: {}, mathMax: 5, stars: 0, tickets: 0, stamps: [], walk: {}, owned: [], avatar: { head: '', face: '', body: '', car: '' } };
  }

  function fresh() {
    return {
      profiles: { pinky: freshProfile(), groentje: freshProfile() },
      settings: { strict: 'normaal', music: true, turnMin: 10, adaptive: true, caps: true }
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
          if (p.stats && typeof p.stats === 'object') {
            Object.keys(p.stats).forEach(function (g) {
              var e = p.stats[g];
              if (LC.GLYPHS[g] && Array.isArray(e) && e.length === 4 && e.every(isFinite)) {
                out.stats[g] = e.map(function (n) { return Math.max(0, Math.min(9999, Math.floor(n))); });
              }
            });
          }
          if (p.time && typeof p.time === 'object') {
            Object.keys(p.time).sort().slice(-30).forEach(function (day) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(day) && isFinite(p.time[day])) out.time[day] = Math.max(0, Math.min(86400, Math.floor(p.time[day])));
            });
          }
          if (p.mathMax === 10) out.mathMax = 10;
          if (isFinite(p.stars)) out.stars = Math.max(0, Math.min(99999, Math.floor(p.stars)));
          if (isFinite(p.tickets)) out.tickets = Math.max(0, Math.min(99, Math.floor(p.tickets)));
          // stamp card (a bonus ride needs stamps from 3 different games) and where the child is in each row
          if (Array.isArray(p.stamps)) {
            p.stamps.forEach(function (g) { if (GAMES.indexOf(g) >= 0 && out.stamps.indexOf(g) < 0 && out.stamps.length < 2) out.stamps.push(g); });
          }
          if (p.walk && typeof p.walk === 'object') {
            ['upper', 'lower', 'digit'].forEach(function (c) {
              var w = p.walk[c];
              if (!w || !isFinite(w.b) || !Array.isArray(w.s)) return;
              out.walk[c] = { b: Math.max(0, Math.min(9, Math.floor(w.b))), s: w.s.filter(function (k, i) { return LC.GLYPHS[k] && LC.categoryOf(k) === c && w.s.indexOf(k) === i; }).slice(0, 7) };
            });
          }
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
        if ([0, 5, 10, 15].indexOf(s.turnMin) >= 0) d.settings.turnMin = s.turnMin;
        if (typeof s.adaptive === 'boolean') d.settings.adaptive = s.adaptive;
        if (typeof s.caps === 'boolean') d.settings.caps = s.caps;
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
    // What happened with one letter or number: asked / first try right / missed tap / failed trace
    record: function (profile, key, kind) {
      var st = get().profiles[profile].stats;
      if (!LC.GLYPHS[key]) return;
      var e = st[key] || (st[key] = [0, 0, 0, 0]);
      if (kind === 'first') { e[0]++; e[1]++; }
      else if (kind === 'ask') e[0]++;
      else if (kind === 'miss') e[2]++;
      else if (kind === 'tryfail') e[3]++;
      for (var i = 0; i < 4; i++) if (e[i] > 9999) e[i] = 9999;
      save();
    },
    dayKey: function (offset) {
      var d = new Date(); d.setDate(d.getDate() - (offset || 0));
      var m = d.getMonth() + 1, day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    },
    addTime: function (profile, sec) {
      var t = get().profiles[profile].time, k = LC.store.dayKey(0);
      t[k] = (t[k] || 0) + sec;
      var keys = Object.keys(t).sort();
      while (keys.length > 30) delete t[keys.shift()];
      dirty = true;
    },
    flush: function () { if (dirty) { dirty = false; save(); } },
    mathMax: function (profile) { return get().profiles[profile].mathMax; },
    setMath: function (profile, v) { get().profiles[profile].mathMax = v === 10 ? 10 : 5; save(); },
    stars: function (profile) { return get().profiles[profile].stars; },
    addStars: function (profile, n) {
      var p = get().profiles[profile];
      p.stars = Math.min(99999, p.stars + n);
      save();
    },
    tickets: function (profile) { return get().profiles[profile].tickets; },
    addTicket: function (profile) {
      var p = get().profiles[profile];
      p.tickets = Math.min(99, p.tickets + 1);
      save();
    },
    stamps: function (profile) { return get().profiles[profile].stamps; },
    // One stamp per game; the third different game turns the card into a bonus ride.
    // Returns 'have' (this game already has one), 'new' or 'ticket'.
    addStamp: function (profile, game) {
      var p = get().profiles[profile];
      if (GAMES.indexOf(game) < 0 || p.stamps.indexOf(game) >= 0) return 'have';
      p.stamps.push(game);
      var r = 'new';
      if (p.stamps.length >= 3) { p.stamps = []; p.tickets = Math.min(99, p.tickets + 1); r = 'ticket'; }
      save();
      return r;
    },
    useTicket: function (profile) {
      var p = get().profiles[profile];
      if (p.tickets < 1) return false;
      p.tickets--;
      save();
      return true;
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
        p.done = {}; p.stats = {}; p.time = {}; p.mathMax = 5; p.stars = 0; p.tickets = 0; p.stamps = []; p.walk = {}; p.owned = []; p.avatar = { head: '', face: '', body: '', car: '' };
      });
      save();
    }
  };
})();
