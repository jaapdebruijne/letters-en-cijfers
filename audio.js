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

  // ---- Engine sound for the bonus ride ----
  // One short engine "cycle" (a few combustion thumps) is made once and looped; speeding up
  // the loop makes the engine rev. If audio/ride/engine.mp3 exists, that loop is used instead.
  var eng = null, synthEngine = null, userEngine = null;

  function buildEngineBuffer() {
    var sr = ctx.sampleRate, per = Math.round(sr / 30), cycles = 24;
    var buf = ctx.createBuffer(1, per * cycles, sr), d = buf.getChannelData(0);
    var amps = [1, 0.55, 0.82, 0.5], peak = 0, c, i;
    for (c = 0; c < cycles; c++) {
      var amp = amps[c % 4] * (0.92 + 0.16 * Math.sin(c * 1.7));
      for (i = 0; i < per; i++) {
        var t = i / sr, env = Math.exp(-t / 0.007);
        var v = env * (Math.sin(6.283 * 85 * t) + 0.5 * Math.sin(6.283 * 170 * t + 0.6)) +
          0.35 * env * (Math.random() * 2 - 1) +
          0.3 * Math.exp(-t / 0.022) * Math.sin(6.283 * 48 * t);
        d[c * per + i] = amp * v;
        if (Math.abs(amp * v) > peak) peak = Math.abs(amp * v);
      }
    }
    for (i = 0; i < d.length; i++) d[i] = d[i] / peak * 0.9;
    return buf;
  }

  function loadUserEngine() {
    if (!ctx || userEngine !== null) return;
    userEngine = false;
    fetch('audio/ride/engine.mp3')
      .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
      .then(function (ab) { return ab ? ctx.decodeAudioData(ab) : null; })
      .then(function (b) { if (b) userEngine = b; })
      .catch(function () { /* no own engine sound: the made one is used */ });
  }

  function engineStart(pitch) {
    if (!ensure() || eng) return;
    var buf = userEngine || synthEngine || (synthEngine = buildEngineBuffer());
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), comp = ctx.createDynamicsCompressor();
    src.buffer = buf; src.loop = true;
    f.type = 'lowpass'; f.frequency.value = 800; f.Q.value = 1.2;
    g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(comp); comp.connect(ctx.destination);
    src.start();
    eng = { src: src, f: f, g: g, pitch: pitch || 1 };
  }

  function engineSet(speed, gas, air) {
    if (!eng) return;
    var t = ctx.currentTime, rate = (0.9 + speed * 3.4 + (gas ? 0.5 : 0) + (air ? 0.9 : 0)) * eng.pitch;
    eng.src.playbackRate.setTargetAtTime(rate, t, 0.09);
    eng.f.frequency.setTargetAtTime(450 + rate * 380 + (gas ? 600 : 0), t, 0.09);
    eng.g.gain.setTargetAtTime(air ? 0.16 : gas ? 0.42 : 0.17, t, 0.08);
  }

  function engineStop() {
    if (!eng) return;
    var e = eng; eng = null;
    e.g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(function () { try { e.src.stop(); } catch (err) { /* already stopped */ } }, 300);
  }

  // ---- Voice clips: audio/letters/*.mp3 and audio/phrases/*.mp3 ----
  var clips = {}, curVoice = null, curDone = null, seq = 0;

  var TTS_TEXTS = {
    'aa': 'aa', 'ee': 'ee', 'oo': 'oo', 'oe': 'oe', 'ij': 'ij',
    'eu': 'eu', 'ie': 'ie', 'ou': 'ou', 'uu': 'uu', 'au': 'au', 'ui': 'ui', 'ei': 'ei',
    'kern-locked': 'Deze letters kun je nog niet oefenen. Vraag papa of mama als je deze letters wil oefenen.',
    'kern-notyet': 'Deze letters kun je nog niet oefenen. Oefen de andere letters eerst nog een beetje meer.',
    'stempel-verdiend': 'Hoera! Je hebt een stempel verdiend! Speel ook andere spelletjes om meer stempels te verdienen.',
    'bonusrit-verdiend': 'Wow! Je hebt genoeg stempels verdiend voor een bonusritje met de auto. Veel plezier, en doe voorzichtig!',
    'stempels-nodig': 'Oeps, je hebt nog niet genoeg stempels verdiend. Speel nog wat andere spelletjes om meer stempels te verdienen.'
  };

  function speakTTS(text) {
    if (!window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-NL'; u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function clipUrl(path) {
    if (!clips[path]) {
      clips[path] = fetch(path)
        .then(function (r) {
          if (!r.ok) return null;
          var ct = (r.headers.get('content-type') || '').toLowerCase();
          return (ct.indexOf('audio') !== -1 || ct.indexOf('octet-stream') !== -1) ? r.blob() : null;
        })
        .then(function (b) { return b && b.size > 0 ? URL.createObjectURL(b) : null; })
        .catch(function () { return null; });
    }
    return clips[path];
  }

  // TTS (Web Speech API) for phonetic sounds; cancels when stopVoice is called.
  var ttsSeq = 0;
  function tts(text) {
    var synth = window.speechSynthesis;
    if (!synth) return Promise.resolve();
    synth.cancel();
    var mine = ++ttsSeq;
    return new Promise(function (resolve) {
      var done = false, spoke = false;
      function finish() { if (!done) { done = true; if (LC.audio.onTalkingChange) LC.audio.onTalkingChange(false); resolve(); } }
      var utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'nl-NL'; utt.rate = 0.9; utt.pitch = 1.0;
      utt.onstart = function () { if (mine === ttsSeq && LC.audio.onTalkingChange) LC.audio.onTalkingChange(true); };
      utt.onend = finish; utt.onerror = finish;
      function doSpeak() {
        if (spoke || mine !== ttsSeq) { finish(); return; }
        spoke = true;
        var vs = synth.getVoices();
        var nl = vs.find(function (v) { return v.lang && v.lang.startsWith('nl'); });
        if (nl) utt.voice = nl;
        synth.speak(utt);
      }
      if (synth.getVoices().length) doSpeak();
      else { synth.onvoiceschanged = doSpeak; setTimeout(doSpeak, 300); }
    });
  }

  var PHONETICS = {
    a: 'aaa', b: 'b', c: 'k', d: 'd', e: 'eee', f: 'fff',
    g: 'ggg', h: 'hhh', i: 'ie', j: 'j', k: 'k', l: 'lll',
    m: 'mmm', n: 'nnn', o: 'ooo', p: 'p', q: 'kw', r: 'rrr',
    s: 'sss', t: 't', u: 'uuu', v: 'vvv', w: 'ww', x: 'ks',
    y: 'ij', z: 'zzz'
  };

  function stopVoice() {
    seq++;
    ttsSeq++;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (curVoice) { try { curVoice.pause(); } catch (e) { /* ignore */ } curVoice = null; }
    if (curDone) { var d = curDone; curDone = null; d(true); }
    if (LC.audio.onTalkingChange) LC.audio.onTalkingChange(false);
  }

  // Resolves true when a recording exists for this clip, once it has finished playing (or was stopped), so a
  // second clip can follow it without cutting it off. Resolves false when there is no recording.
  function playVoice(path) {
    stopVoice();
    var mine = seq;
    return clipUrl(path).then(function (u) {
      if (!u) {
        var ttsKey = path.replace(/^audio\/letters\//, '').replace(/^audio\/phrases\//, '').replace(/\.mp3$/, '');
        if (TTS_TEXTS[ttsKey]) return tts(TTS_TEXTS[ttsKey]).then(function () { return false; });
        return false;
      }
      if (mine !== seq) return true;
      var a = new Audio(u);
      curVoice = a;
      a.addEventListener('playing', function () { if (LC.audio.onTalkingChange) LC.audio.onTalkingChange(true); });
      a.addEventListener('ended', function () { if (LC.audio.onTalkingChange) LC.audio.onTalkingChange(false); });
      a.addEventListener('error', function () { if (LC.audio.onTalkingChange) LC.audio.onTalkingChange(false); });
      return new Promise(function (resolve) {
        var done = function () { if (curDone === done) curDone = null; resolve(true); };
        curDone = done;
        a.addEventListener('ended', done);
        a.addEventListener('error', done);
        var p = a.play();
        if (p && p.catch) p.catch(done);
      });
    });
  }

  function pick(n) { return 1 + Math.floor(Math.random() * n); }

  LC.audio = {
    onTalkingChange: null,
    unlock: function () { ensure(); loadUserEngine(); },
    setMusic: function (on) { wantMusic = on; if (on) startMusic(); else stopMusic(); },
    stopVoice: stopVoice,
    preload: function () {
      var seen = {};
      LC.ORDER.forEach(function (k) {
        var s = LC.GLYPHS[k].sound;
        var f = /-klein$/.test(s) ? s.replace(/-klein$/, '-fo') : s;
        if (!seen[f]) { seen[f] = 1; clipUrl('audio/letters/' + f + '.mp3'); }
      });
      ['welkom', 'kies', 'kijk', 'hoeveel', 'wissel', 'meer', 'erbij', 'naam', 'leeftijd', 'stempel-verdiend', 'bonusrit-verdiend', 'stempels-nodig'].forEach(function (n) { clipUrl('audio/phrases/' + n + '.mp3'); });
      for (var i = 1; i <= PRAISE_COUNT; i++) clipUrl('audio/phrases/goed-' + i + '.mp3');
      for (var j = 1; j <= RETRY_COUNT; j++) clipUrl('audio/phrases/nogeens-' + j + '.mp3');
    },
    voiceLetter: function (sound) { return playVoice('audio/letters/' + String(sound).toLowerCase() + '.mp3'); },
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
    engineStart: engineStart,
    engineSet: engineSet,
    engineStop: engineStop,
    voiceMath: function (type) { return playVoice('audio/phrases/' + (type === 'meer' ? 'meer' : 'erbij') + '.mp3'); },
    voiceSwitch: function () { return playVoice('audio/phrases/wissel.mp3'); },
    voiceHowMany: function () { return playVoice('audio/phrases/hoeveel.mp3'); },
    voiceTTS: function (key) { return playVoice('audio/phrases/' + key + '.mp3'); },
    // Phonetic letter sound (klankzuiver): mp3 first, TTS as fallback.
    speakPhonetic: function (letter) {
      var lk = letter.toLowerCase().replace(/-klein$/, '');
      // Numbers: the "De twee" recording, computer voice only if it is missing.
      if (/^[0-9]$/.test(lk)) return playVoice('audio/letters/' + lk + '.mp3').then(function (heard) { if (!heard) return tts(lk); });
      return playVoice('audio/letters/' + lk + '-fo.mp3').then(function (heard) {
        if (heard) return;
        return tts(PHONETICS[lk] || lk);
      });
    },
    // "Doe mij maar na": plays mp3 if recorded, otherwise TTS.
    voiceDemoIntro: function () {
      return playVoice('audio/phrases/doe-mij-maar-na.mp3').then(function (heard) {
        if (heard) return;
        return tts('Doe mij maar na');
      });
    },
    // "Welke letter wil je nog een keer oefenen?"
    voicePickLetter: function () {
      return playVoice('audio/phrases/welke-letter.mp3').then(function (heard) {
        if (heard) return;
        return tts('Welke letter wil je nog een keer oefenen?');
      });
    },
    // First-run questions: mp3 if recorded, otherwise TTS.
    voiceName: function () {
      var t = 'Hoe heet jij? Als je je naam nog niet zelf kan schrijven, vraag dan papa of mama om deze voor je in te vullen.';
      return playVoice('audio/phrases/naam.mp3').then(function (heard) { if (!heard) return tts(t); });
    },
    voiceAge: function () {
      var t = 'Ik ben wel benieuwd hoe oud jij bent. Je kunt hier je leeftijd kiezen.';
      return playVoice('audio/phrases/leeftijd.mp3').then(function (heard) { if (!heard) return tts(t); });
    },
    // A rising note for each thing that is counted (1 = low, 9 = high).
    note: function (i) {
      if (!ensure()) return;
      var scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5, 1568];
      tone(scale[Math.max(0, Math.min(8, i - 1))], ctx.currentTime + 0.01, 0.5, 0.2, 'sine', sfxGain);
    },
    crash: function () {
      if (!ensure()) return;
      var t = ctx.currentTime + 0.01;
      tone(120, t, 0.35, 0.3, 'sine', sfxGain);
      tone(80, t + 0.1, 0.4, 0.26, 'sine', sfxGain);
      tone(55, t + 0.22, 0.5, 0.22, 'sine', sfxGain);
      LC.audio.pop();
    },
    pop: function () {
      if (!ensure()) return;
      var len = Math.floor(ctx.sampleRate * 0.12);
      var buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = 'highpass'; f.frequency.value = 700; g.gain.value = 0.5;
      src.connect(f); f.connect(g); g.connect(sfxGain);
      src.start(ctx.currentTime);
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
    if (document.hidden) { engineStop(); ctx.suspend(); }
    else if (wantMusic || running) ctx.resume();
  });
})();
