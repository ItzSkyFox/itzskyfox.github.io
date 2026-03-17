'use strict';

/* ═══════════════════════════════════════════════════════════════
   1. DYNAMIC ISLAND
   Populates name + YT handle from data attributes on .island
   Mobile: tap to toggle · Desktop: hover (CSS handles it)
═══════════════════════════════════════════════════════════════ */
(function initIsland() {
  const island = document.querySelector('.island');
  if (!island) return;

  // ── Populate from data attrs — easy to change in HTML ──
  const name   = island.dataset.name     || 'ItzSkyFox';
  const handle = island.dataset.ytHandle || '@ItzSkyFox';
  const url    = island.dataset.ytUrl    || 'https://youtube.com/@ItzSkyFox';

  island.querySelector('.island-name').textContent      = name;
  island.querySelector('.island-yt-handle').textContent = handle;
  island.querySelector('.island-yt').href               = url;

  // ── Mobile: tap to expand/collapse ──
  const isTouch = window.matchMedia('(hover: none)').matches;
  if (isTouch) {
    island.addEventListener('click', e => {
      if (e.target.closest('.island-yt')) return; // let link through
      island.classList.toggle('expanded');
    });
    // Tap outside = collapse
    document.addEventListener('click', e => {
      if (!island.contains(e.target)) island.classList.remove('expanded');
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════
   2. CIRCUIT BOARD BACKGROUND SVG
   Draws PCB-style traces, pads, IC chip outlines + signal pulse
═══════════════════════════════════════════════════════════════ */
(function generateCircuit() {
  const svg = document.getElementById('bg-svg');
  if (!svg) return;

  const isMobile = window.innerWidth < 769;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const ns = 'http://www.w3.org/2000/svg';

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('xmlns', ns);

  // ── Palette ──
  const TRACE = 'rgba(74,240,138,0.11)';
  const PAD   = 'rgba(74,240,138,0.20)';
  const CHIP  = 'rgba(74,240,138,0.06)';
  const CHIP_BORDER = 'rgba(74,240,138,0.16)';

  // ── Grid ──
  const GRID = isMobile ? 85 : 62;
  const cols = Math.floor(W / GRID);
  const rows = Math.floor(H / GRID);
  const gx   = c => c * GRID + GRID * 0.5;
  const gy   = r => r * GRID + GRID * 0.5;
  const rand  = (a, b) => Math.random() * (b - a) + a;
  const rInt  = (a, b) => Math.floor(rand(a, b));

  const make = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };

  const pulseCandidates = [];

  // ── Straight traces (horizontal / vertical) ──
  const lineCount = isMobile ? 28 : 55;
  for (let i = 0; i < lineCount; i++) {
    const col   = rInt(0, cols - 2);
    const row   = rInt(0, rows - 2);
    const horiz = Math.random() > 0.5;
    const span  = rInt(1, 3);

    const x1 = gx(col);
    const y1 = gy(row);
    const x2 = horiz ? Math.min(gx(col + span), W - 8) : x1;
    const y2 = horiz ? y1 : Math.min(gy(row + span), H - 8);

    const line = make('line', {
      x1, y1, x2, y2,
      stroke: TRACE, 'stroke-width': '1.2', 'stroke-linecap': 'round',
    });
    svg.appendChild(line);
    pulseCandidates.push({ el: line, len: Math.hypot(x2 - x1, y2 - y1) });
  }

  // ── L-shaped traces (PCB corner routing) ──
  const lCount = isMobile ? 10 : 22;
  for (let i = 0; i < lCount; i++) {
    const col = rInt(1, cols - 2);
    const row = rInt(1, rows - 2);
    const dx  = (Math.random() > 0.5 ? 1 : -1) * rInt(1, 3);
    const dy  = (Math.random() > 0.5 ? 1 : -1) * rInt(1, 2);

    const x1   = gx(col);
    const y1   = gy(row);
    const xMid = gx(col + dx);
    const yMid = y1;
    const x2   = xMid;
    const y2   = gy(row + dy);

    const path = make('path', {
      d: `M ${x1} ${y1} L ${xMid} ${yMid} L ${x2} ${y2}`,
      stroke: TRACE, 'stroke-width': '1.2',
      fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    });
    svg.appendChild(path);
  }

  // ── Via pads (circles at junctions) ──
  const padCount = isMobile ? 22 : 50;
  for (let i = 0; i < padCount; i++) {
    const col = rInt(0, cols);
    const row = rInt(0, rows);
    const big = Math.random() > 0.7;
    const r   = big ? 3.8 : 2.2;

    svg.appendChild(make('circle', {
      cx: gx(col), cy: gy(row), r,
      fill: 'none', stroke: PAD, 'stroke-width': '1',
    }));

    // Inner dot on bigger pads
    if (big) {
      svg.appendChild(make('circle', {
        cx: gx(col), cy: gy(row), r: '1.2',
        fill: PAD,
      }));
    }
  }

  // ── IC chip outlines ──
  const chipCount = isMobile ? 2 : 5;
  for (let i = 0; i < chipCount; i++) {
    const col = rInt(1, cols - 3);
    const row = rInt(1, rows - 3);
    const cw  = GRID * rand(1.4, 2.6);
    const ch  = GRID * rand(0.8, 1.4);
    const cx  = gx(col) - cw / 2;
    const cy  = gy(row) - ch / 2;

    svg.appendChild(make('rect', {
      x: cx, y: cy, width: cw, height: ch,
      fill: CHIP, stroke: CHIP_BORDER, 'stroke-width': '1', rx: '3',
    }));

    // Pin lines top + bottom
    const pinCount = Math.max(2, Math.floor(cw / 18));
    const pinSpacing = (cw - 24) / Math.max(pinCount - 1, 1);
    for (let p = 0; p < pinCount; p++) {
      const px = cx + 12 + p * pinSpacing;
      svg.appendChild(make('line', { x1: px, y1: cy,      x2: px, y2: cy - 9,      stroke: TRACE, 'stroke-width': '1', 'stroke-linecap': 'round' }));
      svg.appendChild(make('line', { x1: px, y1: cy + ch, x2: px, y2: cy + ch + 9, stroke: TRACE, 'stroke-width': '1', 'stroke-linecap': 'round' }));
    }
  }

  // ── Signal pulse animation (desktop only) ──
  if (!isMobile) {
    const pulseLines = pulseCandidates
      .filter(t => t.len > 30)
      .sort(() => Math.random() - 0.5)
      .slice(0, 7);

    pulseLines.forEach(({ el, len }) => {
      el.setAttribute('stroke', 'rgba(74,240,138,0.45)');

      const dur   = rand(2.5, 5);
      const delay = rand(0, 5);

      el.animate([
        { strokeDasharray: `${len}`, strokeDashoffset: `${len}`, opacity: 0     },
        { strokeDasharray: `${len}`, strokeDashoffset: `${len * 0.9}`, opacity: 1, offset: 0.06 },
        { strokeDasharray: `${len}`, strokeDashoffset: '0', opacity: 1, offset: 0.94 },
        { strokeDasharray: `${len}`, strokeDashoffset: '0', opacity: 0            },
      ], {
        duration: dur * 1000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: 'ease-in-out',
      });
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════
   3. CURSOR GLOW  (desktop / pointer-fine only)
   Smooth lerp follow — not snappy, floats behind cursor
═══════════════════════════════════════════════════════════════ */
(function initCursorGlow() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let mx = 0, my = 0, gx = 0, gy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    glow.style.opacity = '1';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  (function loop() {
    gx += (mx - gx) * 0.09;
    gy += (my - gy) * 0.09;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(loop);
  })();
})();


/* ═══════════════════════════════════════════════════════════════
   4. SCROLL FADE-IN  (IntersectionObserver)
   Staggered reveal for [data-animate] elements
═══════════════════════════════════════════════════════════════ */
(function initScrollAnims() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  // Stagger within each section
  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 5) * 75}ms`;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  els.forEach(el => obs.observe(el));
})();


/* ═══════════════════════════════════════════════════════════════
   5. CLICK RIPPLE
   Green ripple burst on h1 / h2 / p click
═══════════════════════════════════════════════════════════════ */
(function initRipple() {
  document.querySelectorAll('h1, h2, p').forEach(el => {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.addEventListener('click', e => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top  - size / 2;

      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
      el.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    });
  });
})();
