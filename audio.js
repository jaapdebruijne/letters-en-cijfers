(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  var PRAISE_COUNT = 5, RETRY_COUNT = 3;
  var ctx = null, musicGain = null, sfxGain = null, timer = null;
  var nextT = 0, step = 0, running = false, wantMusic = true;
  var STEP = 60 / 84 / 2;

  var N = { F2: 87.31, G2: 98, A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };
  var MEL = ['E5', 0, 'G5', 0, 'A5', 'G5', 'E5', 0, 'D5', 0, 'E5', 0, 'G5', 'E5', 'D5', 0,
    'C5', 0, 'E5', 0, 'G5', 'A5', 'G5', 0, 'A5', 'G5', 'E5', 'D5', 'C5', 0, 0, 0];
  var BASS = [['C3', 'G3'], ['A2', 'E3'], ['F2', 'C3'], ['G2', 'D3']];

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, t, dur, vol, type, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function tick() {
    if (!ctx) return;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.5) {
      var s = step % 32, f = MEL[s], bar = Math.floor(s / 8), k = s % 8;
      if (f) tone(N[f], nextT, 1.1, 0.16, 'triangle', musicGain);
      if (k === 0) tone(N[BASS[bar][0]], nextT, 1.6, 0.14, 'sine', musicGain);
      if (k === 4) tone(N[BASS[bar][1]], nextT, 1.0, 0.09, 'sine', musicGain);
      nextT += STEP; step++;
    }
  }

  function startMusic() {
    if (!ensure() || running || !wantMusic) return;
    running = true;
    nextT = ctx.currentTime + 0.1;
    tick();
    timer = setInterval(tick, 150);
    musicGain.gain.setTargetAtTime(0.25, ctx.currentTime, 0.8);
  }

  function stopMusic() {
    if (!ctx || !running) return;
    running = false;
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    var t = timer; timer = null;
    setTimeout(function () { clearInterval(t); }, 900);
  }

  // ---- Voice clips: audio/letters/*.mp3 and audio/phrases/*.mp3 ----
  var clips = {}, curVoice = null, seq = 0;

  function clipUrl(path) {
    if (!clips[path]) {
      clips[path] = fetch(path)
        .then(function (r) { return r.ok ? r.blob() : null; })
        .then(function (b) { return b && b.size > 0 ? URL.createObjectURL(b) : null; })
        .catch(function () { return path; });
    }
    return clips[path];
  }

  function stopVoice() {
    seq++;
    if (curVoice) { try { curVoice.pause(); } catch (e) { /* ignore */ } curVoice = null; }
  }

  function playVoice(path) {
    stopVoice();
    var mine = seq;
    clipUrl(path).then(function (u) {
      if (!u || mine !== seq) return;
      var a = new Audio(u);
      curVoice = a;
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* silent if blocked or missing */ });
    });
  }

  function pick(n) { return 1 + Math.floor(Math.random() * n); }

  LC.audio = {
    unlock: function () { ensure(); },
    setMusic: function (on) { wantMusic = on; if (on) startMusic(); else stopMusic(); },
    stopVoice: stopVoice,
    preload: function () {
      LC.ORDER.forEach(function (k) { clipUrl('audio/letters/' + LC.GLYPHS[k].sound.toLowerCase() + '.mp3'); });
      ['welkom', 'kies', 'kijk'].forEach(function (n) { clipUrl('audio/phrases/' + n + '.mp3'); });
      for (var i = 1; i <= PRAISE_COUNT; i++) clipUrl('audio/phrases/goed-' + i + '.mp3');
      for (var j = 1; j <= RETRY_COUNT; j++) clipUrl('audio/phrases/nogeens-' + j + '.mp3');
    },
    voiceLetter: function (sound) { playVoice('audio/letters/' + String(sound).toLowerCase() + '.mp3'); },
    voiceWelcome: function () { playVoice('audio/phrases/welkom.mp3'); },
    voiceChoose: function () { playVoice('audio/phrases/kies.mp3'); },
    voiceHelp: function () { playVoice('audio/phrases/kijk.mp3'); },
    voicePraise: function () { playVoice('audio/phrases/goed-' + pick(PRAISE_COUNT) + '.mp3'); },
    voiceRetry: function () { playVoice('audio/phrases/nogeens-' + pick(RETRY_COUNT) + '.mp3'); },
    chime: function () {
      if (!ensure()) return;
      var t = ctx.currentTime + 0.02;
      [N.C6, N.E6, N.G6].forEach(function (f, i) { tone(f, t + i * 0.13, 0.9, 0.22, 'sine', sfxGain); });
    },
    boop: function () {
      if (!ensure()) return;
      var t = ctx.currentTime + 0.02;
      tone(392, t, 0.35, 0.18, 'sine', sfxGain);
      tone(330, t + 0.16, 0.45, 0.16, 'sine', sfxGain);
    }
  };

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (wantMusic || running) ctx.resume();
  });
})();
