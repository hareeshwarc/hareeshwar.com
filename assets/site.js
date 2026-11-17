/* hareeshwar.com: interactions. Everything here is progressive: the pages read fine without it. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia('(pointer: fine)').matches;
  root.classList.add('js');

  /* window.name survives page-to-page navigation in the same tab, so it backs up storage when storage is blocked */
  function wn(k, v) { try { var s = (w.name || '').replace(new RegExp('(^|;)' + k + '=[a-z]+', 'g'), '').replace(/^;+|;+$/g, ''); w.name = (s ? s + ';' : '') + k + '=' + v; } catch (e) {} }

  /* ---------- Theme toggle ---------- */
  function setTheme(t, store) {
    root.setAttribute('data-mode', t);
    var meta = d.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || (t === 'dark' ? '#000000' : '#ffffff'));
    if (store) { try { localStorage.setItem('theme', t); } catch (e) {} wn('theme', t); }
  }
  d.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      var next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      if (!d.startViewTransition || reduce) { setTheme(next, true); return; }
      var x = ev.clientX || w.innerWidth - 40, y = ev.clientY || 24;
      var r = Math.hypot(Math.max(x, w.innerWidth - x), Math.max(y, w.innerHeight - y));
      var vt = d.startViewTransition(function () { setTheme(next, true); });
      vt.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
    });
  });
  try {
    var mq = w.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function (e) { var s = null; try { s = localStorage.getItem('theme'); } catch (x) {} if (!s && /(^|;)theme=/.test(w.name || '')) s = 'set'; if (!s) setTheme(e.matches ? 'dark' : 'light', false); });
  } catch (e) {}

  /* ---------- Entrances ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); start(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  d.querySelectorAll('[data-rise], .panel, [data-count], .hbars').forEach(function (el) { io.observe(el); });

  /* SVG line lengths for draw-in */
  d.querySelectorAll('.draw').forEach(function (p) { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) {} });

  /* ---------- Counters ---------- */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0);
    var from = parseFloat(el.getAttribute('data-from') || '0'), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    if (reduce) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    var t0 = performance.now(), dur = +(el.getAttribute('data-dur') || 1400);
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + (from + (to - from) * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  /* Panels that play their own steps when seen (used outside scrolly chapters) */
  function start(el) {
    if (el.hasAttribute('data-count')) count(el);
    el.querySelectorAll && el.querySelectorAll('[data-count]').forEach(function (c) { if (!c.closest('.scrolly')) count(c); });
    var n = +(el.getAttribute('data-autostep') || 0);
    if (n) {
      if (reduce) { for (var i = 1; i <= n; i++) el.classList.add('s' + i); return; }
      var k = 1; el.classList.add('s1');
      var iv = setInterval(function () { k++; if (k > n) { clearInterval(iv); return; } el.classList.add('s' + k); }, +(el.getAttribute('data-gap') || 1300));
    }
  }

  /* ---------- Scrolly chapters ---------- */
  var scrollies = [].slice.call(d.querySelectorAll('.scrolly')).map(function (s) {
    return { el: s, viz: s.querySelector('.viz'), steps: [].slice.call(s.querySelectorAll('.step')), cur: 0 };
  });
  function pickSteps() {
    var line = w.innerHeight * (w.innerWidth <= 734 ? 0.78 : 0.6);
    scrollies.forEach(function (s) {
      var n = 0;
      s.steps.forEach(function (st, i) { if (st.getBoundingClientRect().top < line) n = i + 1; });
      if (reduce && n === 0 && s.el.getBoundingClientRect().top < w.innerHeight) n = s.steps.length;
      if (n === 0) n = 1;
      if (n === s.cur) return;
      s.cur = n;
      s.steps.forEach(function (st, i) { st.classList.toggle('on', i === n - 1); });
      for (var i = 1; i <= 6; i++) s.viz.classList.toggle('s' + i, i <= n);
      s.viz.querySelectorAll('[data-count-step]').forEach(function (c) {
        var vals = c.getAttribute('data-count-step').split('|'), v = vals[Math.min(n, vals.length) - 1];
        if (c.getAttribute('data-shown') === v) return;
        c.setAttribute('data-shown', v);
        var m = /^([^0-9.-]*)(-?[0-9.]+)(.*)$/.exec(v);
        if (!m || reduce) { c.textContent = v; return; }
        var dec = (m[2].split('.')[1] || '').length, from = parseFloat(c.getAttribute('data-last') || m[2]);
        c.setAttribute('data-last', m[2]);
        var t0 = performance.now(), to = parseFloat(m[2]);
        (function tick(t) { var k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); c.textContent = m[1] + (from + (to - from) * e).toFixed(dec) + m[3]; if (k < 1) requestAnimationFrame(tick); })(t0);
      });
    });
  }

  /* ---------- Reading progress on story pages ---------- */
  var prog = d.querySelector('.progress');
  function progress() {
    if (!prog) return;
    var h = d.documentElement.scrollHeight - w.innerHeight;
    prog.style.setProperty('--read', h > 0 ? Math.min(1, w.scrollY / h).toFixed(4) : 0);
  }

  var ticking = false;
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { pickSteps(); progress(); ticking = false; }); }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', onScroll);
  pickSteps(); progress();

  /* ---------- Athena calculator ---------- */
  d.querySelectorAll('[data-calc]').forEach(function (c) {
    var r = c.querySelector('input'), out = c.querySelector('output'), saved = c.querySelector('[data-saved]'), scans = c.querySelector('[data-scans]');
    function upd() { var n = +r.value; out.textContent = n + (n === 1 ? ' time' : ' times'); saved.textContent = n <= 1 ? '0%' : Math.round((1 - 1 / n) * 1000) / 10 + '%'; scans.textContent = n + ' → 1'; }
    r.addEventListener('input', upd); upd();
  });

  /* ---------- Before / after ---------- */
  d.querySelectorAll('.ba').forEach(function (b) {
    var r = b.querySelector('input');
    function upd() { b.style.setProperty('--cut', r.value + '%'); }
    r.addEventListener('input', upd); upd();
  });

  /* ---------- Next story: remember how we left, so the next page can rise in at its top ---------- */
  d.querySelectorAll('a[data-next]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
      try { sessionStorage.setItem('nav', 'next'); } catch (e) {} wn('nav', 'next');
    });
  });

  /* ---------- Pointer: works with the system cursor, never replaces it (desktop only) ----------
     Cards catch a soft light where the cursor is. Buttons lean a few pixels toward it. */
  if (fine && !reduce) {
    d.querySelectorAll('.tile, .next, .post, .files li').forEach(function (el) {
      el.classList.add('spot');
      el.addEventListener('pointerenter', function () { el.classList.add('lit'); });
      el.addEventListener('pointerleave', function () { el.classList.remove('lit'); });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
    d.querySelectorAll('.btn, .pill, .theme-btn, .next .arrow').forEach(function (el) {
      var host = el.classList.contains('arrow') ? el.closest('.next') : el, k = el.classList.contains('arrow') ? 0.08 : 0.22, max = 7;
      el.classList.add('mag');
      host.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.classList.add('pull');
        el.style.setProperty('--tx', Math.max(-max, Math.min(max, dx * k)).toFixed(1) + 'px');
        el.style.setProperty('--ty', Math.max(-max, Math.min(max, dy * k)).toFixed(1) + 'px');
      }, { passive: true });
      host.addEventListener('pointerleave', function () { el.classList.remove('pull'); el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px'); });
    });
  }

  /* ---------- GSAP: hero lines and smooth scroll, when the libraries loaded ---------- */
  if (!reduce && w.gsap) {
    d.querySelectorAll('[data-split]').forEach(function (h) {
      var lines = h.querySelectorAll('.split-line > span');
      if (lines.length) w.gsap.from(lines, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.1 });
    });
  }
  if (!reduce && fine && w.Lenis) {
    var lenis = new w.Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', onScroll);
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ---------- A live favicon: a heartbeat that flatlines when you leave the tab ---------- */
  (function () {
    var link = d.querySelector('link[rel="icon"][data-live]');
    if (!link || reduce) return;
    var cv = d.createElement('canvas'); cv.width = cv.height = 64;
    var g = cv.getContext('2d'), t = 0, title = d.title, timer = null;
    function draw(flat) {
      g.clearRect(0, 0, 64, 64);
      g.fillStyle = '#000'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, 64, 64, 14) : g.rect(0, 0, 64, 64); g.fill();
      g.strokeStyle = flat ? '#ff9f0a' : '#ffffff'; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
      for (var x = 8; x <= 56; x += 2) {
        var y = 34;
        if (!flat) { var p = ((x + t) % 48) / 48; y = 34 - (p > 0.4 && p < 0.5 ? 20 * Math.sin((p - 0.4) / 0.1 * Math.PI) : 0) + (p > 0.5 && p < 0.56 ? 8 : 0); }
        x === 8 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      if (flat) { g.fillStyle = '#ff9f0a'; g.beginPath(); g.arc(56, 34, 5, 0, 7); g.fill(); }
      link.href = cv.toDataURL('image/png');
    }
    function run() { clearInterval(timer); timer = setInterval(function () { t = (t + 4) % 48; draw(false); }, 120); }
    d.addEventListener('visibilitychange', function () {
      if (d.hidden) { clearInterval(timer); draw(true); d.title = 'This line went flat. Come back?'; }
      else { d.title = title; run(); }
    });
    run();
  })();
})();
