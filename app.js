// stryde.buenoworks.app: interactive claim map, waitlist form, on-screen-only video playback, section reveals.

// Instagram/Facebook in-app browsers ignore target=_blank and won't hand a play.google.com page to the Play app:
// on Android an intent: link opens the Play Store directly, falling back to the web listing.
if (/Android/i.test(navigator.userAgent)) {
  for (const a of document.querySelectorAll('a[href^="https://play.google.com/store/apps/details"]')) {
    const web = a.href, q = new URL(web).search.slice(1);
    a.href = `intent://details?${q}#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=${encodeURIComponent(web)};end`;
    a.removeAttribute('target');
  }
}

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the map: draw a loop, the land inside turns lime ----------
  const host = document.getElementById('map');
  const cvs = host.querySelector('canvas');
  const ctx = cvs.getContext('2d');
  const hint = document.getElementById('hint');
  const toast = document.getElementById('toast');
  const LIME = '#b6ff3a';
  let W = 0, H = 0, dpr = 1, blocks = [], river = [];
  let path = [], drawing = false, claims = [], demo = null, idleTimer = 0, touched = false, fade = 0;
  const M_PER_PX = 2.4; // synthetic scale for the "km² claimed" label

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function layout() {
    const r = host.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    // a made-up street grid with a river: blocks between streets, a few parks
    // streets every `cell`, wider avenues every 4th, blocks split into building footprints
    const R = rng(7), cell = Math.max(70, Math.min(W, H) / 6.5);
    blocks = [];
    for (let gy = -1; gy * cell < H + cell; gy++) for (let gx = -1; gx * cell < W + cell; gx++) {
      const gapX = gx % 4 === 0 ? cell * 0.26 : cell * 0.13, gapY = gy % 4 === 0 ? cell * 0.26 : cell * 0.13;
      const x = gx * cell + gapX / 2, y = gy * cell + gapY / 2, w = cell - gapX, h = cell - gapY;
      const park = R() < 0.09, parts = [];
      if (!park) {
        const split = R();
        if (split < 0.35) parts.push([0, 0, 1, 1]);
        else if (split < 0.7) { const s = 0.4 + R() * 0.2; parts.push([0, 0, s, 1], [s, 0, 1 - s, 1]); }
        else { const s = 0.45 + R() * 0.1, t = 0.45 + R() * 0.1; parts.push([0, 0, s, t], [s, 0, 1 - s, t], [0, t, s, 1 - t], [s, t, 1 - s, 1 - t]); }
      }
      blocks.push({ x, y, w, h, park, parts: parts.map((p) => ({ p, tone: R() })) });
    }
    river = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; river.push([t * W, H * 0.16 + Math.sin(t * 5.2) * H * 0.05]); }
    draw();
  }

  function base() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0a0d12'; ctx.fillRect(0, 0, W, H);
    for (const b of blocks) {
      ctx.fillStyle = b.park ? '#0f241a' : '#10161e';
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill();
      if (b.park) { ctx.fillStyle = '#143322'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(b.x + b.w * (0.2 + 0.15 * i), b.y + b.h * (0.3 + 0.4 * ((i * 37) % 10) / 10), b.w * 0.07, 0, 7); ctx.fill(); } continue; }
      for (const { p: [px, py, pw, ph], tone } of b.parts) {
        const inset = 2.5;
        ctx.fillStyle = tone < 0.33 ? '#161e29' : tone < 0.66 ? '#18212d' : '#1b2532';
        ctx.beginPath(); ctx.roundRect(b.x + b.w * px + inset, b.y + b.h * py + inset, b.w * pw - inset * 2, b.h * ph - inset * 2, 3); ctx.fill();
      }
    }
    ctx.lineWidth = 26; ctx.strokeStyle = '#0d2236'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); river.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  }

  function polygon(pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }

  function draw() {
    base();
    const now = performance.now();
    for (const c of claims) {
      const a = reduce ? 1 : Math.min(1, (now - c.t) / 700);
      polygon(c.pts); ctx.closePath();
      ctx.fillStyle = `rgba(182,255,58,${0.24 * a})`; ctx.fill();
      ctx.save(); ctx.clip();
      // a soft pulse rolling out from where the loop closed
      if (a < 1) { const g = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, 40 + a * 520); g.addColorStop(0, `rgba(182,255,58,${0.35 * (1 - a)})`); g.addColorStop(1, 'rgba(182,255,58,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      polygon(c.pts); ctx.closePath();
      ctx.lineWidth = 3; ctx.strokeStyle = LIME; ctx.shadowColor = 'rgba(182,255,58,0.6)'; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
    }
    if (path.length > 1) {
      ctx.globalAlpha = 1 - fade;
      polygon(path); ctx.lineWidth = 5; ctx.strokeStyle = LIME; ctx.shadowColor = 'rgba(182,255,58,0.7)'; ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;
      const [sx, sy] = path[0], [hx, hy] = path[path.length - 1];
      ctx.beginPath(); ctx.arc(sx, sy, 16, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(182,255,58,0.55)'; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = LIME; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  let raf = 0;
  function loop() {
    raf = 0;
    if (demo) stepDemo();
    if (fade > 0 && fade < 1) { fade = Math.min(1, fade + 0.05); if (fade >= 1) { path = []; fade = 0; } }
    draw();
    const animating = demo || (fade > 0) || claims.some((c) => performance.now() - c.t < 750);
    if (animating) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  function area(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s / 2); }
  function lengthOf(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }

  function closeLoop() {
    const pts = path.slice();
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    claims.push({ pts, t: performance.now(), cx, cy });
    if (claims.length > 4) claims.shift();
    path = [];
    const km2 = (area(pts) * M_PER_PX * M_PER_PX) / 1e6;
    showToast(`Claimed · ${km2 < 0.1 ? km2.toFixed(3) : km2.toFixed(2)} km²`);
    kick();
  }

  function showToast(text) {
    toast.textContent = text; toast.classList.add('on');
    clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('on'), 2200);
  }

  function point(e) { const r = cvs.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function interactive(e) { return !e.target.closest('.pitch, .bar, a, button, input'); }

  host.parentElement.addEventListener('pointerdown', (e) => {
    if (!interactive(e) || e.button > 0) return;
    stopDemo(); touched = true; hint.style.opacity = 0;
    drawing = true; fade = 0; path = [point(e)];
    host.setPointerCapture?.(e.pointerId); kick();
  });
  addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = point(e), last = path[path.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 5) return;
    path.push(p);
    // closing: back within reach of the start after a real loop
    if (path.length > 12 && lengthOf(path) > 220 && Math.hypot(p[0] - path[0][0], p[1] - path[0][1]) < 30) { drawing = false; closeLoop(); return; }
    draw();
  });
  addEventListener('pointerup', () => {
    if (!drawing) return; drawing = false;
    if (path.length > 2) { showToast('End where you started to close it'); fade = 0.01; kick(); }
  });

  // auto demo: a runner traces a loop round a few blocks until someone draws
  function demoPath() {
    const cx = W * (W > 860 ? 0.68 : 0.5), cy = H * (W > 860 ? 0.42 : 0.34), rx = Math.min(W, 900) * (W > 860 ? 0.16 : 0.3), ry = H * 0.16, pts = [];
    for (let i = 0; i <= 80; i++) { const t = (i / 80) * Math.PI * 2 - Math.PI / 2; const wob = 1 + 0.08 * Math.sin(t * 3); pts.push([cx + Math.cos(t) * rx * wob, cy + Math.sin(t) * ry * wob]); }
    return pts;
  }
  function startDemo() {
    if (touched) return;
    const pts = demoPath();
    if (reduce) { path = pts.slice(0, -1); closeLoop(); return; }
    demo = { pts, i: 0, t0: performance.now() }; path = [pts[0]]; kick();
  }
  function stepDemo() {
    const k = Math.min(1, (performance.now() - demo.t0) / 2600), n = Math.floor(k * (demo.pts.length - 1));
    path = demo.pts.slice(0, Math.max(2, n));
    if (k >= 1) { demo = null; path = path.slice(0, -1); closeLoop(); idleTimer = setTimeout(() => { if (!touched) { claims = []; startDemo(); } }, 5200); }
  }
  function stopDemo() { demo = null; clearTimeout(idleTimer); }

  // keep claims across resizes (phones fire resize when the URL bar hides); only rebuild the city
  let lastW = 0;
  addEventListener('resize', () => { const w = host.getBoundingClientRect().width; if (Math.abs(w - lastW) < 2) { layout(); return; } lastW = w; claims = []; path = []; stopDemo(); layout(); if (!touched) setTimeout(startDemo, 400); });
  lastW = host.getBoundingClientRect().width;
  layout();
  setTimeout(startDemo, reduce ? 0 : 900);

  // ---------- waitlist ----------
  document.querySelectorAll('form.join').forEach((form) => {
    const note = form.nextElementSibling, btn = form.querySelector('button'), input = form.querySelector('input[type=email]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (form.company.value) return; // bots fill the hidden field
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.className = 'join-note err'; note.textContent = 'That email doesn’t look right. Check it and try again.'; input.focus(); return; }
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Adding you…';
      try {
        const r = await fetch(`${WAITLIST.url}/rest/v1/waitlist`, {
          method: 'POST',
          headers: { apikey: WAITLIST.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ email, app: 'stryde', source: `${form.dataset.source}:${form.os?.value || 'unknown'}` }),
        });
        if (r.ok || r.status === 409) { if (window.gtag) gtag('event', 'join_waitlist', { os: form.os?.value || 'unknown' }); note.className = 'join-note ok'; note.textContent = 'You’re on the list. We’ll email you once, when Stryde launches.'; form.reset(); btn.textContent = 'You’re in'; return; }
        throw new Error(String(r.status));
      } catch {
        note.className = 'join-note err'; note.textContent = 'Couldn’t add you just now. Try again in a moment, or email support@buenoworks.app.';
        btn.disabled = false; btn.textContent = label;
      }
    });
  });

  // ---------- clips play only while on screen; reveals ----------
  const vids = document.querySelectorAll('video');
  if (!reduce && 'IntersectionObserver' in window) {
    const vo = new IntersectionObserver((es) => es.forEach((en) => { const v = en.target; if (en.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause(); }), { threshold: 0.35 });
    vids.forEach((v) => vo.observe(v));
  }
  const ro = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } }), { threshold: 0.15 }) : null;
  document.querySelectorAll('.reveal').forEach((el) => (ro ? ro.observe(el) : el.classList.add('in')));
})();
