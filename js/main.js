/* ============================================================
   NAVKAR LGSF — theme, interactions, scroll animation

   Scroll animation runs one of two ways:
     • GSAP + ScrollTrigger when the CDN is reachable  (richer, smoothed)
     • a self-contained requestAnimationFrame loop otherwise
   Everything else — theme, nav, tabs, form — is plain JS either way.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var useGSAP = !!(window.gsap && window.ScrollTrigger) && !reduced;

  if (useGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('gsap-on');
  }

  /* ---------------------------------------------------------
     THEME
     Initial value is set by the inline script in <head> so the
     page never paints the wrong theme first.
     --------------------------------------------------------- */
  var themeTog = document.getElementById('themeTog');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  var THEME_BG = { dark: '#07080a', light: '#ffffff' };

  function applyTheme(next, animate) {
    root.setAttribute('data-theme', next);
    if (metaTheme) metaTheme.setAttribute('content', THEME_BG[next]);
    if (themeTog) {
      themeTog.setAttribute('aria-label',
        next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    try { localStorage.setItem('nispl-theme', next); } catch (e) {}

    if (animate && !reduced) {
      // brief global colour transition, then remove so it never
      // interferes with hover/scroll animation
      root.classList.add('theming');
      clearTimeout(applyTheme._t);
      applyTheme._t = setTimeout(function () { root.classList.remove('theming'); }, 500);
    }
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);

  if (themeTog) {
    themeTog.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
    });
  }

  // follow the OS if the visitor has never chosen explicitly
  var sysLight = window.matchMedia('(prefers-color-scheme: light)');
  var onSysChange = function (e) {
    var stored = null;
    try { stored = localStorage.getItem('nispl-theme'); } catch (err) {}
    if (!stored) applyTheme(e.matches ? 'light' : 'dark', true);
  };
  if (sysLight.addEventListener) sysLight.addEventListener('change', onSysChange);
  else if (sysLight.addListener) sysLight.addListener(onSysChange);

  /* ---------------------------------------------------------
     PRELOADER
     --------------------------------------------------------- */
  var pre = document.getElementById('preloader');
  var preBar = document.getElementById('preBar');
  var pct = 0;
  var started = false;

  var fake = setInterval(function () {
    pct = Math.min(pct + Math.random() * 16, 92);
    if (preBar) preBar.style.width = pct + '%';
  }, 130);

  function finishLoad() {
    if (started) return;
    started = true;
    clearInterval(fake);
    if (preBar) preBar.style.width = '100%';
    setTimeout(function () {
      if (pre) pre.classList.add('is-done');
      // The CSS-driven hero intro is only used on the fallback path;
      // with GSAP the timeline below owns it.
      if (!useGSAP) document.body.classList.add('is-loaded');
      if (useGSAP) { heroIntro(); ScrollTrigger.refresh(); }
      else { measure(); }
    }, 320);
  }
  window.addEventListener('load', finishLoad);
  setTimeout(finishLoad, 4500);   // safety net if an asset stalls

  /* ---------------------------------------------------------
     NAV
     --------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var navLinks = document.getElementById('navLinks');
  var lastY = 0;

  burger.addEventListener('click', function () {
    var open = navLinks.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });

  navLinks.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      navLinks.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    }
  });

  var sectionIds = ['home', 'about', 'technology', 'advantage', 'applications', 'specs', 'process', 'projects', 'team', 'contact'];
  var navMap = {};
  sectionIds.forEach(function (id) {
    var a = navLinks.querySelector('a[href="#' + id + '"]');
    var s = document.getElementById(id);
    if (a && s) navMap[id] = { a: a, s: s };
  });

  /* ---------------------------------------------------------
     TABS
     --------------------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var key = t.getAttribute('data-tab');
      tabs.forEach(function (x) { x.classList.toggle('is-active', x === t); });
      panels.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === key); });
      if (useGSAP) ScrollTrigger.refresh();
    });
  });

  /* ---------------------------------------------------------
     SHARED ELEMENT REFS
     --------------------------------------------------------- */
  var hsec = document.getElementById('process');
  var hTrack = document.getElementById('hTrack');
  var hBar = document.getElementById('hBar');
  var scrollBar = document.getElementById('scrollBar');
  var toTop = document.getElementById('toTop');
  var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  /* =========================================================
     PATH A — GSAP + ScrollTrigger
     ========================================================= */
  /* Hand an element back to the stylesheet once its entrance is done, so no
     inline transform lingers and the compositor layer can be released. */
  function settleReveal(targets) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    gsap.set(targets, { clearProps: 'transform,opacity,willChange' });
  }

  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero__title .line > span', { yPercent: 0, y: 0, duration: 1.15, stagger: 0.1 }, 0)
      .to('.hero__blueprint', { opacity: 1, duration: 1.4 }, 0.1)
      .to('.hero .reveal', {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.09,
        onComplete: function () { settleReveal(this.targets()); }
      }, 0.3)
      .to('.hero__scroll', { opacity: 1, duration: 0.8 }, 1.1);
  }

  function initGSAP() {
    // Start states must be declared in GSAP, not inherited from the CSS.
    // GSAP parses the stylesheet's translateY(105%) into a *pixel* y, so a
    // later { yPercent: 0 } tween would move nothing and the H1 would never
    // animate in. Setting yPercent here makes GSAP own both ends.
    gsap.set('.hero__title .line > span', { yPercent: 0, y: 0 });
    gsap.set('.hero .reveal', { opacity: 1, y: 0 });

    /* --- parallax layers --- */
    gsap.utils.toArray('[data-parallax]').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var shift = sp * 55;                       // % of the element's own height
      gsap.fromTo(el,
        { yPercent: -shift },
        {
          yPercent: shift, ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: 'top bottom', end: 'bottom top',
            scrub: 0.5, invalidateOnRefresh: true
          }
        });
    });

    /* --- reveals, staggered per batch ---
       On completion each element is handed back to the stylesheet (.is-in) and
       its inline transform/opacity dropped. Without this the page ends up with
       100+ permanently promoted compositor layers, which costs memory and
       stutters scrolling on mobile. */
    ScrollTrigger.batch(revealEls.filter(function (el) { return !el.closest('.hero'); }), {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          stagger: 0.08, overwrite: true,
          onComplete: function () { settleReveal(this.targets()); }
        });
      }
    });

    /* --- counters --- */
    counters.forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: to, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });

    /* --- production process: pinned horizontal sweep --- */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 721px)', function () {
      if (!hsec || !hTrack) return;
      gsap.to(hTrack, {
        x: function () { return -(hTrack.scrollWidth - window.innerWidth + 40); },
        ease: 'none',
        scrollTrigger: {
          trigger: hsec, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (self) {
            if (hBar) hBar.style.width = (self.progress * 100) + '%';
          }
        }
      });
    });

    /* --- ticker reacts to scroll velocity --- */
    var track = document.querySelector('.ticker__track');
    if (track) {
      track.style.animation = 'none';           // hand over from CSS
      var spin = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
      var settle;
      ScrollTrigger.create({
        onUpdate: function (self) {
          var boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 900);
          gsap.to(spin, { timeScale: boost, duration: 0.3, overwrite: true });
          clearTimeout(settle);
          settle = setTimeout(function () {
            gsap.to(spin, { timeScale: 1, duration: 0.9 });
          }, 180);
        }
      });
    }

    /* --- scroll progress --- */
    if (scrollBar) {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) { scrollBar.style.width = (self.progress * 100) + '%'; }
      });
    }

    // late-loading images change page height
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* =========================================================
     PATH B — fallback rAF engine (no GSAP / reduced motion)
     ========================================================= */
  var pxEls = [], vh = window.innerHeight, isTouch = false;
  var hRange = 0, hStart = 0, hEnd = 0;

  function initFallback() {
    pxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')).map(function (el) {
      return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0.1, top: 0, h: 0 };
    });

    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var ix = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(ix, 8) * 70 + 'ms';
          el.classList.add('is-in');
          io.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }

    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          runCount(en.target);
          cio.unobserve(en.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    } else {
      counters.forEach(runCount);
    }

    window.addEventListener('resize', debounce(measure, 180));
    window.addEventListener('orientationchange', debounce(measure, 260));
    measure();
  }

  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    if (reduced) { el.textContent = to; return; }
    var start = performance.now(), dur = 1500;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  function measure() {
    vh = window.innerHeight;
    isTouch = window.matchMedia('(max-width: 720px)').matches;

    pxEls.forEach(function (o) {
      var prev = o.el.style.transform;
      o.el.style.transform = 'none';
      var r = o.el.getBoundingClientRect();
      o.top = r.top + window.pageYOffset;
      o.h = r.height;
      o.el.style.transform = prev;
    });

    if (hsec && hTrack && !isTouch) {
      var r2 = hsec.getBoundingClientRect();
      hStart = r2.top + window.pageYOffset;
      hEnd = hStart + hsec.offsetHeight - vh;
      hRange = Math.max(hTrack.scrollWidth - window.innerWidth + 40, 0);
    } else {
      hRange = 0;
      if (hTrack) hTrack.style.transform = '';
    }
    onScroll();
  }

  /* ---------------------------------------------------------
     SHARED SCROLL LOOP
     Nav state / progress / back-to-top run on both paths;
     parallax + horizontal only on the fallback path.
     --------------------------------------------------------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    var y = window.pageYOffset;
    var winH = window.innerHeight;

    if (!useGSAP && scrollBar) {
      var doc = document.documentElement.scrollHeight - winH;
      scrollBar.style.width = (doc > 0 ? (y / doc) * 100 : 0) + '%';
    }

    if (nav) {
      nav.classList.toggle('is-solid', y > 60);
      if (y > 420 && y > lastY && !navLinks.classList.contains('is-open')) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
    }
    lastY = y;

    if (toTop) toTop.classList.toggle('is-on', y > winH * 0.9);

    var current = null;
    for (var id in navMap) {
      if (navMap[id].s.getBoundingClientRect().top <= winH * 0.35) current = id;
    }
    for (var k in navMap) navMap[k].a.classList.toggle('is-active', k === current);

    if (useGSAP) return;

    for (var i = 0; i < pxEls.length; i++) {
      var o = pxEls[i];
      var rel = (y + vh) - o.top;
      if (rel < -300 || rel > o.h + vh + 300) continue;
      o.el.style.transform = 'translate3d(0,' + ((rel - (o.h + vh) / 2) * o.speed).toFixed(2) + 'px,0)';
    }

    if (hRange > 0 && hTrack) {
      var p = Math.max(0, Math.min(1, (y - hStart) / (hEnd - hStart)));
      hTrack.style.transform = 'translate3d(' + (-p * hRange).toFixed(2) + 'px,0,0)';
      if (hBar) hBar.style.width = (p * 100) + '%';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* ---------------------------------------------------------
     HERO MOUSE PARALLAX
     --------------------------------------------------------- */
  var hero = document.querySelector('.hero');
  var bp = document.querySelector('.hero__blueprint');
  var grid = document.querySelector('.hero__grid');
  if (hero && !reduced && window.matchMedia('(hover: hover)').matches) {
    var mx = 0, my = 0, cx = 0, cy = 0, mAF = null;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.width / 2) / r.width;
      my = (e.clientY - r.height / 2) / r.height;
      if (!mAF) mAF = requestAnimationFrame(loopMouse);
    });
    hero.addEventListener('mouseleave', function () { mx = 0; my = 0; });

    function loopMouse() {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      // margin, not transform — the scroll parallax owns transform
      if (bp) { bp.style.marginLeft = (cx * 26).toFixed(2) + 'px'; bp.style.marginTop = (cy * 20).toFixed(2) + 'px'; }
      if (grid) { grid.style.marginLeft = (cx * -14).toFixed(2) + 'px'; grid.style.marginTop = (cy * -10).toFixed(2) + 'px'; }
      if (Math.abs(mx - cx) > 0.001 || Math.abs(my - cy) > 0.001) mAF = requestAnimationFrame(loopMouse);
      else mAF = null;
    }
  }

  /* ---------------------------------------------------------
     SMOOTH ANCHORS
     --------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.pageYOffset - 74,
      behavior: reduced ? 'auto' : 'smooth'
    });
    history.replaceState(null, '', id);
  });

  /* ---------------------------------------------------------
     ENQUIRY FORM (mailto handoff — no backend)
     --------------------------------------------------------- */
  var form = document.getElementById('enquiry');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, bad = false;

      ['name', 'phone', 'email'].forEach(function (n) {
        var el = f[n];
        var ok = el.value.trim() !== '' && (n !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        el.classList.toggle('err', !ok);
        if (!ok) bad = true;
      });

      if (bad) {
        note.textContent = 'Please fill in your name, phone and a valid email.';
        note.style.color = '#e5484d';
        return;
      }

      var body =
        'Name: ' + f.name.value + '\n' +
        'Phone: ' + f.phone.value + '\n' +
        'Email: ' + f.email.value + '\n' +
        'Project type: ' + f.type.value + '\n' +
        'Built-up area: ' + (f.area.value || '—') + '\n\n' +
        'Brief:\n' + (f.msg.value || '—');

      window.location.href = 'mailto:navkarengineersandconsultants1@gmail.com'
        + '?subject=' + encodeURIComponent('LGSF enquiry — ' + f.name.value + ' (' + f.type.value + ')')
        + '&body=' + encodeURIComponent(body);

      note.style.color = '';
      note.textContent = 'Opening your email app… if nothing happens, write to navkarengineersandconsultants1@gmail.com or call +91 97277 33126.';
    });
  }

  /* ---------------------------------------------------------
     RELAYOUT
     Both engines cache scroll positions, so both go stale when the
     page height changes after start-up — which it always does, because
     the webfonts swap in and reflow every block of text. Re-measure
     whenever the document actually changes size.
     --------------------------------------------------------- */
  function relayout() {
    if (useGSAP) ScrollTrigger.refresh();
    else measure();
  }

  var relayoutSoon = debounce(relayout, 250);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(relayoutSoon).catch(function () {});
  }

  if ('ResizeObserver' in window) {
    var lastH = 0;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;   // ignore sub-pixel noise
      lastH = h;
      relayoutSoon();
    }).observe(document.body);
  }

  /* ---------------------------------------------------------
     GO
     --------------------------------------------------------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  if (useGSAP) initGSAP();
  else initFallback();

  update();
})();
