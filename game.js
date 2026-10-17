(function () {
  'use strict';
  var LC = window.LC, store = LC.store, audio = LC.audio;
  var state = { profile: null, glyph: null, cat: 'upper' };
  var tracer = null, advanceTimer = 0, moodTimer = 0, token = 0, current = 'profile', T = {};

  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function other(key) { return key === 'pinky' ? 'groentje' : 'pinky'; }

  var app = document.getElementById('app');
  app.appendChild(h('div', 'bg', LC.sceneSVG()));
  var scr = {};
  ['profile', 'menu', 'trace', 'bye'].forEach(function (n) {
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
    buildMenu();
    show('menu');
    audio.voiceWelcome();
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

    var sw = h('button', 'switch', LC.catSVG(other(key), { head: true }));
    sw.addEventListener('click', function () { buildProfile(); show('profile'); });
    s.appendChild(sw);

    var mc = h('div', 'menu-cat', LC.catSVG(key, {}));
    var nm = h('div', 'pname'); nm.textContent = LC.CATS[key].name; mc.appendChild(nm);
    if (prof.name) { var kn = h('div', 'kname'); kn.textContent = prof.name; mc.appendChild(kn); }
    s.appendChild(mc);

    var tabs = h('div', 'tabs');
    [['upper', 'A'], ['lower', 'a'], ['digit', '1']].forEach(function (c) {
      var tb = h('button', 'tab' + (c[0] === state.cat ? ' on' : ''), LC.glyphSVG(c[1], { sw: 16 }));
      tb.dataset.cat = c[0];
      tb.addEventListener('click', function () { state.cat = c[0]; buildMenu(); });
      tabs.appendChild(tb);
    });
    s.appendChild(tabs);

    var grid = h('div', 'grid ' + (state.cat === 'digit' ? 'g5' : 'g7'));
    LC.CATEGORIES[state.cat].forEach(function (k) {
      var done = prof.done[k] || 0, stars = '';
      for (var j = 0; j < Math.min(5, done); j++) stars += '★';
      var t = h('button', 'tile', LC.glyphSVG(k, { sw: 16 }));
      t.dataset.key = k;
      var st = h('div', 'stars'); st.textContent = stars; t.appendChild(st);
      t.addEventListener('click', function () { openTrace(k); });
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

  function neighbour(key, d) {
    var list = LC.CATEGORIES[LC.categoryOf(key)], i = list.indexOf(key);
    return list[(i + d + list.length) % list.length];
  }
  function step(d) { openTrace(neighbour(state.glyph, d)); }

  function setMood(m) {
    var c = T.cat;
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

  function openTrace(key) {
    clearTimeout(advanceTimer); token++;
    var mine = token;
    state.glyph = key;
    state.cat = LC.categoryOf(key);
    if (tracer) { tracer.destroy(); tracer = null; }
    show('trace');
    T.cur.innerHTML = LC.glyphSVG(key, { sw: 15 });
    setMood('idle');
    tracer = new LC.Tracer(T.card, key, store.get().settings.strict, {
      onSuccess: function () { success(key, mine); },
      onTry: function () { setMood('oops'); audio.boop(); audio.voiceRetry(); },
      onHelp: function () { setMood('help'); audio.voiceHelp(); },
      onHelpDone: function () { setMood('idle'); }
    });
    setTimeout(function () { if (mine === token) audio.voiceLetter(LC.GLYPHS[key].sound); }, 350);
    if ((store.get().profiles[state.profile].done[key] || 0) < 3) {
      setTimeout(function () { if (mine === token) showHow(); }, 1100);
    }
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
    advanceTimer = setTimeout(function () {
      if (mine !== token) return;
      openTrace(neighbour(key, 1));
    }, 3800);
  }

  function burst() {
    for (var i = 0; i < 7; i++) {
      var b = h('div', 'balloon', LC.balloonSVG(LC.BALLOON_COLORS[i % LC.BALLOON_COLORS.length]));
      b.style.left = (6 + Math.random() * 84) + '%';
      b.style.setProperty('--dx', (Math.random() * 16 - 8) + 'vw');
      b.style.animationDelay = (i * 0.16) + 's';
      b.style.animationDuration = (3.6 + Math.random() * 1.2) + 's';
      T.balloons.appendChild(b);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6500); })(b);
    }
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
    if (current === 'trace' && state.glyph) openTrace(state.glyph);
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
