'use strict';

/* ═══════════════════════════════════════════════════════════
   1. DYNAMIC ISLAND
   Fills name + handle from data-* attrs on .island
   Mobile: tap to toggle · Desktop: CSS hover handles it
═══════════════════════════════════════════════════════════ */
(function initIsland() {
  const island = document.querySelector('.island');
  if (!island) return;

  island.querySelector('.island-name').textContent   = island.dataset.name     || 'ItzSkyFox';
  island.querySelector('.island-handle').textContent = island.dataset.ytHandle || '@ItzSkyFox';
  island.querySelector('.island-yt').href             = island.dataset.ytUrl    || 'https://youtube.com/@ItzSkyFox';

  // Make the whole island clickable as a YT link on desktop when expanded
  // and tap-togglable on mobile
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (isTouch) {
    let expanded = false;
    island.addEventListener('click', () => {
      expanded = !expanded;
      island.classList.toggle('expanded', expanded);

      // Second tap = navigate to YT
      if (!expanded) {
        window.open(island.dataset.ytUrl || 'https://youtube.com/@ItzSkyFox', '_blank', 'noopener');
      }
    });
    document.addEventListener('click', e => {
      if (!island.contains(e.target)) {
        expanded = false;
        island.classList.remove('expanded');
      }
    }, true);
  } else {
    island.addEventListener('click', () => {
      window.open(island.dataset.ytUrl || 'https://youtube.com/@ItzSkyFox', '_blank', 'noopener');
    });
  }
})();


