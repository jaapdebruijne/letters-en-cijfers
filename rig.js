(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // Moves the layers of the animal drawings (see avatars.js). The game only switches classes on the
  // <svg class="cat">: idle, happy, oops, help, zwaait, talking, sleep, still. This script does the rest.
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Rig(svg) {
    this.svg = svg;
    this.pet = svg.getAttribute('data-pet');
    this.anims = []; this.idle = []; this.timers = [];
    this.state = null; this.token = 0; this.dead = false;
    this.cache = {};
  }
  var R = Rig.prototype;

  R.l = function (name) {
    if (!(name in this.cache)) this.cache[name] = this.svg.querySelector('[data-l="' + name + '"]');
    return this.cache[name];
  };
  R.a = function (name, frames, dur, opts) {
    var el = this.l(name);
    if (!el) return null;
    var an = el.animate(frames, Object.assign({ duration: dur, fill: 'none', easing: 'ease-in-out' }, opts || {}));
    this.anims.push(an);
    return an;
  };
  R.rot = function (name, pts, dur, opts) {
    return this.a(name, pts.map(function (p) { return { offset: p[0], transform: 'rotate(' + p[1] + 'deg)' }; }), dur, opts);
  };
  R.tf = function (name, pts, dur, opts) {
    return this.a(name, pts.map(function (p) { return { offset: p[0], transform: p[1] }; }), dur, opts);
  };
  // Show (or hide) a layer between two points of a move.
  R.swap = function (name, show, s, e, dur) {
    var off = show ? 0 : 1, on = show ? 1 : 0, e2 = Math.min(1, e + 0.02);
    var f = [{ offset: 0, opacity: off }, { offset: s, opacity: off }, { offset: Math.min(1, s + 0.02), opacity: on }, { offset: e, opacity: on }];
    if (e < 1) f.push({ offset: e2, opacity: off }, { offset: 1, opacity: off });
    return this.a(name, f, dur, { easing: 'linear' });
  };
  R.set = function (name, prop, val) { var el = this.l(name); if (el) el.style[prop] = val; };
  R.clearAnims = function () {
    this.token++;
    this.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* ignore */ } });
    this.anims = [];
    this.timers.forEach(clearTimeout); this.timers = [];
  };
  R.later = function (fn, ms) { var t = setTimeout(fn, ms); this.timers.push(t); return t; };

  // ---------- idle: breathing, ears, a blink now and then
  R.startIdle = function () {
    this.stopIdle();
    if (reduce) return;
    var self = this;
    var ch = this.l('character');
    if (ch) this.idle.push(ch.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(.995,1.014)' }],
      { duration: 1700 + Math.random() * 400, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
    ['ear-left', 'ear-right'].forEach(function (id, i) {
      var el = self.l(id);
      if (el) self.idle.push(el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (i ? 1 : -1) * 1.6 + 'deg)' }],
        { duration: 2300 + i * 300, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: i * 400 }));
    });
    var tail = this.l('tail');
    if (tail) this.idle.push(tail.animate([{ transform: 'rotate(-5deg)' }, { transform: 'rotate(8deg)' }],
      { duration: 2400 + Math.random() * 400, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }));
    var loop = function () {
      self.blinkTimer = setTimeout(function () {
        if (self.dead || !self.svg.isConnected) return;
        if (!self.eyesBusy) self.blink();
        loop();
      }, 2200 + Math.random() * 3200);
    };
    loop();
  };
  R.stopIdle = function () {
    this.idle.forEach(function (a) { try { a.cancel(); } catch (e) { /* ignore */ } });
    this.idle = [];
    clearTimeout(this.blinkTimer);
  };

  // ---------- moves
  R.blink = function () {
    var d = 180, self = this;
    ['left', 'right'].forEach(function (s) {
      var open = self.l('eye-' + s + '-open'), closed = self.l('eye-' + s + '-closed');
      if (open) open.animate([
        { offset: 0, transform: 'scaleY(1)', opacity: 1 }, { offset: .4, transform: 'scaleY(.12)', opacity: 1 },
        { offset: .41, transform: 'scaleY(.12)', opacity: 0 }, { offset: .7, transform: 'scaleY(.12)', opacity: 0 },
        { offset: .71, transform: 'scaleY(.12)', opacity: 1 }, { offset: 1, transform: 'scaleY(1)', opacity: 1 }], { duration: d });
      if (closed) closed.animate([
        { offset: 0, opacity: 0 }, { offset: .4, opacity: 0 }, { offset: .41, opacity: 1 }, { offset: .7, opacity: 1 }, { offset: .71, opacity: 0 }, { offset: 1, opacity: 0 }], { duration: d });
    });
  };

  R.wave = function () {
    var d = 2400;
    var arm = [[0, 0], [.14, -150], [.24, -126], [.35, -150], [.46, -126], [.57, -150], [.68, -126], [.8, -140], [1, 0]];
    var hand = [[0, 0], [.14, -12], [.24, 18], [.35, -14], [.46, 18], [.57, -14], [.68, 18], [.8, 0], [1, 0]];
    this.rot('arm-right', arm, d); this.rot('hand-right', hand, d);
    this.rot('head', [[0, 0], [.15, 5], [.5, 3], [.8, 5], [1, 0]], d);
    this.rot('arm-left', [[0, 0], [.15, -6], [.8, -6], [1, 0]], d);
    this.swap('mouth-rest', false, .1, .85, d); this.swap('mouth-e', true, .1, .85, d);
  };

  R.cheer = function () {
    var d = 1800, lop = this.svg.getAttribute('data-pet') && /^(honey|pepper|pickle|mochi)$/.test(this.pet);
    var ears = lop ? [[0, 0], [.32, 14], [.5, -6], [.72, 10], [.86, -4], [1, 0]] : [[0, 0], [.32, 8], [.5, -6], [.72, 6], [.86, -3], [1, 0]];
    this.tf('character', [[0, 'translateY(0) scale(1,1)'], [.14, 'translateY(0) scale(1.06,.92)'], [.32, 'translateY(-70px) scale(.96,1.05)'],
      [.5, 'translateY(0) scale(1.08,.9)'], [.62, 'translateY(0) scale(1,1)'], [.73, 'translateY(-30px) scale(.98,1.03)'],
      [.86, 'translateY(0) scale(1.04,.96)'], [1, 'translateY(0) scale(1,1)']], d);
    this.tf('shadow', [[0, 'scale(1)'], [.14, 'scale(1.05)'], [.32, 'scale(.72)'], [.5, 'scale(1.06)'], [.73, 'scale(.86)'], [.86, 'scale(1.03)'], [1, 'scale(1)']], d);
    this.rot('arm-left', [[0, 0], [.14, 20], [.3, 135], [.4, 118], [.5, 142], [.62, 120], [.74, 140], [.88, 130], [1, 0]], d);
    this.rot('arm-right', [[0, 0], [.14, -20], [.3, -135], [.4, -118], [.5, -142], [.62, -120], [.74, -140], [.88, -130], [1, 0]], d);
    this.rot('ear-left', ears, d);
    this.rot('ear-right', ears.map(function (p) { return [p[0], -p[1]]; }), d);
    this.rot('tail', [[0, 0], [.2, 20], [.35, -22], [.5, 20], [.65, -22], [.8, 12], [1, 0]], d);
    this.tf('head', [[0, 'translateY(0)'], [.14, 'translateY(6px)'], [.32, 'translateY(-4px)'], [.5, 'translateY(6px)'], [.62, 'translateY(0)'], [1, 'translateY(0)']], d);
    this.swap('fx-sparkles', true, .24, .92, d);
    for (var i = 1; i <= 5; i++) {
      this.tf('sparkle-' + i, [[0, 'scale(.2) rotate(0deg)'], [.3, 'scale(.2) rotate(0deg)'], [.45 + i * .02, 'scale(1.15) rotate(25deg)'],
        [.65, 'scale(.8) rotate(45deg)'], [.85, 'scale(1.1) rotate(70deg)'], [1, 'scale(.3) rotate(90deg)']], d);
    }
  };

  R.oops = function (d) {
    d = d || 2300;
    this.tf('head', [[0, 'translateY(0) rotate(0deg)'], [.16, 'translateY(8px) rotate(-7deg)'], [.5, 'translateY(8px) rotate(-5deg)'], [.82, 'translateY(8px) rotate(-7deg)'], [1, 'translateY(0) rotate(0deg)']], d);
    this.rot('arm-left', [[0, 0], [.2, 172], [.3, 166], [.42, 173], [.54, 167], [.82, 172], [1, 0]], d);
    this.rot('arm-right', [[0, 0], [.2, -172], [.3, -166], [.42, -173], [.54, -167], [.82, -172], [1, 0]], d);
    this.rot('ear-left', [[0, 0], [.16, -14], [.82, -14], [1, 0]], d);
    this.rot('ear-right', [[0, 0], [.16, 14], [.82, 14], [1, 0]], d);
    this.tf('brow-left', [[0, 'translateY(0) rotate(0deg)'], [.14, 'translateY(-8px) rotate(-15deg)'], [.84, 'translateY(-8px) rotate(-15deg)'], [1, 'translateY(0) rotate(0deg)']], d);
    this.tf('brow-right', [[0, 'translateY(0) rotate(0deg)'], [.14, 'translateY(-8px) rotate(15deg)'], [.84, 'translateY(-8px) rotate(15deg)'], [1, 'translateY(0) rotate(0deg)']], d);
    this.swap('mouth-rest', false, .12, .86, d); this.swap('mouth-oops', true, .12, .86, d);
    this.swap('fx-blush-lines', true, .22, .86, d);
    this.a('fx-sweat', [{ offset: 0, opacity: 0, transform: 'translateY(-6px)' }, { offset: .22, opacity: 0, transform: 'translateY(-6px)' },
      { offset: .3, opacity: 1, transform: 'translateY(0)' }, { offset: .84, opacity: 1, transform: 'translateY(10px)' }, { offset: 1, opacity: 0, transform: 'translateY(14px)' }], d, { easing: 'linear' });
  };

  R.nod = function () {
    this.rot('head', [[0, 0], [.15, -9], [.3, 7], [.45, -9], [.6, 7], [.75, -9], [.9, 5], [1, 0]], 3000);
  };

  R.talkStart = function () {
    var self = this, shapes = ['rest', 'a', 'e', 'o', 'mbp'];
    this.talking = true;
    var tick = function () {
      if (!self.talking || self.dead || !self.svg.isConnected) return;
      var v = shapes[Math.floor(Math.random() * shapes.length)];
      shapes.forEach(function (s) { self.set('mouth-' + s, 'opacity', s === v ? '1' : '0'); });
      self.talkTimer = setTimeout(tick, 110 + Math.random() * 60);
    };
    tick();
    this.rot('head', [[0, 0], [.2, 2.5], [.45, -2], [.7, 2], [1, 0]], 2400, { iterations: Infinity });
  };
  R.talkStop = function () {
    this.talking = false;
    clearTimeout(this.talkTimer);
    var self = this;
    ['rest', 'a', 'e', 'o', 'mbp'].forEach(function (s) { self.set('mouth-' + s, 'opacity', ''); });
  };

  // Held states: eyes shut for sleep, happy eyes for a happy cat.
  R.hold = function (kind) {
    var self = this;
    ['left', 'right'].forEach(function (s) {
      self.set('eye-' + s + '-open', 'opacity', kind ? '0' : '');
      self.set('eye-' + s + '-closed', 'opacity', kind === 'sleep' ? '1' : '');
      self.set('eye-' + s + '-happy', 'opacity', kind === 'happy' ? '1' : '');
    });
    if (kind === 'happy') { this.set('mouth-rest', 'opacity', '0'); this.set('mouth-cheer', 'opacity', '1'); }
    else { this.set('mouth-rest', 'opacity', ''); this.set('mouth-cheer', 'opacity', ''); }
  };

  // Called whenever the class list of the svg changes.
  R.sync = function () {
    var cl = this.svg.classList, self = this;
    var st = ['still', 'sleep', 'happy', 'oops', 'help', 'zwaait'].filter(function (c) { return cl.contains(c); }).join(' ');
    var talking = cl.contains('talking');
    if (talking !== !!this.talking) { if (talking) this.talkStart(); else this.talkStop(); }
    if (st === this.state) return;
    this.state = st;
    this.clearAnims();
    this.eyesBusy = false;
    if (this.talking) { this.talkStop(); this.talkStart(); }
    this.hold('');
    if (cl.contains('still')) { this.stopIdle(); return; }
    if (cl.contains('sleep')) { this.stopIdle(); this.hold('sleep'); return; }
    this.startIdle();
    if (cl.contains('happy')) { this.eyesBusy = true; this.hold('happy'); this.cheer(); }
    else if (cl.contains('oops')) { this.eyesBusy = true; this.oops(1300); }
    else if (cl.contains('help')) this.nod();
    else if (cl.contains('zwaait')) this.wave();
  };

  R.destroy = function () {
    this.dead = true;
    this.stopIdle(); this.clearAnims(); this.talkStop();
    if (this.mo) this.mo.disconnect();
  };

  function attach(svg) {
    if (svg._rig || !svg.getAttribute('data-pet')) return;
    // The pivots are set from code: the page's security policy ignores style attributes inside the drawings.
    var vb = svg.viewBox.baseVal;
    Array.prototype.forEach.call(svg.querySelectorAll('[data-pivot]'), function (el) {
      var p = el.getAttribute('data-pivot').split(',');
      el.style.transformBox = 'view-box';
      el.style.transformOrigin = (p[0] - vb.x) + 'px ' + (p[1] - vb.y) + 'px';
    });
    var rig = svg._rig = new Rig(svg);
    rig.mo = new MutationObserver(function () { rig.sync(); });
    rig.mo.observe(svg, { attributes: true, attributeFilter: ['class'] });
    rig.sync();
  }

  // Every <svg class="cat"> that appears anywhere in the page gets a rig; removed ones are cleaned up.
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches && node.matches('svg.cat')) attach(node);
    if (node.querySelectorAll) Array.prototype.forEach.call(node.querySelectorAll('svg.cat'), attach);
  }
  function drop(node) {
    if (node.nodeType !== 1) return;
    var list = node.matches && node.matches('svg.cat') ? [node] : (node.querySelectorAll ? Array.prototype.slice.call(node.querySelectorAll('svg.cat')) : []);
    list.forEach(function (s) { if (s._rig && !s.isConnected) { s._rig.destroy(); s._rig = null; } });
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, scan);
        Array.prototype.forEach.call(m.removedNodes, drop);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  LC.rig = { attach: attach };
})();
