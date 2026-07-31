/**
 * SHOPDIGITAL · Fondo Ciber-Digital Púrpura
 * Canvas de circuitos ortogonales animados con pulsos de luz neón.
 * Se inicializa automáticamente al cargar el DOM.
 * NO toca ningún componente de la app — solo el canvas #sd-circuit-canvas.
 */

(function initSDCircuitBackground() {
  'use strict';

  const canvas = document.getElementById('sd-circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, nodes, edges, pulses, rafId;

  const rand = (a, b) => Math.random() * (b - a) + a;
  const randInt = (a, b) => Math.floor(rand(a, b));

  const COLORS = {
    line:       'rgba(190, 155, 255, 0.3)',
    lineBright: 'rgba(215, 185, 255, 0.55)',
    nodeOuter:  'rgba(200, 165, 255, 0.45)',
    nodeInner:  'rgba(255, 255, 255, 0.85)',
    pulse:      'rgba(255, 255, 255, 0.9)',
  };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    build();
  }

  function build() {
    nodes  = [];
    edges  = [];
    pulses = [];

    const cols   = Math.ceil(W / 110) + 1;
    const rows   = Math.ceil(H / 110) + 1;
    const stepX  = W / (cols - 1);
    const stepY  = H / (rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nodes.push({
          x:          c * stepX + rand(-stepX * 0.35, stepX * 0.35),
          y:          r * stepY + rand(-stepY * 0.35, stepY * 0.35),
          r:          rand(2.5, 4.5),
          pulsePhase: rand(0, Math.PI * 2),
          bright:     Math.random() > 0.65,
        });
      }
    }

    const maxDist = Math.max(stepX, stepY) * 1.8;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < maxDist && Math.random() > 0.45) {
          const midX = Math.random() > 0.5 ? b.x : a.x;
          const midY = Math.random() > 0.5 ? a.y : b.y;
          edges.push({ a, b, midX, midY, bright: a.bright && b.bright });
        }
      }
    }

    for (let k = 0; k < 18; k++) spawnPulse();
  }

  function spawnPulse() {
    if (!edges.length) return;
    const edge = edges[randInt(0, edges.length)];
    pulses.push({ edge, t: rand(0, 1), speed: rand(0.003, 0.008), size: rand(2.5, 5), alpha: 0 });
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function getPulsePos(e, t) {
    if (t <= 0.5) {
      const s = t * 2;
      return { x: lerp(e.a.x, e.midX, s), y: lerp(e.a.y, e.midY, s) };
    }
    const s = (t - 0.5) * 2;
    return { x: lerp(e.midX, e.b.x, s), y: lerp(e.midY, e.b.y, s) };
  }

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    // Aristas (líneas de circuito)
    for (const e of edges) {
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.midX, e.midY);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.strokeStyle = e.bright ? COLORS.lineBright : COLORS.line;
      ctx.lineWidth   = e.bright ? 1.2 : 0.8;
      ctx.stroke();
    }

    // Nodos
    for (const n of nodes) {
      const pulse = 0.7 + 0.3 * Math.sin(ts * 0.0012 + n.pulsePhase);

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 1.8 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.nodeOuter;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = n.bright ? COLORS.nodeInner : COLORS.nodeOuter;
      ctx.fill();

      if (n.bright) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6 * pulse);
        g.addColorStop(0, 'rgba(255,255,255,0.22)');
        g.addColorStop(1, 'rgba(190,150,255,0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    }

    // Pulsos
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.speed;

      if      (p.t < 0.15) p.alpha = p.t / 0.15;
      else if (p.t > 0.85) p.alpha = (1 - p.t) / 0.15;
      else                  p.alpha = 1;

      if (p.t >= 1) { pulses.splice(i, 1); spawnPulse(); continue; }

      const pos = getPulsePos(p.edge, p.t);

      const gO = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 4);
      gO.addColorStop(0, `rgba(230,200,255,${p.alpha * 0.5})`);
      gO.addColorStop(1, 'rgba(230,200,255,0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = gO;
      ctx.fill();

      const gI = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size);
      gI.addColorStop(0, `rgba(255,255,255,${p.alpha * 0.95})`);
      gI.addColorStop(0.5, `rgba(210,180,255,${p.alpha * 0.6})`);
      gI.addColorStop(1, 'rgba(210,180,255,0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = gI;
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  // Respeta prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  resize();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    requestAnimationFrame(draw);
  });
  requestAnimationFrame(draw);
})();
