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
  ['profile', 'games', 'menu', 'trace', 'find', 'pop', 'bye'].forEach(function (n) {
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
    var wrap = h('div', 'pwrap');
    ['pinky', 'groentje'].forEach(function (key) {
      var b = h('button', 'pcard pc-' + key, LC.catSVG(key, {}));
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
    buildTrace();
    buildFind();
    buildPop();
    buildGames();
    show('games');
    audio.voiceWelcome();
  }

  // ---------- Which game? ----------
  function buildGames() {
    var s = scr.games, key = state.profile;
    s.textContent = '';
    var sw = h('button', 'switch', LC.catSVG(other(key), { head: true }));
    sw.addEventListener('click', function () { buildProfile(); show('profile'); });
    s.appendChild(sw);

    var mc = h('div', 'games-cat', LC.catSVG(key, {}));
    var nm = h('div', 'pname'); nm.textContent = LC.CATS[key].name; mc.appendChild(nm);
    var kid = store.get().profiles[key].name;
    if (kid) { var kn = h('div', 'kname'); kn.textContent = kid; mc.appendChild(kn); }
    s.appendChild(mc);

    var row = h('div', 'gcards');
    [['trace', 'Schrijven'], ['find', 'Zoeken'], ['pop', 'Prikken']].forEach(function (g, i) {
      var c = h('button', 'gcard gc-' + g[0], LC.gameCardSVG(g[0]));
      c.dataset.game = g[0];
      var t = h('div', 'gtitle'); t.textContent = g[1]; c.appendChild(t);
      c.style.animationDelay = (-i * 0.9) + 's';
      c.addEventListener('click', function () { state.game = g[0]; buildMenu(); show('menu'); });
      row.appendChild(c);
    });
    s.appendChild(row);
  }

  // ---------- Letter and number choice ----------
  function buildMenu() {
    var s = scr.menu, key = state.profile, prof = store.get().profiles[key];
    s.textContent = '';
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

    var mc = h('div', 'menu-cat', LC.catSVG(key, {}));
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
    var cat = h('div', 'trace-cat', LC.catSVG(state.profile, {}));
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
    var c = current === 'find' ? F.cat : current === 'pop' ? G.cat : T.cat;
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
    var list = listFor(state.cat), last = state.cat === 'name' && state.pos === list.length - 1;
    if (last) {
      // The whole name is done: a bigger celebration, then back to the choice screen.
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
    var cat = h('div', 'trace-cat', LC.catSVG(state.profile, {}));
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
    F.kind = cat; F.pool = pool; F.n = 0; F.target = null;
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
      btn.classList.add('right');
      Array.prototype.forEach.call(F.choices.children, function (c) { if (c !== btn) c.classList.add('fade'); });
      setMood('happy');
      audio.chime();
      F.bubble.classList.remove('on');
      setTimeout(function () { if (gen === F.gen) audio.voicePraise(); }, 500);
      burst(F.balloons);
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
    setTimeout(function () { if (gen === F.gen) { audio.chime(); burst(F.balloons); } }, 1200);
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
    var cat = h('div', 'trace-cat', LC.catSVG(state.profile, {}));
    var bubble = h('div', 'bubble');
    cat.appendChild(bubble);
    cat.addEventListener('click', function () { speakTarget(G); });
    var dots = h('div', 'dots');
    var sky = h('div', 'popsky');
    var fx = h('div', 'balloons');
    s.appendChild(home); s.appendChild(cat); s.appendChild(dots); s.appendChild(sky); s.appendChild(fx);
    G = { cat: cat.querySelector('.cat'), bubble: bubble, dots: dots, sky: sky, fx: fx,
      gen: 0, timer: 0, hintT: 0, spawn: 0, n: 0, pool: [], target: null, wrong: 0, locked: true, kind: 'upper' };
  }

  function leavePop() {
    clearInterval(G.spawn); clearTimeout(G.timer); clearTimeout(G.hintT);
    G.gen++;
    if (G.sky) G.sky.innerHTML = '';
    audio.stopVoice();
  }

  function startPop(cat) {
    var pool = poolFor(cat);
    if (!pool.length) { cat = 'upper'; pool = poolFor(cat); }
    leavePop();
    G.kind = cat; G.pool = pool; G.n = 0; G.target = null;
    show('pop');
    G.spawn = setInterval(spawnTick, 1500);
    nextPopRound();
  }

  function distractor() {
    var t = G.target;
    var opts = G.pool.filter(function (k) { return k !== t && !lookalike(k, t); });
    if (!opts.length) opts = G.pool.filter(function (k) { return k !== t; });
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function targetCount() { return G.sky.querySelectorAll('[data-key="' + G.target + '"]').length; }

  function spawnTick() {
    if (!G.target || G.sky.children.length >= 5) return;
    var wantTarget = !G.locked && targetCount() < 2 && Math.random() < 0.4;
    spawnBalloon(wantTarget ? G.target : distractor());
  }

  function spawnBalloon(key) {
    var color = LC.BALLOON_COLORS[Math.floor(Math.random() * LC.BALLOON_COLORS.length)];
    var b = h('button', 'pballoon', LC.balloonLetterSVG(color, key));
    b.dataset.key = key;
    b.style.left = (30 + Math.random() * 58) + 'vw';
    b.style.animationDuration = (9 + Math.random() * 3) + 's';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); popTap(b, key); });
    b.addEventListener('animationend', function (e) {
      if (e.animationName !== 'floatup') return;
      if (b.parentNode) b.parentNode.removeChild(b);
      if (!G.locked && G.target && !targetCount()) spawnBalloon(G.target);
    });
    G.sky.appendChild(b);
    return b;
  }

  function nextPopRound() {
    clearTimeout(G.timer); clearTimeout(G.hintT);
    G.gen++;
    var gen = G.gen;
    if (G.n >= ROUNDS) { popFinale(gen); return; }
    G.n++; G.wrong = 0;

    var cands = G.pool.filter(function (k) { return k !== G.target; });
    G.target = cands[Math.floor(Math.random() * cands.length)];
    G.locked = false;
    G.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) G.dots.appendChild(h('span', 'dot' + (i < G.n - 1 ? ' on' : i === G.n - 1 ? ' cur' : '')));
    G.bubble.classList.remove('on');
    setMood('idle');
    if (!targetCount()) spawnBalloon(G.target);
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
    if (G.locked || key !== G.target) {
      if (!G.locked) {
        G.wrong++;
        audio.boop();
        if (G.wrong % 2 === 0) {
          setMood('oops'); audio.voiceRetry();
          G.timer = setTimeout(function () { if (gen === G.gen) speakTarget(G); }, 1800);
        }
      }
      b.classList.add('bounce');
      setTimeout(function () { b.classList.remove('bounce'); }, 520);
      return;
    }
    G.locked = true;
    clearTimeout(G.hintT);
    sparks(b);
    if (b.parentNode) b.parentNode.removeChild(b);
    audio.pop();
    setMood('happy');
    G.bubble.classList.remove('on');
    setTimeout(function () { audio.chime(); }, 150);
    setTimeout(function () { if (gen === G.gen) audio.voicePraise(); }, 600);
    G.timer = setTimeout(nextPopRound, 2800);
  }

  function popFinale(gen) {
    G.locked = true;
    G.target = null;
    clearInterval(G.spawn);
    G.dots.innerHTML = '';
    for (var i = 0; i < ROUNDS; i++) G.dots.appendChild(h('span', 'dot on'));
    setMood('happy');
    Array.prototype.forEach.call(G.sky.children, function (b, i) {
      setTimeout(function () { if (gen === G.gen && b.parentNode) { sparks(b); audio.pop(); b.parentNode.removeChild(b); } }, 200 + i * 250);
    });
    setTimeout(function () { if (gen === G.gen) { audio.chime(); burst(G.fx); } }, 400);
    G.timer = setTimeout(function () {
      if (gen !== G.gen) return;
      leavePop(); buildMenu(); show('menu');
    }, 5000);
  }

  // ---------- Goodbye ----------
  function buildBye() {
    var s = scr.bye;
    s.textContent = '';
    var w = h('div', 'byewrap', LC.catSVG(state.profile || 'pinky', { cls: 'sleep' }));
    var t = h('div', 'byetext'); t.textContent = 'Tot ziens! zzz';
    w.appendChild(t);
    s.appendChild(w);
  }

  function closeGame() {
    closeModal();
    leaveTrace();
    leaveFind();
    leavePop();
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
    if (current === 'pop') startPop(G.kind);
    else if (current === 'find') startFind(F.kind);
    else if (current === 'trace' && state.glyph) openTrace(state.cat, state.pos);
    else if (current === 'games') buildGames();
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
      store.resetProgress(); armed = false; reset.textContent = 'Gewist';
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
