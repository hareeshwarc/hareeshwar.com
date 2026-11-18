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
    root.style.colorScheme = t;
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
  }, { rootMargin: '0px 0px -6% 0px' });
  d.querySelectorAll('[data-rise], .panel, [data-count], .hbars').forEach(function (el) { io.observe(el); });
  /* On a snap screen, everything on it shows as soon as the screen lands, even what sits behind the tab bar */
  function reveal(sc) { sc.querySelectorAll('[data-rise]:not(.is-in), .panel:not(.is-in), [data-count]:not(.is-in), .hbars:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); io.unobserve(el); start(el); }); }

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
    var phone = w.innerWidth <= 734, line = w.innerHeight * 0.6, tb = phone ? d.querySelector('.tabbar') : null, bottom = w.innerHeight - (tb ? tb.offsetHeight : 0);
    scrollies.forEach(function (s) {
      var n = 0;
      /* Phones: the picture is pinned at the top, so a step counts once its text is well into the space below the picture */
      if (phone) { var vb = Math.max(0, Math.min(bottom - 60, s.viz.getBoundingClientRect().bottom)); line = vb + (bottom - vb) * 0.62; }
      s.steps.forEach(function (st, i) { var t = phone ? (st.firstElementChild || st) : st; if (t.getBoundingClientRect().top < line) n = i + 1; });
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
    d.querySelectorAll('.story .art, .next, .post, .files li').forEach(function (el) {
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
  /* ---------- Copy the email address ---------- */
  d.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-copy'), done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1600); };
      try { navigator.clipboard.writeText(v).then(done, function () { selectIt(); }); } catch (e) { selectIt(); }
      function selectIt() { var s = btn.previousElementSibling, r = d.createRange(); r.selectNodeContents(s); var sel = w.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    });
  });

  /* ---------- Where am I: a dot rail on desktop, the active tab on phones ---------- */
  var screens = [].slice.call(d.querySelectorAll('.snap[data-label], #contact'));
  var rail = null;
  if (root.classList.contains('page-home') && screens.length) {
    rail = d.createElement('ol'); rail.className = 'rail'; rail.setAttribute('aria-label', 'Sections');
    screens.forEach(function (sc) {
      var li = d.createElement('li'), a = d.createElement('a');
      a.href = '#' + sc.id; a.title = sc.getAttribute('data-label') || 'Contact';
      a.setAttribute('aria-label', a.title); li.appendChild(a); rail.appendChild(li);
    });
    d.body.appendChild(rail);
  }
  var tabs = {}; d.querySelectorAll('.tabbar a[data-tab]').forEach(function (a) { tabs[a.getAttribute('data-tab')] = a; });
  function setTab(k) { Object.keys(tabs).forEach(function (t) { if (t === k) tabs[t].setAttribute('aria-current', 'page'); else tabs[t].removeAttribute('aria-current'); }); }
  var sio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var sc = e.target, i = screens.indexOf(sc);
      reveal(sc);
      if (rail) {
        rail.querySelectorAll('a').forEach(function (a, j) { if (j === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        rail.classList.toggle('on-dark', sc.classList.contains('dark') || sc.classList.contains('stage'));
      }
      if (sc.id === 'contact') setTab('contact');
      else if (sc.id === 'writing') setTab('writing');
      else if (sc.id === 'top') setTab('home');
      else setTab('stories');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  screens.forEach(function (sc) { sio.observe(sc); });
  /* ---------- Touch: a screen taller than the window must never trap the scroll ----------
     Mandatory snapping only works cleanly when each screen fits. Any screen that does not fit
     (a short phone, big system font) keeps its snap point but lets the finger pass through it. */
  if (!fine) {
    var fit = function () {
      var avail = w.innerHeight - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 2;
      d.querySelectorAll('.snap').forEach(function (sc) { sc.classList.toggle('tall', sc.offsetHeight > avail); });
    };
    fit(); w.addEventListener('resize', fit); w.addEventListener('load', fit);
  }
  /* ---------- One wheel gesture = one screen (desktop) ----------
     Phones get this from CSS scroll-snap with scroll-snap-stop. A mouse wheel or trackpad needs help:
     inside a screen taller than the window we let the page scroll normally, at its edges we jump a whole screen. */
  if (root.classList.contains('snap-y') && fine) {
    var snaps = [].slice.call(d.querySelectorAll('.snap')), lockUntil = 0, lastWheel = 0;
    var pad = function () { return parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; };
    w.addEventListener('wheel', function (ev) {
      if (ev.ctrlKey || Math.abs(ev.deltaY) < Math.abs(ev.deltaX)) return;
      if (ev.target.closest && ev.target.closest('input, textarea, select, .files')) return;
      var now = Date.now(), p = pad(), vh = w.innerHeight, dir = ev.deltaY > 0 ? 1 : -1;
      if (now < lockUntil) { ev.preventDefault(); if (now - lastWheel < 140) lockUntil = Math.max(lockUntil, now + 160); lastWheel = now; return; }
      lastWheel = now;
      var i = -1;
      for (var k = 0; k < snaps.length; k++) { var r = snaps[k].getBoundingClientRect(); if (r.top <= p + 6 && r.bottom > p + 6) { i = k; break; } }
      if (i < 0) return;
      var rc = snaps[i].getBoundingClientRect();
      if (dir > 0 && rc.bottom > vh + 4) return;      // more of this screen below: scroll normally
      if (dir < 0 && rc.top < p - 4) return;           // more of this screen above: scroll normally
      var j = i + dir; if (j < 0 || j >= snaps.length) return;
      ev.preventDefault();
      var t = snaps[j], tr = t.getBoundingClientRect(), y = w.scrollY + tr.top - p;
      if (dir < 0 && tr.height > vh - p) y = w.scrollY + tr.bottom - vh;   // coming back up into a long screen: land on its end
      w.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
      lockUntil = now + (reduce ? 200 : 750);
    }, { passive: false });
  }
})();