/* ═══════════════════════════════════════════════════════════
   2. MOTHERBOARD PCB BACKGROUND
   Structured layout — chipset hub with radiating trace bundles,
   via arrays, SMD cap rows, edge connector, silkscreen labels
═══════════════════════════════════════════════════════════ */
(function generatePCB() {
  const svg = document.getElementById('bg-svg');
  if (!svg) return;

  const W  = window.innerWidth;
  const H  = window.innerHeight;
  const ns = 'http://www.w3.org/2000/svg';
  const mob = W < 769;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const mk = (tag, a) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
    return el;
  };
  const rnd  = (a, b) => Math.random() * (b - a) + a;
  const rInt = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

  // ── Color palette ──
  const C = {
    trace:     'rgba(48,209,88,0.09)',
    traceMed:  'rgba(48,209,88,0.16)',
    tracePwr:  'rgba(48,209,88,0.22)',   // power plane (thick)
    tracePulse:'rgba(48,209,88,0.28)',
    pad:       'rgba(48,209,88,0.25)',
    padFill:   'rgba(48,209,88,0.07)',
    ic:        'rgba(48,209,88,0.04)',
    icBorder:  'rgba(48,209,88,0.18)',
    smd:       'rgba(48,209,88,0.06)',
    smdBorder: 'rgba(48,209,88,0.17)',
    silk:      'rgba(48,209,88,0.055)',
    silkText:  'rgba(48,209,88,0.08)',
  };

  // ── Layer groups ──
  const gSilk   = mk('g', {});
  const gPlane  = mk('g', {});
  const gTraces = mk('g', {});
  const gComps  = mk('g', {});
  const gPads   = mk('g', {});
  svg.append(gSilk, gPlane, gTraces, gComps, gPads);

  // ── Helper: draw an IC (QFP) at cx,cy ──
  function drawIC(g, cx, cy, bw, bh, pinSpacingH, pinSpacingV) {
    const x = cx - bw / 2, y = cy - bh / 2;

    // Body
    g.appendChild(mk('rect', {
      x, y, width: bw, height: bh,
      fill: C.ic, stroke: C.icBorder, 'stroke-width': '1', rx: '2',
    }));

    // Pin-1 notch
    g.appendChild(mk('path', {
      d: `M${x+2} ${y+7} L${x+7} ${y+2}`,
      stroke: C.icBorder, 'stroke-width': '0.7', fill: 'none',
    }));

    // Internal cross-hatch lines (die marking suggestion)
    g.appendChild(mk('line', { x1: x+4, y1: cy, x2: x+bw-4, y2: cy, stroke: C.silk, 'stroke-width': '0.5' }));
    g.appendChild(mk('line', { x1: cx, y1: y+4, x2: cx, y2: y+bh-4, stroke: C.silk, 'stroke-width': '0.5' }));

    const pinsH  = Math.floor((bw - 10) / pinSpacingH);
    const pinsV  = bh > 30 ? Math.floor((bh - 10) / (pinSpacingV || pinSpacingH)) : 0;

    // Top/bottom pins
    for (let i = 0; i < pinsH; i++) {
      const px = x + 5 + i * pinSpacingH;
      gPads.appendChild(mk('rect', { x: px-1.5, y: y-5, width: 3, height: 5.5, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.4' }));
      gPads.appendChild(mk('rect', { x: px-1.5, y: y+bh-0.5, width: 3, height: 5.5, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.4' }));
    }

    // Left/right pins
    const pv = pinsV || Math.floor((bh - 10) / pinSpacingH);
    for (let i = 0; i < pv; i++) {
      const py = y + 5 + i * (pinSpacingV || pinSpacingH);
      gPads.appendChild(mk('rect', { x: x-5, y: py-1.5, width: 5.5, height: 3, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.4' }));
      gPads.appendChild(mk('rect', { x: x+bw-0.5, y: py-1.5, width: 5.5, height: 3, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.4' }));
    }

    return { x, y, cx, cy, bw, bh, pinsH, pinsV: pv };
  }

  // ── Helper: via ──
  function via(cx, cy, r = 3) {
    gPads.appendChild(mk('circle', { cx, cy, r, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.9' }));
    gPads.appendChild(mk('circle', { cx, cy, r: r * 0.45, fill: 'none', stroke: 'rgba(48,209,88,0.28)', 'stroke-width': '0.5' }));
  }

  // ── Helper: SMD resistor ──
  function resistor(cx, cy, angle = 0) {
    const g = mk('g', { transform: `rotate(${angle} ${cx} ${cy})` });
    g.appendChild(mk('rect', { x: cx-7, y: cy-3.5, width: 14, height: 7, fill: C.smd, stroke: C.smdBorder, 'stroke-width': '0.7', rx: '1' }));
    [-1,1].forEach(s => g.appendChild(mk('rect', { x: cx + s*4.5 - 2, y: cy-3.5, width: 3, height: 7, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.5' })));
    gComps.appendChild(g);
  }

  // ── Helper: SMD cap ──
  function cap(cx, cy, angle = 0) {
    const g = mk('g', { transform: `rotate(${angle} ${cx} ${cy})` });
    g.appendChild(mk('rect', { x: cx-4.5, y: cy-4.5, width: 9, height: 9, fill: C.smd, stroke: C.smdBorder, 'stroke-width': '0.7', rx: '1.5' }));
    g.appendChild(mk('line', { x1: cx-1, y1: cy-3, x2: cx-1, y2: cy+3, stroke: C.smdBorder, 'stroke-width': '0.6' }));
    gComps.appendChild(g);
  }

  // ── Helper: via array (row of vias) ──
  function viaRow(sx, sy, count, spacing, horiz = true) {
    for (let i = 0; i < count; i++) {
      via(horiz ? sx + i*spacing : sx, horiz ? sy : sy + i*spacing, 2.5);
    }
  }

  // ── Helper: trace bundle (N parallel traces) ──
  function traceBundleH(x1, x2, y, n, pitch = 5, color = C.trace) {
    const start = y - ((n-1)*pitch)/2;
    for (let i = 0; i < n; i++) {
      const ty = start + i * pitch;
      gTraces.appendChild(mk('line', { x1, y1: ty, x2, y2: ty, stroke: color, 'stroke-width': '0.9', 'stroke-linecap': 'square' }));
    }
  }

  function traceBundleV(x, y1, y2, n, pitch = 5, color = C.trace) {
    const start = x - ((n-1)*pitch)/2;
    for (let i = 0; i < n; i++) {
      const tx = start + i * pitch;
      gTraces.appendChild(mk('line', { x1: tx, y1, x2: tx, y2, stroke: color, 'stroke-width': '0.9', 'stroke-linecap': 'square' }));
    }
  }

  // ── Helper: routed trace (ortho + 45° bend) ──
  function routeTrace(x1, y1, x2, y2, color = C.trace, width = '0.9') {
    // Determine bend: go horizontal first, then 45° corner, then vertical
    const dx = x2 - x1, dy = y2 - y1;
    let d;
    if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
      d = `M${x1} ${y1} L${x2} ${y2}`;
    } else {
      const cornerLen = Math.min(Math.abs(dx), Math.abs(dy));
      const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
      const mx1 = x1 + dx - sx * cornerLen;
      const my1 = y1;
      const mx2 = x2;
      const my2 = y1 + sy * cornerLen;
      d = `M${x1} ${y1} L${mx1} ${my1} L${mx2} ${my2} L${x2} ${y2}`;
    }
    gTraces.appendChild(mk('path', { d, stroke: color, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'square', 'stroke-linejoin': 'miter' }));
  }

  // ── Silkscreen label ──
  function silkLabel(x, y, text) {
    const t = mk('text', {
      x, y,
      fill: C.silkText,
      'font-size': '6',
      'font-family': 'monospace',
      'letter-spacing': '0.5',
    });
    t.textContent = text;
    gSilk.appendChild(t);
  }

  // ════════════════════════════════════════════════════════
  //  SCENE LAYOUT
  //  We use proportional positioning so it works any screen
  // ════════════════════════════════════════════════════════

  // ── Main chipset — center-left ──
  const CHIP_CX = W * (mob ? 0.3 : 0.28);
  const CHIP_CY = H * 0.48;
  const CHIP_W  = mob ? 68 : 96;
  const CHIP_H  = mob ? 60 : 84;

  const chip = drawIC(gComps, CHIP_CX, CHIP_CY, CHIP_W, CHIP_H, 6, 6);
  silkLabel(CHIP_CX - CHIP_W/2 + 2, CHIP_CY + CHIP_H/2 + 12, 'U1');

  // Via farm around chipset (decoupling)
  if (!mob) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        via(CHIP_CX - CHIP_W/2 - 22 + col * 7.5, CHIP_CY - 14 + row * 8, 2.2);
      }
    }
  }

  // ── Secondary IC — upper right ──
  const IC2_CX = W * (mob ? 0.72 : 0.68);
  const IC2_CY = H * (mob ? 0.28 : 0.30);
  const IC2_W  = mob ? 42 : 58;
  const IC2_H  = mob ? 36 : 48;

  drawIC(gComps, IC2_CX, IC2_CY, IC2_W, IC2_H, 6, 6);
  silkLabel(IC2_CX - IC2_W/2 + 2, IC2_CY + IC2_H/2 + 10, 'U2');

  // ── Small controller IC — lower right ──
  const IC3_CX = W * (mob ? 0.70 : 0.72);
  const IC3_CY = H * (mob ? 0.70 : 0.72);
  const IC3_W  = mob ? 32 : 42;
  const IC3_H  = mob ? 28 : 36;

  drawIC(gComps, IC3_CX, IC3_CY, IC3_W, IC3_H, 7, 7);
  silkLabel(IC3_CX - IC3_W/2 + 2, IC3_CY + IC3_H/2 + 10, 'U3');

  // ── Edge connector — bottom left (PCIe/memory slot style) ──
  if (!mob) {
    const CONN_X = W * 0.04;
    const CONN_Y = H * 0.72;
    const CONN_H = 90;
    const CONN_W = 12;

    gComps.appendChild(mk('rect', {
      x: CONN_X, y: CONN_Y - CONN_H/2,
      width: CONN_W, height: CONN_H,
      fill: C.ic, stroke: C.icBorder, 'stroke-width': '0.8', rx: '1',
    }));
    // Connector fingers
    for (let i = 0; i < 12; i++) {
      const py = CONN_Y - CONN_H/2 + 5 + i * 6.8;
      gPads.appendChild(mk('rect', { x: CONN_X-1, y: py, width: CONN_W+2, height: 4, fill: C.padFill, stroke: C.pad, 'stroke-width': '0.5', rx: '0.5' }));
    }
    silkLabel(CONN_X + 1, CONN_Y + CONN_H/2 + 10, 'J1');
  }

  // ── Power delivery network — horizontal thick bus ──
  if (!mob) {
    const PWR_Y = H * 0.84;
    gTraces.appendChild(mk('line', {
      x1: W * 0.05, y1: PWR_Y,
      x2: W * 0.90, y2: PWR_Y,
      stroke: C.tracePwr, 'stroke-width': '2.2', 'stroke-linecap': 'square',
    }));
    // VCC labels at intervals
    for (let i = 0; i < 6; i++) {
      const vx = W * 0.12 + i * (W * 0.14);
      gTraces.appendChild(mk('line', { x1: vx, y1: PWR_Y, x2: vx, y2: PWR_Y - 18, stroke: C.tracePwr, 'stroke-width': '1.4', 'stroke-linecap': 'square' }));
      via(vx, PWR_Y - 18, 3.2);
      if (i % 2 === 0) silkLabel(vx - 5, PWR_Y + 10, 'VCC');
    }
  }

  // ── Trace bundles: chipset → IC2 ──
  // Horizontal run from right side of chipset
  const BUS1_X1 = CHIP_CX + CHIP_W/2 + 6;
  const BUS1_X2 = IC2_CX - IC2_W/2 - 6;
  const BUS1_Y  = (CHIP_CY + IC2_CY) / 2;
  const busCount = mob ? 4 : 7;

  // Route bundle: right from chip, then angle up to IC2
  traceBundleH(BUS1_X1, Math.min(BUS1_X1 + (BUS1_X2 - BUS1_X1)*0.55, W-10), CHIP_CY - 10, busCount, 4.5);
  traceBundleV(BUS1_X2 + (BUS1_X2 - BUS1_X1)*0.1, CHIP_CY - 10, IC2_CY + IC2_H/2, busCount, 4.5);

  // ── Trace bundles: chipset → IC3 ──
  const BUS2_Y1 = CHIP_CY + CHIP_H/2 + 5;
  const BUS2_Y2 = IC3_CY - IC3_H/2 - 5;
  traceBundleV(CHIP_CX + 15, BUS2_Y1, Math.min(BUS2_Y1 + (BUS2_Y2 - BUS2_Y1)*0.5, H-10), mob ? 3 : 5, 4.5);
  traceBundleH(CHIP_CX + 15, IC3_CX, BUS2_Y2 + (BUS2_Y2 - BUS2_Y1)*0.1, mob ? 3 : 5, 4.5);

  // ── Individual routed traces radiating from chipset ──
  const traceTargets = mob ? [
    [CHIP_CX - CHIP_W/2 - 40, CHIP_CY - 30],
    [CHIP_CX - CHIP_W/2 - 50, CHIP_CY + 25],
    [CHIP_CX + 20,             CHIP_CY + CHIP_H/2 + 55],
  ] : [
    [CHIP_CX - CHIP_W/2 - 65, CHIP_CY - 40],
    [CHIP_CX - CHIP_W/2 - 80, CHIP_CY + 10],
    [CHIP_CX - CHIP_W/2 - 55, CHIP_CY + 55],
    [CHIP_CX + 30,             CHIP_CY + CHIP_H/2 + 75],
    [W * 0.55,                  CHIP_CY + CHIP_H/2 + 40],
    [W * 0.15,                  H * 0.20],
  ];

  traceTargets.forEach(([tx, ty]) => {
    const cx = clamp(tx, 10, W-10), cy = clamp(ty, 10, H-10);
    routeTrace(
      CHIP_CX + (cx < CHIP_CX ? -CHIP_W/2 : CHIP_W/2),
      CHIP_CY,
      cx, cy,
      C.traceMed, '0.85',
    );
    via(cx, cy, 2.8);
  });

  // ── Cap/resistor arrays near chipset ──
  const compAngles = mob ? [0, 90] : [0, 0, 90, 90, 0, 45];
  const compOffsets = mob ? [
    [CHIP_CX - CHIP_W/2 - 22, CHIP_CY - 10],
    [CHIP_CX + CHIP_W/2 + 22, CHIP_CY + 10],
  ] : [
    [CHIP_CX - CHIP_W/2 - 20, CHIP_CY - 18],
    [CHIP_CX - CHIP_W/2 - 20, CHIP_CY + 4],
    [CHIP_CX - CHIP_W/2 - 20, CHIP_CY + 22],
    [CHIP_CX + CHIP_W/2 + 22, CHIP_CY - 18],
    [CHIP_CX + CHIP_W/2 + 22, CHIP_CY + 4],
    [CHIP_CX,                   CHIP_CY - CHIP_H/2 - 18],
  ];

  compOffsets.forEach(([cx, cy], i) => {
    const a = compAngles[i] || 0;
    if (i % 2 === 0) resistor(cx, cy, a);
    else             cap(cx, cy, a);
    // Small stub trace to component
    const sx = cx < CHIP_CX ? CHIP_CX - CHIP_W/2 - 5 : CHIP_CX + CHIP_W/2 + 5;
    gTraces.appendChild(mk('line', { x1: sx, y1: CHIP_CY, x2: cx, y2: cy, stroke: C.trace, 'stroke-width': '0.7', 'stroke-dasharray': '', 'stroke-linecap': 'round' }));
  });

  // ── Via rows near IC2 ──
  viaRow(IC2_CX - IC2_W/2 - 28, IC2_CY - 8, mob ? 3 : 5, 7);
  viaRow(IC2_CX - IC2_W/2 - 28, IC2_CY + 8, mob ? 3 : 5, 7);

  // ── Scattered test points / single vias ──
  const testPoints = mob ? 8 : 20;
  for (let i = 0; i < testPoints; i++) {
    via(rnd(W*0.05, W*0.95), rnd(H*0.05, H*0.95), rnd(1.5, 2.5));
  }

  // ── Signal pulse animations (desktop only) ──
  if (!mob) {
    // Animate the trace bundles
    const pulseLines = Array.from(gTraces.children)
      .filter(el => el.tagName === 'line' || el.tagName === 'path')
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    pulseLines.forEach(el => {
      const len = el.tagName === 'line'
        ? Math.hypot(
            (el.getAttribute('x2') - el.getAttribute('x1')),
            (el.getAttribute('y2') - el.getAttribute('y1'))
          )
        : 200;
      if (len < 20) return;

      el.setAttribute('stroke', C.tracePulse);

      el.animate([
        { strokeDasharray: `${len}`, strokeDashoffset: `${len}`,    opacity: 0   },
        { strokeDasharray: `${len}`, strokeDashoffset: `${len*0.9}`, opacity: 1, offset: 0.06 },
        { strokeDasharray: `${len}`, strokeDashoffset: '0',          opacity: 1, offset: 0.94 },
        { strokeDasharray: `${len}`, strokeDashoffset: '0',          opacity: 0   },
      ], {
        duration: rnd(2600, 5000),
        delay:    rnd(0, 5500),
        iterations: Infinity,
        easing: 'ease-in-out',
      });
    });
  }
})();


/* ═══════════════════════════════════════════════════════════
   3. SMOOTH CURSOR TRAIL (desktop pointer only)
   Speed-sensitive length. Fades from tail. Smooth bezier line.
═══════════════════════════════════════════════════════════ */
(function initTrail() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const canvas = document.getElementById('trail-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const TRAIL_MS = 220;   // trail lifetime in ms
  const MIN_DIST = 3;     // minimum px between recorded points

  const pts = [];          // { x, y, t }
  let   last = null;
  let   active = false;

  document.addEventListener('mousemove', e => {
    const p = { x: e.clientX, y: e.clientY, t: Date.now() };
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= MIN_DIST) {
      pts.push(p);
      last = p;
    }
    active = true;
  }, { passive: true });

  document.addEventListener('mouseleave', () => { active = false; });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    // Remove expired points
    while (pts.length > 1 && now - pts[0].t > TRAIL_MS) pts.shift();

    if (pts.length >= 2) {
      // ── Outer glow pass (wide, soft) ──
      ctx.save();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 7;

      for (let i = 1; i < pts.length; i++) {
        const age   = (now - pts[i].t) / TRAIL_MS;
        const alpha = Math.max(0, 1 - age) * 0.09;

        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(pts[0].x, pts[0].y);
        } else {
          const px = (pts[i-2].x + pts[i-1].x) / 2;
          const py = (pts[i-2].y + pts[i-1].y) / 2;
          ctx.moveTo(px, py);
        }
        const mx = (pts[i-1].x + pts[i].x) / 2;
        const my = (pts[i-1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mx, my);

        ctx.strokeStyle = `rgba(48,209,88,${alpha})`;
        ctx.stroke();
      }
      ctx.restore();

      // ── Core trail pass (thin, sharp) ──
      ctx.save();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < pts.length; i++) {
        const t     = i / pts.length;                    // 0 = tail, 1 = head
        const age   = (now - pts[i].t) / TRAIL_MS;
        const alpha = Math.max(0, 1 - age) * 0.75;
        const width = 0.8 + t * 1.4;

        ctx.beginPath();
        if (i === 1) {
          ctx.moveTo(pts[0].x, pts[0].y);
        } else {
          const px = (pts[i-2].x + pts[i-1].x) / 2;
          const py = (pts[i-2].y + pts[i-1].y) / 2;
          ctx.moveTo(px, py);
        }
        const mx = (pts[i-1].x + pts[i].x) / 2;
        const my = (pts[i-1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mx, my);

        ctx.strokeStyle = `rgba(48,209,88,${alpha})`;
        ctx.lineWidth   = width;
        ctx.stroke();
      }
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();


/* ═══════════════════════════════════════════════════════════
   4. SCROLL REVEAL
═══════════════════════════════════════════════════════════ */
(function initScroll() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 75}ms`; });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

  els.forEach(el => obs.observe(el));
})();


/* ═══════════════════════════════════════════════════════════
   5. CLICK RIPPLE
═══════════════════════════════════════════════════════════ */
(function initRipple() {
  document.querySelectorAll('h1, h2, p').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('click', e => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const dot  = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
    });
  });
})();
