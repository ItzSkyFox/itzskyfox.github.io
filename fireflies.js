/* fireflies.js — drop this before </body> */
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'firefly-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // How many fireflies — fewer on small screens
  const COUNT = window.innerWidth < 600 ? 28 : 55;

  const flies = Array.from({ length: COUNT }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    r:     Math.random() * 1.6 + 0.6,        // radius 0.6 – 2.2
    speed: Math.random() * 0.25 + 0.06,      // drift speed
    angle: Math.random() * Math.PI * 2,      // direction
    turn:  (Math.random() - 0.5) * 0.018,   // how much it slowly veers
    pulse: Math.random() * Math.PI * 2,      // phase offset for glow pulse
    // warm amber-green hue range
    hue:   Math.random() > 0.4 ? 75 : 48,   // 75 = yellow-green, 48 = amber
    sat:   70 + Math.random() * 20,
  }));

  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    flies.forEach(f => {
      // Slow pulse: opacity breathes between 0.15 and 0.85
      const pulse = 0.15 + 0.70 * (0.5 + 0.5 * Math.sin(ts * 0.0008 + f.pulse));

      // Radial glow
      const grd = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
      grd.addColorStop(0,   `hsla(${f.hue}, ${f.sat}%, 75%, ${pulse})`);
      grd.addColorStop(0.4, `hsla(${f.hue}, ${f.sat}%, 60%, ${pulse * 0.35})`);
      grd.addColorStop(1,   `hsla(${f.hue}, ${f.sat}%, 50%, 0)`);

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Bright core dot
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${f.hue}, 90%, 88%, ${pulse * 0.9})`;
      ctx.fill();

      // Move
      f.angle += f.turn;
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed;

      // Wrap around edges
      if (f.x < -20) f.x = canvas.width  + 20;
      if (f.x > canvas.width  + 20) f.x = -20;
      if (f.y < -20) f.y = canvas.height + 20;
      if (f.y > canvas.height + 20) f.y = -20;
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
