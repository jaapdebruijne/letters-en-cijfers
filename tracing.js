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

  // Level-4 recognition thresholds (normalized 200-unit space)
  var REC_THRESHOLD = 45;   // max avg Hausdorff-like distance
  var HIST_BINS = 3;         // grid resolution for spatial histogram check
  var HIST_THRESHOLD = 0.55; // max L1 distance between HIST_BINS² histograms (0=identical, 2=disjoint)

  function mk(tag, attrs, cls) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute('class', cls);
    return e;
  }

  LC.Tracer = function (host, key, strictKey, cb) {
    var g = LC.GLYPHS[key], cfg = STRICT[strictKey] || STRICT.normaal;
    var level = (cb && cb.level) || 1;
    var svg = mk('svg', { viewBox: g.view.join(' ') }, 'board-svg');
    var wide = mk('g'), dots = mk('g'), ink = mk('g'), top = mk('g');
    svg.appendChild(wide); svg.appendChild(dots); svg.appendChild(ink); svg.appendChild(top);
    host.appendChild(svg);

    var totalLen = 0;
    var tracks = g.strokes.map(function (d) {
      if (level <= 2) wide.appendChild(mk('path', { d: d, stroke: g.color }, 'guide-wide'));
      var p = mk('path', { d: d, stroke: g.color }, 'guide-dots');
      if (level <= 3) {
        dots.appendChild(p);
      } else {
        // Temporarily add to SVG to compute length, then remove
        svg.appendChild(p);
      }
      var len = p.getTotalLength();
      totalLen += len;
      var n = Math.max(4, Math.round(len / 10)), pts = [];
      for (var i = 0; i <= n; i++) { var q = p.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
      if (level >= 4 && p.parentNode === svg) svg.removeChild(p);
      var cover = [];
      for (var c = 0; c < pts.length; c++) cover.push(Infinity);
      return { pts: pts, next: 0, cover: cover, done: false };
    });

    // Pre-compute denser template for level-4 shape recognition
    var recTemplate = [];
    if (level >= 4) {
      g.strokes.forEach(function (d) {
        var tmp = mk('path', { d: d });
        svg.appendChild(tmp);
        var tlen = tmp.getTotalLength();
        var tn = Math.max(8, Math.round(tlen / 5));
        for (var ti = 0; ti <= tn; ti++) {
          var tq = tmp.getPointAtLength(tlen * ti / tn);
          recTemplate.push([tq.x, tq.y]);
        }
        svg.removeChild(tmp);
      });
      recTemplate = recNorm(recTemplate);
    }

    // Floating cat paw that follows the ghost cursor during demo
    var pawCol = (cb && cb.pawColor) || '#ee7fa7';
    var pawPad = mk('ellipse', { cx: 0, cy: 0, rx: '13', ry: '11', fill: pawCol, stroke: 'white', 'stroke-width': '2' });
    var pawT1  = mk('circle', { cx: 0, cy: 0, r: '5', fill: pawCol, stroke: 'white', 'stroke-width': '1.5' });
    var pawT2  = mk('circle', { cx: 0, cy: 0, r: '5', fill: pawCol, stroke: 'white', 'stroke-width': '1.5' });
    var pawT3  = mk('circle', { cx: 0, cy: 0, r: '5', fill: pawCol, stroke: 'white', 'stroke-width': '1.5' });
    var pawT4  = mk('circle', { cx: 0, cy: 0, r: '5', fill: pawCol, stroke: 'white', 'stroke-width': '1.5' });
    var catArm = mk('g', { visibility: 'hidden' });
    catArm.appendChild(pawT1); catArm.appendChild(pawT2);
    catArm.appendChild(pawT3); catArm.appendChild(pawT4);
    catArm.appendChild(pawPad);

    function moveArm(x, y) {
      pawPad.setAttribute('cx', x);       pawPad.setAttribute('cy', y);
      pawT1.setAttribute('cx', x - 10);  pawT1.setAttribute('cy', y - 12);
      pawT2.setAttribute('cx', x - 3);   pawT2.setAttribute('cy', y - 16);
      pawT3.setAttribute('cx', x + 4);   pawT3.setAttribute('cy', y - 16);
      pawT4.setAttribute('cx', x + 11);  pawT4.setAttribute('cy', y - 12);
    }

    var marker = mk('circle', { r: 11, stroke: g.color }, 'marker');
    var ghost = mk('circle', { r: 14, stroke: g.color, visibility: 'hidden' }, 'ghost');
    if (level >= 4) marker.setAttribute('visibility', 'hidden');
    top.appendChild(marker); top.appendChild(ghost); top.appendChild(catArm);

    var active = null, last = null, cur = null, curD = '', inkLen = 0;
    var inkCells = {};
    var locked = false, solved = false, dead = false, tries = 0;
    var attemptT = 0, helpT = 0, raf = 0, forceT = 0;
    var recDrawn = [];       // accumulated drawn points for level-4 recognition
    var recStrokeCount = 0;  // completed strokes (reset on each fail)
    var recInkAtDown = 0;    // inkLen at the start of the current stroke

    // ---- Shape recognizer helpers (used only at level 4) ----

    // Normalize points to a 200-unit bounding box, centered at origin.
    // Uniform scale (preserves aspect ratio) so tall letters stay tall.
    function recNorm(pts) {
      if (!pts.length) return pts;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < pts.length; i++) {
        if (pts[i][0] < minX) minX = pts[i][0];
        if (pts[i][0] > maxX) maxX = pts[i][0];
        if (pts[i][1] < minY) minY = pts[i][1];
        if (pts[i][1] > maxY) maxY = pts[i][1];
      }
      var w = maxX - minX || 1, h = maxY - minY || 1;
      var s = 200 / Math.max(w, h);
      var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      return pts.map(function (p) { return [(p[0] - cx) * s, (p[1] - cy) * s]; });
    }

    // Bidirectional average nearest-neighbor distance (Hausdorff-like).
    // Returns the worse direction so both over-drawing and under-drawing are penalized.
    function recScore(a, b) {
      function avgNN(x, y) {
        var sum = 0;
        for (var i = 0; i < x.length; i++) {
          var best = Infinity;
          for (var j = 0; j < y.length; j++) {
            var dx = x[i][0] - y[j][0], dy = x[i][1] - y[j][1], d = dx * dx + dy * dy;
            if (d < best) best = d;
          }
          sum += Math.sqrt(best);
        }
        return sum / x.length;
      }
      return Math.max(avgNN(a, b), avgNN(b, a));
    }

    // Spatial histogram check: divide the 200-unit space into bins×bins cells,
    // compare point density per cell (L1 distance between normalized histograms).
    // Catches mirror images and reflections that fool the NN distance check.
    function recHistScore(a, b, bins) {
      function hist(pts) {
        var h = [], i;
        for (i = 0; i < bins * bins; i++) h.push(0);
        for (i = 0; i < pts.length; i++) {
          var xi = Math.min(bins - 1, Math.max(0, Math.floor((pts[i][0] + 100) / 200 * bins)));
          var yi = Math.min(bins - 1, Math.max(0, Math.floor((pts[i][1] + 100) / 200 * bins)));
          h[yi * bins + xi]++;
        }
        var sum = 0;
        for (i = 0; i < h.length; i++) sum += h[i];
        sum = sum || 1;
        for (i = 0; i < h.length; i++) h[i] /= sum;
        return h;
      }
      var ha = hist(a), hb = hist(b), diff = 0;
      for (var i = 0; i < ha.length; i++) diff += Math.abs(ha[i] - hb[i]);
      return diff;
    }

    // Run shape recognition for level 4 and handle pass/fail.
    function runLevelFourCheck() {
      clearTimeout(forceT);
      if (recDrawn.length < 15) { clearInk(); recDrawn = []; recStrokeCount = 0; return; }
      var nd = recNorm(recDrawn);
      var score = recScore(nd, recTemplate);
      var hist = recHistScore(nd, recTemplate, HIST_BINS);
      if (score < REC_THRESHOLD && hist < HIST_THRESHOLD) {
        solved = true; locked = true;
        clearTimeout(attemptT);
        svg.setAttribute('class', 'board-svg solved');
        if (cb.onSuccess) cb.onSuccess();
        return;
      }
      tries++;
      recDrawn = []; recStrokeCount = 0;
      clearInk();
      if (cb.onTry) cb.onTry(tries);
      if (tries >= 5) {
        tries = 0;
        if (cb.onHelp) cb.onHelp();
        helpT = setTimeout(function () { demo(); }, 1500);
      }
    }

    // ---- End shape recognizer helpers ----

    function placeMarker() {
      if (level >= 4) { marker.setAttribute('visibility', 'hidden'); return; }
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
      inkLen = 0; cur = null; curD = ''; inkCells = {};
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
      for (var i = 1; i <= steps; i++) {
        var ip = [last[0] + dx * i / steps, last[1] + dy * i / steps];
        if (level < 4) hit(ip);
        inkCells[Math.floor(ip[0] / 10) + ',' + Math.floor(ip[1] / 10)] = 1;
      }
      inkLen += dist;
      curD += ' L ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
      if (cur) cur.setAttribute('d', curD);
      last = p;
      if (level >= 4) recDrawn.push([p[0], p[1]]);
    }

    // What fraction of 10×10-unit canvas cells contain ink?
    // Correct trace: cells along the letter only (~15–30%). Scribble: most cells (>40%).
    function cellCoverage() {
      var n = Object.keys(inkCells).length;
      if (n < 4) return 0;
      var totalCells = Math.ceil(g.view[2] / 10) * Math.ceil(g.view[3] / 10);
      return n / totalCells;
    }

    function win() {
      var cc = cellCoverage();
      var inkRatio = totalLen > 0 ? inkLen / totalLen : 0;
      if (cc > 0.35 || inkRatio > 4.0) {
        tries++;
        clearInk();
        resetTracks();
        if (cb.onTry) cb.onTry(tries);
        if (tries >= 5) { tries = 0; if (cb.onHelp) cb.onHelp(); helpT = setTimeout(function () { demo(); }, 1500); }
        return;
      }
      solved = true; locked = true;
      clearTimeout(attemptT);
      marker.setAttribute('visibility', 'hidden');
      svg.setAttribute('class', 'board-svg solved');
      if (cb.onSuccess) cb.onSuccess();
    }

    function endAttempt() {
      if (dead || solved || locked) return;

      if (level >= 4) {
        var strokeInk = inkLen - recInkAtDown;
        if (strokeInk < 15) return; // tiny accidental touch, wait
        recStrokeCount++;           // count this final stroke
        if (recStrokeCount < g.strokes.length) {
          // Not enough strokes yet. Give a 3-second grace period so the user
          // isn't stuck forever if they drew fewer strokes than the template.
          clearTimeout(forceT);
          forceT = setTimeout(function () {
            if (!dead && !solved && !locked && recDrawn.length >= 15) runLevelFourCheck();
          }, 3000);
          return;
        }
        runLevelFourCheck();
        return;
      }

      if (inkLen < 30) { clearInk(); return; }
      tries++;
      clearInk();
      resetTracks();
      if (cb.onTry) cb.onTry(tries);
      if (tries >= 5) {
        tries = 0;
        if (cb.onHelp) cb.onHelp();
        helpT = setTimeout(function () { demo(); }, 1500);
      }
    }

    var demoing = false;

    // The finger draws the shape stroke by stroke and leaves a trail behind it.
    function demo(opts) {
      if (dead || solved || demoing || active !== null) return;
      var passes = (opts && opts.passes) || 2;
      demoing = true; locked = true;
      clearTimeout(attemptT); clearTimeout(forceT);
      resetTracks(); clearInk();

      // At level 4, dots has no paths; add temporary ones just for the demo animation.
      var tempAdded = [];
      if (level >= 4) {
        g.strokes.forEach(function (d) {
          var tp = mk('path', { d: d, stroke: g.color }, 'guide-dots');
          dots.appendChild(tp);
          tempAdded.push(tp);
        });
      }

      var paths = dots.querySelectorAll('path'), seq = [], r, i;
      for (r = 0; r < passes; r++) {
        for (i = 0; i < paths.length; i++) {
          var len = paths[i].getTotalLength();
          var trail = mk('path', { d: paths[i].getAttribute('d'), stroke: g.color, 'stroke-dasharray': len + ' ' + (len + 1), 'stroke-dashoffset': len }, 'ink');
          ink.appendChild(trail);
          seq.push({ p: paths[i], len: len, trail: trail, lastOfPass: i === paths.length - 1 });
        }
      }
      var idx = 0, start = performance.now();
      var q0 = seq[0].p.getPointAtLength(0);
      moveArm(q0.x, q0.y);
      ghost.setAttribute('cx', q0.x); ghost.setAttribute('cy', q0.y);
      ghost.setAttribute('visibility', 'visible');
      catArm.setAttribute('visibility', 'visible');
      function frame(now) {
        if (dead) return;
        var s = seq[idx], dur = s.len / 0.08, el = now - start, f = Math.min(el, dur) / dur;
        var q = s.p.getPointAtLength(s.len * f);
        ghost.setAttribute('cx', q.x); ghost.setAttribute('cy', q.y);
        moveArm(q.x, q.y);
        s.trail.setAttribute('stroke-dashoffset', s.len * (1 - f));
        if (el > dur + 450) {
          if (s.lastOfPass) {
            for (var k = 0; k <= idx; k++) if (seq[k].trail.getAttribute('class') === 'ink') seq[k].trail.setAttribute('class', 'ink fading');
          }
          idx++; start = now;
          if (idx >= seq.length) {
            ghost.setAttribute('visibility', 'hidden');
            catArm.setAttribute('visibility', 'hidden');
            setTimeout(function () { if (!dead) clearInk(); }, 500);
            tempAdded.forEach(function (tp) { if (tp.parentNode) tp.parentNode.removeChild(tp); });
            demoing = false; locked = false; placeMarker();
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
      if (level < 4) {
        hit(p);
      } else {
        // If the previous stroke added enough ink, count it now (handles fast drawing
        // where endAttempt never fired between strokes).
        if (inkLen - recInkAtDown >= 15) recStrokeCount++;
        recInkAtDown = inkLen;
        recDrawn.push([p[0], p[1]]);
        clearTimeout(forceT);
      }
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
      demo: demo,
      getLevel: function () { return level; },
      destroy: function () {
        dead = true;
        clearTimeout(attemptT); clearTimeout(helpT); clearTimeout(forceT);
        cancelAnimationFrame(raf);
        if (svg.parentNode) svg.parentNode.removeChild(svg);
      }
    };
  };
})();
