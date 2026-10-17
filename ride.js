(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  var H = 560;            // the world is 560 units high; the screen is scaled to fit
  var LEN = 22000;        // length of the course
  var OFF = 28;           // from the middle of the car down to the ground
  var STEP = 1 / 60;

  // Four worlds. Each ride picks one at random and shuffles the hills and jumps.
  // The waves are long and low on purpose, so the car rolls smoothly.
  var LEVELS = [
    { id: 'meadow', sky: ['#bfe6ff', '#fdf0f8'], far: '#e1d4f5', soil: '#f3d8ae', grass: '#8fdc8f', sun: '#fff3b0',
      amp: [95, 34, 14], lam: [1100, 600, 420], kickers: 5 },
    { id: 'desert', sky: ['#ffd2a1', '#fff3df'], far: '#f6c79b', soil: '#efc884', grass: '#e6b05a', sun: '#fff0a8',
      amp: [125, 40, 12], lam: [1500, 800, 500], kickers: 6 },
    { id: 'snow', sky: ['#d3e9ff', '#f5fbff'], far: '#c9dcf0', soil: '#ffffff', grass: '#cfe8ff', sun: '#ffffff',
      amp: [80, 44, 14], lam: [950, 540, 380], kickers: 5 },
    { id: 'night', sky: ['#2a2c6b', '#7d6fbd'], far: '#4a3f8f', soil: '#5b4b9c', grass: '#9a8be6', sun: '#f2f0ff', night: true,
      amp: [105, 40, 14], lam: [1250, 650, 430], kickers: 6 }
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // Hills from a few waves with random shifts (re-rolled until none is too steep), plus
  // jumps: a ramp that gets steeper towards the edge, then a sudden drop.
  function makeLevel() {
    var lv = LEVELS[Math.floor(Math.random() * LEVELS.length)], ph, hills, tries = 0, steepest;
    function build() {
      ph = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
      hills = function (x) {
        return lv.amp[0] * Math.sin(x / lv.lam[0] + ph[0]) + lv.amp[1] * Math.sin(x / lv.lam[1] + ph[1]) + lv.amp[2] * Math.sin(x / lv.lam[2] + ph[2]);
      };
      steepest = 0;
      for (var x = 600; x < LEN; x += 25) steepest = Math.max(steepest, Math.abs(hills(x + 5) - hills(x - 5)) / 10);
    }
    do { build(); tries++; } while (steepest > 0.58 && tries < 30);

    var kick = [], gap = (LEN - 3400) / lv.kickers;
    for (var i = 0; i < lv.kickers; i++) {
      kick.push({ x: 2000 + i * gap + (Math.random() - 0.5) * 300, h: 100 + Math.random() * 40 });
    }
    var RAMP = 420, DROP = 80;
    function ground(x) {
      var ramp = Math.min(1, Math.max(0, (x - 700) / 1500));
      var flat = Math.min(1, Math.max(0, (LEN + 300 - x) / 900));
      var y = 480 - ramp * flat * hills(x);
      for (var k = 0; k < kick.length; k++) {
        var dx = x - kick[k].x, hgt = 0;
        if (dx > -RAMP && dx <= 0) { var t = (dx + RAMP) / RAMP; hgt = kick[k].h * t * t; }
        else if (dx > 0 && dx < DROP) hgt = kick[k].h * (1 - dx / DROP);
        y -= hgt;
      }
      return y;
    }
    return { theme: lv, ground: ground, kick: kick };
  }
  LC.RideLevel = makeLevel;

  LC.Ride = function (host, opts) {
    var level = makeLevel(), ground = level.ground, theme = level.theme, veh = opts.vehicle;
    var phys = LC.carPhysics(veh, ground, { x: 140 });
    var car = phys.s;

    var canvas = el('canvas', 'ridecanvas');
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = 1000, scale = 1;
    function resize() {
      var r = host.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      scale = canvas.height / H;
      W = canvas.width / scale;
    }
    resize();
    window.addEventListener('resize', resize);

    // --- pedals and little display ---
    var hud = el('div', 'ridehud', '★ 0');
    var bar = el('div', 'ridebar'), fill = el('div', 'ridefill');
    bar.appendChild(fill);
    var brake = el('button', 'pedal brake', '<span>REM</span>');
    var gas = el('button', 'pedal gas', '<span>GAS</span>');
    host.appendChild(hud); host.appendChild(bar); host.appendChild(brake); host.appendChild(gas);

    var keys = { gas: false, brake: false }, touch = { gas: false, brake: false };
    function hold(btn, flag) {
      btn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        touch[flag] = true; btn.classList.add('down');
        try { btn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
        btn.addEventListener(ev, function () { touch[flag] = false; btn.classList.remove('down'); });
      });
    }
    hold(brake, 'brake'); hold(gas, 'gas');
    function onKey(down) {
      return function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'd' || k === ' ') keys.gas = down;
        if (k === 'ArrowLeft' || k === 'a') keys.brake = down;
      };
    }
    var kd = onKey(true), ku = onKey(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // --- the world ---
    var stars = [], i, sx;
    for (i = 0; i < 12; i++) {
      sx = 900 + i * (LEN - 2100) / 11 + (Math.random() - 0.5) * 140;
      stars.push({ x: sx, y: ground(sx) - 52 - Math.random() * 30, got: false });
    }
    // Up in the air after every jump: a prize for those who fly.
    level.kick.forEach(function (k) {
      var top = ground(k.x - 1);
      stars.push({ x: k.x + 190, y: top - OFF - 62, got: false });
    });
    var camY = car.y - H * 0.58;
    var collected = 0, finished = false, crashed = false, running = true, endT = 0, raf = 0, clock = 0;

    var head = new Image();
    head.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(opts.catSvg || '');
    var bodyImg = new Image();
    bodyImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(veh.bodySvg);
    var skyGrad = null;
    var nightStars = [];
    for (i = 0; i < 40; i++) nightStars.push([Math.random() * 1400, Math.random() * 320, 1 + Math.random() * 2]);

    function step(dt) {
      clock += dt;
      var gas_ = (keys.gas || touch.gas), brk = (keys.brake || touch.brake);
      if (finished) { gas_ = false; brk = true; }
      phys.step(dt, gas_, brk);

      camY += ((car.y - H * 0.58) - camY) * Math.min(1, dt * 3.5);

      for (var j = 0; j < stars.length; j++) {
        var s = stars[j];
        if (!s.got && Math.abs(s.x - car.x) < 80) {
          var dx = s.x - car.x, dy = s.y - car.y;
          if (dx * dx + dy * dy < 62 * 62) {
            s.got = true; collected++;
            hud.textContent = '★ ' + collected;
            if (opts.onStar) opts.onStar(collected);
          }
        }
      }
      fill.style.width = Math.max(0, Math.min(100, car.x / LEN * 100)) + '%';
      if (opts.onEngine) opts.onEngine(Math.min(1, Math.max(0, car.vx) / 600), gas_ && !crashed, car.air);

      if (!crashed && car.crashed) {
        crashed = true;
        if (opts.onCrash) opts.onCrash();
        endT = setTimeout(function () { if (running && opts.onFinish) opts.onFinish(collected, false); }, 1900);
      }
      if (!finished && !crashed && car.x >= LEN) {
        finished = true;
        endT = setTimeout(function () { if (running && opts.onFinish) opts.onFinish(collected, true); }, 2400);
      }
    }

    function drawStar(cx, cy, r) {
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r * 0.46 : r;
        ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffd23f'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.lineJoin = 'round'; ctx.stroke();
    }

    function drawCar() {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.a);
      var bob = crashed ? 0 : Math.sin(clock * 11) * Math.min(2.5, Math.abs(car.vx) / 160), hd = veh.head;
      if (head.complete && head.naturalWidth) ctx.drawImage(head, hd[0], hd[1] + bob, hd[2], hd[3]);
      if (bodyImg.complete && bodyImg.naturalWidth) ctx.drawImage(bodyImg, veh.vb[0], veh.vb[1], veh.vb[2], veh.vb[3]);
      ctx.restore();
      car.wheels.forEach(function (w) {
        ctx.save(); ctx.translate(w.cx, w.cy); ctx.rotate(w.rot);
        ctx.beginPath(); ctx.arc(0, 0, w.r, 0, 6.3); ctx.fillStyle = '#3b2f55'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, w.r * 0.45, 0, 6.3); ctx.fillStyle = '#cfd6e4'; ctx.fill();
        ctx.strokeStyle = '#8a7aa6'; ctx.lineWidth = 3;
        var q = w.r * 0.45;
        ctx.beginPath(); ctx.moveTo(-q, 0); ctx.lineTo(q, 0); ctx.moveTo(0, -q); ctx.lineTo(0, q); ctx.stroke();
        ctx.restore();
      });
    }

    function draw() {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      if (!skyGrad) {
        skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        skyGrad.addColorStop(0, theme.sky[0]); skyGrad.addColorStop(1, theme.sky[1]);
      }
      ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);
      var camX = car.x - W * 0.3 - Math.max(0, car.vx) * 0.12, x;

      if (theme.night) {
        ctx.fillStyle = '#ffffff';
        nightStars.forEach(function (s) {
          var px = ((s[0] - camX * 0.05) % 1400 + 1400) % 1400;
          if (px < W) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(clock * 2 + s[0]); ctx.fillRect(px, s[1], s[2], s[2]); }
        });
        ctx.globalAlpha = 1;
      }
      ctx.beginPath(); ctx.arc(W * 0.82, 110, 46, 0, 6.3); ctx.fillStyle = theme.sun; ctx.fill();
      ctx.fillStyle = theme.night ? 'rgba(255,255,255,0.18)' : '#ffffff';
      for (var c = 0; c < 6; c++) {
        var cx = ((c * 520 - camX * 0.15) % (W + 400) + (W + 400)) % (W + 400) - 200, cy = 90 + (c % 3) * 60;
        ctx.beginPath(); ctx.ellipse(cx, cy, 70, 24, 0, 0, 6.3); ctx.ellipse(cx + 40, cy - 14, 44, 22, 0, 0, 6.3); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(0, H);
      for (x = 0; x <= W + 20; x += 20) {
        var wx2 = x + camX * 0.35;
        ctx.lineTo(x, 400 - camY * 0.3 + 46 * Math.sin(wx2 / 300) + 24 * Math.sin(wx2 / 120));
      }
      ctx.lineTo(W + 20, H); ctx.closePath(); ctx.fillStyle = theme.far; ctx.fill();

      ctx.save();
      ctx.translate(-camX, -camY);
      var bottom = camY + H + 60, x0 = camX - 30, x1 = camX + W + 30, gx;
      ctx.beginPath(); ctx.moveTo(x0, bottom);
      for (gx = x0; gx <= x1; gx += 8) ctx.lineTo(gx, ground(gx));
      ctx.lineTo(x1, bottom); ctx.closePath();
      ctx.fillStyle = theme.soil; ctx.fill();
      ctx.beginPath();
      for (gx = x0; gx <= x1; gx += 8) ctx[gx === x0 ? 'moveTo' : 'lineTo'](gx, ground(gx) + 2);
      ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = theme.grass; ctx.stroke();

      var fy = ground(LEN);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(LEN - 3, fy - 150, 6, 150);
      for (var fx = 0; fx < 4; fx++) for (var fr = 0; fr < 3; fr++) {
        ctx.fillStyle = (fx + fr) % 2 ? '#3b2f55' : '#ffffff';
        ctx.fillRect(LEN + 3 + fx * 16, fy - 150 + fr * 16, 16, 16);
      }
      stars.forEach(function (s, idx) {
        if (!s.got && s.x > x0 - 40 && s.x < x1 + 40) drawStar(s.x, s.y + Math.sin(clock * 3 + idx) * 5, 22);
      });
      drawCar();
      ctx.restore();
    }

    function frame(t) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!frame.last) frame.last = t;
      var dt = Math.min(0.05, (t - frame.last) / 1000);
      frame.last = t;
      if (opts.paused && opts.paused()) {
        if (opts.onEngine) opts.onEngine(0, false, false);
        draw();
        return;
      }
      frame.acc = (frame.acc || 0) + dt;
      while (frame.acc >= STEP) { step(STEP); frame.acc -= STEP; }
      draw();
    }
    raf = requestAnimationFrame(frame);

    return {
      // Run the game forward without waiting (for testing).
      advance: function (seconds) {
        for (var t = 0; t < seconds; t += STEP) step(STEP);
        draw();
      },
      collected: function () { return collected; },
      stop: function () {
        running = false;
        cancelAnimationFrame(raf);
        clearTimeout(endT);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
      }
    };
  };
})();
