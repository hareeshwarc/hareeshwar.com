/* global Framework7 */
(function () {
  var look = window.__LOOK__ || 'android';

  // Seed colours. Material You derives its whole dark palette from the primary colour.
  var primary = { ios: '#0a84ff', android: '#6f9cff', windows: '#60cdff' }[look];

  var tpl = function (id) { return document.getElementById(id).innerHTML; };

  var app = new Framework7({
    el: '#app',
    name: 'Hareeshwar',
    theme: look === 'ios' ? 'ios' : 'md',
    darkMode: true,
    colors: { primary: primary },
    mdColorScheme: look === 'android' ? 'vibrant' : 'default',
    touch: { tapHold: false },
    card: { hideNavbarOnOpen: true, hideToolbarOnOpen: true, swipeToClose: true, backdrop: true },
    routes: [
      { path: '/stack/', content: tpl('tpl-stack') }
    ]
  });
  window.app = app;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sidebar <-> tabs ---------- */
  function syncSidebar(id) {
    $$('.side-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === id); });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-tab]');
    if (!a) return;
    e.preventDefault();
    app.tab.show(a.dataset.tab, true);
  });
  app.on('tabShow', function (el) {
    if (!el || !el.id) return;
    syncSidebar('#' + el.id);
    // Make sure the phone tab bar also reflects tabs opened from the sidebar or a button
    $$('.main-tabbar .tab-link').forEach(function (l) {
      l.classList.toggle('tab-link-active', l.getAttribute('href') === '#' + el.id);
    });
    if (app.toolbar && app.toolbar.setHighlight) app.toolbar.setHighlight('.main-tabbar');
    revealIn(el);
  });

  /* ---------- Count-up numbers ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseFloat(el.dataset.to);
    var from = parseFloat(el.dataset.from || '0');
    var dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    var dur = 1400, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Scroll reveal (works inside each tab's own scroller) ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add('in');
      $$('.count', el).forEach(countUp);
      io.unobserve(el);
      // Hand control of transforms back to Framework7 for the expandable cards
      if (el.classList.contains('card-expandable')) {
        setTimeout(function () { el.classList.remove('reveal', 'in'); }, 800);
      }
    });
  }, { threshold: 0.12 });

  function revealIn(root) {
    $$('.reveal:not(.in)', root).forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
      io.observe(el);
    });
  }
  revealIn(document.querySelector('.tab-active') || document);
  // Pre-arm the other tabs so they animate the first time they open
  $$('.views > .tab:not(.tab-active)').forEach(function (t) {
    $$('.reveal', t).forEach(function (el) { el.style.transitionDelay = '0ms'; });
  });

  /* ---------- Work filter ---------- */
  var filter = $('.work-filter');
  if (filter) {
    filter.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', filter).forEach(function (x) { x.classList.toggle('button-active', x === b); });
      var f = b.dataset.f;
      var n = 0;
      $$('.work-list li').forEach(function (li) {
        var show = f === 'all' || li.dataset.co === f;
        li.classList.toggle('hide', !show);
        li.classList.remove('pop');
        if (show) {
          void li.offsetWidth;
          li.style.animationDelay = (n++ * 40) + 'ms';
          li.classList.add('pop');
        }
      });
    });
  }

  /* ---------- Small platform touches ---------- */
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', look === 'windows' ? '#202020' : (look === 'android' ? '#111318' : '#000000'));
})();
