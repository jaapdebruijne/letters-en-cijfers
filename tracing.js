(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});
  var NS = 'http://www.w3.org/2000/svg';

  // r   = how close (in drawing units, the letter is ~120 wide) the finger must be to a checkpoint
  // cov = share of checkpoints that must really be touched
  // win = how many checkpoints ahead the finger may jump
  var STRICT = {
    soepel: { r: 21, cov: 0.8, win: 6 },
    normaal: { r: 18, cov: 0.8, win: 5 },
    streng: { r: 13, cov: 0.9, win: 4 }
  };
  var SLACK = 10;

  function mk(tag, attrs, cls) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute('class', cls);
    return e;
  }

  LC.Tracer = function (host, key, strictKey, cb) {
    var g = LC.GLYPHS[key], cfg = STRICT[strictKey] || STRICT.normaal;
    var svg = mk('svg', { viewBox: g.view.join(' ') }, 'board-svg');
    var wide = mk('g'), dots = mk('g'), ink = mk('g'), top = mk('g');
    svg.appendChild(wide); svg.appendChild(dots); svg.appendChild(ink); svg.appendChild(top);
    host.appendChild(svg);

    var totalLen = 0;
    var tracks = g.strokes.map(function (d) {
      wide.appendChild(mk('path', { d: d, stroke: g.color }, 'guide-wide'));
      var p = mk('path', { d: d, stroke: g.color }, 'guide-dots');
      dots.appendChild(p);
      var len = p.getTotalLength();
      totalLen += len;
      var n = Math.max(4, Math.round(len / 10)), pts = [];
      for (var i = 0; i <= n; i++) { var q = p.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
      var cover = [];
      for (var c = 0; c < pts.length; c++) cover.push(Infinity);
      return { pts: pts, next: 0, cover: cover, done: false };
    });

    var marker = mk('circle', { r: 11, stroke: g.color }, 'marker');
    var ghost = mk('circle', { r: 14, stroke: g.color, visibility: 'hidden' }, 'ghost');
    top.appendChild(marker); top.appendChild(ghost);

    var active = null, last = null, cur = null, curD = '', inkLen = 0;
    var locked = false, solved = false, dead = false, tries = 0;
    var attemptT = 0, helpT = 0, raf = 0;

    function placeMarker() {
      var t = null;
      for (var i = 0; i < tracks.length; i++) if (!tracks[i].done) { t = tracks[i]; break; }
      if (!t) { marker.setAttribute('visibility', 'hidden'); return; }
      var p = t.pts[Math.min(t.next, t.pts.length - 1)];
      marker.setAttribute('cx', p[0]); marker.setAttribute('cy', p[1]);
      marker.setAttribute('visibility', 'visible');
    }

    function resetTracks() {
      tracks.forEach(function (t) {
        t.next = 0; t.done = false;
        for (var i = 0; i < t.cover.length; i++) t.cover[i] = Infinity;
      });
      placeMarker();
    }

    function clearInk() {
      var old = Array.prototype.slice.call(ink.childNodes);
      old.forEach(function (n) { n.setAttribute('class', 'ink fading'); });
      setTimeout(function () { old.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); }, 450);
      inkLen = 0; cur = null; curD = '';
    }

    function local(e) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var r = pt.matrixTransform(m.inverse());
      return [r.x, r.y];
    }

    function minDist(t, p) {
      var best = Infinity;
      for (var i = 0; i < t.pts.length; i++) {
        var dx = t.pts[i][0] - p[0], dy = t.pts[i][1] - p[1], d = dx * dx + dy * dy;
        if (d < best) best = d;
      }
      return Math.sqrt(best);
    }

    // One finger position. Each stroke only moves forward, so the direction matters,
    // but the finger may skip a little and strokes may be done in any order.
    function coverage(t, r2) {
      var n = 0;
      for (var i = 0; i < t.cover.length; i++) if (t.cover[i] <= r2) n++;
      return n / t.cover.length;
    }

    function hit(p) {
      if (solved) return;
      var r2 = cfg.r * cfg.r, changed = false, best = Infinity;
      var md = tracks.map(function (t) { var d = minDist(t, p); if (d < best) best = d; return d; });
      tracks.forEach(function (t, ti) {
        if (t.done || md[ti] > best + SLACK) return;
        var i, dx, dy, d2;
        for (i = 0; i < t.pts.length; i++) {
          dx = t.pts[i][0] - p[0]; dy = t.pts[i][1] - p[1]; d2 = dx * dx + dy * dy;
          if (d2 < t.cover[i]) t.cover[i] = d2;
        }
        var hi = Math.min(t.pts.length - 1, t.next + cfg.win), far = -1;
        for (i = t.next; i <= hi; i++) {
          dx = t.pts[i][0] - p[0]; dy = t.pts[i][1] - p[1];
          if (dx * dx + dy * dy <= r2) far = i;
        }
        if (far >= 0) { t.next = far + 1; changed = true; }
        if (t.next >= t.pts.length && coverage(t, r2) >= cfg.cov) { t.done = true; changed = true; }
      });
      if (changed) {
        placeMarker();
        if (tracks.every(function (t) { return t.done; })) win();
      }
    }

    function add(p) {
      var dx = p[0] - last[0], dy = p[1] - last[1], dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.8) return;
      var steps = Math.ceil(dist / 5);
      for (var i = 1; i <= steps; i++) hit([last[0] + dx * i / steps, last[1] + dy * i / steps]);
      inkLen += dist;
      curD += ' L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      if (cur) cur.setAttribute('d', curD);
      last = p;
    }

    function win() {
      solved = true; locked = true;
      clearTimeout(attemptT);
      marker.setAttribute('visibility', 'hidden');
      svg.setAttribute('class', 'board-svg solved');
      if (cb.onSuccess) cb.onSuccess();
    }

    function endAttempt() {
      if (dead || solved || locked) return;
      if (inkLen < 30) { clearInk(); return; }
      tries++;
      clearInk();
      resetTracks();
      if (cb.onTry) cb.onTry(tries);
      if (tries >= 5) {
        tries = 0;
        if (cb.onHelp) cb.onHelp();
        helpT = setTimeout(demo, 1500);
      }
    }

    function demo() {
      if (dead || solved) return;
      locked = true;
      clearTimeout(attemptT);
      resetTracks(); clearInk();
      var paths = dots.querySelectorAll('path'), seq = [], r;
      for (r = 0; r < 2; r++) for (var i = 0; i < paths.length; i++) seq.push({ p: paths[i], len: paths[i].getTotalLength() });
      var idx = 0, start = performance.now();
      ghost.setAttribute('visibility', 'visible');
      function frame(now) {
        if (dead) return;
        var s = seq[idx], dur = s.len / 0.07, el = now - start;
        var q = s.p.getPointAtLength(s.len * Math.min(el, dur) / dur);
        ghost.setAttribute('cx', q.x); ghost.setAttribute('cy', q.y);
        if (el > dur + 450) {
          idx++; start = now;
          if (idx >= seq.length) {
            ghost.setAttribute('visibility', 'hidden');
            locked = false; placeMarker();
            if (cb.onHelpDone) cb.onHelpDone();
            return;
          }
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }

    svg.addEventListener('pointerdown', function (e) {
      if (locked || dead || active !== null) return;
      e.preventDefault();
      active = e.pointerId;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      clearTimeout(attemptT);
      var p = local(e);
      if (!p) return;
      curD = 'M ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      cur = mk('path', { d: curD, stroke: g.color }, 'ink');
      ink.appendChild(cur);
      last = p;
      hit(p);
    });

    svg.addEventListener('pointermove', function (e) {
      if (e.pointerId !== active || locked || !last) return;
      var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      if (!list.length) list = [e];
      for (var i = 0; i < list.length; i++) {
        var p = local(list[i]);
        if (p && last) add(p);
      }
    });

    function up(e) {
      if (e.pointerId !== active) return;
      active = null; last = null;
      if (!solved && !locked) attemptT = setTimeout(endAttempt, 1500);
    }
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);

    placeMarker();

    return {
      destroy: function () {
        dead = true;
        clearTimeout(attemptT); clearTimeout(helpT);
        cancelAnimationFrame(raf);
        if (svg.parentNode) svg.parentNode.removeChild(svg);
      }
    };
  };
})();
