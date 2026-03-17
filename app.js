'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. DYNAMIC ISLAND
═══════════════════════════════════════════════════════════════ */
(function initIsland() {
  const island = document.querySelector('.island');
  if (!island) return;

  const name   = island.dataset.name     || 'ItzSkyFox';
  const handle = island.dataset.ytHandle || '@ItzSkyFox';
  const url    = island.dataset.ytUrl    || 'https://youtube.com/@ItzSkyFox';

  island.querySelector('.island-name').textContent        = name;
  island.querySelector('.island-yt-handle').textContent   = handle;
  island.querySelector('.island-yt-link').href            = url;

  // Mobile: tap to expand
  if (window.matchMedia('(hover: none)').matches) {
    island.addEventListener('click', e => {
      if (e.target.closest('.island-yt-link')) return;
      island.classList.toggle('expanded');
    });
    document.addEventListener('click', e => {
      if (!island.contains(e.target)) island.classList.remove('expanded');
    }, true);
  }
})();


/* ═══════════════════════════════════════════════════════════════
   2. PCB BACKGROUND — improved accuracy
   Traces: orthogonal + 45° bends (real PCB routing)
   Components: ICs, SMD resistors, SMD caps, vias, pads
   Signal: animated travelling pulse on select traces
═══════════════════════════════════════════════════════════════ */
(function generatePCB() {
  const svg = document.getElementById('bg-svg');
  if (!svg) return;

  const W  = window.innerWidth;
  const H  = window.innerHeight;
  const ns = 'http://www.w3.org/2000/svg';
  const mobile = W < 769;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const mk = (tag, attr) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attr)) el.setAttribute(k, v);
    return el;
  };

  const rand  = (a, b) => Math.random() * (b - a) + a;
  const rInt  = (a, b) => Math.floor(rand(a, b + 1));
  const snap  = (v, g) => Math.round(v / g) * g;

  // PCB grid
  const G    = mobile ? 70 : 52;
  const cols = Math.ceil(W / G) + 1;
  const rows = Math.ceil(H / G) + 1;
  const gx   = c => c * G;
  const gy   = r => r * G;

  // ── Colors ──
  const C = {
    trace:     'rgba(48,209,88,0.10)',
    traceBrt:  'rgba(48,209,88,0.20)',
    pad:       'rgba(48,209,88,0.22)',
    padFill:   'rgba(48,209,88,0.10)',
    ic:        'rgba(48,209,88,0.05)',
    icBorder:  'rgba(48,209,88,0.14)',
    smd:       'rgba(48,209,88,0.08)',
    smdBorder: 'rgba(48,209,88,0.18)',
    silk:      'rgba(48,209,88,0.06)',
  };

  // ── Layer groups (back to front) ──
  const gSilk   = mk('g', { opacity: '1' });
  const gTraces = mk('g', { opacity: '1' });
  const gComps  = mk('g', { opacity: '1' });
  const gPads   = mk('g', { opacity: '1' });
  svg.append(gSilk, gTraces, gComps, gPads);

  // ── Silkscreen reference lines (very faint background grid suggestion) ──
  for (let r = 0; r <= rows; r += 3) {
    gSilk.appendChild(mk('line', {
      x1: 0, y1: gy(r), x2: W, y2: gy(r),
      stroke: 'rgba(48,209,88,0.025)', 'stroke-width': '0.5',
      'stroke-dasharray': '2 12',
    }));
  }
  for (let c = 0; c <= cols; c += 3) {
    gSilk.appendChild(mk('line', {
      x1: gx(c), y1: 0, x2: gx(c), y2: H,
      stroke: 'rgba(48,209,88,0.025)', 'stroke-width': '0.5',
      'stroke-dasharray': '2 12',
    }));
  }

  // ── Orthogonal traces ──
  const traceEls = [];
  const traceCount = mobile ? 24 : 52;

  for (let i = 0; i < traceCount; i++) {
    const c    = rInt(0, cols - 3);
    const r    = rInt(0, rows - 3);
    const horiz = Math.random() > 0.48;
    const span = rInt(1, 4);
    const x1   = snap(gx(c), G);
    const y1   = snap(gy(r), G);
    const x2   = horiz ? Math.min(x1 + span * G, W - 4) : x1;
    const y2   = horiz ? y1 : Math.min(y1 + span * G, H - 4);

    const line = mk('line', {
      x1, y1, x2, y2,
      stroke: C.trace, 'stroke-width': '1', 'stroke-linecap': 'square',
    });
    gTraces.appendChild(line);
    traceEls.push({ el: line, x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
  }

  // ── 45° diagonal traces (real PCB routing style) ──
  const diagCount = mobile ? 6 : 16;
  for (let i = 0; i < diagCount; i++) {
    const c   = rInt(1, cols - 3);
    const r   = rInt(1, rows - 3);
    const len = rInt(1, 2) * G;
    const dir = rInt(0, 3); // 4 diagonal directions
    const dx  = [1, -1, 1, -1][dir] * len;
    const dy  = [1, 1, -1, -1][dir] * len;
    const x1  = gx(c), y1 = gy(r);

    gTraces.appendChild(mk('line', {
      x1, y1, x2: x1 + dx, y2: y1 + dy,
      stroke: C.trace, 'stroke-width': '0.8', 'stroke-linecap': 'round',
    }));
  }

  // ── L-bend traces (orthogonal corner routing) ──
  const lCount = mobile ? 8 : 20;
  for (let i = 0; i < lCount; i++) {
    const c  = rInt(1, cols - 3);
    const r  = rInt(1, rows - 3);
    const dx = (Math.random() > 0.5 ? 1 : -1) * rInt(1, 3);
    const dy = (Math.random() > 0.5 ? 1 : -1) * rInt(1, 2);
    const x1 = gx(c), y1 = gy(r);
    const mx = gx(c + dx), my = y1;
    const x2 = mx, y2 = gy(r + dy);

    gTraces.appendChild(mk('path', {
      d: `M${x1} ${y1} L${mx} ${my} L${x2} ${y2}`,
      stroke: C.trace, 'stroke-width': '1',
      fill: 'none', 'stroke-linecap': 'square', 'stroke-linejoin': 'miter',
    }));
  }

  // ── Through-hole vias ──
  const viaCount = mobile ? 18 : 42;
  for (let i = 0; i < viaCount; i++) {
    const cx = snap(gx(rInt(0, cols)), G);
    const cy = snap(gy(rInt(0, rows)), G);
    const big = Math.random() > 0.65;

    // Annular ring
    gPads.appendChild(mk('circle', {
      cx, cy, r: big ? 4.5 : 3,
      fill: C.padFill, stroke: C.pad, 'stroke-width': big ? 1.2 : 0.9,
    }));
    // Drill hole
    gPads.appendChild(mk('circle', {
      cx, cy, r: big ? 2 : 1.3,
      fill: 'none', stroke: 'rgba(48,209,88,0.30)', 'stroke-width': '0.6',
    }));
  }

  // ── SMD resistors ──
  const resCount = mobile ? 5 : 14;
  for (let i = 0; i < resCount; i++) {
    const cx  = rand(G * 2, W - G * 2);
    const cy  = rand(G * 2, H - G * 2);
    const rot = Math.random() > 0.5 ? 0 : 90;
    const rw  = 14, rh = 7;

    const g = mk('g', { transform: `rotate(${rot} ${cx} ${cy})` });
    // Body
    g.appendChild(mk('rect', {
      x: cx - rw / 2, y: cy - rh / 2, width: rw, height: rh,
      fill: C.smd, stroke: C.smdBorder, 'stroke-width': '0.7', rx: '1',
    }));
    // End pads
    [-1, 1].forEach(s => {
      g.appendChild(mk('rect', {
        x: cx - rw / 2 + (s === -1 ? 0 : rw - 3), y: cy - rh / 2,
        width: 3, height: rh,
        fill: C.padFill, stroke: C.pad, 'stroke-width': '0.5',
      }));
    });
    gComps.appendChild(g);
  }

  // ── SMD capacitors (slightly wider, rounder) ──
  const capCount = mobile ? 3 : 9;
  for (let i = 0; i < capCount; i++) {
    const cx  = rand(G * 2, W - G * 2);
    const cy  = rand(G * 2, H - G * 2);
    const rot = rInt(0, 3) * 45;
    const cw  = 10, ch = 10;

    const g = mk('g', { transform: `rotate(${rot} ${cx} ${cy})` });
    g.appendChild(mk('rect', {
      x: cx - cw / 2, y: cy - ch / 2, width: cw, height: ch,
      fill: C.smd, stroke: C.smdBorder, 'stroke-width': '0.7', rx: '2',
    }));
    // Cap polarity mark
    g.appendChild(mk('line', {
      x1: cx - 1, y1: cy - ch / 2 + 2,
      x2: cx - 1, y2: cy + ch / 2 - 2,
      stroke: C.smdBorder, 'stroke-width': '0.6',
    }));
    gComps.appendChild(g);
  }

  // ── IC chips — proper SOIC/QFP style ──
  const icCount = mobile ? 2 : 5;
  for (let i = 0; i < icCount; i++) {
    const bw  = rand(40, 80);
    const bh  = rand(28, 55);
    const cx  = rand(G * 3, W - G * 3);
    const cy  = rand(G * 3, H - G * 3);
    const x   = cx - bw / 2;
    const y   = cy - bh / 2;
    const rot = Math.random() > 0.5 ? 90 : 0;

    const g = mk('g', { transform: `rotate(${rot} ${cx} ${cy})` });

    // Body
    g.appendChild(mk('rect', {
      x, y, width: bw, height: bh,
      fill: C.ic, stroke: C.icBorder, 'stroke-width': '1', rx: '2',
    }));

    // Pin 1 marker (notch circle)
    g.appendChild(mk('circle', {
      cx: x + 5, cy: y + 5, r: '2',
      fill: 'none', stroke: C.icBorder, 'stroke-width': '0.7',
    }));

    // Pins top + bottom
    const pinSpacing = 7;
    const pinCountH  = Math.floor((bw - 12) / pinSpacing);
    for (let p = 0; p < pinCountH; p++) {
      const px = x + 6 + p * pinSpacing;
      // Top pins
      g.appendChild(mk('rect', {
        x: px - 1.5, y: y - 5.5, width: 3, height: 6,
        fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.5',
      }));
      // Bottom pins
      g.appendChild(mk('rect', {
        x: px - 1.5, y: y + bh - 0.5, width: 3, height: 6,
        fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.5',
      }));
    }

    // Pins left + right (if tall enough)
    if (bh > 36) {
      const pinCountV = Math.floor((bh - 12) / pinSpacing);
      for (let p = 0; p < pinCountV; p++) {
        const py = y + 6 + p * pinSpacing;
        g.appendChild(mk('rect', {
          x: x - 5.5, y: py - 1.5, width: 6, height: 3,
          fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.5',
        }));
        g.appendChild(mk('rect', {
          x: x + bw - 0.5, y: py - 1.5, width: 6, height: 3,
          fill: C.padFill, stroke: C.pad, 'stroke-width': '0.6', rx: '0.5',
        }));
      }
    }

    gComps.appendChild(g);
  }

  // ── Signal pulse (desktop only) ──
  if (!mobile) {
    const candidates = traceEls.filter(t => t.len > G * 1.5);
    const picks = candidates.sort(() => Math.random() - 0.5).slice(0, 6);

    picks.forEach(({ el, len }) => {
      el.setAttribute('stroke', C.traceBrt);
      el.setAttribute('stroke-width', '1.2');

      el.animate([
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: `${len}`,   opacity: 0   },
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: `${len * 0.92}`, opacity: 0.9, offset: 0.05 },
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: `-${len * 0.08}`, opacity: 0.9, offset: 0.92 },
        { strokeDasharray: `${len} ${len}`, strokeDashoffset: `-${len}`,  opacity: 0   },
      ], {
        duration: rand(2800, 5200),
        delay: rand(0, 5000),
        iterations: Infinity,
        easing: 'ease-in-out',
      });
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════
   3. CURSOR TRAIL  (desktop pointer only)
   Small glowing dots that follow and fade — not a blob
═══════════════════════════════════════════════════════════════ */
(function initTrail() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const canvas = document.getElementById('trail-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const points = [];
  const MAX    = 22;     // trail length
  let mx = -999, my = -999;
  let active = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    active = true;
  }, { passive: true });

  document.addEventListener('mouseleave', () => { active = false; });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (active) {
      points.push({ x: mx, y: my, age: 0 });
      if (points.length > MAX) points.shift();
    }

    points.forEach((p, i) => {
      p.age++;
      const life  = 1 - p.age / (MAX * 2.2);
      if (life <= 0) return;

      const r     = 2.5 * life;
      const alpha = life * 0.65;

      // Outer glow
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      grd.addColorStop(0,   `rgba(48,209,88,${alpha * 0.5})`);
      grd.addColorStop(1,   `rgba(48,209,88,0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(48,209,88,${alpha})`;
      ctx.fill();
    });

    // Clean stale
    for (let i = points.length - 1; i >= 0; i--) {
      if (1 - points[i].age / (MAX * 2.2) <= 0) points.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();


/* ═══════════════════════════════════════════════════════════════
   4. SCROLL REVEAL
═══════════════════════════════════════════════════════════════ */
(function initScroll() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  els.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });

  els.forEach(el => obs.observe(el));
})();


/* ═══════════════════════════════════════════════════════════════
   5. CLICK RIPPLE
═══════════════════════════════════════════════════════════════ */
(function initRipple() {
  document.querySelectorAll('h1, h2, p').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('click', e => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const dot  = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top  - size / 2}px;
      `;
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
    });
  });
})();
