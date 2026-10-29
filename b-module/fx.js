/* ============================================================
 * B 模块 · 战斗像素特效层 v2
 * 纯代码生成 · 无外部素材
 * ------------------------------------------------------------
 * 关键修复：
 *   1) t≥1 后不再执行特效函数（旧版会导致粒子无限生成、Promise 永不 resolve、战斗卡死）
 *   2) 时长结束即 resolve，不等粒子；另有安全兜底定时器
 * 画法：全部用像素方块（pline / prect）绘制，保证 16-bit 观感
 * ============================================================ */
(function (B) {
  'use strict';

  var cv, ctx, W = 1280, H = 416;
  var parts = [], fx = null, raf = 0, startT = 0, safetyTimer = 0;

  function init(canvasEl) {
    cv = canvasEl;
    cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function R(v) { return Math.round(v); }

  /* ---------------- 像素图元 ---------------- */
  function prect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(R(x), R(y), Math.max(1, R(w)), Math.max(1, R(h)));
  }
  function bolt(x, y, s, fill, edge) {
    edge = edge || '#1c2a44';
    prect(x - 1, y - 1, s + 2, s + 2, edge);
    prect(x, y, s, s, fill);
  }
  function pline(x1, y1, x2, y2, w, color) {
    var dx = x2 - x1, dy = y2 - y1;
    var steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)));
    if (steps < 1) return;
    ctx.fillStyle = color;
    var sx = dx / steps, sy = dy / steps;
    for (var i = 0; i <= steps; i++) {
      var x = R(x1 + sx * i), y = R(y1 + sy * i);
      ctx.fillRect(x - (w >> 1), y - (w >> 1), w, w);
    }
  }
  function pstroke(x1, y1, x2, y2, w, core, edge) {
    pline(x1, y1, x2, y2, w + 2, edge || '#2a3550');
    pline(x1, y1, x2, y2, w, core);
  }
  function parc(cx, cy, r, a0, a1, w, color, ry) {
    var n = Math.max(6, Math.ceil(Math.abs(a1 - a0) * r / 3));
    ctx.fillStyle = color;
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * (i / n);
      var x = R(cx + Math.cos(a) * r);
      var y = R(cy + Math.sin(a) * r * (ry || 1));
      ctx.fillRect(x - (w >> 1), y - (w >> 1), w, w);
    }
  }
  function flash(alpha) {
    if (alpha <= 0) return;
    ctx.globalAlpha = Math.min(0.85, alpha);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  function star(cx, cy, r, color) {
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + Math.PI / 4;
      pstroke(cx - Math.cos(a) * r, cy - Math.sin(a) * r,
        cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, color);
    }
    for (var j = 0; j < 4; j++) {
      var b = j * Math.PI / 2;
      pstroke(cx - Math.cos(b) * r * 0.65, cy - Math.sin(b) * r * 0.65,
        cx + Math.cos(b) * r * 0.65, cy + Math.sin(b) * r * 0.65, 3, '#ffffff');
    }
  }

  /* ---------------- 粒子 ---------------- */
  function spawn(x, y, o) {
    o = o || {};
    parts.push({
      x: x, y: y,
      vx: o.vx == null ? rnd(-3.2, 3.2) : o.vx,
      vy: o.vy == null ? rnd(-4.2, -1) : o.vy,
      g: o.g == null ? 0.28 : o.g,
      life: o.life || 24, max: o.life || 24,
      size: o.size || 5,
      color: o.color || '#ffe066',
      edge: o.edge === undefined ? '#1c2a44' : o.edge
    });
  }
  function burst(x, y, n, o) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = rnd(1.6, 5.2);
      spawn(x, y, Object.assign({}, o, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1 }));
    }
  }
  function ringBurst(x, y, n, rad, o) {
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      spawn(x + Math.cos(a) * rad, y + Math.sin(a) * rad,
        Object.assign({}, o, { vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, g: 0 }));
    }
  }

  /* ---------------- 缓动 ---------------- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 2.4); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }

  /* ============================================================
   * 各技能特效
   * A = 攻击方中心, B = 目标中心
   * ============================================================ */
  var FX = {
    /* 基础攻击：突进 + 三段斩 */
    slash: function (t, A, B) {
      var cx = B.x, cy = B.y;
      if (t < 0.42) {
        var p = easeOut(seg(t, 0, 0.42));
        for (var s = 0; s < 3; s++) {
          var yy = A.y - 26 + s * 26;
          var x1 = A.x + (cx - A.x) * (p * 0.55);
          pline(x1 - 120 * (1 - p), yy, x1, yy, 3, s === 1 ? '#ffffff' : '#8fd8ff');
        }
      }
      for (var i = 0; i < 3; i++) {
        var k = seg(t, 0.10 + i * 0.07, 0.46 + i * 0.07);
        if (k <= 0) continue;
        var L = 230 * easeOut(k);
        var ang = -0.95 + i * 0.15;
        var ox = cx - Math.cos(ang) * 115 + (i - 1) * 52;
        var oy = cy - Math.sin(ang) * 115 + (i - 1) * 24;
        pstroke(ox, oy, ox + Math.cos(ang) * L, oy + Math.sin(ang) * L,
          i === 1 ? 7 : 5, i === 1 ? '#ffffff' : '#ffe9a8', '#b9803a');
      }
      if (t > 0.36 && t < 0.62) flash(0.22 * (1 - seg(t, 0.36, 0.62)));
      if (t > 0.38 && t < 0.55) burst(cx, cy, 3, { color: '#ffd166', life: 20, size: 5 });
      if (t > 0.44 && t < 0.62) star(cx, cy, 46, '#fff3c8');
    },

    /* 防御：旋转六边护盾 */
    guard: function (t, A) {
      var cx = A.x, cy = A.y - 10;
      var inP = easeOut(seg(t, 0, 0.28));
      var outP = seg(t, 0.72, 1);
      var r = (86 + 26 * inP) * (1 - outP * 0.35);
      ctx.globalAlpha = 1 - outP;
      var seg6 = Math.PI / 3, rot = t * 0.55;
      for (var w = 0; w < 2; w++) {
        var rr = r * (w === 0 ? 1.18 : 1);
        for (var i = 0; i < 6; i++) {
          var a0 = rot + i * seg6, a1 = rot + (i + 1) * seg6;
          pline(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr * 0.82,
            cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr * 0.82,
            w === 0 ? 6 : 3, w === 0 ? '#2a7fa8' : '#bfefff');
        }
      }
      ctx.globalAlpha = 1;
      if (t > 0.15 && t < 0.7) {
        ringBurst(cx, cy, 1, r, { color: '#e8fbff', size: 4, life: 18, g: -0.02 });
      }
    },

    /* 擒抱：左右钩爪合拢 */
    grip: function (t, A, B) {
      var cx = B.x, cy = B.y;
      var close = easeOut(seg(t, 0.08, 0.5));
      var open = seg(t, 0.78, 1);
      var gap = (120 - 92 * close) + 70 * open;
      for (var side = -1; side <= 1; side += 2) {
        var bx = cx + side * gap;
        pstroke(bx, cy - 54, bx, cy + 54, 7, '#cfae7e', '#5c452c');
        for (var i = -1; i <= 1; i++) {
          var y0 = cy + i * 34;
          var tipX = bx - side * 30;
          pline(bx, y0, bx - side * 26, y0, 6, '#e8dcc0');
          pline(bx - side * 26, y0, tipX - side * 10, y0 + (i === 0 ? 0 : (i > 0 ? 12 : -12)),
            4, '#fff6e0');
        }
      }
      if (t > 0.46 && t < 0.66) flash(0.18 * (1 - seg(t, 0.46, 0.66)));
      if (t > 0.44 && t < 0.72) burst(cx, cy, 2, { color: '#ff8a72', life: 18, size: 5 });
      if (t > 0.48 && t < 0.66) star(cx, cy, 40, '#ffd7cf');
    },

    /* 卷曲：椭圆甲壳 */
    curl: function (t, A) {
      var cx = A.x, cy = A.y + 8;
      var k = easeOut(seg(t, 0, 0.3)) * (1 - seg(t, 0.75, 1));
      ctx.globalAlpha = Math.max(0, k);
      var rings = [104, 88, 72];
      for (var ri = 0; ri < rings.length; ri++) {
        var r = rings[ri];
        parc(cx, cy, r, Math.PI * 1.10, Math.PI * 1.90, ri === 1 ? 9 : 6,
          ri === 1 ? '#e8dcb8' : '#c9b88e', 0.62);
        parc(cx, cy, r, Math.PI * 0.10, Math.PI * 0.90, ri === 1 ? 9 : 6,
          ri === 1 ? '#e8dcb8' : '#b9a67c', 0.62);
      }
      ctx.globalAlpha = 1;
      if (t > 0.2 && t < 0.7) ringBurst(cx, cy + 34, 1, 78,
        { color: '#c8b78e', size: 4, life: 18, g: 0.34, vy: -1.4 });
    },

    /* 长吻探取 */
    probe: function (t, A, B) {
      var p = easeOut(seg(t, 0, 0.22));
      var ret = seg(t, 0.6, 1);
      var ex = A.x + (B.x - A.x) * p * (1 - ret);
      var ey = A.y + (B.y - A.y) * p * (1 - ret);
      pstroke(A.x, A.y, ex, ey, 7, '#9fe8ff', '#2a7fa8');
      pstroke(A.x, A.y, ex, ey, 3, '#ffffff', '#ffffff');
      if (t > 0.2 && t < 0.62) {
        bolt(B.x + rnd(-34, 34), B.y + rnd(-30, 30), 4, '#ffffff', '#2a7fa8');
        if (Math.random() < 0.6) spawn(B.x + rnd(-30, 30), B.y + rnd(-10, 40),
          { color: '#e8fbff', size: 4, life: 26, g: -0.04, vx: rnd(-0.5, 0.5), vy: -1.4 });
      }
      if (t > 0.22 && t < 0.42) star(B.x, B.y, 30, '#bfefff');
    },

    /* 硬鳞棘刺 */
    spikes: function (t, A, B) {
      var cx = A.x, cy = A.y;
      var grow = easeOut(seg(t, 0, 0.35)) * (1 - seg(t, 0.7, 1));
      var N = 12;
      for (var i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2 + 0.26;
        var r1 = 54, r2 = 54 + 78 * grow;
        pstroke(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.72,
          cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.72,
          5, i % 2 ? '#efe0b4' : '#cbb98a', '#6b5a3a');
      }
      if (t > 0.3 && t < 0.75) burst(B.x, B.y, 1, { color: '#efe0b4', life: 16, size: 5 });
      if (t > 0.34 && t < 0.5) flash(0.16);
    },

    /* 疾跑冲撞 */
    dash: function (t, A, B) {
      var cx = B.x, cy = B.y;
      var p = easeOut(seg(t, 0, 0.4));
      /* 残影：限制在舞台内 */
      /* 残影只留在前半段，不要压到右侧血条 */
      for (var i = 3; i >= 1; i--) {
        var gp = Math.max(0, Math.min(0.62, p - i * 0.07));
        var gx = A.x + (cx - A.x) * gp;
        var gy = A.y - 24;
        if (gy < 8) gy = 8;
        if (gy + 48 > H - 10) gy = H - 58;
        ctx.globalAlpha = 0.16 * (4 - i);
        prect(gx - 40, gy, 80, 48, '#bfe6ff');
        ctx.globalAlpha = 1;
      }
      /* 速度线：只向目标方向拉，且不超出舞台 */
      var yy0 = Math.max(A.y - 40, 18);
      for (var s = 0; s < 5; s++) {
        var yy = yy0 + s * 20;
        if (yy > H - 14) break;
        var len = 96 * Math.sin(Math.PI * clamp01(t * 1.5));
        var dir = cx > A.x ? 1 : -1;
        pline(A.x + dir * 24, yy, A.x + dir * (24 + len), yy, 4, s % 2 ? '#ffffff' : '#8fd8ff');
      }
      if (t > 0.42 && t < 0.58) flash(0.18);
      if (t > 0.42 && t < 0.72) {
        burst(cx, cy, 2, { color: '#ffffff', life: 16, size: 6 });
        star(cx, cy, 48, '#ffffff');
      }
    },

    /* 撕咬 */
    bite: function (t, A, B) {
      var cx = B.x, cy = B.y;
      var k = easeOut(seg(t, 0.06, 0.46));
      var open = (1 - k) + seg(t, 0.8, 1) * 0.9;
      var jawY = 16 + 62 * open;
      for (var side = -1; side <= 1; side += 2) {
        var y0 = cy + side * jawY;
        pstroke(cx - 96, y0, cx + 96, y0 - side * 16, 9, '#d8c9a6', '#5c4b2e');
        for (var i = 0; i < 7; i++) {
          var x = cx - 84 + i * 28;
          var yy = y0 - side * 14;
          pline(x, yy, x, yy - side * 20, 6, '#fdf6e0');
          pline(x, yy - side * 20, x + 4, yy - side * 27, 4, '#ffffff');
        }
      }
      if (t > 0.42 && t < 0.6) flash(0.2 * (1 - seg(t, 0.42, 0.6)));
      if (t > 0.44 && t < 0.74) burst(cx, cy, 3, { color: '#ff9b8a', life: 20, size: 5 });
      if (t > 0.46 && t < 0.68) star(cx, cy, 44, '#ffd7cf');
    },

    /* 尾击 */
    tail: function (t, A, B) {
      var cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
      var sweep = easeOut(seg(t, 0.05, 0.55));
      var fade = 1 - seg(t, 0.7, 1);
      ctx.globalAlpha = Math.max(0, fade);
      for (var w = 0; w < 2; w++) {
        parc(cx, cy + 10, 200 + w * 16, -Math.PI * 0.62 + sweep * Math.PI * 1.15,
          -Math.PI * 0.62 + sweep * Math.PI * 1.15 + 0.62,
          w === 0 ? 10 : 4, w === 0 ? '#8a7a58' : '#f0e4c0', 0.62);
      }
      ctx.globalAlpha = 1;
      if (t > 0.5 && t < 0.9) {
        burst(B.x + rnd(-30, 30), B.y + 34, 2, { color: '#cbb98a', life: 22, size: 6, g: 0.34 });
      }
    },

    /* 命中 */
    hit: function (t, A, B) {
      var cx = B.x, cy = B.y;
      var k = Math.sin(Math.PI * clamp01(t));
      flash(0.34 * k);
      if (t < 0.42) {
        star(cx, cy, 58 * easeOut(seg(t, 0, 0.42)), '#fff6d0');
        burst(cx, cy, 3, { color: '#ffd166', life: 16, size: 5 });
      }
    },

    /* 回能 */
    energy: function (t, A) {
      for (var i = 0; i < 2; i++) {
        var a = Math.random() * Math.PI * 2, r = rnd(30, 70);
        spawn(A.x + Math.cos(a) * r, A.y + 30 + Math.sin(a) * r * 0.5,
          { color: Math.random() < 0.5 ? '#ffe066' : '#fff6d0', size: 5, life: 26, g: -0.03,
            vx: rnd(-0.4, 0.4), vy: -2.2 });
      }
    }
  };

  /* 命中定格时机（hit-stop） */
  var IMPACT = { slash: 0.46, grip: 0.50, bite: 0.50, tail: 0.55, dash: 0.45,
    spikes: 0.42, probe: 0.40 };

  /* ---------------- 主循环 ---------------- */
  function frame(now) {
    if (!ctx || !fx) return;
    var eff = now - startT;

    /* hit-stop：到达命中点先定帧，再继续走时间轴 */
    if (fx.stopAt != null && !fx.holdDone) {
      var pre = (eff - fx.hold) / fx.dur;
      if (pre >= fx.stopAt) {
        if (!fx.holdStart) fx.holdStart = now;
        if (now - fx.holdStart < fx.stopMs) {
          drawFrame(fx.stopAt, false);
          raf = requestAnimationFrame(frame);
          return;
        }
        fx.holdDone = true;
        fx.hold = fx.stopMs;
      }
    }

    var t = (eff - fx.hold) / fx.dur;
    if (t >= 1) { drawFrame(1, false); endEffect(); return; }
    drawFrame(t, true);
    raf = requestAnimationFrame(frame);
  }

  function drawFrame(t, advance) {
    ctx.clearRect(0, 0, W, H);

    /* 关键：t<1 才执行特效函数，避免无限生成粒子 */
    if (t < 1 && fx.fn) fx.fn(t, fx.A, fx.B, fx);

    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      if (advance) {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--;
      }
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0.18, Math.min(1, (p.life / p.max) * 1.7));
      if (p.edge) prect(p.x - 1, p.y - 1, p.size + 2, p.size + 2, p.edge);
      prect(p.x, p.y, p.size, p.size, p.color);
      ctx.globalAlpha = 1;
    }
  }

  function endEffect() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = 0; }
    parts.length = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
    var done = fx && fx.resolve;
    fx = null;
    if (done) done();
  }

  function play(kind, opts) {
    opts = opts || {};
    if (!ctx) return Promise.resolve();
    if (fx) endEffect();   /* 同一时间只允许一个特效 */

    var fn = FX[kind] || FX.slash;
    var DUR = {
      slash: 400, grip: 430, bite: 440, tail: 450, dash: 390,
      spikes: 430, probe: 400, guard: 470, curl: 470, hit: 240, energy: 480
    };
    var dur = opts.dur || DUR[kind] || 430;
    var stopAt = opts.stopAt === undefined ? IMPACT[kind] : opts.stopAt;
    var stopMs = opts.stopMs === undefined ? 55 : opts.stopMs;

    return new Promise(function (resolve) {
      fx = {
        fn: fn, dur: dur,
        stopAt: stopAt == null ? null : stopAt,
        stopMs: stopMs, hold: 0, holdStart: 0, holdDone: false,
        A: opts.from || { x: W * 0.25, y: H * 0.6 },
        B: opts.to || { x: W * 0.75, y: H * 0.4 },
        resolve: resolve
      };
      startT = performance.now();
      safetyTimer = setTimeout(function () { if (fx) endEffect(); }, dur + 1200);
      raf = requestAnimationFrame(frame);
    });
  }

  /* 静态取帧（调试/截图） */
  function preview(kind, prog, A, B) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    parts.length = 0;
    var fn = FX[kind] || FX.slash;
    fn(clamp01(prog), A || { x: W * 0.3, y: H * 0.6 }, B || { x: W * 0.7, y: H * 0.4 }, {});
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.x += p.vx * 3; p.y += p.vy * 3;
      ctx.globalAlpha = Math.max(0.2, p.life / p.max);
      if (p.edge) prect(p.x - 1, p.y - 1, p.size + 2, p.size + 2, p.edge);
      prect(p.x, p.y, p.size, p.size, p.color);
      ctx.globalAlpha = 1;
    }
    parts.length = 0;
  }

  function clear() {
    parts.length = 0;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = 0; }
    fx = null;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  B.FX = {
    init: init, play: play, clear: clear, preview: preview,
    kinds: Object.keys(FX),
    resize: function (w, h) { W = w; H = h; if (cv) { cv.width = w; cv.height = h; } }
  };
})(window.B = window.B || {});
