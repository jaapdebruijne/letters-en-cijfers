(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // A small car model: a chassis with a spring leg at each wheel. Drive and brake forces
  // push on the wheels below the middle of the car, so gas lifts the nose, brakes drop it,
  // and a bad landing can flip it. y points down, angles turn clockwise.
  var P = LC.carTune = {
    G: 600,           // gravity (lowish, like the moon: long, floaty jumps)
    L0: 24, LMIN: 0, LMAX: 38,   // spring leg: rest, shortest, longest (more travel = softer hits)
    K: 50, B: 9,      // spring and damper per wheel
    FMAX: 2600,       // strongest push a spring leg can give
    E: 0.08,          // how much a hard landing bounces (0 = dead, 1 = rubber)
    MU: 1.4,          // grip from the weight on a wheel
    GRIP0: 380,       // grip every wheel always has, so a light wheel on a steep hill still pulls
    DRIVE: 480,       // engine push per wheel
    BRK: 700,         // brake push per wheel
    ROLL: 0.18,       // rolling resistance
    TARM: 56,         // height below the middle where the wheel forces act (more = more lean)
    AIRT: 2.6,        // turning the car in the air with gas and brake
    W0: 2.2, Z: 0.6,  // how strongly the car levels itself in the air
    ADAMP: 0.5,       // calming of spinning in the air
    GDAMP: 3.4,       // calming of rocking when the wheels are on the ground
    WMAX: 9,          // fastest the car may spin
    IFACT: 1.2,       // how heavy the car is to turn (times length squared)
    VMAX: 800
  };

  LC.carPhysics = function (def, ground, opts) {
    opts = opts || {};
    var wheels = def.wheels.map(function (w) {
      return { x: w.x, r: w.r, ay: 28 - w.r - P.L0, len: P.L0, rot: 0, contact: false, cx: 0, cy: 0, vt: 0 };
    });
    var len = def.vb[2], I = P.IFACT * len * len * (def.stats.i || 1);
    var vmax = P.VMAX * def.stats.v, drive = P.DRIVE * def.stats.a;
    var hd = def.head, hx = hd[0] + hd[2] / 2, hy = hd[1] + hd[3] * 0.4;
    var bx0 = def.vb[0] + 8, bx1 = def.vb[0] + def.vb[2] - 8;

    var s = {
      x: opts.x || 120, y: 0, a: 0, vx: 0, vy: 0, w: 0, t: 0,
      air: false, crashed: false, wheels: wheels, headX: 0, headY: 0
    };
    s.y = ground(s.x) - 28 + 8;

    // A hit against the ground at one point: take away the speed into the ground (a little
    // bounce at most) and lift the car out of the ground. No grip here: it must never slow the car.
    function collide(px, py, nx, ny, pen) {
      var rx = px - s.x, ry = py - s.y;
      var vpx = s.vx - s.w * ry, vpy = s.vy + s.w * rx;
      var vn = vpx * nx + vpy * ny;
      if (vn < 0) {
        var rn = rx * ny - ry * nx, k = 1 + rn * rn / I, J = -(1 + P.E) * vn / k;
        s.vx += J * nx; s.vy += J * ny; s.w += J * rn / I;
      }
      if (pen > 0) { s.x += nx * pen * 0.6; s.y += ny * pen * 0.6; }
    }

    function substep(dt, gas, brake) {
      var cos = Math.cos(s.a), sin = Math.sin(s.a);
      var ax = 0, ay = P.G, torque = 0, contacts = 0, hits = [];

      wheels.forEach(function (wh) {
        var Ax = s.x + wh.x * cos - wh.ay * sin, Ay = s.y + wh.x * sin + wh.ay * cos;
        var ux = -sin, uy = cos, L = wh.len, inContact = false;

        if (uy > 0.15) {
          var l = P.L0, i;
          for (i = 0; i < 3; i++) {
            var gy = ground(Ax + ux * l);
            l = (gy - wh.r - Ay) / uy;
          }
          if (l <= P.LMAX) { inContact = true; L = l; }
        }

        if (!inContact) {
          wh.len += (P.LMAX - wh.len) * Math.min(1, dt * 12);
          wh.contact = false;
          wh.cx = Ax + ux * wh.len; wh.cy = Ay + uy * wh.len;
          wh.rot += wh.vt / wh.r * dt;
          return;
        }
        contacts++;
        wh.contact = true;
        var clamped = Math.min(Math.max(L, P.LMIN), P.LMAX);
        var lenDot = (clamped - wh.len) / dt;
        var Fn = P.K * (P.L0 - clamped) - P.B * lenDot;
        if (Fn < 0) Fn = 0; else if (Fn > P.FMAX) Fn = P.FMAX;
        if (L < P.LMIN) {
          // a fully pushed-in leg means the wheel hit the ground hard: bounce off the slope itself
          var wx = Ax + ux * clamped, sl = ground(wx + 3) - ground(wx - 3), nl = Math.sqrt(36 + sl * sl);
          hits.push({ x: wx, y: ground(wx), nx: sl / nl, ny: -6 / nl, pen: (P.LMIN - L) * 0.8 });
        }
        wh.len = clamped;
        wh.cx = Ax + ux * clamped; wh.cy = Ay + uy * clamped;

        // spring push on the chassis, along the leg
        var Fx = -ux * Fn, Fy = -uy * Fn;
        ax += Fx; ay += Fy;
        torque += (Ax - s.x) * Fy - (Ay - s.y) * Fx;

        // drive and brake along the ground
        var gx = ground(wh.cx + 3) - ground(wh.cx - 3), tl = Math.sqrt(36 + gx * gx);
        var tx = 6 / tl, ty = gx / tl;
        var rpx = wh.x * cos - P.TARM * sin, rpy = wh.x * sin + P.TARM * cos;
        var vpx = s.vx - s.w * rpy, vpy = s.vy + s.w * rpx;
        var vt = vpx * tx + vpy * ty;
        wh.vt = vt;
        var ft = 0;
        if (gas) ft += drive * Math.max(0, 1 - vt / vmax);
        if (brake) ft -= P.BRK * Math.max(-1, Math.min(1, vt / 40));
        ft -= P.ROLL * vt;
        var cap = P.MU * Fn + P.GRIP0;
        if (ft > cap) ft = cap; else if (ft < -cap) ft = -cap;
        var Tx = ft * tx, Ty = ft * ty;
        ax += Tx; ay += Ty;
        torque += rpx * Ty - rpy * Tx;
        wh.rot += vt / wh.r * dt;
      });

      // body corners: if the belly comes down on the ground it stops there
      var corners = [bx0, bx1];
      for (var c = 0; c < 2; c++) {
        var lx = corners[c], ly = -4;
        var px = s.x + lx * cos - ly * sin, py = s.y + lx * sin + ly * cos, pen = py - ground(px);
        if (pen > 0) {
          var sl = ground(px + 3) - ground(px - 3), nl = Math.sqrt(36 + sl * sl);
          hits.push({ x: px, y: py, nx: sl / nl, ny: -6 / nl, pen: pen });
          contacts++;
        }
      }

      s.air = contacts === 0;
      if (s.air) {
        // Gas tips the nose up and brake tips it down, but the car also levels itself
        // gently towards the way it is flying, so a held pedal never spins it round.
        if (gas) torque -= P.AIRT * I;
        if (brake) torque += P.AIRT * I;
        var aim = Math.max(-0.6, Math.min(0.6, Math.atan2(s.vy, Math.max(s.vx, 120)) * 0.8));
        torque -= I * (P.W0 * P.W0 * (s.a - aim) + 2 * P.Z * P.W0 * s.w);
      }
      torque -= (s.air ? P.ADAMP : P.GDAMP) * s.w * I;

      s.vx += ax * dt; s.vy += ay * dt;
      s.w += torque / I * dt;
      for (var h = 0; h < hits.length; h++) collide(hits[h].x, hits[h].y, hits[h].nx, hits[h].ny, hits[h].pen);
      if (s.w > P.WMAX) s.w = P.WMAX; else if (s.w < -P.WMAX) s.w = -P.WMAX;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.a += s.w * dt;
      s.t += dt;
    }

    return {
      s: s,
      step: function (dt, gas, brake) {
        if (s.crashed) { gas = false; brake = false; }
        var n = Math.ceil(dt / (1 / 180)), h = dt / n;
        for (var k = 0; k < n; k++) substep(h, gas, brake);
        var c = Math.cos(s.a), sn = Math.sin(s.a);
        s.headX = s.x + hx * c - hy * sn; s.headY = s.y + hx * sn + hy * c;
        if (!s.crashed && s.t > 1.2 && s.headY > ground(s.headX) - 12) s.crashed = true;
        return s;
      }
    };
  };
})();
