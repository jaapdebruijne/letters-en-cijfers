(function () {
  'use strict';
  var LC = window.LC, store = LC.store, audio = LC.audio;
  var state = { profile: null, glyph: null, cat: 'upper', pos: 0, game: 'trace' };
  var F = {};
  var tracer = null, advanceTimer = 0, moodTimer = 0, token = 0, current = 'profile', T = {};

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function other(key) { return key === 'pinky' ? 'groentje' : 'pinky'; }

  // A cat wearing whatever its child has put on in the shop.
  function catFor(key, opts) {
    var o = {};
    for (var k in (opts || {})) o[k] = opts[k];
    o.outfit = store.get().profiles[key].avatar;
    return LC.catSVG(key, o);
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

  // A bonus ride is earned by finishing a part well.
  function awardTicket(container) {
    store.addTicket(state.profile);
    if (!container) return;
    var t = h('div', 'ticket-toast', LC.carIconSVG() + '<span>Bonusrit!</span>');
    container.appendChild(t);
    audio.chime();
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3600);
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
  function nameLetters(profile) {
    var raw = store.get().profiles[profile].name || '';
    var plain = raw.normalize ? raw.normalize('NFD').replace(/[̀-ͯ]/g, '') : raw;
    var out = [];
    for (var i = 0; i < plain.length; i++) {
      var c = plain.charAt(i);
      if (/[A-Za-z]/.test(c)) out.push(out.length === 0 ? c.toUpperCase() : c);
    }
    return out;
  }
  function listFor(cat) {
    return cat === 'name' ? nameLetters(state.profile) : LC.CATEGORIES[cat];
  }

  var app = document.getElementById('app');
  app.appendChild(h('div', 'bg', LC.sceneSVG()));
  var scr = {};
  ['profile', 'games', 'shop', 'house', 'ride', 'menu', 'trace', 'find', 'pop', 'count', 'bye'].forEach(function (n) {
    scr[n] = h('div', 'screen s-' + n);
    app.appendChild(scr[n]);
  });

  function show(n) {
    current = n;
    Object.keys(scr).forEach(function (k) { scr[k].classList.toggle('on', k === n); });
  }

  // ---------- Who is playing ----------
  function buildProfile() {
    var s = scr.profile;
    s.textContent = '';
    state.profile = null;
    renderDecor();
    var wrap = h('div', 'pwrap');
    ['pinky', 'groentje'].forEach(function (key) {
      var b = h('button', 'pcard pc-' + key, catFor(key, {}));
      var nm = h('div', 'pname'); nm.textContent = LC.CATS[key].name; b.appendChild(nm);
      var kid = store.get().profiles[key].name;
      if (kid) { var k = h('div', 'kname'); k.textContent = kid; b.appendChild(k); }
      b.addEventListener('click', function () { pickProfile(key); });
      wrap.appendChild(b);
    });
    s.appendChild(wrap);
  }

  function pickProfile(key) {
    audio.unlock();
    audio.preload();
    audio.setMusic(store.get().settings.music);
    state.profile = key;
    renderDecor();
    buildTrace();
    buildFind();
    buildPop();
    buildCount();
    buildGames();
    show('games');
    audio.voiceWelcome();
  }

  // ---------- Which game? ----------
  function buildGames() {
    var s = scr.games, key = state.profile;
    s.textContent = '';
    var sw = h('button', 'switch', catFor(other(key), { head: true }));
    sw.addEventListener('click', function () { buildProfile(); show('profile'); });
    s.appendChild(sw);

    var mc = h('div', 'games-cat', catFor(key, {}));
    var nm = h('div', 'pname'); nm.textContent = LC.CATS[key].name; mc.appendChild(nm);
    var kid = store.get().profiles[key].name;
    if (kid) { var kn = h('div', 'kname'); kn.textContent = kid; mc.appendChild(kn); }
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
    carBtn.addEventListener('click', function () {
      if (store.tickets(key) > 0) { startRide(); return; }
      carBtn.classList.add('nope'); audio.boop();
      setTimeout(function () { carBtn.classList.remove('nope'); }, 600);
    });
    s.appendChild(pill); s.appendChild(carBtn); s.appendChild(houseBtn); s.appendChild(shopBtn);

    var row = h('div', 'gcards');
    [['trace', 'Schrijven'], ['find', 'Zoeken'], ['pop', 'Prikken'], ['count', 'Tellen']].forEach(function (g, i) {
      var c = h('button', 'gcard gc-' + g[0], LC.gameCardSVG(g[0]));
      c.dataset.game = g[0];
      var t = h('div', 'gtitle'); t.textContent = g[1]; c.appendChild(t);
      c.style.animationDelay = (-i * 0.9) + 's';
      c.addEventListener('click', function () {
        if (g[0] === 'count') { buildCount(); startCount(); return; }
        state.game = g[0]; buildMenu(); show('menu');
      });
      row.appendChild(c);
    });
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
    [['avatar', catFor(key, { head: true })], ['car', LC.carIconSVG()], ['room', LC.homeSVG()]].forEach(function (t) {
      var b = h('button', 'shoptab' + (t[0] === shopTab ? ' on' : ''), t[1]);
      b.addEventListener('click', function () { shopTab = t[0]; buildShop(); });
      tabs.appendChild(b);
    });

    var grid = h('div', 'shopgrid ' + shopTab);
    LC.SHOP[shopTab].forEach(function (it) {
      var owned = store.owns(key, it.id);
      var equipped = !!it.slot && st.avatar[it.slot] === it.id;
      var card = h('button', 'scard' + (owned ? ' owned' : '') + (equipped ? ' on' : ''),
        shopTab === 'avatar' ? LC.accessoryPreview(key, it.id)
          : shopTab === 'car' ? LC.carPreview(it.id, key, st.avatar)
          : LC.decorPreview(it.id));
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
      if (it.slot) {
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
      c.classList.remove('idle'); void c.getBoundingClientRect(); c.classList.add('happy');
      audio.chime();
      setTimeout(function () { c.classList.remove('happy'); c.classList.add('idle'); }, 1800);
    });
    s.appendChild(home); s.appendChild(cat); s.appendChild(fx);
    show('house');
    if (newId) { burst(fx); audio.chime(); }
  }

  // ---------- Letter and number choice ----------
  function buildMenu() {
    var s = scr.menu, key = state.profile, prof = store.get().profiles[key];
    s.textContent = '';
    // The game screens draw their own cat, so redraw them to show the current outfit.
    buildTrace(); buildFind(); buildPop(); buildCount();
    var sky = h('div', 'sky');
    var n = Math.min(10, store.total(key));
    for (var i = 0; i < n; i++) {
      var b = h('div', 'floaty', LC.balloonSVG(LC.BALLOON_COLORS[i % LC.BALLOON_COLORS.length]));
      b.style.left = (14 + i * 8 + (i % 2) * 2) + '%';
      b.style.animationDelay = (-i * 0.6) + 's';
      sky.appendChild(b);
    }
    s.appendChild(sky);

    var back = h('button', 'home', LC.homeSVG());
    back.addEventListener('click', function () { buildGames(); show('games'); audio.voiceChoose(); });
    s.appendChild(back);
    var badge = h('div', 'modebadge', state.game === 'find' ? LC.searchSVG() : state.game === 'pop' ? LC.balloonIconSVG() : LC.pencilSVG());
    s.appendChild(badge);

    var mc = h('div', 'menu-cat', catFor(key, {}));
    var nm = h('div', 'pname'); nm.textContent = LC.CATS[key].name; mc.appendChild(nm);
    if (prof.name) { var kn = h('div', 'kname'); kn.textContent = prof.name; mc.appendChild(kn); }
    s.appendChild(mc);

    var letters = nameLetters(key);
    if (state.cat === 'name' && !letters.length) state.cat = 'upper';

    var tabs = h('div', 'tabs');
    var tabDefs = [['upper', 'A'], ['lower', 'a'], ['digit', '1']];
    if (letters.length) tabDefs.push(['name', letters[0]]);
    tabDefs.forEach(function (c) {
      var tb = h('button', 'tab' + (c[0] === state.cat ? ' on' : ''), LC.glyphSVG(c[1], { sw: 16 }) + (c[0] === 'name' ? '<span class="badge">★</span>' : ''));
      tb.dataset.cat = c[0];
      tb.addEventListener('click', function () { state.cat = c[0]; buildMenu(); });
      tabs.appendChild(tb);
    });
    s.appendChild(tabs);

    if (state.game !== 'trace') {
      var play = h('button', 'playbig', LC.playSVG());
      play.addEventListener('click', function () { (state.game === 'pop' ? startPop : startFind)(state.cat); });
      s.appendChild(play);
      return;
    }

    var list = listFor(state.cat);
    var grid = h('div', 'grid ' + (state.cat === 'digit' ? 'g5' : state.cat === 'name' ? 'gname' : 'g7'));
    list.forEach(function (k, idx) {
      var done = prof.done[k] || 0, stars = '';
      for (var j = 0; j < Math.min(5, done); j++) stars += '★';
      var t = h('button', 'tile', LC.glyphSVG(k, { sw: 16 }));
      t.dataset.key = k;
      var st = h('div', 'stars'); st.textContent = stars; t.appendChild(st);
      t.addEventListener('click', function () { openTrace(state.cat, idx); });
      grid.appendChild(t);
    });
    s.appendChild(grid);
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
    var n = listFor(state.cat).length;
    openTrace(state.cat, (state.pos + d + n) % n);
  }

  function renderCurrent(list) {
    if (state.cat !== 'name') {
      T.cur.className = 'navcur';
      T.cur.innerHTML = LC.glyphSVG(state.glyph, { sw: 15 });
      return;
    }
    T.cur.className = 'navcur namerow' + (list.length > 9 ? ' long' : '');
    T.cur.innerHTML = list.map(function (k, i) {
      return '<span class="np' + (i < state.pos ? ' done' : i === state.pos ? ' cur' : '') + '">' + LC.glyphSVG(k, { sw: 18 }) + '</span>';
    }).join('');
  }

  function setMood(m) {
    var c = current === 'find' ? F.cat : current === 'pop' ? G.cat : current === 'count' ? C.cat : T.cat;
    if (!c) return;
    clearTimeout(moodTimer);
    c.classList.remove('idle', 'happy', 'oops', 'help');
    void c.getBoundingClientRect();
    c.classList.add(m);
    if (m === 'oops') moodTimer = setTimeout(function () { setMood('idle'); }, 1300);
  }

  function leaveTrace() {
    clearTimeout(advanceTimer); token++;
    audio.stopVoice();
    if (tracer) { tracer.destroy(); tracer = null; }
  }

  function openTrace(cat, pos) {
    clearTimeout(advanceTimer); token++;
    var mine = token;
    var list = listFor(cat);
    if (!list.length) { cat = 'upper'; list = listFor(cat); pos = 0; }
    state.cat = cat;
    state.pos = Math.max(0, Math.min(pos || 0, list.length - 1));
    var key = list[state.pos];
    state.glyph = key;
    if (tracer) { tracer.destroy(); tracer = null; }
    show('trace');
    renderCurrent(list);
    setMood('idle');
    tracer = new LC.Tracer(T.card, key, store.get().settings.strict, {
      onSuccess: function () { success(key, mine); },
      onTry: function () { setMood('oops'); audio.boop(); audio.voiceRetry(); },
      onHelp: function () { setMood('help'); audio.voiceHelp(); },
      onHelpDone: function () { setMood('idle'); }
    });
    setTimeout(function () { if (mine === token) audio.voiceLetter(LC.GLYPHS[key].sound); }, 350);
    setTimeout(function () { if (mine === token) showHow(); }, 1100);
  }

  function showHow() {
    if (!tracer) return;
    setMood('help');
    tracer.demo({ passes: 1 });
  }

  function success(key, mine) {
    setMood('happy');
    audio.chime();
    setTimeout(function () { if (mine === token) audio.voicePraise(); }, 500);
    store.addDone(state.profile, key);
    burst();
    gain(1, T.balloons);
    T.run = (T.run || 0) + 1;
    if (T.run === 5) setTimeout(function () { if (mine === token) awardTicket(T.balloons); }, 700);
    var list = listFor(state.cat), last = state.cat === 'name' && state.pos === list.length - 1;
    if (last) {
      // The whole name is done: a bigger celebration, then back to the choice screen.
      setTimeout(function () { if (mine === token) { gain(2, T.balloons); awardTicket(T.balloons); } }, 1200);
      setTimeout(function () { if (mine === token) { burst(); audio.chime(); } }, 1200);
      setTimeout(function () { if (mine === token) { burst(); audio.chime(); } }, 2400);
      advanceTimer = setTimeout(function () {
        if (mine !== token) return;
        leaveTrace(); buildMenu(); show('menu');
      }, 6000);
      return;
    }
    var nextPos = (state.pos + 1) % list.length, cat = state.cat;
    advanceTimer = setTimeout(function () {
      if (mine !== token) return;
      openTrace(cat, nextPos);
    }, 3800);
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

  function poolFor(cat) {
    if (cat !== 'name') return LC.CATEGORIES[cat].slice();
    var seen = {}, pool = [];
    nameLetters(state.profile).forEach(function (k) { if (!seen[k]) { seen[k] = 1; pool.push(k); } });
    if (pool.length < 3) LC.CATEGORIES.upper.forEach(function (k) { if (!seen[k] && pool.length < 6) { seen[k] = 1; pool.push(k); } });
    return pool;
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

  function startFind(cat) {
    var pool = poolFor(cat);
    if (!pool.length) { cat = 'upper'; pool = poolFor(cat); }
    F.kind = cat; F.pool = pool; F.n = 0; F.target = null; F.first = 0;
    show('find');
    nextRound();
  }

  function speakTarget(ctx) {
    if (!ctx.target) return;
    var gen = ctx.gen;
    audio.voiceLetter(LC.GLYPHS[ctx.target].sound).then(function (heard) {
      if (gen !== ctx.gen) return;
      // With no recording yet the cat shows the letter in a speech bubble instead.
      ctx.bubble.innerHTML = heard ? '' : LC.glyphSVG(ctx.target, { sw: 16 });
      ctx.bubble.classList.toggle('on', !heard);
    });
  }
  function sayTarget() { speakTarget(F); }

  function nextRound() {
    clearTimeout(F.timer);
    F.gen++;
    var gen = F.gen;
    if (F.n >= ROUNDS) { findFinale(gen); return; }
    F.n++; F.wrong = 0; F.locked = false;

    var candidates = F.pool.filter(function (k) { return k !== F.target; });
    var target = candidates[Math.floor(Math.random() * candidates.length)];
    var others = shuffle(F.pool.filter(function (k) { return k !== target && !lookalike(k, target); }));
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
    setTimeout(function () { if (gen === F.gen) { audio.chime(); burst(F.balloons); gain(2, F.balloons); if (F.first >= 4) awardTicket(F.balloons); } }, 1200);
    F.timer = setTimeout(function () {
      if (gen !== F.gen) return;
      leaveFind(); buildMenu(); show('menu');
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

  function startPop(cat) {
    var pool = poolFor(cat);
    if (!pool.length) { cat = 'upper'; pool = poolFor(cat); }
    leavePop();
    G.kind = cat; G.pool = pool; G.n = 0; G.target = null; G.firstTry = 0;
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
    var opts = G.pool.filter(function (k) { return k !== t && !lookalike(k, t); });
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
    var cands = G.pool.filter(function (k) { return k !== G.target; });
    var floating = visibleKeys().filter(function (k) { return k !== G.target && G.pool.indexOf(k) >= 0; });
    G.target = floating.length && Math.random() < 0.6
      ? floating[Math.floor(Math.random() * floating.length)]
      : cands[Math.floor(Math.random() * cands.length)];
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
    setTimeout(function () { if (gen === G.gen) { audio.chime(); burst(G.fx); gain(bonus, G.fx); if (G.firstTry >= 4) awardTicket(G.fx); } }, 400);
    G.timer = setTimeout(function () {
      if (gen !== G.gen) return;
      leavePop(); buildMenu(); show('menu');
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
    C.n = 0; C.firstTry = 0; C.answer = 0;
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
    var lo = C.n <= 2 ? 1 : 2, hi = C.n <= 2 ? 3 : C.n <= 4 ? 6 : 9, ans;
    do { ans = lo + Math.floor(Math.random() * (hi - lo + 1)); } while (ans === C.answer);
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
    setTimeout(function () { if (gen === C.gen) { audio.chime(); burst(C.fx); gain(bonus, C.fx); if (C.firstTry >= 4) awardTicket(C.fx); } }, 1200);
    C.timer = setTimeout(function () {
      if (gen !== C.gen) return;
      leaveCount(); buildGames(); show('games');
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

  // ---------- Goodbye ----------
  function buildBye() {
    var s = scr.bye;
    s.textContent = '';
    var w = h('div', 'byewrap', catFor(state.profile || 'pinky', { cls: 'sleep' }));
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
    if (current === 'count') startCount();
    else if (current === 'pop') startPop(G.kind);
    else if (current === 'find') startFind(F.kind);
    else if (current === 'trace' && state.glyph) openTrace(state.cat, state.pos);
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
    var back = h('button', 'btn ghost'); back.textContent = 'Terug'; card.appendChild(back);
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

    card.appendChild(row('Hoe streng nakijken?', seg([['soepel', 'Soepel'], ['normaal', 'Normaal'], ['streng', 'Streng']], d.settings.strict,
      function (v) { d.settings.strict = v; store.save(); })));
    card.appendChild(row('Muziek', seg([['aan', 'Aan'], ['uit', 'Uit']], d.settings.music ? 'aan' : 'uit',
      function (v) { d.settings.music = v === 'aan'; store.save(); audio.setMusic(d.settings.music); })));
    card.appendChild(row('Naam bij Pinky', nameInput('pinky')));
    card.appendChild(row('Naam bij Groentje', nameInput('groentje')));

    var actions = h('div', 'actions');
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
    actions.appendChild(reset); actions.appendChild(close); actions.appendChild(back);
    card.appendChild(actions);

    openModal(card, 60000);
  }

  // ---------- Hidden paw print: 5 quick taps open the sum ----------
  var paw = h('button', null, LC.pawSVG());
  paw.id = 'paw';
  paw.setAttribute('aria-label', 'ouders');
  document.body.appendChild(paw);
  var taps = [];
  paw.addEventListener('click', function () {
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 3000; });
    taps.push(now);
    if (taps.length >= 5) { taps = []; openGate(); }
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
