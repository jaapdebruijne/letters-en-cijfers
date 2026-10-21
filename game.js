(function () {
  'use strict';
  var LC = window.LC, store = LC.store, audio = LC.audio;
  var state = { profile: null, glyph: null, cat: 'upper', pos: 0, game: 'trace', kern: 'start', firstBatchDone: false, openKern: null, digraphKey: null, digraphPart: 0, traceBatch: null };
  var F = {};
  var tracer = null, advanceTimer = 0, moodTimer = 0, token = 0, current = 'profile', T = {};

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function other(key) { return key === 'speler1' ? 'speler2' : 'speler1'; }

  // A cat wearing whatever its child has put on in the shop.
  function catFor(key, opts) {
    var o = {};
    for (var k in (opts || {})) o[k] = opts[k];
    o.outfit = store.get().profiles[key].avatar;
    return LC.catSVG(store.getFur(key), o);
  }

  // The doll house things a child has bought appear in the room behind every screen.
  function renderDecor(newId) {
    var g = document.getElementById('decor');
    if (!g) return;
    var ids = state.profile ? store.get().profiles[state.profile].owned.filter(function (id) {
      return LC.SHOP.room.some(function (r) { return r.id === id; });
    }) : [];
    g.innerHTML = LC.decorMarkup(ids, newId);
  }

  function adaptDifficulty(key) {
    if (!store.get().settings.adaptive) return;
    var prof = store.get().profiles[key];
    var strict = prof.strict || 'normaal';
    var stats = prof.stats;
    var baseGlyphs = Object.keys(LC.GLYPHS).filter(function (g) {
      var cat = LC.categoryOf(g);
      return cat === 'lower' || cat === 'digit';
    });
    var attempted = baseGlyphs.filter(function (g) { return stats[g] && stats[g][0] >= 3; });
    if (attempted.length < 5) return;
    var topCount = attempted.filter(function (g) { return stats[g][1] / stats[g][0] >= 0.85; }).length;
    var topRate = topCount / attempted.length;
    var base = prof.strictBase || { asked: 0, firstTry: 0 };
    var totalAsked = baseGlyphs.reduce(function (s, g) { return s + (stats[g] ? stats[g][0] : 0); }, 0);
    var totalFirst = baseGlyphs.reduce(function (s, g) { return s + (stats[g] ? stats[g][1] : 0); }, 0);
    var recentAsked = totalAsked - base.asked;
    var recentFirst = totalFirst - base.firstTry;
    if (strict !== 'streng' && topRate >= 0.85 && attempted.length >= 10) {
      var next = strict === 'soepel' ? 'normaal' : 'streng';
      store.setStrict(key, next);
      store.setStrictBase(key, { asked: totalAsked, firstTry: totalFirst });
      if (next === 'streng') store.setCaps(key, true);
      return;
    }
    if (strict !== 'soepel' && recentAsked >= 15 && recentFirst / recentAsked < 0.40) {
      var prev = strict === 'streng' ? 'normaal' : 'soepel';
      store.setStrict(key, prev);
      store.setStrictBase(key, { asked: totalAsked, firstTry: totalFirst });
      if (prev !== 'streng') store.setCaps(key, false);
    }
  }

  // The spoken line for a stamp starts a moment after the message and is long; the finale waits for it
  // (afterStamp) so going back to the menu does not cut it off.
  function stampVoice(key, toast) {
    var who = state.profile;
    var p = new Promise(function (resolve) {
      setTimeout(function () {
        if (toast.isConnected && state.profile === who) audio.voiceTTS(key).then(resolve, resolve); else resolve();
      }, 1700);
    });
    state.stampBusy = p;
    p.then(function () { if (state.stampBusy === p) state.stampBusy = null; });
  }
  function afterStamp(fn) { if (state.stampBusy) state.stampBusy.then(fn); else fn(); }

  // A finished game round earns a stamp for that game. Stamps from 3 different games make a bonus
  // ride, so the same easy game over and over gives only one stamp.
  function earnStamp(game, container) {
    adaptDifficulty(state.profile);
    var r = store.addStamp(state.profile, game);
    if (!container) return;
    var t;
    if (r === 'ticket') {
      t = h('div', 'ticket-toast', LC.carIconSVG() + '<span>Bonusrit!</span>');
      stampVoice('bonusrit-verdiend', t);
    }
    else if (r === 'new') {
      state.freshStamp = game;
      t = h('div', 'ticket-toast stamp-toast', '<span class="tpaw">' + LC.pawSVG() + '</span><span>Stempel ' + store.stamps(state.profile).length + ' van 3</span>');
      stampVoice('stempel-verdiend', t);
    }
    else t = h('div', 'ticket-toast', '<span class="tstar">★</span><span>Probeer een ander spel!</span>');
    container.appendChild(t);
    audio.chime();
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3600);
  }

  // Tracing goes through the letters row by row (a row of 7, for numbers 5). The child has to finish
  // the whole row before the next one comes up; finishing a row earns the Schrijven stamp.
  function rowSize(cat) { return cat === 'digit' ? 5 : 7; }
  function walkOf(cat) {
    var prof = store.get().profiles[state.profile];
    return prof.walk[cat] || (prof.walk[cat] = { b: 0, s: [] });
  }
  function walkRange(cat) {
    var list = LC.CATEGORIES[cat], size = rowSize(cat), w = walkOf(cat);
    var rows = Math.ceil(list.length / size);
    if (w.b >= rows) w.b = 0;
    return { from: w.b * size, to: Math.min(list.length, w.b * size + size), rows: rows, w: w };
  }
  // Tracing one glyph of the current row; true when that finishes the row.
  function walkTrace(cat, key) {
    if (cat === 'name') return false;
    var r = walkRange(cat), idx = LC.CATEGORIES[cat].indexOf(key);
    if (idx < r.from || idx >= r.to) return false;
    if (r.w.s.indexOf(key) < 0) r.w.s.push(key);
    var full = r.w.s.length >= r.to - r.from;
    if (full) { r.w.b = (r.w.b + 1) % r.rows; r.w.s = []; }
    store.save();
    return full;
  }
  // The next glyph of the current row that is not done yet (or -1).
  function walkNext(cat, afterPos) {
    var r = walkRange(cat), list = LC.CATEGORIES[cat], n = r.to - r.from;
    for (var i = 1; i <= n; i++) {
      var p = r.from + ((afterPos - r.from + i) % n + n) % n;
      if (r.w.s.indexOf(list[p]) < 0) return p;
    }
    return -1;
  }

  // One star (or more) earned: it floats up and is saved for the shop.
  function gain(n, container) {
    store.addStars(state.profile, n);
    if (!container) return;
    var g = h('div', 'gain');
    g.textContent = '★ +' + n;
    container.appendChild(g);
    setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 1800);
  }

  // The letters of a child's name (set in the parent panel). Accents are dropped and
  // anything that is not a plain letter (spaces, hyphens) is skipped.
  // Capital letters can be switched off in the parent panel (children learn them later at school).
  function capsOn() { return store.getCaps(state.profile || 'speler1'); }

  function nameLetters(profile) {
    var raw = store.get().profiles[profile].name || '';
    var plain = raw.normalize ? raw.normalize('NFD').replace(/[̀-ͯ]/g, '') : raw;
    var out = [];
    for (var i = 0; i < plain.length; i++) {
      var c = plain.charAt(i);
      if (/[A-Za-z]/.test(c)) out.push(capsOn() ? (out.length === 0 ? c.toUpperCase() : c) : c.toLowerCase());
    }
    return out;
  }
  // Numbers are a free extra tile next to the kerns: always open, not part of the mastery chain.
  var DIGIT_KERN = { id: 'cijfers', label: 'Cijfers', letters: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] };
  function allKerns() { return LC.KERNS.concat([DIGIT_KERN]); }
  function kernLetters(kernId) {
    var all = allKerns();
    for (var i = 0; i < all.length; i++) { if (all[i].id === kernId) return all[i].letters.slice(); }
    return [];
  }
  function availablePool() { return LC.availableLetters(state.profile); }
  // Zoeken and Prikken also use numbers: 1-5 from the start, 6-0 once 1-5 are all mastered.
  function digitPool() {
    var d = ['1', '2', '3', '4', '5'];
    var ok = d.every(function (k) { return LC.masteryOf(state.profile, k) === 'good'; });
    return ok ? d.concat(['6', '7', '8', '9', '0']) : d;
  }
  function gamePool() { return availablePool().concat(digitPool()); }
  function sameKind(a, b) { return (LC.categoryOf(a) === 'digit') === (LC.categoryOf(b) === 'digit'); }
  function listFor() { return kernLetters(state.kern); }

  var app = document.getElementById('app');
  app.appendChild(h('div', 'bg', LC.sceneSVG()));
  var scr = {};
  ['profile', 'games', 'shop', 'house', 'ride', 'menu', 'trace', 'find', 'pop', 'count', 'math', 'switch', 'bye'].forEach(function (n) {
    scr[n] = h('div', 'screen s-' + n);
    app.appendChild(scr[n]);
  });

  function show(n) {
    current = n;
    Object.keys(scr).forEach(function (k) { scr[k].classList.toggle('on', k === n); });
    // When the turn is over, change cats at the next calm moment (back at a choice screen).
    if (turn.due && (n === 'games' || n === 'menu')) setTimeout(startSwitch, 350);
    updateRing();
    // The cat on this screen says hello once.
    var hello = scr[n].querySelector('.games-cat .cat, .menu-cat .cat, .trace-cat .cat, .house-cat .cat');
    if (hello) setTimeout(function () { if (current === n) LC.catWave(hello); }, 350);
  }
  // Tapping the cat makes it wave (the house cat hops instead).
  app.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.games-cat .cat, .menu-cat .cat, .trace-cat .cat');
    if (c) LC.catWave(c);
  });

  // ---------- Taking turns ----------
  // Only real play time counts: not the cat choice, not the parent panel, not a hidden page.
  var turn = { ms: 0, due: false, grace: 0, last: Date.now() };
  var timeupEl = null;

  function showTimeup() {
    if (timeupEl) return;
    timeupEl = h('div', 'timeup', LC.hourglassSVG());
    document.body.appendChild(timeupEl);
    audio.chime();
  }
  // A round timer (like the kids know from screen time) shows how much of the turn is left.
  var ringEl = null, ringArc = null, RING_LEN = 2 * Math.PI * 40;
  function updateRing() {
    var min = store.get().settings.turnMin;
    var on = state.profile && min && !turn.due && store.getPlayers() > 1 && current !== 'profile' && current !== 'switch' && current !== 'bye';
    if (!on) { if (ringEl) ringEl.classList.add('off'); return; }
    if (!ringEl) {
      ringEl = h('div', 'turnring', '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#ece4f7" stroke-width="14"/>' +
        '<circle class="arc" cx="50" cy="50" r="40" fill="none" stroke-width="14" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="' + RING_LEN.toFixed(1) + '"/></svg>');
      ringArc = ringEl.querySelector('.arc');
      document.body.appendChild(ringEl);
    }
    var left = Math.max(0, 1 - turn.ms / (min * 60000));
    ringArc.setAttribute('stroke', left < 0.2 ? '#ff9f43' : LC.petColor(store.getFur(state.profile)));
    ringArc.setAttribute('stroke-dashoffset', (RING_LEN * (1 - left)).toFixed(1));
    ringEl.classList.remove('off');
  }
  function removeTimeup() {
    if (timeupEl && timeupEl.parentNode) timeupEl.parentNode.removeChild(timeupEl);
    timeupEl = null;
  }
  // The turn clock is kept in localStorage, so a page reload (Android does that a lot) does not
  // start the ten minutes again. It is only picked up again by the same cat within 20 minutes.
  var TURN_KEY = 'lcl.turn';
  function saveTurn() {
    try { localStorage.setItem(TURN_KEY, JSON.stringify({ p: state.profile, ms: turn.ms, due: turn.due, grace: turn.grace, at: Date.now() })); } catch (e) { /* no storage: fine */ }
  }
  function clearTurn() { try { localStorage.removeItem(TURN_KEY); } catch (e) { /* ignore */ } }
  function turnReset() {
    turn.ms = 0; turn.due = false; turn.grace = 0;
    removeTimeup();
    clearTurn();
    updateRing();
  }
  function turnResume(key) {
    var v = null;
    try { v = JSON.parse(localStorage.getItem(TURN_KEY)); } catch (e) { v = null; }
    if (v && v.p === key && Date.now() - v.at < 20 * 60000 && v.ms >= 0 && v.grace >= 0) {
      turn.ms = v.ms; turn.due = !!v.due; turn.grace = v.grace;
      if (turn.due) showTimeup();
      updateRing();
    } else turnReset();
  }
  function turnTick(dt) {
    if (!state.profile || modal || document.hidden || current === 'profile' || current === 'switch' || current === 'bye') return;
    store.addTime(state.profile, dt / 1000);
    var min = store.get().settings.turnMin;
    if (!min || store.getPlayers() < 2) return;
    if (!turn.due) {
      turn.ms += dt;
      if (turn.ms >= min * 60000) { turn.due = true; showTimeup(); }
      updateRing();
    } else {
      turn.grace += dt;
      if (turn.grace >= 75000) { startSwitch(); return; }
    }
    saveTurn();
  }
  setInterval(function () {
    var now = Date.now(), dt = Math.min(2500, now - turn.last);
    turn.last = now;
    turnTick(dt);
    if (++flushCount % 15 === 0) store.flush();
  }, 1000);
  var flushCount = 0;
  document.addEventListener('visibilitychange', function () { if (document.hidden) store.flush(); });
  LC.testTurn = function (ms) { turnTick(ms); return turn; };

  // Stop whatever is running; a bonus ride in progress keeps the stars collected so far.
  function abortGames() {
    if (R && R.ride && !R.ended) {
      var n = R.ride.collected();
      if (n > 0) store.addStars(state.profile, n);
    }
    leaveTrace(); leaveFind(); leavePop(); leaveCount(); leaveMath(); stopRide();
  }

  function startSwitch() {
    if (!state.profile || modal || current === 'switch' || current === 'profile' || current === 'bye') return;
    var from = state.profile, to = other(from);
    abortGames();
    turnReset();
    buildSwitch(from, to);
    show('switch');
    audio.voiceSwitch();
  }

  function buildSwitch(from, to) {
    var s = scr.switch;
    s.textContent = '';
    s.appendChild(h('div', 'swicon', LC.swapSVG()));
    var fromName = store.get().profiles[from].name || (from === 'speler1' ? 'Speler 1' : 'Speler 2');
    var sl = h('div', 'sleeper', catFor(from, { cls: 'sleep' }));
    var zz = h('div', 'zzz'); zz.textContent = 'zzz'; sl.appendChild(zz);
    var sn = h('div', 'sleepname'); sn.textContent = fromName; sl.appendChild(sn);
    s.appendChild(sl);

    var wrap = h('div', 'pwrap swwrap');
    var card = h('button', 'pcard swcard pc-' + to, catFor(to, { cls: 'happy' }));
    var toName = store.get().profiles[to].name || (to === 'speler1' ? 'Speler 1' : 'Speler 2');
    var nm = h('div', 'pname'); nm.textContent = toName; card.appendChild(nm);
    var kid = store.get().profiles[to].name;
    var line = h('div', 'kname'); line.textContent = kid ? kid + ', jouw beurt!' : 'Jouw beurt!'; card.appendChild(line);
    card.addEventListener('click', function () { pickProfile(to); });
    wrap.appendChild(card);
    s.appendChild(wrap);
  }

  // ---------- Who is playing ----------
  // Returns a player card (cat + name) for the profile screen. Used for 1- and 2-player layout.
  function makeProfileCard(key) {
    var d = store.get();
    var b = h('button', 'pcard pc-' + key, catFor(key, {}));
    var nm = h('div', 'pname');
    nm.textContent = d.profiles[key].name || (key === 'speler1' ? 'Speler 1' : 'Speler 2');
    b.appendChild(nm);
    b.addEventListener('click', function () { pickProfile(key); });
    return b;
  }

  function buildProfile() {
    var s = scr.profile;
    s.textContent = '';
    state.profile = null;
    renderDecor();

    var d = store.get();
    var players = store.getPlayers();

    // First visit: no fur chosen yet for speler1 → welcome screen then color picker
    if (!d.profiles.speler1.fur) {
      var ws = h('div', 'pwrap');
      var wc = h('div', 'pcard');
      wc.innerHTML = LC.catSVG(LC.AVATAR_ORDER[0], {});
      wc.querySelector('.cat').classList.add('still');
      var wb = h('button', 'cp-done');
      wb.textContent = 'Begin! →';
      wb.addEventListener('click', function () {
        audio.unlock();
        audio.voiceWelcome();
        buildPlayerPicker();
      });
      wc.appendChild(wb);
      ws.appendChild(wc);
      s.appendChild(ws);
      return;
    }

    var wrap = h('div', 'pwrap');
    var profileKeys = players === 1 ? ['speler1'] : ['speler1', 'speler2'];
    profileKeys.forEach(function (key) {
      wrap.appendChild(makeProfileCard(key));
    });
    s.appendChild(wrap);
  }

  // Setup, step 1: how many players. Then every player without an animal picks one (free); the others
  // are for sale in the shop. After that come the name and age screens.
  function activePlayers() { return store.getPlayers() === 1 ? ['speler1'] : ['speler1', 'speler2']; }

  function setupNext() {
    var need = activePlayers().filter(function (pk) { return !store.get().profiles[pk].fur; })[0];
    if (need) { buildPetPicker(need); show('profile'); }
    else { buildNameScreen('name'); show('profile'); }
  }

  function buildPlayerPicker() {
    var s = scr.profile;
    s.textContent = '';
    var players = store.getPlayers();
    var playerSec = h('div', 'cp-playersec');
    var playerLbl = h('div', 'cp-seclbl'); playerLbl.textContent = 'Hoeveel spelers?';
    playerSec.appendChild(playerLbl);
    var playerCards = h('div', 'cp-playercards');
    [1, 2].forEach(function (n) {
      var card = h('button', 'cp-playercard' + (n === players ? ' on' : ''));
      var icon = h('div', 'cp-playericon');
      for (var i = 0; i < n; i++) {
        var pk = i === 0 ? 'speler1' : 'speler2';
        icon.innerHTML += LC.catSVG(store.get().profiles[pk].fur || LC.AVATAR_ORDER[i * 5], { head: true, cls: 'still' });
      }
      card.appendChild(icon);
      var lbl = h('div', 'cp-playerlbl'); lbl.textContent = n + (n === 1 ? ' speler' : ' spelers'); card.appendChild(lbl);
      card.addEventListener('click', function () { store.setPlayers(n); buildPlayerPicker(); });
      playerCards.appendChild(card);
    });
    playerSec.appendChild(playerCards);
    s.appendChild(playerSec);
    var done = h('button', 'btn primary cp-done');
    done.textContent = 'Volgende →';
    done.addEventListener('click', setupNext);
    s.appendChild(done);
  }

  function buildPetPicker(profileKey) {
    var s = scr.profile;
    s.textContent = '';
    var sel = store.get().profiles[profileKey].fur || '';
    var sec = h('div', 'cp-colorsec');
    var lbl = h('div', 'cp-seclbl');
    lbl.textContent = store.getPlayers() === 2 ? (profileKey === 'speler1' ? 'Speler 1' : 'Speler 2') + ': kies je vriendje' : 'Kies je vriendje';
    sec.appendChild(lbl);
    var grid = h('div', 'cp-petgrid');
    var done = h('button', 'btn primary cp-done');
    done.textContent = 'Klaar! →';
    done.disabled = !sel;
    LC.AVATAR_ORDER.forEach(function (id) {
      var btn = h('button', 'cp-petopt' + (id === sel ? ' on' : ''), LC.catSVG(id, { head: true, cls: 'still' }));
      var nm = h('span', 'cp-colname'); nm.textContent = LC.CATS[id].name; btn.appendChild(nm);
      btn.addEventListener('click', function () {
        store.chooseFirstPet(profileKey, id);
        audio.pop();
        Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('on'); });
        btn.classList.add('on');
        done.disabled = false;
      });
      grid.appendChild(btn);
    });
    sec.appendChild(grid);
    s.appendChild(sec);
    done.addEventListener('click', setupNext);
    s.appendChild(done);
  }

  // Two screens after the colour picker: first the name, then the age. `quiet` skips the spoken line
  // (used when the age screen redraws after a tap).
  function buildNameScreen(step, quiet) {
    step = step || 'name';
    var s = scr.profile;
    s.textContent = '';

    var players = store.getPlayers();
    var profileKeys = players === 1 ? ['speler1'] : ['speler1', 'speler2'];

    var wrap = h('div', 'ns-wrap');
    var title = h('div', 'ns-title'); title.textContent = step === 'name' ? 'Hoe heet jij?' : 'Hoe oud ben jij?'; wrap.appendChild(title);
    var sub = h('div', 'ns-sub');
    sub.textContent = step === 'name'
      ? 'Kun je je naam nog niet zelf schrijven? Vraag dan papa of mama om hem voor je in te vullen.'
      : 'Ik ben wel benieuwd hoe oud jij bent! Je kunt hier je leeftijd kiezen.';
    wrap.appendChild(sub);
    if (!quiet) { if (step === 'name') audio.voiceName(); else audio.voiceAge(); }

    profileKeys.forEach(function (profileKey) {
      var card = h('div', 'ns-card');

      var catEl = h('div', 'ns-cat', catFor(profileKey, { cls: 'idle' }));
      card.appendChild(catEl);

      var fields = h('div', 'ns-fields');

      if (step === 'name') {
      var nameRow = h('div', 'ns-row');
      var nameLbl = h('label', 'ns-lbl'); nameLbl.textContent = players === 2 ? (profileKey === 'speler1' ? 'Naam speler 1' : 'Naam speler 2') : 'Jouw naam';
      var nameInp = h('input');
      nameInp.type = 'text'; nameInp.maxLength = 20; nameInp.autocomplete = 'off';
      nameInp.placeholder = players === 2 ? (profileKey === 'speler1' ? 'Speler 1' : 'Speler 2') : 'Naam...';
      nameInp.value = store.get().profiles[profileKey].name;
      nameInp.addEventListener('input', function () { store.get().profiles[profileKey].name = nameInp.value.slice(0, 20); store.save(); });
      nameRow.appendChild(nameLbl); nameRow.appendChild(nameInp);
      fields.appendChild(nameRow);
      } else {
      var ageRow = h('div', 'ns-row');
      var ageLbl = h('label', 'ns-lbl'); ageLbl.textContent = 'Leeftijd';
      ageRow.appendChild(ageLbl);
      var agePicker = h('div', 'ns-agepicker');
      var curAge = store.getAge(profileKey);
      [3, 4, 5, 6, 7, 8].forEach(function (age) {
        var ab = h('button', 'ns-agebtn' + (curAge === age ? ' on' : '')); ab.textContent = age;
        ab.addEventListener('click', function () { store.setAge(profileKey, age); store.setAgeDefaults(profileKey, age); buildNameScreen('age', true); });
        agePicker.appendChild(ab);
      });
      ageRow.appendChild(agePicker);
      fields.appendChild(ageRow);
      }

      card.appendChild(fields);
      wrap.appendChild(card);
    });

    s.appendChild(wrap);

    var done = h('button', 'btn primary cp-done');
    done.textContent = step === 'name' ? 'Volgende →' : 'Spelen! →';
    done.addEventListener('click', function () {
      if (step === 'name') { audio.stopVoice(); buildNameScreen('age'); show('profile'); }
      else { audio.stopVoice(); buildProfile(); show('profile'); }
    });
    s.appendChild(done);
  }

  function pickProfile(key) {
    turnResume(key);
    audio.unlock();
    audio.preload();
    audio.setMusic(store.get().settings.music);
    state.profile = key;
    renderDecor();
    buildTrace();
    buildFind();
    buildPop();
    buildCount();
    buildMath();
    buildGames();
    show('games');
  }

  // ---------- Which game? ----------
  function buildGames() {
    var s = scr.games, key = state.profile;
    s.textContent = '';
    var players = store.getPlayers();
    // Only show the switch button in 2-player mode
    if (players === 2) {
      var sw = h('button', 'switch', catFor(other(key), { head: true }));
      sw.addEventListener('click', function () { buildProfile(); show('profile'); });
      s.appendChild(sw);
    }

    var mc = h('div', 'games-cat', catFor(key, {}));
    var playerName = store.get().profiles[key].name || (key === 'speler1' ? 'Speler 1' : 'Speler 2');
    var nm = h('div', 'pname'); nm.textContent = playerName; mc.appendChild(nm);
    s.appendChild(mc);

    var pill = h('div', 'starpill');
    pill.textContent = '★ ' + store.stars(key);
    var shopBtn = h('button', 'topbtn shopbtn', LC.giftSVG());
    shopBtn.addEventListener('click', function () { buildShop(); show('shop'); });
    var houseBtn = h('button', 'topbtn housebtn', LC.homeSVG());
    houseBtn.addEventListener('click', function () { openHouse(); });
    var tk = store.tickets(key);
    var carBtn = h('button', 'topbtn carbtn' + (tk > 0 ? ' ready' : ''), LC.carIconSVG());
    var tb = h('span', 'tbadge'); tb.textContent = String(tk); carBtn.appendChild(tb);
    var stamped = store.stamps(key), dots = h('span', 'stampdots');
    for (var sd = 0; sd < 3; sd++) dots.appendChild(h('i', sd < stamped.length ? 'on' : '', LC.pawSVG()));
    s.appendChild(dots);
    carBtn.addEventListener('click', function () {
      if (store.tickets(key) > 0) { startRide(); return; }
      carBtn.classList.add('nope'); audio.boop(); audio.voiceTTS('stempels-nodig');
      setTimeout(function () { carBtn.classList.remove('nope'); }, 600);
    });
    s.appendChild(pill); s.appendChild(carBtn); s.appendChild(houseBtn); s.appendChild(shopBtn);

    var row = h('div', 'gcards');
    [['trace', 'Schrijven'], ['find', 'Zoeken'], ['pop', 'Prikken'], ['count', 'Tellen'], ['math', 'Rekenen']].forEach(function (g, i) {
      var c = h('button', 'gcard gc-' + g[0], LC.gameCardSVG(g[0], !capsOn()));
      c.dataset.game = g[0];
      var t = h('div', 'gtitle'); t.textContent = g[1]; c.appendChild(t);
      if (stamped.indexOf(g[0]) >= 0) {
        c.appendChild(h('span', 'gstamp' + (state.freshStamp === g[0] ? ' fresh' : ''), LC.pawSVG()));
      }
      c.style.animationDelay = (-i * 0.9) + 's';
      c.addEventListener('click', function () {
        if (g[0] === 'count') { buildCount(); startCount(); return; }
        if (g[0] === 'math') { buildMath(); startMath(); return; }
        state.game = g[0]; state.firstBatchDone = false; buildMenu(); show('menu');
      });
      row.appendChild(c);
    });
    state.freshStamp = null;
    s.appendChild(row);
  }

  // ---------- Star shop ----------
  var shopTab = 'avatar';

  function buildShop() {
    var s = scr.shop, key = state.profile, st = store.get().profiles[key];
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { buildGames(); show('games'); audio.voiceChoose(); });
    var pill = h('div', 'starpill big');
    pill.textContent = '★ ' + st.stars;
    var cat = h('div', 'shop-cat', catFor(key, {}));
    var fx = h('div', 'balloons');

    var tabs = h('div', 'shoptabs');
    [['avatar', catFor(key, { head: true, cls: 'still' })], ['car', LC.carIconSVG()], ['room', LC.homeSVG()], ['dieren', '🐾']].forEach(function (t) {
      var b = h('button', 'shoptab' + (t[0] === shopTab ? ' on' : ''), t[1]);
      b.addEventListener('click', function () { shopTab = t[0]; buildShop(); });
      tabs.appendChild(b);
    });

    var grid = h('div', 'shopgrid ' + shopTab);
    LC.SHOP[shopTab].forEach(function (it) {
      var owned = store.owns(key, it.id);
      var curFur = store.getFur(key);
      var equipped = it.slot === 'fur' ? curFur === it.fur : (!!it.slot && st.avatar[it.slot] === it.id);
      var preview;
      if (shopTab === 'dieren') {
        preview = LC.catSVG(it.fur, { head: true, cls: 'still' });
      } else if (shopTab === 'avatar') {
        preview = LC.accessoryPreview(key, it.id);
      } else if (shopTab === 'car') {
        preview = LC.carPreview(it.id, key, st.avatar);
      } else {
        preview = LC.decorPreview(it.id);
      }
      var card = h('button', 'scard' + (owned ? ' owned' : '') + (equipped ? ' on' : ''), preview);
      var chip = h('div', 'chip' + (owned ? ' got' : ''));
      chip.textContent = owned ? (it.slot ? (equipped ? 'Aan' : 'Uit') : '✓') : '★ ' + it.cost;
      card.appendChild(chip);
      card.addEventListener('click', function () { shopItemTap(it, card, fx); });
      grid.appendChild(card);
    });

    s.appendChild(home); s.appendChild(pill); s.appendChild(cat); s.appendChild(tabs); s.appendChild(grid); s.appendChild(fx);
  }

  function shopItemTap(it, card, fx) {
    var key = state.profile;
    if (store.owns(key, it.id)) {
      if (it.slot === 'fur') {
        store.setFur(key, it.fur);
        audio.pop();
        buildShop();
      } else if (it.slot) {
        var cur = store.get().profiles[key].avatar[it.slot];
        store.equip(key, it.slot, cur === it.id ? '' : it.id);
        audio.pop();
        buildShop();
      } else {
        card.classList.add('bounce');
        audio.chime();
        setTimeout(function () { openHouse(); }, 250);
      }
      return;
    }
    if (store.buy(key, it.id)) {
      audio.chime();
      if (it.slot === 'fur') { store.setFur(key, it.fur); buildShop(); burst(scr.shop.querySelector('.balloons')); return; }
      if (!it.slot) { openHouse(it.id); return; }
      buildShop();
      burst(scr.shop.querySelector('.balloons'));
      return;
    }
    // Not enough stars yet: the price just wobbles, nothing "wrong" is shown.
    card.classList.add('nope');
    audio.boop();
    setTimeout(function () { card.classList.remove('nope'); }, 600);
  }

  // ---------- The doll house ----------
  function openHouse(newId) {
    var s = scr.house, key = state.profile;
    s.textContent = '';
    renderDecor(newId);
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { buildGames(); show('games'); audio.voiceChoose(); });
    var cat = h('div', 'house-cat', catFor(key, { cls: newId ? 'happy' : 'idle' }));
    var fx = h('div', 'balloons');
    cat.addEventListener('click', function () {
      var c = cat.querySelector('.cat');
      c.classList.remove('idle', 'zwaait'); void c.getBoundingClientRect(); c.classList.add('happy');
      audio.chime();
      setTimeout(function () { c.classList.remove('happy'); c.classList.add('idle'); }, 1800);
    });
    s.appendChild(home); s.appendChild(cat); s.appendChild(fx);
    show('house');
    if (newId) { burst(fx); audio.chime(); }
  }

  // ---------- Letter and number choice ----------
  function buildMenu() {
    if (!state.firstBatchDone) { buildStartScreen(); } else { buildKernChoice(); }
  }

  function menuSky(s, key) {
    var sky = h('div', 'sky');
    var n = Math.min(10, store.total(key));
    for (var i = 0; i < n; i++) {
      var b = h('div', 'floaty', LC.balloonSVG(LC.BALLOON_COLORS[i % LC.BALLOON_COLORS.length]));
      b.style.left = (14 + i * 8 + (i % 2) * 2) + '%';
      b.style.animationDelay = (-i * 0.6) + 's';
      sky.appendChild(b);
    }
    s.appendChild(sky);
  }

  function buildStartScreen() {
    var s = scr.menu, key = state.profile;
    s.textContent = '';
    buildTrace(); buildFind(); buildPop(); buildCount(); buildMath();
    menuSky(s, key);
    var back = h('button', 'home', LC.homeSVG());
    back.addEventListener('click', function () { buildGames(); show('games'); audio.voiceChoose(); });
    s.appendChild(back);
    var mc = h('div', 'menu-cat', catFor(key, {}));
    var nm = h('div', 'pname');
    nm.textContent = store.get().profiles[key].name || (key === 'speler1' ? 'Speler 1' : 'Speler 2');
    mc.appendChild(nm); s.appendChild(mc);
    var pool = state.game === 'trace' ? availablePool() : gamePool();
    if (state.game === 'trace') {
      var play = h('button', 'playbig', LC.playSVG());
      play.addEventListener('click', function () { startTraceBatch(pool); });
      s.appendChild(play);
      var playLbl = h('div', 'playbig-lbl'); playLbl.textContent = 'Spelen!';
      s.appendChild(playLbl);
    } else {
      var play2 = h('button', 'playbig', LC.playSVG());
      play2.addEventListener('click', function () {
        state.firstBatchDone = true;
        (state.game === 'pop' ? startPop : startFind)(pool);
      });
      s.appendChild(play2);
    }
  }

  var KERN_COLORS = ['#ff9f43', '#ff6b6b', '#48dbfb', '#1dd1a1', '#5f27cd', '#f368e0', '#feca57', '#54a0ff'];

  function buildKernChoice() {
    var s = scr.menu, key = state.profile;
    s.textContent = '';
    buildTrace(); buildFind(); buildPop(); buildCount(); buildMath();
    menuSky(s, key);
    var back = h('button', 'home', LC.homeSVG());
    back.addEventListener('click', function () { buildGames(); show('games'); audio.voiceChoose(); });
    s.appendChild(back);
    var badge = h('div', 'modebadge', state.game === 'find' ? LC.searchSVG() : state.game === 'pop' ? LC.balloonIconSVG() : LC.pencilSVG());
    s.appendChild(badge);
    var mc = h('div', 'menu-cat', catFor(key, {}));
    var nm = h('div', 'pname');
    nm.textContent = store.get().profiles[key].name || (key === 'speler1' ? 'Speler 1' : 'Speler 2');
    mc.appendChild(nm); s.appendChild(mc);

    if (state.game !== 'trace') {
      var play = h('button', 'playbig', LC.playSVG());
      play.addEventListener('click', function () { (state.game === 'pop' ? startPop : startFind)(gamePool()); });
      s.appendChild(play);
      return;
    }

    if (state.openKern) {
      buildLetterPicker(s, key);
    } else {
      var grid = h('div', 'kern-pick-wrap');
      allKerns().forEach(function (kern, i) {
        var isDig = kern.id === DIGIT_KERN.id;
        var purchased = isDig || LC.kernPurchased(kern.id);
        var reachable = isDig || LC.kernReachable(key, kern.id);
        var tile = h('div', 'kern-big-tile' + (reachable ? ' open' : purchased ? ' notyet' : ' locked'));
        tile.style.background = KERN_COLORS[i % KERN_COLORS.length];
        var lbl = h('div', 'kern-big-lbl'); lbl.textContent = kern.label; tile.appendChild(lbl);
        var letters = h('div', 'kern-big-letters');
        kern.letters.slice(0, 4).forEach(function (lk) {
          var sp = h('span', 'kern-big-letter'); sp.innerHTML = LC.glyphSVG(lk, { sw: 14, color: '#4a3f63' }); letters.appendChild(sp);
        });
        tile.appendChild(letters);
        if (!purchased) { var lck = h('span', 'kern-big-lock'); lck.innerHTML = LC.lockSVG(); tile.appendChild(lck); }
        tile.addEventListener('click', function () {
          if (!purchased) { audio.voiceTTS(reachable ? 'kern-notyet' : 'kern-locked'); return; }
          state.kern = kern.id;
          state.openKern = kern.id;
          buildKernChoice();
          audio.voicePickLetter();
        });
        grid.appendChild(tile);
      });
      s.appendChild(grid);
    }
  }

  function buildLetterPicker(s, key) {
    var kern = allKerns().find(function (k) { return k.id === state.openKern; });
    if (!kern) { state.openKern = null; buildKernChoice(); return; }
    var topRow = h('div', 'letter-pick-top');
    var backBtn = h('button', 'btn-back-kern'); backBtn.textContent = '← ' + kern.label;
    backBtn.addEventListener('click', function () { state.openKern = null; buildKernChoice(); });
    topRow.appendChild(backBtn);
    s.appendChild(topRow);
    var wrap = h('div', 'letter-pick-wrap');
    kern.letters.forEach(function (lk, idx) {
      var tile = h('div', 'letter-pick-tile');
      tile.innerHTML = LC.glyphSVG(lk, { sw: 28, color: '#4a3f63' });
      tile.addEventListener('click', function () {
        state.kern = state.openKern;
        openTrace(idx, false);
      });
      wrap.appendChild(tile);
    });
    s.appendChild(wrap);
  }

  // ---------- Tracing screen ----------
  function buildTrace() {
    var s = scr.trace;
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () {
      leaveTrace(); buildMenu(); show('menu'); audio.voiceChoose();
    });
    var cat = h('div', 'trace-cat', catFor(state.profile, {}));
    cat.addEventListener('click', showHow);
    var card = h('div', 'board-card');
    var nav = h('div', 'nav');
    var prev = h('button', 'navbtn prev', LC.arrowSVG(-1));
    var curg = h('div', 'navcur');
    var next = h('button', 'navbtn next', LC.arrowSVG(1));
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    nav.appendChild(prev); nav.appendChild(curg); nav.appendChild(next);
    var balloons = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(card); s.appendChild(nav); s.appendChild(balloons);
    T = { cat: cat.querySelector('.cat'), card: card, balloons: balloons, cur: curg };
  }

  function step(d) {
    if (state.traceBatch && !state.firstBatchDone) {
      var n = state.traceBatch.pool.length;
      openTrace((state.pos + d + n) % n, true);
    } else {
      var list = listFor(), n2 = list.length || 1;
      openTrace((state.pos + d + n2) % n2, false);
    }
  }

  function renderCurrent() {
    T.cur.className = 'navcur';
    T.cur.innerHTML = LC.glyphSVG(state.glyph, { sw: 15 });
  }

  function setMood(m) {
    var c = current === 'find' ? F.cat : current === 'pop' ? G.cat : current === 'count' ? C.cat : current === 'math' ? M.cat : T.cat;
    if (!c) return;
    clearTimeout(moodTimer);
    c.classList.remove('idle', 'happy', 'oops', 'help');
    if (m === 'happy') c.classList.remove('zwaait');
    void c.getBoundingClientRect();
    c.classList.add(m);
    if (m === 'oops') moodTimer = setTimeout(function () { setMood('idle'); }, 1300);
  }

  audio.onTalkingChange = function (on) {
    var c = current === 'find' ? F.cat : current === 'pop' ? G.cat : current === 'count' ? C.cat : current === 'math' ? M.cat : T.cat;
    if (c) c.classList.toggle('talking', on);
  };

  function leaveTrace() {
    clearTimeout(advanceTimer); token++;
    audio.stopVoice();
    if (tracer) { tracer.destroy(); tracer = null; }
  }

  function openTrace(posOrIdx, batchMode) {
    clearTimeout(advanceTimer); token++;
    var mine = token;
    var list, key;
    if (batchMode && state.traceBatch) {
      list = state.traceBatch.pool;
      state.pos = Math.max(0, Math.min(posOrIdx || 0, list.length - 1));
      key = list[state.pos];
    } else {
      list = listFor();
      if (!list.length) { list = LC.KERNS[0].letters.slice(); }
      state.pos = Math.max(0, Math.min(posOrIdx || 0, list.length - 1));
      key = list[state.pos];
      batchMode = false;
    }
    state.glyph = key;

    // Digraph: trace first component first
    var g = LC.GLYPHS[key];
    if (g && g.parts) {
      state.digraphKey = key; state.digraphPart = 0;
    } else {
      state.digraphKey = null; state.digraphPart = 0;
    }
    var effectiveKey = (g && g.parts) ? g.parts[0] : key;

    if (tracer) { tracer.destroy(); tracer = null; }
    show('trace');
    renderCurrent();
    setMood('idle');

    // For digraphs: split the board card into two side-by-side halves so both letters are visible
    T.card.innerHTML = '';
    var tracerHost;
    if (g && g.parts) {
      T.card.className = 'board-card board-card--digraph';
      var leftHalf = h('div', 'digraph-half digraph-active');
      var rightHalf = h('div', 'digraph-half digraph-waiting');
      var prevSvg = LC.glyphSVG(g.parts[1], { sw: 10 });
      rightHalf.innerHTML = prevSvg.replace('<svg class="glyph"', '<svg class="glyph digraph-preview"');
      T.card.appendChild(leftHalf);
      T.card.appendChild(rightHalf);
      T.digraphLeft = leftHalf;
      T.digraphRight = rightHalf;
      tracerHost = leftHalf;
    } else {
      T.card.className = 'board-card';
      T.digraphLeft = null; T.digraphRight = null;
      tracerHost = T.card;
    }

    var level = store.getTraceLevel(state.profile, effectiveKey);
    tracer = new LC.Tracer(tracerHost, effectiveKey, store.getStrict(state.profile), {
      pawColor: LC.petColor(store.getFur(state.profile)),
      level: level,
      onSuccess: function () { success(key, mine, batchMode); },
      onTry: function () { store.record(state.profile, effectiveKey, 'tryfail'); store.traceResult(state.profile, effectiveKey, false); setMood('oops'); audio.boop(); audio.voiceRetry(); },
      onHelp: function () { setMood('help'); audio.voiceDemoIntro(); },
      onHelpDone: function () { setMood('idle'); },
      onLevel4Done: function () { level4Done(key, mine, batchMode); }
    });
    if (level <= 2) {
      setTimeout(function () {
        if (mine !== token) return;
        audio.speakPhonetic(key.toLowerCase()).then(function () {
          if (mine !== token) return;
          setTimeout(function () {
            if (mine !== token) return;
            audio.voiceDemoIntro().then(function () {
              if (mine !== token) return;
              showHow();
            });
          }, 200);
        });
      }, 350);
    } else {
      setTimeout(function () { if (mine === token) audio.speakPhonetic(key.toLowerCase()); }, 350);
    }
  }

  function showHow() {
    if (!tracer) return;
    setMood('help');
    tracer.demo({ passes: 1 });
  }

  function success(key, mine, batchMode) {
    var g = LC.GLYPHS[key];
    var justTracedKey = (state.digraphKey === key) ? g.parts[state.digraphPart] : key;

    setMood('happy');
    audio.chime();
    setTimeout(function () { if (mine === token) audio.voicePraise(); }, 500);
    store.addDone(state.profile, key);
    store.traceResult(state.profile, justTracedKey, true);
    burst();
    gain(1, T.balloons);

    // Digraph part 0 done: now trace part 1
    if (state.digraphKey === key && state.digraphPart === 0 && g && g.parts) {
      state.digraphPart = 1;
      var part1Key = g.parts[1];
      var level1 = store.getTraceLevel(state.profile, part1Key);
      advanceTimer = setTimeout(function () {
        if (mine !== token) return;
        if (tracer) { tracer.destroy(); tracer = null; }
        // Swap halves: left shows done part 0, right becomes active tracer host
        if (T.digraphLeft && T.digraphRight) {
          T.digraphLeft.className = 'digraph-half digraph-done';
          T.digraphLeft.innerHTML = LC.glyphSVG(g.parts[0], { sw: 10 }).replace('<svg class="glyph"', '<svg class="digraph-preview"');
          T.digraphRight.innerHTML = '';
          T.digraphRight.className = 'digraph-half digraph-active';
          tracer = new LC.Tracer(T.digraphRight, part1Key, store.getStrict(state.profile), {
            pawColor: LC.petColor(store.getFur(state.profile)),
            level: level1,
            onSuccess: function () { success(key, mine, batchMode); },
            onTry: function () { store.record(state.profile, part1Key, 'tryfail'); store.traceResult(state.profile, part1Key, false); setMood('oops'); audio.boop(); audio.voiceRetry(); },
            onHelp: function () { setMood('help'); audio.voiceDemoIntro(); },
            onHelpDone: function () { setMood('idle'); },
            onLevel4Done: function () { level4Done(key, mine, batchMode); }
          });
        } else {
          tracer = new LC.Tracer(T.card, part1Key, store.getStrict(state.profile), {
            pawColor: LC.petColor(store.getFur(state.profile)),
            level: level1,
            onSuccess: function () { success(key, mine, batchMode); },
            onTry: function () { store.record(state.profile, part1Key, 'tryfail'); store.traceResult(state.profile, part1Key, false); setMood('oops'); audio.boop(); audio.voiceRetry(); },
            onHelp: function () { setMood('help'); audio.voiceDemoIntro(); },
            onHelpDone: function () { setMood('idle'); },
            onLevel4Done: function () { level4Done(key, mine, batchMode); }
          });
        }
      }, 1200);
      return;
    }

    if (state.digraphKey === key && state.digraphPart === 1) {
      state.digraphKey = null; state.digraphPart = 0;
    }
    advanceAfterTrace(key, mine, batchMode);
  }

  function level4Done(key, mine, batchMode) {
    var g = LC.GLYPHS[key];
    var justTracedKey = (state.digraphKey === key) ? g.parts[state.digraphPart] : key;
    store.traceResult(state.profile, justTracedKey, true);
    if (state.digraphKey === key && state.digraphPart === 0 && g && g.parts) {
      store.traceResult(state.profile, g.parts[1], true);
    }
    state.digraphKey = null; state.digraphPart = 0;
    setMood('happy');
    audio.chime();
    store.addDone(state.profile, key);
    burst();
    gain(1, T.balloons);
    advanceAfterTrace(key, mine, batchMode);
  }

  function advanceAfterTrace(key, mine, batchMode) {
    if (batchMode && state.traceBatch) {
      var batch = state.traceBatch;
      batch.idx = (batch.idx || 0) + 1;
      if (batch.idx >= batch.pool.length) {
        state.firstBatchDone = true;
        setTimeout(function () { if (mine === token) { gain(2, T.balloons); earnStamp('trace', T.balloons); } }, 1200);
        setTimeout(function () { if (mine === token) { burst(); audio.chime(); } }, 1200);
        setTimeout(function () { if (mine === token) { burst(); audio.chime(); } }, 2400);
        advanceTimer = setTimeout(function () {
          if (mine !== token) return;
          afterStamp(function () { if (mine !== token) return; leaveTrace(); buildMenu(); show('menu'); });
        }, 6000);
        return;
      }
      advanceTimer = setTimeout(function () {
        if (mine !== token) return;
        openTrace(batch.idx, true);
      }, 3800);
      return;
    }
    // Free trace: advance within kern, occasionally practice weak letters
    var list = listFor();
    var nextPos = list.length ? (state.pos + 1) % list.length : 0;
    if (store.get().settings.adaptive && Math.random() < 0.34) {
      var hard = list.filter(function (k) { return k !== key && mastery(state.profile, k) === 'practice'; });
      if (hard.length) nextPos = list.indexOf(pickTarget(hard, key));
    }
    advanceTimer = setTimeout(function () {
      if (mine !== token) return;
      openTrace(nextPos, false);
    }, 3800);
  }

  LC.testTraceSuccess = function () { if (tracer) success(state.glyph, token, !!state.traceBatch); };

  var BATCH_SIZE = 7;

  function startTraceBatch(pool) {
    var batch = pool.slice();
    if (batch.length > BATCH_SIZE) batch = shuffle(batch).slice(0, BATCH_SIZE);
    state.traceBatch = { pool: batch, idx: 0 };
    state.firstBatchDone = false;
    state.openKern = null;
    openTrace(0, true);
  }

  function burst(container) {
    container = container || T.balloons;
    for (var i = 0; i < 7; i++) {
      var b = h('div', 'balloon', LC.balloonSVG(LC.BALLOON_COLORS[i % LC.BALLOON_COLORS.length]));
      b.style.left = (6 + Math.random() * 84) + '%';
      b.style.setProperty('--dx', (Math.random() * 16 - 8) + 'vw');
      b.style.animationDelay = (i * 0.16) + 's';
      b.style.animationDuration = (3.6 + Math.random() * 1.2) + 's';
      container.appendChild(b);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6500); })(b);
    }
  }

  // ---------- Find the letter ----------
  var ROUNDS = 6;
  var LOOKALIKES = [['b', 'd', 'p', 'q'], ['m', 'n', 'u', 'w'], ['M', 'N', 'W'], ['E', 'F'], ['O', 'Q', 'C', 'G'], ['P', 'R', 'B'], ['6', '9'], ['2', '5']];

  function lookalike(a, b) {
    return LOOKALIKES.some(function (g) { return g.indexOf(a) >= 0 && g.indexOf(b) >= 0; });
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildFind() {
    var s = scr.find;
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { leaveFind(); buildMenu(); show('menu'); audio.voiceChoose(); });
    var cat = h('div', 'trace-cat', catFor(state.profile, {}));
    var bubble = h('div', 'bubble');
    cat.appendChild(bubble);
    cat.addEventListener('click', function () { sayTarget(); });
    var dots = h('div', 'dots');
    var choices = h('div', 'choices');
    var balloons = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(dots); s.appendChild(choices); s.appendChild(balloons);
    F = { cat: cat.querySelector('.cat'), bubble: bubble, dots: dots, choices: choices, balloons: balloons,
      gen: 0, timer: 0, n: 0, pool: [], target: null, wrong: 0, locked: true, kind: 'upper' };
  }

  function leaveFind() {
    clearTimeout(F.timer); F.gen++;
    audio.stopVoice();
  }

  function startFind(pool) {
    var wasBatch = !state.firstBatchDone;
    if (!pool || !pool.length) pool = gamePool();
    if (!pool.length) pool = LC.KERNS[0].letters.slice();
    F.kind = 'kern'; F.pool = pool; F.n = 0; F.target = null; F.first = 0; F.used = {}; F._wasBatch = wasBatch;
    show('find');
    nextRound();
  }

  function speakTarget(ctx) {
    if (!ctx.target) return;
    (LC.categoryOf(ctx.target) === 'digit' ? audio.voiceLetter(LC.GLYPHS[ctx.target].sound) : audio.speakPhonetic(LC.GLYPHS[ctx.target].sound)).then(function () {
      ctx.bubble.innerHTML = '';
      ctx.bubble.classList.remove('on');
    });
  }
  function sayTarget() { speakTarget(F); }

  function nextRound() {
    clearTimeout(F.timer);
    F.gen++;
    var gen = F.gen;
    if (F.n >= ROUNDS) { findFinale(gen); return; }
    F.n++; F.wrong = 0; F.locked = false;

    var target = pickTarget(F.pool, F.target, F.used);
    F.used[target] = 1;
    var others = shuffle(F.pool.filter(function (k) { return k !== target && !lookalike(k, target) && sameKind(k, target); }));
    if (others.length < 2) others = shuffle(F.pool.filter(function (k) { return k !== target && !lookalike(k, target); }));
    if (others.length < 2) others = shuffle(F.pool.filter(function (k) { return k !== target; }));
    var options = shuffle([target].concat(others.slice(0, 2)));
    F.target = target;

    F.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) F.dots.appendChild(h('span', 'dot' + (i < F.n - 1 ? ' on' : i === F.n - 1 ? ' cur' : '')));
    F.choices.innerHTML = '';
    options.forEach(function (k) {
      var b = h('button', 'choice', LC.glyphSVG(k, { sw: 14 }));
      b.dataset.key = k;
      b.addEventListener('click', function () { choose(b, k, gen); });
      F.choices.appendChild(b);
    });
    F.bubble.classList.remove('on');
    setMood('idle');
    F.timer = setTimeout(function () { if (gen === F.gen) sayTarget(); }, 500);
  }

  function choose(btn, key, gen) {
    if (gen !== F.gen || F.locked) return;
    if (key === F.target) {
      F.locked = true;
      store.record(state.profile, F.target, F.wrong === 0 ? 'first' : 'ask');
      store.recordFirst(state.profile, F.target, F.wrong === 0);
      if (F.wrong === 0) F.first = (F.first || 0) + 1;
      btn.classList.add('right');
      Array.prototype.forEach.call(F.choices.children, function (c) { if (c !== btn) c.classList.add('fade'); });
      setMood('happy');
      audio.chime();
      F.bubble.classList.remove('on');
      setTimeout(function () { if (gen === F.gen) audio.voicePraise(); }, 500);
      burst(F.balloons);
      gain(1, F.balloons);
      F.timer = setTimeout(nextRound, 3200);
      return;
    }
    F.wrong++;
    store.record(state.profile, F.target, 'miss');
    btn.classList.add('fade');
    btn.disabled = true;
    setMood('oops');
    audio.boop();
    audio.voiceRetry();
    if (F.wrong >= 2) {
      var right = F.choices.querySelector('[data-key="' + F.target + '"]');
      if (right) right.classList.add('hint');
    }
    F.timer = setTimeout(function () { if (gen === F.gen) sayTarget(); }, 1800);
  }

  function findFinale(gen) {
    F.locked = true;
    F.choices.innerHTML = '';
    F.bubble.classList.remove('on');
    F.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) F.dots.appendChild(h('span', 'dot on'));
    setMood('happy');
    audio.chime(); burst(F.balloons);
    setTimeout(function () { if (gen === F.gen) { audio.chime(); burst(F.balloons); gain(2, F.balloons); if (F.first >= 4) earnStamp('find', F.balloons); if (F._wasBatch) state.firstBatchDone = true; } }, 1200);
    F.timer = setTimeout(function () {
      if (gen !== F.gen) return;
      afterStamp(function () { if (gen !== F.gen) return; leaveFind(); buildMenu(); show('menu'); });
    }, 5000);
  }

  // ---------- Pop the balloon ----------
  var G = {};

  function buildPop() {
    var s = scr.pop;
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { leavePop(); buildMenu(); show('menu'); audio.voiceChoose(); });
    var cat = h('div', 'trace-cat', catFor(state.profile, {}));
    var bubble = h('div', 'bubble');
    cat.appendChild(bubble);
    cat.addEventListener('click', function () { speakTarget(G); });
    var dots = h('div', 'dots');
    var sky = h('div', 'popsky');
    var fx = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(dots); s.appendChild(sky); s.appendChild(fx);
    G = { cat: cat.querySelector('.cat'), bubble: bubble, dots: dots, sky: sky, fx: fx,
      gen: 0, run: 0, timer: 0, hintT: 0, coolT: 0, spawnT: 0, n: 0, pool: [], target: null, wrong: 0,
      locked: true, cool: false, firstTry: 0, targetDue: 0, kind: 'upper' };
  }

  function leavePop() {
    clearTimeout(G.spawnT); clearTimeout(G.timer); clearTimeout(G.hintT); clearTimeout(G.coolT);
    G.gen++; G.run++; G.cool = false;
    if (G.sky) { G.sky.innerHTML = ''; G.sky.classList.remove('cool'); }
    audio.stopVoice();
  }

  function startPop(pool) {
    var wasBatch = !state.firstBatchDone;
    if (!pool || !pool.length) pool = gamePool();
    if (!pool.length) pool = LC.KERNS[0].letters.slice();
    leavePop();
    G.kind = 'kern'; G.pool = pool; G.n = 0; G.target = null; G.firstTry = 0; G.used = {}; G._wasBatch = wasBatch;
    show('pop');
    spawnLoop(G.run);
    nextPopRound();
  }

  // Balloons come at uneven moments, not on a fixed beat.
  function spawnLoop(run) {
    G.spawnT = setTimeout(function () {
      if (run !== G.run) return;
      spawnTick();
      spawnLoop(run);
    }, 800 + Math.random() * 1100);
  }

  function distractor() {
    var t = G.target;
    var opts = G.pool.filter(function (k) { return k !== t && !lookalike(k, t) && sameKind(k, t); });
    if (opts.length < 2) opts = G.pool.filter(function (k) { return k !== t && !lookalike(k, t); });
    if (!opts.length) opts = G.pool.filter(function (k) { return k !== t; });
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function targetCount() { return G.sky.querySelectorAll('[data-key="' + G.target + '"]').length; }

  function spawnTick() {
    if (!G.target) return;
    // The wanted letter only shows up once its (random) moment has come, even if the sky is busy.
    var due = !G.locked && targetCount() === 0 && Date.now() >= G.targetDue;
    if (!due && G.sky.children.length >= 5) return;
    spawnBalloon(due ? G.target : distractor());
  }

  function spawnBalloon(key) {
    var color = LC.BALLOON_COLORS[Math.floor(Math.random() * LC.BALLOON_COLORS.length)];
    var b = h('button', 'pballoon', LC.balloonLetterSVG(color, key));
    b.dataset.key = key;
    b.style.left = (30 + Math.random() * 58) + 'vw';
    b.style.animationDuration = (8 + Math.random() * 5) + 's';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); popTap(b, key); });
    b.addEventListener('animationend', function (e) {
      if (e.animationName !== 'floatup') return;
      if (b.parentNode) b.parentNode.removeChild(b);
      if (key === G.target && !G.locked && targetCount() === 0) G.targetDue = Date.now() + 1000 + Math.random() * 2000;
    });
    G.sky.appendChild(b);
    return b;
  }

  // Letters of balloons that are floating in the middle of the screen right now.
  function visibleKeys() {
    var keys = [], h0 = window.innerHeight;
    Array.prototype.forEach.call(G.sky.children, function (b) {
      var top = b.getBoundingClientRect().top;
      if (top > h0 * 0.25 && top < h0 * 0.75 && keys.indexOf(b.dataset.key) < 0) keys.push(b.dataset.key);
    });
    return keys;
  }

  function nextPopRound() {
    clearTimeout(G.timer); clearTimeout(G.hintT); clearTimeout(G.coolT);
    G.gen++; G.cool = false;
    G.sky.classList.remove('cool');
    var gen = G.gen;
    if (G.n >= ROUNDS) { popFinale(gen); return; }
    G.n++; G.wrong = 0;

    // Often the wanted letter is already floating by, otherwise it comes later at a random moment.
    var floating = visibleKeys().filter(function (k) { return k !== G.target && G.pool.indexOf(k) >= 0; });
    G.target = floating.length && Math.random() < 0.6
      ? pickTarget(floating, G.target, G.used)
      : pickTarget(G.pool, G.target, G.used);
    G.used[G.target] = 1;
    G.targetDue = Date.now() + (targetCount() ? 0 : 2000 + Math.random() * 3500);
    G.locked = false;
    G.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) G.dots.appendChild(h('span', 'dot' + (i < G.n - 1 ? ' on' : i === G.n - 1 ? ' cur' : '')));
    G.bubble.classList.remove('on');
    setMood('idle');
    G.timer = setTimeout(function () { if (gen === G.gen) speakTarget(G); }, 500);
    G.hintT = setTimeout(function () { if (gen === G.gen) hintTarget(gen); }, 11000);
  }

  function hintTarget(gen) {
    Array.prototype.forEach.call(G.sky.querySelectorAll('[data-key="' + G.target + '"]'), function (b) { b.classList.add('hint'); });
    speakTarget(G);
    G.hintT = setTimeout(function () { if (gen === G.gen) hintTarget(gen); }, 11000);
  }

  function sparks(b) {
    var r = b.getBoundingClientRect(), root = G.fx.getBoundingClientRect();
    var cx = r.left + r.width / 2 - root.left, cy = r.top + r.height * 0.32 - root.top;
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2, d = 60 + Math.random() * 50;
      var sp = h('span', 'spark');
      sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
      sp.style.background = LC.BALLOON_COLORS[i % LC.BALLOON_COLORS.length];
      sp.style.setProperty('--dx', Math.cos(a) * d + 'px');
      sp.style.setProperty('--dy', Math.sin(a) * d + 'px');
      G.fx.appendChild(sp);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700); })(sp);
    }
  }

  function popTap(b, key) {
    var gen = G.gen;
    if (G.locked || G.cool) return;
    if (key !== G.target) { wrongTap(b, gen); return; }
    store.record(state.profile, G.target, G.wrong === 0 ? 'first' : 'ask');
    store.recordFirst(state.profile, G.target, G.wrong === 0);
    G.locked = true;
    clearTimeout(G.hintT);
    sparks(b);
    if (b.parentNode) b.parentNode.removeChild(b);
    audio.pop();
    setMood('happy');
    G.bubble.classList.remove('on');
    setTimeout(function () { audio.chime(); }, 150);
    setTimeout(function () { if (gen === G.gen) audio.voicePraise(); }, 600);
    if (G.wrong === 0) { G.firstTry++; gain(1, G.fx); }
    G.timer = setTimeout(nextPopRound, 2800);
  }

  // Three chances per letter. After a miss everything rests for a moment, so tapping
  // wildly does not help; after the third miss the cat shows the right balloon herself.
  function wrongTap(b, gen) {
    G.wrong++;
    store.record(state.profile, G.target, 'miss');
    b.classList.add('bounce');
    setTimeout(function () { b.classList.remove('bounce'); }, 520);
    audio.boop();
    setMood('oops');
    if (G.wrong >= 3) { revealTarget(gen); return; }
    G.cool = true;
    G.sky.classList.add('cool');
    audio.voiceRetry();
    G.coolT = setTimeout(function () {
      if (gen !== G.gen) return;
      G.cool = false;
      G.sky.classList.remove('cool');
      speakTarget(G);
    }, 2000);
  }

  function revealTarget(gen) {
    store.record(state.profile, G.target, 'ask');
    store.recordFirst(state.profile, G.target, false);
    G.locked = true; G.cool = false;
    clearTimeout(G.hintT);
    G.sky.classList.remove('cool');
    audio.voiceHelp();
    var t = G.sky.querySelector('[data-key="' + G.target + '"]');
    if (!t) { t = spawnBalloon(G.target); t.style.animationDuration = '7s'; }
    t.classList.add('hint');
    setTimeout(function () { if (gen === G.gen) speakTarget(G); }, 1600);
    G.timer = setTimeout(function () {
      if (gen !== G.gen) return;
      var tb = G.sky.querySelector('[data-key="' + G.target + '"]');
      if (tb) { sparks(tb); if (tb.parentNode) tb.parentNode.removeChild(tb); audio.pop(); }
      G.bubble.classList.remove('on');
      setMood('idle');
      G.timer = setTimeout(nextPopRound, 2000);
    }, 3400);
  }

  function popFinale(gen) {
    G.locked = true;
    G.target = null;
    clearTimeout(G.spawnT);
    var bonus = G.firstTry >= 4 ? 2 : 1;
    G.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) G.dots.appendChild(h('span', 'dot on'));
    setMood('happy');
    Array.prototype.forEach.call(G.sky.children, function (b, i) {
      setTimeout(function () { if (gen === G.gen && b.parentNode) { sparks(b); audio.pop(); b.parentNode.removeChild(b); } }, 200 + i * 250);
    });
    setTimeout(function () { if (gen === G.gen) { audio.chime(); burst(G.fx); gain(bonus, G.fx); if (G.firstTry >= 4) earnStamp('pop', G.fx); if (G._wasBatch) state.firstBatchDone = true; } }, 400);
    G.timer = setTimeout(function () {
      if (gen !== G.gen) return;
      afterStamp(function () { if (gen !== G.gen) return; leavePop(); buildMenu(); show('menu'); });
    }, 5000);
  }

  // ---------- Counting ----------
  var C = {};
  var COUNT_KINDS = ['star', 'heart', 'flower', 'balloon'];

  function buildCount() {
    var s = scr.count;
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { leaveCount(); buildGames(); show('games'); audio.voiceChoose(); });
    var cat = h('div', 'trace-cat', catFor(state.profile, {}));
    cat.addEventListener('click', function () { audio.voiceHowMany(); });
    var dots = h('div', 'dots');
    var field = h('div', 'cfield');
    var choices = h('div', 'cchoices');
    var fx = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(dots); s.appendChild(field); s.appendChild(choices); s.appendChild(fx);
    C = { cat: cat.querySelector('.cat'), dots: dots, field: field, choices: choices, fx: fx,
      gen: 0, timer: 0, autoT: 0, n: 0, answer: 0, wrong: 0, counted: 0, locked: true, firstTry: 0 };
  }

  function leaveCount() {
    clearTimeout(C.timer); clearTimeout(C.autoT);
    C.gen++;
    audio.stopVoice();
  }

  function startCount() {
    leaveCount();
    C.n = 0; C.firstTry = 0; C.answer = 0; C.used = {};
    show('count');
    nextCountRound();
  }

  function markCounted(item) {
    if (item.classList.contains('counted')) return;
    item.classList.add('counted');
    C.counted++;
    item.appendChild(h('span', 'cbadge', LC.glyphSVG(String(C.counted), { sw: 20 })));
    audio.note(C.counted);
  }

  function nextCountRound() {
    clearTimeout(C.timer); clearTimeout(C.autoT);
    C.gen++;
    var gen = C.gen;
    if (C.n >= ROUNDS) { countFinale(gen); return; }
    C.n++; C.wrong = 0; C.locked = false; C.counted = 0;

    // The amounts grow: 1-3 first, then up to 6, then up to 9.
    var lo = C.n <= 2 ? 1 : 2, hi = C.n <= 2 ? 3 : C.n <= 4 ? 6 : 9, range = [], ans, v;
    for (v = lo; v <= hi; v++) range.push(String(v));
    ans = Number(pickTarget(range, String(C.answer), C.used));
    C.used[String(ans)] = 1;
    C.answer = ans;

    C.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) C.dots.appendChild(h('span', 'dot' + (i < C.n - 1 ? ' on' : i === C.n - 1 ? ' cur' : '')));

    var kind = COUNT_KINDS[Math.floor(Math.random() * COUNT_KINDS.length)];
    var colors = ['#ff6f91', '#4d96ff', '#ffa62b', '#4cc26b', '#9b72ff', '#12b5a6'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, ans);
    C.field.innerHTML = '';
    C.field.className = 'cfield ' + (ans <= 3 ? 'big' : ans <= 6 ? 'mid' : '');
    cells.forEach(function (cell) {
      var it = h('button', 'citem', LC.countItemSVG(kind, color));
      it.style.left = (7 + (cell % 3) * 30 + Math.random() * 5) + '%';
      it.style.top = (6 + Math.floor(cell / 3) * 30 + Math.random() * 5) + '%';
      it.addEventListener('pointerdown', function (e) { e.preventDefault(); if (!C.locked) markCounted(it); });
      C.field.appendChild(it);
    });

    // Answers: the right number and two close ones, so guessing is not enough.
    var near = [];
    for (var d = -2; d <= 2; d++) { var v = ans + d; if (d !== 0 && v >= 1 && v <= 9) near.push(v); }
    var opts = [ans].concat(shuffle(near).slice(0, 2));
    C.choices.innerHTML = '';
    shuffle(opts).forEach(function (num) {
      var b = h('button', 'cchoice', LC.glyphSVG(String(num), { sw: 14 }));
      b.dataset.num = String(num);
      b.addEventListener('click', function () { chooseCount(b, num, gen); });
      C.choices.appendChild(b);
    });
    setMood('idle');
    C.timer = setTimeout(function () { if (gen === C.gen) audio.voiceHowMany(); }, 500);
  }

  // The cat counts along, one by one, to show how it goes.
  function autoCount(gen) {
    var items = Array.prototype.filter.call(C.field.children, function (it) { return !it.classList.contains('counted'); });
    items.forEach(function (it, i) {
      C.autoT = setTimeout(function () { if (gen === C.gen) markCounted(it); }, 400 + i * 550);
    });
  }

  function chooseCount(btn, num, gen) {
    if (gen !== C.gen || C.locked) return;
    if (num === C.answer) {
      store.record(state.profile, String(C.answer), C.wrong === 0 ? 'first' : 'ask');
      C.locked = true;
      clearTimeout(C.autoT);
      btn.classList.add('right');
      Array.prototype.forEach.call(C.choices.children, function (c) { if (c !== btn) c.classList.add('fade'); });
      Array.prototype.forEach.call(C.field.children, function (it) { markCounted(it); });
      setMood('happy');
      audio.chime();
      setTimeout(function () { if (gen === C.gen) audio.voiceLetter(String(num)); }, 500);
      if (C.wrong === 0) { C.firstTry++; gain(1, C.fx); }
      burst(C.fx);
      C.timer = setTimeout(nextCountRound, 4600);
      return;
    }
    C.wrong++;
    store.record(state.profile, String(C.answer), 'miss');
    btn.classList.add('fade');
    btn.disabled = true;
    setMood('oops');
    audio.boop();
    audio.voiceRetry();
    if (C.wrong >= 2) {
      var right = C.choices.querySelector('[data-num="' + C.answer + '"]');
      if (right) right.classList.add('hint');
      autoCount(gen);
    }
  }

  function countFinale(gen) {
    C.locked = true;
    var bonus = C.firstTry >= 4 ? 2 : 1;
    C.field.innerHTML = ''; C.choices.innerHTML = '';
    C.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) C.dots.appendChild(h('span', 'dot on'));
    setMood('happy');
    audio.chime(); burst(C.fx);
    setTimeout(function () { if (gen === C.gen) { audio.chime(); burst(C.fx); gain(bonus, C.fx); if (C.firstTry >= 4) earnStamp('count', C.fx); } }, 1200);
    C.timer = setTimeout(function () {
      if (gen !== C.gen) return;
      afterStamp(function () { if (gen !== C.gen) return; leaveCount(); buildGames(); show('games'); });
    }, 5000);
  }

  // ---------- Bonus ride ----------
  var R = null;

  function startRide() {
    var key = state.profile;
    if (!store.useTicket(key)) return;
    var s = scr.ride;
    s.textContent = '';
    var host = h('div', 'ridehost');
    var fx = h('div', 'balloons');
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { endRide(); });
    s.appendChild(host); s.appendChild(home); s.appendChild(fx);
    show('ride');
    var avatar = store.get().profiles[key].avatar;
    var catSvg = LC.catSVG(key, { head: true, cls: 'still', vb: '30 -62 240 285', outfit: avatar });
    R = { fx: fx, ended: false };
    var ENGINE_PITCH = { '': 1, taxi: 1, police: 1.1, truck: 0.7, fire: 0.8, bus: 0.72, f1: 1.45 };
    audio.engineStart(ENGINE_PITCH[avatar.car] || 1);
    R.ride = new LC.Ride(host, {
      vehicle: LC.vehicleDef(avatar.car, key),
      catSvg: catSvg,
      paused: function () { return !!modal; },
      onStar: function (n) { audio.note(((n - 1) % 9) + 1); },
      onEngine: function (speed, gas, air) { audio.engineSet(speed, gas, air); },
      onCrash: function () { audio.engineStop(); audio.crash(); },
      onFinish: function (n, ok) { finishRide(n, ok); }
    });
  }

  // The ride is over: at the finish line, or after a crash. The stars collected are kept either way.
  function finishRide(n, ok) {
    if (!R || R.ended) return;
    R.ended = true;
    R.ride.stop();
    audio.engineStop();
    var fx = R.fx;
    var done = h('div', 'ridedone' + (ok ? '' : ' oops'), (ok ? '' : 'Oei!<br>') + '★ ' + n);
    fx.appendChild(done);
    if (ok) { audio.chime(); burst(fx); }
    if (n > 0) store.addStars(state.profile, n);
    setTimeout(function () {
      if (R && R.fx === fx) { R = null; buildGames(); show('games'); audio.voiceChoose(); }
    }, 4200);
  }

  // Leaving early still keeps the stars collected so far.
  function endRide() {
    if (!R) return;
    if (!R.ended) {
      R.ended = true;
      R.ride.stop();
      audio.engineStop();
      var n = R.ride.collected();
      if (n > 0) store.addStars(state.profile, n);
    }
    R = null;
    buildGames(); show('games'); audio.voiceChoose();
  }

  LC.testRide = function () { return R && R.ride; };

  function stopRide() {
    if (R && R.ride) R.ride.stop();
    audio.engineStop();
    R = null;
  }

  // ---------- Rekenen: more or less, and adding ----------
  // Starts with numbers up to 5. Three rounds in a row right first time: up to 10.
  // Two rounds in a row with mistakes at 10: back to 5. The level is kept per child.
  var M = {};

  function rnd(n) { return Math.floor(Math.random() * n); }

  function buildMath() {
    var s = scr.math;
    s.textContent = '';
    var home = h('button', 'home', LC.homeSVG());
    home.addEventListener('click', function () { leaveMath(); buildGames(); show('games'); audio.voiceChoose(); });
    var cat = h('div', 'trace-cat', catFor(state.profile, {}));
    var bubble = h('div', 'bubble txt');
    cat.appendChild(bubble);
    cat.addEventListener('click', function () { sayMath(); });
    var dots = h('div', 'dots');
    var field = h('div', 'mfield');
    var cards = h('div', 'mcards');
    var choices = h('div', 'cchoices');
    var fx = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(dots); s.appendChild(field); s.appendChild(cards); s.appendChild(choices); s.appendChild(fx);
    M = { cat: cat.querySelector('.cat'), bubble: bubble, dots: dots, field: field, cards: cards, choices: choices, fx: fx,
      gen: 0, timer: 0, autoT: 0, n: 0, type: 'meer', answer: 0, big: 0, wrong: 0, counted: 0, locked: true,
      firstTry: 0, streak: 0, missRounds: 0, max: 5, used: {}, prevAns: 0 };
  }

  function leaveMath() {
    clearTimeout(M.timer); clearTimeout(M.autoT);
    M.gen++;
    audio.stopVoice();
  }

  function startMath() {
    leaveMath();
    M.n = 0; M.firstTry = 0; M.streak = 0; M.missRounds = 0; M.used = {}; M.prevAns = 0;
    M.max = store.mathMax(state.profile);
    show('math');
    nextMathRound();
  }

  function sayMath() {
    M.bubble.textContent = M.type === 'meer' ? 'Meer?' : 'Samen?';
    M.bubble.classList.add('on');
    audio.voiceMath(M.type);
  }

  // Put n items of one kind in a box, on a grid, at random spots. Returns the item elements.
  function fillGroup(box, n, kind, color, cols, rows, left, width, top, height) {
    var cells = shuffle(Array.apply(null, { length: cols * rows }).map(function (_, i) { return i; })).slice(0, n), els = [];
    cells.forEach(function (cell) {
      var it = h('div', 'mitem', LC.countItemSVG(kind, color));
      it.style.left = (left + (cell % cols) * (width / cols)) + '%';
      it.style.top = (top + Math.floor(cell / cols) * (height / rows)) + '%';
      box.appendChild(it); els.push(it);
    });
    return els;
  }

  function numberItems(els, startAt) {
    els.forEach(function (it, i) {
      if (it.classList.contains('counted')) return;
      it.classList.add('counted');
      it.appendChild(h('span', 'cbadge' + (startAt + i >= 10 ? ' wide' : ''), LC.numberSVG(startAt + i, { sw: 20 })));
    });
  }

  function nextMathRound() {
    clearTimeout(M.timer); clearTimeout(M.autoT);
    M.gen++;
    var gen = M.gen;
    if (M.n >= ROUNDS) { mathFinale(gen); return; }
    M.n++; M.wrong = 0; M.locked = false; M.counted = 0;
    M.type = M.n % 2 === 1 ? 'meer' : 'erbij';
    M.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) M.dots.appendChild(h('span', 'dot' + (i < M.n - 1 ? ' on' : i === M.n - 1 ? ' cur' : '')));
    M.field.innerHTML = ''; M.cards.innerHTML = ''; M.choices.innerHTML = '';
    M.field.style.display = M.type === 'erbij' ? 'block' : 'none';
    M.cards.style.display = M.type === 'meer' ? 'flex' : 'none';
    var kinds = ['star', 'heart', 'flower', 'balloon'], colors = ['#ff6f91', '#4d96ff', '#ffa62b', '#4cc26b', '#9b72ff', '#12b5a6'];
    var kind = kinds[rnd(kinds.length)], color = colors[rnd(colors.length)];

    if (M.type === 'meer') {
      var a, b, tries = 0, gap = M.n <= 2 && M.max >= 4 ? 2 : 1;
      do { a = 1 + rnd(M.max); b = 1 + rnd(M.max); tries++; } while ((a === b || Math.abs(a - b) < gap) && tries < 80);
      if (a === b) b = a % M.max + 1;
      M.big = a > b ? 0 : 1;
      [a, b].forEach(function (cnt, idx) {
        var card = h('button', 'mgroup'), els;
        var cols = cnt <= 6 ? 3 : 5, rows = 2;
        card.className = 'mgroup ' + (cols === 3 ? 'big' : 'small');
        els = fillGroup(card, cnt, kind, color, cols, rows, 6, 86, 10, 74);
        card.dataset.count = String(cnt);
        card._els = els;
        card.addEventListener('click', function () { chooseMore(card, idx, gen); });
        M.cards.appendChild(card);
      });
    } else {
      var ans, range = [], v;
      for (v = 2; v <= M.max; v++) range.push(String(v));
      ans = Number(pickTarget(range, String(M.prevAns), M.used));
      M.used[String(ans)] = 1; M.prevAns = ans; M.answer = ans;
      var ea = 1 + rnd(ans - 1), eb = ans - ea;
      var kindB = kinds[(kinds.indexOf(kind) + 1 + rnd(3)) % kinds.length], colorB = colors[(colors.indexOf(color) + 1 + rnd(5)) % colors.length];
      var elsA = fillGroup(M.field, ea, kind, color, 3, 3, 3, 36, 10, 74);
      var elsB = fillGroup(M.field, eb, kindB, colorB, 3, 3, 61, 36, 10, 74);
      var plus = h('div', 'mplus'); plus.textContent = '+'; M.field.appendChild(plus);
      M.all = elsA.concat(elsB);
      M.all.forEach(function (it) {
        it.className = 'mitem tap';
        it.addEventListener('pointerdown', function (e) { e.preventDefault(); if (!M.locked) markMath(it); });
      });
      var near = [];
      for (var d = -2; d <= 2; d++) { var w = ans + d; if (d !== 0 && w >= 1 && w <= 10) near.push(w); }
      shuffle([ans].concat(shuffle(near).slice(0, 2))).forEach(function (num) {
        var bt = h('button', 'cchoice', LC.numberSVG(num, { sw: 14 }));
        bt.dataset.num = String(num);
        bt.addEventListener('click', function () { chooseSum(bt, num, gen); });
        M.choices.appendChild(bt);
      });
    }
    setMood('idle');
    M.bubble.textContent = M.type === 'meer' ? 'Meer?' : 'Samen?';
    M.bubble.classList.add('on');
    M.timer = setTimeout(function () { if (gen === M.gen) audio.voiceMath(M.type); }, 500);
  }

  function markMath(it) {
    if (it.classList.contains('counted')) return;
    it.classList.add('counted');
    M.counted++;
    it.appendChild(h('span', 'cbadge' + (M.counted >= 10 ? ' wide' : ''), LC.numberSVG(M.counted, { sw: 20 })));
    audio.note(M.counted);
  }

  // A round is over: stars, and the smart level.
  function mathRoundDone(gen) {
    audio.chime();
    setMood('happy');
    burst(M.fx);
    if (M.wrong === 0) { M.firstTry++; M.streak++; M.missRounds = 0; gain(1, M.fx); } else { M.streak = 0; M.missRounds++; }
    if (M.max === 5 && M.streak >= 3) {
      M.max = 10; store.setMath(state.profile, 10);
      var t = h('div', 'ticket-toast', '<span class="tstar">★</span><span>Tot 10!</span>');
      M.fx.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3600);
    } else if (M.max === 10 && M.missRounds >= 2) {
      M.max = 5; store.setMath(state.profile, 5); M.missRounds = 0;
    }
    M.timer = setTimeout(function () { if (gen === M.gen) nextMathRound(); }, 4200);
  }

  function chooseMore(card, idx, gen) {
    if (gen !== M.gen || M.locked) return;
    if (idx === M.big) {
      M.locked = true;
      card.classList.add('right');
      Array.prototype.forEach.call(M.cards.children, function (c) {
        if (c !== card) c.classList.add('fade');
        numberItems(c._els, 1);
      });
      mathRoundDone(gen);
      return;
    }
    M.wrong++;
    card.classList.add('fade');
    card.disabled = true;
    setMood('oops');
    audio.boop();
    audio.voiceRetry();
    // The other group lights up and both are counted out, one after the other.
    Array.prototype.forEach.call(M.cards.children, function (c) {
      if (c !== card) c.classList.add('hint');
      c._els.forEach(function (it, i) { M.autoT = setTimeout(function () { if (gen === M.gen) numberItems([it], i + 1); }, 300 + i * 260); });
    });
  }

  function chooseSum(btn, num, gen) {
    if (gen !== M.gen || M.locked) return;
    if (num === M.answer) {
      if (M.answer <= 9) store.record(state.profile, String(M.answer), M.wrong === 0 ? 'first' : 'ask');
      M.locked = true;
      clearTimeout(M.autoT);
      btn.classList.add('right');
      Array.prototype.forEach.call(M.choices.children, function (c) { if (c !== btn) c.classList.add('fade'); });
      M.all.forEach(function (it) { markMath(it); });
      mathRoundDone(gen);
      return;
    }
    M.wrong++;
    if (M.answer <= 9) store.record(state.profile, String(M.answer), 'miss');
    btn.classList.add('fade');
    btn.disabled = true;
    setMood('oops');
    audio.boop();
    audio.voiceRetry();
    if (M.wrong >= 2) {
      var right = M.choices.querySelector('[data-num="' + M.answer + '"]');
      if (right) right.classList.add('hint');
      M.all.filter(function (it) { return !it.classList.contains('counted'); }).forEach(function (it, i) {
        M.autoT = setTimeout(function () { if (gen === M.gen) markMath(it); }, 400 + i * 520);
      });
    }
  }

  function mathFinale(gen) {
    M.locked = true;
    var bonus = M.firstTry >= 4 ? 2 : 1;
    if (M.max === 5 && M.firstTry >= 5) { M.max = 10; store.setMath(state.profile, 10); }
    M.field.innerHTML = ''; M.cards.innerHTML = ''; M.choices.innerHTML = '';
    M.bubble.classList.remove('on');
    M.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) M.dots.appendChild(h('span', 'dot on'));
    setMood('happy');
    audio.chime(); burst(M.fx);
    setTimeout(function () { if (gen === M.gen) { audio.chime(); burst(M.fx); gain(bonus, M.fx); if (M.firstTry >= 4) earnStamp('math', M.fx); } }, 1200);
    M.timer = setTimeout(function () {
      if (gen !== M.gen) return;
      afterStamp(function () { if (gen !== M.gen) return; leaveMath(); buildGames(); show('games'); });
    }, 5000);
  }

  // ---------- Goodbye ----------
  function buildBye() {
    var s = scr.bye;
    s.textContent = '';
    var w = h('div', 'byewrap', catFor(state.profile || 'speler1', { cls: 'sleep' }));
    var t = h('div', 'byetext'); t.textContent = 'Tot ziens! zzz';
    w.appendChild(t);
    s.appendChild(w);
  }

  function closeGame() {
    closeModal();
    leaveTrace();
    leaveFind();
    leavePop();
    leaveCount();
    leaveMath();
    stopRide();
    audio.setMusic(false);
    buildBye();
    show('bye');
    try { window.close(); } catch (e) { /* browsers usually refuse; the goodbye screen stays */ }
  }

  // ---------- Parent gate ----------
  var modal = null, idleT = 0;

  function closeModal() {
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
    clearTimeout(idleT);
  }
  function bump(ms) {
    clearTimeout(idleT);
    idleT = setTimeout(closeAndResume, ms);
  }
  function openModal(content, ms) {
    closeModal();
    modal = h('div', 'modal');
    modal.appendChild(content);
    document.body.appendChild(modal);
    bump(ms);
    modal.addEventListener('pointerdown', function () { bump(ms); });
    modal.addEventListener('input', function () { bump(ms); });
  }
  function closeAndResume() {
    closeModal();
    if (current === 'math') startMath();
    else if (current === 'count') startCount();
    else if (current === 'pop') startPop(G.pool && G.pool.length ? G.pool : gamePool());
    else if (current === 'find') startFind(F.pool && F.pool.length ? F.pool : gamePool());
    else if (current === 'trace' && state.glyph) openTrace(state.pos, !!(state.traceBatch && !state.firstBatchDone));
    else if (current === 'games') buildGames();
    else if (current === 'shop') buildShop();
    else if (current === 'menu') buildMenu();
    else if (current === 'profile') buildProfile();
  }

  function openGate() {
    var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    var answer = String(a + b), val = '', wrong = 0;
    var card = h('div', 'mcard gate');
    var title = h('h2'); title.textContent = 'Voor ouders'; card.appendChild(title);
    var sum = h('div', 'sum'); sum.textContent = a + ' + ' + b + ' = ?'; card.appendChild(sum);
    var ans = h('div', 'ans'); card.appendChild(ans);
    var pad = h('div', 'pad'); card.appendChild(pad);
    var back = h('button', 'btn quiet'); back.textContent = 'Terug'; card.appendChild(back);
    back.addEventListener('click', closeAndResume);

    function refresh() { ans.textContent = val || ' '; }
    function press(k) {
      if (k === 'wis') { val = val.slice(0, -1); refresh(); return; }
      if (k === 'OK') {
        if (val === answer) {
          closeModal();
          if (current === 'bye') { buildProfile(); show('profile'); }
          else openParent();
          return;
        }
        wrong++; val = ''; refresh();
        card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        if (wrong >= 3) closeAndResume();
        return;
      }
      if (val.length < 2) { val += k; refresh(); }
    }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'wis', '0', 'OK'].forEach(function (k) {
      var bt = h('button', 'key' + (k === 'OK' ? ' ok' : '')); bt.textContent = k;
      bt.addEventListener('click', function () { press(k); });
      pad.appendChild(bt);
    });
    refresh();
    openModal(card, 30000);
  }

  // ---------- Parent panel ----------
  function seg(options, value, onPick) {
    var box = h('div', 'seg');
    options.forEach(function (o) {
      var b = h('button', o[0] === value ? 'on' : ''); b.textContent = o[1];
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(box.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        onPick(o[0]);
      });
      box.appendChild(b);
    });
    return box;
  }
  function row(label, control) {
    var r = h('div', 'row'), l = h('label'); l.textContent = label;
    r.appendChild(l); r.appendChild(control);
    return r;
  }
  function nameInput(key) {
    var inp = h('input');
    inp.type = 'text'; inp.maxLength = 20; inp.autocomplete = 'off';
    inp.value = store.get().profiles[key].name;
    inp.addEventListener('input', function () { store.get().profiles[key].name = inp.value.slice(0, 20); store.save(); });
    return inp;
  }

  function openParent() {
    var d = store.get();
    var card = h('div', 'mcard panel');
    var title = h('h2'); title.textContent = 'Ouders'; card.appendChild(title);

    var players = store.getPlayers();
    var pkeys = players === 2 ? ['speler1', 'speler2'] : ['speler1'];
    pkeys.forEach(function (pk) {
      var label = players === 2 ? (pk === 'speler1' ? 'Speler 1 — moeilijkheid' : 'Speler 2 — moeilijkheid') : 'Moeilijkheid';
      card.appendChild(row(label, seg([['soepel', 'Soepel'], ['normaal', 'Normaal'], ['streng', 'Streng']], store.getStrict(pk),
        function (v) { store.setStrict(pk, v); })));
      var capsLabel = players === 2 ? (pk === 'speler1' ? 'Speler 1 — hoofdletters' : 'Speler 2 — hoofdletters') : 'Hoofdletters';
      card.appendChild(row(capsLabel, seg([['aan', 'Aan'], ['uit', 'Uit']], store.getCaps(pk) ? 'aan' : 'uit',
        function (v) { store.setCaps(pk, v === 'aan'); if (!store.getCaps(pk) && state.profile === pk && state.cat === 'upper') state.cat = 'lower'; })));
    });
    card.appendChild(row('Muziek', seg([['aan', 'Aan'], ['uit', 'Uit']], d.settings.music ? 'aan' : 'uit',
      function (v) { d.settings.music = v === 'aan'; store.save(); audio.setMusic(d.settings.music); })));
    card.appendChild(row('Slim oefenen', seg([['aan', 'Aan'], ['uit', 'Uit']], d.settings.adaptive ? 'aan' : 'uit',
      function (v) { d.settings.adaptive = v === 'aan'; store.save(); })));
    card.appendChild(row('Beurtwissel', seg([['0', 'Uit'], ['5', '5 min'], ['10', '10 min'], ['15', '15 min']], String(d.settings.turnMin),
      function (v) { d.settings.turnMin = +v; store.save(); turnReset(); })));
    card.appendChild(row('Aantal spelers', seg([['1', '1'], ['2', '2']], String(store.getPlayers()),
      function (v) { store.setPlayers(+v); openParent(); })));
    card.appendChild(row('Naam bij Speler 1', nameInput('speler1')));
    if (store.getPlayers() === 2) card.appendChild(row('Naam bij Speler 2', nameInput('speler2')));
    card.appendChild(row('Alle kernen open', seg([['uit', 'Uit'], ['aan', 'Aan']], d.settings.unlockAll ? 'aan' : 'uit',
      function (v) { d.settings.unlockAll = v === 'aan'; store.save(); })));

    var actions = h('div', 'actions');
    var prog = h('button', 'btn'); prog.textContent = 'Voortgang bekijken';
    prog.addEventListener('click', function () { openProgress(state.profile || 'speler1'); });
    var reset = h('button', 'btn warn'); reset.textContent = 'Voortgang wissen';
    var armed = false;
    reset.addEventListener('click', function () {
      if (!armed) { armed = true; reset.textContent = 'Zeker weten? Tik nog eens'; return; }
      store.resetProgress(); renderDecor(); armed = false; reset.textContent = 'Gewist';
    });
    var close = h('button', 'btn'); close.textContent = 'Sluit spel';
    close.addEventListener('click', closeGame);
    var back = h('button', 'btn primary'); back.textContent = 'Terug naar spel';
    back.addEventListener('click', closeAndResume);
    actions.appendChild(prog); actions.appendChild(reset); actions.appendChild(close); actions.appendChild(back);
    card.appendChild(actions);

    openModal(card, 60000);
  }

  // ---------- Practice what is hard ----------
  // Letters and numbers that need extra practice come up more often; what already goes well
  // still comes up now and then.
  function weightFor(key) {
    if (!store.get().settings.adaptive || !state.profile) return 1;
    var m = LC.masteryOf(state.profile, key);
    return m === 'practice' ? 6 : m === 'new' ? 3 : m === 'busy' ? 2 : 0.8;
  }

  // Pick one item from pool: not `avoid`, and less likely if it was already used this game.
  function pickTarget(pool, avoid, used) {
    var cands = pool.filter(function (k) { return k !== avoid; });
    if (!cands.length) cands = pool.slice();
    var ws = cands.map(function (k) { return weightFor(k) * (used && used[k] ? 0.35 : 1); });
    var total = ws.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
    for (var i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
    return cands[cands.length - 1];
  }
  LC.testPick = pickTarget;

  // ---------- Progress overview for parents ----------
  var WEEKDAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

  // new = not seen yet, busy = on the way, good = knows it, practice = needs extra attention
  function mastery(profile, k) { return LC.masteryOf(profile, k); }

  function detailText(p, k) {
    var e = p.stats[k] || [0, 0, 0, 0], done = p.done[k] || 0, parts = [];
    if (done) parts.push(done + '× overgetrokken');
    if (e[0]) parts.push(e[1] + ' van ' + e[0] + ' in één keer goed');
    if (e[2]) parts.push(e[2] + '× misgetikt');
    if (e[3]) parts.push(e[3] + ' mislukte pogingen bij overtrekken');
    return parts.length ? parts.join(' · ') : 'Nog niet geoefend';
  }

  function openProgress(which) {
    var d = store.get();
    var card = h('div', 'mcard progress');
    var title = h('h2'); title.textContent = 'Voortgang'; card.appendChild(title);

    var tabs = h('div', 'ptabs');
    var progressKeys = store.getPlayers() === 1 ? ['speler1'] : ['speler1', 'speler2'];
    progressKeys.forEach(function (k) {
      var b = h('button', 'ptab' + (k === which ? ' on' : ''), catFor(k, { head: true }));
      var displayName = d.profiles[k].name || (k === 'speler1' ? 'Speler 1' : 'Speler 2');
      var n = h('span'); n.textContent = displayName;
      b.appendChild(n);
      b.addEventListener('click', function () { openProgress(k); });
      tabs.appendChild(b);
    });
    card.appendChild(tabs);

    var p = d.profiles[which];
    var today = Math.round((p.time[store.dayKey(0)] || 0) / 60);
    var info = h('div', 'pinfo');
    ['★ ' + p.stars + ' sterren', 'Bonuskaartjes: ' + p.tickets, 'Rekenen: tot ' + p.mathMax, 'Vandaag gespeeld: ' + today + ' min'].forEach(function (t) {
      var sp = h('span'); sp.textContent = t; info.appendChild(sp);
    });
    card.appendChild(info);

    var week = h('div', 'pweek'), mins = [], maxMin = 1, i;
    for (i = 6; i >= 0; i--) { var mm = Math.round((p.time[store.dayKey(i)] || 0) / 60); mins.push([i, mm]); if (mm > maxMin) maxMin = mm; }
    mins.forEach(function (x) {
      var dt = new Date(); dt.setDate(dt.getDate() - x[0]);
      var bar = h('div', 'pbar');
      var num = h('span'); num.textContent = x[1] ? String(x[1]) : ''; bar.appendChild(num);
      var col = h('i'); col.style.height = (x[1] ? Math.max(8, x[1] / maxMin * 100) : 3) + '%'; bar.appendChild(col);
      var lab = h('em'); lab.textContent = x[0] === 0 ? 'nu' : WEEKDAYS[dt.getDay()]; bar.appendChild(lab);
      week.appendChild(bar);
    });
    card.appendChild(week);

    var detail = h('div', 'pdetail'); detail.textContent = 'Tik op een letter of cijfer voor details.';
    var hasData = false;
    LC.KERNS.forEach(function (kern) {
      var t = h('div', 'pgtitle'); t.textContent = kern.label; card.appendChild(t);
      var grid = h('div', 'pgrid');
      kern.letters.forEach(function (k) {
        var mst = mastery(which, k);
        if (mst !== 'new') hasData = true;
        var tile = h('button', 'ptile m-' + mst, LC.glyphSVG(k, { sw: 18, color: '#4a3f63' }));
        tile.addEventListener('click', function () { detail.textContent = k + ': ' + detailText(p, k); });
        grid.appendChild(tile);
      });
      card.appendChild(grid);
    });

    var legend = h('div', 'plegend');
    [['m-good', 'goed'], ['m-busy', 'bezig'], ['m-practice', 'extra oefenen'], ['m-new', 'nog niet gezien']].forEach(function (l) {
      var sp = h('span', l[0]); sp.textContent = l[1]; legend.appendChild(sp);
    });
    card.appendChild(legend);
    card.appendChild(detail);

    var bad = [];
    LC.KERNS.forEach(function (kern) {
      kern.letters.forEach(function (k) {
        if (mastery(which, k) === 'practice') { var e = p.stats[k] || [0, 0, 0, 0]; bad.push([k, e[2] + (e[0] - e[1]) + e[3] / 2]); }
      });
    });
    bad.sort(function (a, b) { return b[1] - a[1]; });
    var prac = h('div', 'ppractice');
    var pt = h('b'); pt.textContent = 'Extra oefenen met: '; prac.appendChild(pt);
    if (bad.length) {
      bad.slice(0, 8).forEach(function (b) { prac.appendChild(h('span', 'pchip', LC.glyphSVG(b[0], { sw: 18, color: '#d9534f' }))); });
    } else {
      var none = h('span'); none.textContent = hasData ? 'niets, alles gaat goed!' : 'nog te weinig gespeeld, het overzicht vult zich vanzelf.'; prac.appendChild(none);
    }
    card.appendChild(prac);

    card.appendChild(row('Beheersingsnorm', seg(
      [['3', '3 van 5'], ['4', '4 van 5'], ['5', '5 van 5']],
      String(store.getMasteryThreshold(which)),
      function (v) { store.setMasteryThreshold(which, +v); }
    )));

    var back = h('button', 'btn primary'); back.textContent = 'Terug';
    back.addEventListener('click', openParent);
    var wrap = h('div', 'actions'); wrap.appendChild(back); card.appendChild(wrap);
    openModal(card, 120000);
  }

  // ---------- Hidden paw print: 5 quick taps open the sum ----------
  var paw = h('button', null, LC.pawSVG());
  paw.id = 'paw';
  paw.setAttribute('aria-label', 'ouders');
  document.body.appendChild(paw);
  var taps = [];
  paw.addEventListener('click', function () {
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 5000; });
    taps.push(now);
    // a little sign that the tap counted, so a parent can see it is working
    paw.classList.add('tapped');
    setTimeout(function () { paw.classList.remove('tapped'); }, 450);
    if (taps.length >= 5) { taps = []; paw.classList.remove('tapped'); openGate(); }
  });

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  buildProfile();
  show('profile');

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* works without it */ });
    });
  }
})();
