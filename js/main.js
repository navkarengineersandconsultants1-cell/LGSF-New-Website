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
  document.addEventListener('DOMContentLoaded', finishLoad);
  setTimeout(finishLoad, 500);   // fast safety net so preloader never hangs

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

  // Global smooth scroll for all hash links with header offset
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var targetId = anchor.getAttribute('href').slice(1);
    if (!targetId) return;
    var targetEl = document.getElementById(targetId);
    if (targetEl) {
      e.preventDefault();
      var navHeight = nav ? nav.offsetHeight : 75;
      var targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
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
  /* ---------------------------------------------------------
     LGSF INTERACTIVE EXPLAINER (WALL, SLOPING ROOF & FLAT SLAB)
     --------------------------------------------------------- */
  /* ---------------------------------------------------------
     3D TECHNICAL ANIMATED VIDEO PLAYER (CINEMATIC CAD SIMULATION)
     --------------------------------------------------------- */
  var vpContainer = document.getElementById('lgsfVplayer');
  if (vpContainer) {
    var vpChapBtns = Array.prototype.slice.call(vpContainer.querySelectorAll('.vchap-btn'));
    var vpScreen = document.getElementById('vpScreen');
    var vpStage = document.getElementById('vpStage');
    var vpCenterPlay = document.getElementById('vpCenterPlay');
    var vpPlayPause = document.getElementById('vpPlayPause');
    var vpRestart = document.getElementById('vpRestart');
    var vpFill = document.getElementById('vpFill');
    var vpHandle = document.getElementById('vpHandle');
    var vpTimeline = document.getElementById('vpTimeline');
    var vpTime = document.getElementById('vpTime');
    var vpStepNum = document.getElementById('vpStepNum');
    var vpStepTitle = document.getElementById('vpStepTitle');
    var vpStepDesc = document.getElementById('vpStepDesc');
    var vpStepSpecs = document.getElementById('vpStepSpecs');
    var vpSpeedBtn = document.getElementById('vpSpeed');

    var VP_DATA = {
      building: {
        totalSec: 36,
        steps: [
          {
            t: 0,
            num: "STAGE 01 / 06",
            title: "1. Complete Concrete Plinth Foundation",
            desc: "Full building concrete plinth slab constructed with high-tensile anchor bolts for structural framing attachment.",
            spec1: "<b>Base:</b> Concrete Plinth Slab",
            spec2: "<b>Anchor:</b> High-Tensile Anchor Bolts",
            img: "assets/img/tech-entire-building.png",
            scale: 1.0
          },
          {
            t: 6,
            num: "STAGE 02 / 06",
            title: "2. Ground Floor LGSF Wall Panels & Stud Erection",
            desc: "Galvanized cold-formed steel C/U stud wall panels rise on all 4 sides of the building, creating room partitions & load-bearing walls.",
            spec1: "<b>Wall Panels:</b> C/U Stud Frames (0.8–1.6mm)",
            spec2: "<b>Precision:</b> CNC Punched ±1mm",
            img: "assets/img/tech-entire-building.png",
            scale: 1.08
          },
          {
            t: 12,
            num: "STAGE 03 / 06",
            title: "3. First Floor 300mm Steel Floor Joists & Decking Slab",
            desc: "300mm deep open-web LGSF floor joists span across ground floor walls, topped with galvanized steel decking & foam concrete.",
            spec1: "<b>Joists:</b> 300mm Steel Floor Beams",
            spec2: "<b>Slab:</b> Steel Decking + Foam Concrete",
            img: "assets/img/tech-floor-joists.png",
            scale: 1.15
          },
          {
            t: 18,
            num: "STAGE 04 / 06",
            title: "4. Upper Floor Wall Panels & Pitched Roof Trusses",
            desc: "First floor LGSF walls assemble, followed by complete sloping steel roof trusses craned and secured on top.",
            spec1: "<b>Roof Trusses:</b> Cold-Formed Steel Trusses",
            spec2: "<b>Geometry:</b> Engineered Pitched Roof",
            img: "assets/img/tech-sloping-roof.png",
            scale: 1.20
          },
          {
            t: 24,
            num: "STAGE 05 / 06",
            title: "5. Outer CLC Panels, MEP Routing & Rockwool Insulation",
            desc: "Exterior CLC/FCB cladding wraps the entire building. Pre-punched MEP conduits thread through studs, and Rockwool fills cavity spaces.",
            spec1: "<b>Cladding:</b> Outer CLC / 10mm FCB",
            spec2: "<b>Insulation:</b> 50mm Rockwool Filling",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.24
          },
          {
            t: 30,
            num: "STAGE 06 / 06",
            title: "6. Inner Boarding (8mm FCB + 12mm Gypsum Board) & Finished Villa",
            desc: "Inner lining (8mm FCB + 12mm Gypsum Board) installs on interior walls, roof shingles finish the roof, completing the LGSF building.",
            spec1: "<b>Inner Boarding:</b> 8mm FCB + 12mm Gypsum",
            spec2: "<b>Roof Finish:</b> Architectural Shingles",
            img: "assets/img/tech-entire-building.png",
            scale: 1.28
          }
        ]
      },
      wall: {
        totalSec: 30,
        steps: [
          {
            t: 0,
            num: "STEP 01 / 05",
            title: "1. Plinth Foundation & Steel Stud Members",
            desc: "Galvanized cold-formed steel C & U studs (0.8–1.6mm) anchored precisely to the concrete plinth foundation.",
            spec1: "<b>Material:</b> Cold-Formed Steel Studs",
            spec2: "<b>Fixing:</b> High-Tensile Anchor Bolts",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.05
          },
          {
            t: 6,
            num: "STEP 02 / 05",
            title: "2. Outer Side CLC / FCB Panel Fixing",
            desc: "Cellular Lightweight Concrete (CLC) or 10mm Fibre Cement Board (FCB) attached to outer steel studs for weather protection.",
            spec1: "<b>Outer Board:</b> CLC / 10mm FCB",
            spec2: "<b>Property:</b> All-Weather Resistance",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.12
          },
          {
            t: 12,
            num: "STEP 03 / 05",
            title: "3. MEP Service & Conduit Routing",
            desc: "Electrical wiring conduits, water supply, and plumbing pipes seamlessly routed through pre-punched CNC service holes.",
            spec1: "<b>Routing:</b> CNC Pre-punched Holes",
            spec2: "<b>Conduits:</b> Fire-Safe Electrical PVC",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.18
          },
          {
            t: 18,
            num: "STEP 04 / 05",
            title: "4. Rockwool Thermal & Acoustic Insulation",
            desc: "High-density 50mm Rockwool/Glasswool insulation filled tightly into internal stud cavities for thermal & sound isolation.",
            spec1: "<b>Density:</b> 50mm Rockwool (64kg/m³)",
            spec2: "<b>Rating:</b> Fire & Sound Resistance",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.22
          },
          {
            t: 24,
            num: "STEP 05 / 05",
            title: "5. Inner Boarding: 8mm FCB + 12mm Gypsum Board",
            desc: "Inner lining comprising an 8mm Fibre Cement Board (FCB) topped with a 12mm Gypsum Board for smooth interior paint finishing inside.",
            spec1: "<b>Lining 1:</b> 8mm FCB Substrate",
            spec2: "<b>Lining 2:</b> 12mm Gypsum Board",
            img: "assets/img/tech-wall-layers.png",
            scale: 1.28
          }
        ]
      },
      flat: {
        totalSec: 24,
        steps: [
          {
            t: 0,
            num: "STEP 01 / 04",
            title: "1. 300mm Depth LGSF Floor Joists (Beams)",
            desc: "300mm deep cold-formed C-section joists acting as structural floor beams for high load capacity.",
            spec1: "<b>Joist Depth:</b> 300mm Open-Web C-Joists",
            spec2: "<b>Function:</b> Primary Floor Beams",
            img: "assets/img/tech-floor-joists.png",
            scale: 1.05
          },
          {
            t: 6,
            num: "STEP 02 / 04",
            title: "2. Profiled Galvanized Steel Decking Sheet",
            desc: "High-rib profile steel decking sheet laid across 300mm joists to serve as permanent formwork.",
            spec1: "<b>Sheet:</b> Profiled Galvanized Steel",
            spec2: "<b>Formwork:</b> Permanent Steel Deck",
            img: "assets/img/tech-floor-joists.png",
            scale: 1.15
          },
          {
            t: 12,
            num: "STEP 03 / 04",
            title: "3. Lightweight Foam Concrete Topping",
            desc: "Required design thickness of cellular foam concrete poured over decking sheet for lightweight strength & acoustic isolation.",
            spec1: "<b>Topping:</b> Cellular Foam Concrete",
            spec2: "<b>Density:</b> Lightweight Structural Pour",
            img: "assets/img/tech-flat-slab.png",
            scale: 1.22
          },
          {
            t: 18,
            num: "STEP 04 / 04",
            title: "4. Waterproofing & Tile Floor Finish",
            desc: "Terrace waterproofing, screed, and tile/wooden floor finishing installed over cured foam concrete.",
            spec1: "<b>Terrace Finish:</b> Waterproof Membrane",
            spec2: "<b>Top Layer:</b> Tiles / Screed",
            img: "assets/img/tech-flat-slab.png",
            scale: 1.28
          }
        ]
      }
    };

    var curChap = 'building';
    var curTimeSec = 0;
    var speed = 1.0;
    var isPlaying = true;
    var timer = null;

    var canvas = document.getElementById('vpCanvas');
    var ctx = canvas ? canvas.getContext('2d') : null;

    function formatTime(s) {
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec);
    }

    function draw3DCanvasAnimation() {
      if (!ctx || !canvas) return;
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Dark CAD Viewport Grid
      ctx.fillStyle = '#060a11';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(240, 190, 61, 0.06)';
      ctx.lineWidth = 1;
      for (var x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (var y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      var chapData = VP_DATA[curChap];
      var progress = curTimeSec / (chapData ? chapData.totalSec : 36);

      // 3D Isometric Base Construction Scene
      var ox = w * 0.5;
      var oy = h * 0.72;

      // Stage 1+: Plinth Foundation Slab of Entire Building
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(ox - 240, oy);
      ctx.lineTo(ox, oy - 100);
      ctx.lineTo(ox + 240, oy);
      ctx.lineTo(ox, oy + 100);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Plinth 3D Depth
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(ox - 240, oy);
      ctx.lineTo(ox, oy + 100);
      ctx.lineTo(ox, oy + 125);
      ctx.lineTo(ox - 240, oy + 25);
      ctx.closePath(); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(ox + 240, oy);
      ctx.lineTo(ox, oy + 100);
      ctx.lineTo(ox, oy + 125);
      ctx.lineTo(ox + 240, oy + 25);
      ctx.closePath(); ctx.fill();

      if (curChap === 'building') {
        // Stage 2+: Ground Floor Wall Panels Erection (all 4 sides of building)
        if (progress > 0.14) {
          ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 3;
          var gHeight = 110;
          // Front & Side Wall Studs
          [-200, -140, -80, 0, 80, 140, 200].forEach(function (sx) {
            ctx.beginPath();
            ctx.moveTo(ox + sx, oy + (sx * 0.41));
            ctx.lineTo(ox + sx, oy + (sx * 0.41) - gHeight);
            ctx.stroke();
          });
          // Ground Floor Top Header Track
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 82 - gHeight);
          ctx.lineTo(ox, oy + 82 - gHeight);
          ctx.lineTo(ox + 200, oy - 82 - gHeight);
          ctx.stroke();
        }

        // Stage 3+: First Floor 300mm Floor Joists & Slab
        if (progress > 0.32) {
          ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 3;
          // Open-web 300mm floor joist beams spanning across floor
          [-160, -100, -40, 20, 80, 140].forEach(function (jx) {
            ctx.beginPath();
            ctx.moveTo(ox + jx, oy + (jx * 0.41) - 110);
            ctx.lineTo(ox + jx + 60, oy + (jx * 0.41) - 135);
            ctx.stroke();
          });
          // Steel Decking Slab
          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 192);
          ctx.lineTo(ox, oy - 28);
          ctx.lineTo(ox + 200, oy - 192);
          ctx.lineTo(ox, oy - 292);
          ctx.closePath(); ctx.fill();
        }

        // Stage 4+: First Floor Walls & Sloping Roof Trusses
        if (progress > 0.5) {
          // Upper Floor Walls
          ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 3;
          [-160, -80, 0, 80, 160].forEach(function (sx) {
            ctx.beginPath();
            ctx.moveTo(ox + sx, oy + (sx * 0.41) - 140);
            ctx.lineTo(ox + sx, oy + (sx * 0.41) - 220);
            ctx.stroke();
          });

          // Roof Trusses
          ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 220);
          ctx.lineTo(ox, oy - 320);
          ctx.lineTo(ox + 200, oy - 220);
          ctx.closePath(); ctx.stroke();
        }

        // Stage 5+: Outer CLC Panels & Insulation Wrapping
        if (progress > 0.68) {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 82);
          ctx.lineTo(ox, oy + 82);
          ctx.lineTo(ox, oy - 138);
          ctx.lineTo(ox - 200, oy - 302);
          ctx.closePath(); ctx.fill();
        }

        // Stage 6+: Complete Finished Villa (Roof Shingles & Interior Boarding)
        if (progress > 0.85) {
          ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
          ctx.beginPath();
          ctx.moveTo(ox - 205, oy - 222);
          ctx.lineTo(ox, oy - 325);
          ctx.lineTo(ox + 205, oy - 222);
          ctx.lineTo(ox + 200, oy - 215);
          ctx.lineTo(ox, oy - 315);
          ctx.lineTo(ox - 200, oy - 215);
          ctx.closePath(); ctx.fill();
        }
      } else {
        // Fallback for detail modes
        ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(ox - 180, oy); ctx.lineTo(ox + 180, oy - 160); ctx.stroke();
      }

      // HUD Compass Widget
      ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(50, 50, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#FBDD82'; ctx.font = '10px monospace';
      ctx.fillText('N 3D', 42, 54);
    }

      // Draw Steel Studs / Roof / Joists based on Chapter & Progress
      if (curChap === 'wall') {
        // Step 1+: Steel C-Studs (drop in from top)
        var studOffset = Math.min(1, progress * 4);
        var sy = oy - (180 * studOffset);

        ctx.strokeStyle = '#FBDD82';
        ctx.lineWidth = 4;
        var studsX = [-180, -90, 0, 90, 180];
        studsX.forEach(function (sx) {
          ctx.beginPath();
          ctx.moveTo(ox + sx, oy + (sx * 0.45));
          ctx.lineTo(ox + sx, sy + (sx * 0.45));
          ctx.stroke();
        });

        // Top U-Track Header
        if (studOffset > 0.8) {
          ctx.beginPath();
          ctx.moveTo(ox - 180, sy - 81);
          ctx.lineTo(ox + 180, sy + 81);
          ctx.stroke();
        }

        // Step 2+: Outer CLC Panel (slide in from left)
        if (progress > 0.2) {
          var pOffset = Math.min(1, (progress - 0.2) * 4);
          var px = (ox - 180) + (pOffset * 0);
          ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
          ctx.beginPath();
          ctx.moveTo(px, oy - 81);
          ctx.lineTo(px + 120, oy - 27);
          ctx.lineTo(px + 120, oy - 180);
          ctx.lineTo(px, oy - 234);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2; ctx.stroke();
        }

        // Step 3+: MEP Conduits (glow cyan line)
        if (progress > 0.4) {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 90);
          ctx.lineTo(ox + 200, oy + 90);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Step 4+: Rockwool Insulation (yellow filling)
        if (progress > 0.6) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.beginPath();
          ctx.moveTo(ox - 90, oy - 40);
          ctx.lineTo(ox + 90, oy + 41);
          ctx.lineTo(ox + 90, oy - 120);
          ctx.lineTo(ox - 90, oy - 200);
          ctx.closePath();
          ctx.fill();
        }

        // Step 5+: Inner Boarding (white gypsum board slide in)
        if (progress > 0.8) {
          ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
          ctx.beginPath();
          ctx.moveTo(ox - 180, oy - 70);
          ctx.lineTo(ox + 180, oy + 92);
          ctx.lineTo(ox + 180, oy - 70);
          ctx.lineTo(ox - 180, oy - 230);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        }
      } else if (curChap === 'sloping') {
        // Sloping Roof Trusses 3D animation
        ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ox - 200, oy);
        ctx.lineTo(ox, oy - 160);
        ctx.lineTo(ox + 200, oy);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ox - 200, oy);
        ctx.lineTo(ox + 200, oy);
        ctx.moveTo(ox, oy - 160);
        ctx.lineTo(ox, oy);
        ctx.stroke();

        if (progress > 0.3) {
          // 12mm FCB Substrate
          ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
          ctx.beginPath();
          ctx.moveTo(ox - 205, oy - 5);
          ctx.lineTo(ox, oy - 168);
          ctx.lineTo(ox + 205, oy - 5);
          ctx.lineTo(ox + 200, oy + 5);
          ctx.lineTo(ox, oy - 158);
          ctx.lineTo(ox - 200, oy + 5);
          ctx.closePath(); ctx.fill();
        }

        if (progress > 0.6) {
          // Shingles finish
          ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
          ctx.beginPath();
          ctx.moveTo(ox - 208, oy - 8);
          ctx.lineTo(ox, oy - 173);
          ctx.lineTo(ox + 208, oy - 8);
          ctx.lineTo(ox + 200, oy + 5);
          ctx.lineTo(ox, oy - 160);
          ctx.lineTo(ox - 200, oy + 5);
          ctx.closePath(); ctx.fill();
        }
      } else if (curChap === 'flat') {
        // 300mm Floor Joists Open-Web Mesh 3D Animation (matching user photo)
        ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 4;
        var jX = [-180, -120, -60, 0, 60, 120, 180];
        jX.forEach(function (jx) {
          ctx.beginPath();
          ctx.moveTo(ox + jx, oy + (jx * 0.4));
          ctx.lineTo(ox + jx + 60, oy + (jx * 0.4) - 80);
          ctx.stroke();

          // Open-web zigzag cross bracing
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + jx, oy + (jx * 0.4));
          ctx.lineTo(ox + jx + 30, oy + (jx * 0.4) - 40);
          ctx.lineTo(ox + jx + 60, oy + (jx * 0.4) - 80);
          ctx.stroke();
          ctx.lineWidth = 4;
        });

        if (progress > 0.3) {
          // Decking sheet
          ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 90);
          ctx.lineTo(ox + 200, oy + 90);
          ctx.lineTo(ox + 200, oy + 70);
          ctx.lineTo(ox - 200, oy - 110);
          ctx.closePath(); ctx.fill();
        }

        if (progress > 0.6) {
          // Foam concrete topping
          ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
          ctx.beginPath();
          ctx.moveTo(ox - 200, oy - 110);
          ctx.lineTo(ox + 200, oy + 70);
          ctx.lineTo(ox + 200, oy + 40);
          ctx.lineTo(ox - 200, oy - 140);
          ctx.closePath(); ctx.fill();
        }
      }

      // HUD Compass Widget in corner
      ctx.strokeStyle = '#FBDD82'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(50, 50, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#FBDD82'; ctx.font = '10px monospace';
      ctx.fillText('N 3D', 42, 54);
    }

    function renderVideoState() {
      var chapData = VP_DATA[curChap];
      if (!chapData) return;

      var totalSec = chapData.totalSec;
      var curStep = chapData.steps[0];

      for (var i = chapData.steps.length - 1; i >= 0; i--) {
        if (curTimeSec >= chapData.steps[i].t) {
          curStep = chapData.steps[i];
          break;
        }
      }

      // Update Callout HUD
      if (vpStepNum) vpStepNum.textContent = curStep.num;
      if (vpStepTitle) vpStepTitle.textContent = curStep.title;
      if (vpStepDesc) vpStepDesc.textContent = curStep.desc;
      if (vpStepSpecs) vpStepSpecs.innerHTML = '<span>' + (curStep.spec1 || '') + '</span><span>' + (curStep.spec2 || '') + '</span>';

      // Draw real-time 3D animation frame on canvas
      draw3DCanvasAnimation();

      // Time & Timeline Fill
      if (vpTime) vpTime.textContent = formatTime(curTimeSec) + ' / ' + formatTime(totalSec);
      var pct = Math.min(100, (curTimeSec / totalSec) * 100);
      if (vpFill) vpFill.style.width = pct + '%';
      if (vpHandle) vpHandle.style.left = pct + '%';
    }

    function play() {
      stop();
      isPlaying = true;
      if (vpScreen) vpScreen.classList.add('is-playing');
      if (vpPlayPause) vpPlayPause.classList.add('is-playing');
      timer = setInterval(function () {
        var chapData = VP_DATA[curChap];
        curTimeSec += 0.5 * speed;
        if (curTimeSec > chapData.totalSec) {
          curTimeSec = 0;
        }
        renderVideoState();
      }, 300);
    }

    function stop() {
      isPlaying = false;
      if (vpScreen) vpScreen.classList.remove('is-playing');
      if (vpPlayPause) vpPlayPause.classList.remove('is-playing');
      if (timer) clearInterval(timer);
    }

    // Handlers
    vpChapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        vpChapBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        curChap = btn.getAttribute('data-chap');

        if (curChap === 'yt') {
          stop();
          if (vpScreen) {
            vpScreen.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/mfZo_HvMmM8?autoplay=1" title="3D Construction Animation Walkthrough" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; inset:0; width:100%; height:100%; border:none; z-index:10;"></iframe>';
          }
          return;
        }

        if (!document.getElementById('vpCanvas') && vpScreen) {
          vpScreen.innerHTML = '<canvas id="vpCanvas" width="900" height="440" class="vplayer__canvas"></canvas><div class="vplayer__overlay"><div class="vp-callout" id="vpCallout"><span class="vp-callout__step" id="vpStepNum">STEP 01</span><h4 id="vpStepTitle"></h4><p id="vpStepDesc"></p><div class="vp-callout__specs" id="vpStepSpecs"></div></div></div><button class="vplayer__center-play" id="vpCenterPlay" type="button" aria-label="Play 3D Assembly Video"><svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg></button>';
          canvas = document.getElementById('vpCanvas');
          ctx = canvas ? canvas.getContext('2d') : null;
          vpStepNum = document.getElementById('vpStepNum');
          vpStepTitle = document.getElementById('vpStepTitle');
          vpStepDesc = document.getElementById('vpStepDesc');
          vpStepSpecs = document.getElementById('vpStepSpecs');
        }

        curTimeSec = 0;
        renderVideoState();
        play();
      });
    });

    if (vpPlayPause) {
      vpPlayPause.addEventListener('click', function () {
        if (isPlaying) stop();
        else play();
      });
    }

    if (vpCenterPlay) {
      vpCenterPlay.addEventListener('click', function () {
        play();
      });
    }

    if (vpRestart) {
      vpRestart.addEventListener('click', function () {
        curTimeSec = 0;
        renderVideoState();
        play();
      });
    }

    if (vpSpeedBtn) {
      vpSpeedBtn.addEventListener('click', function () {
        if (speed === 1.0) speed = 1.5;
        else if (speed === 1.5) speed = 2.0;
        else speed = 1.0;
        vpSpeedBtn.textContent = speed.toFixed(1) + 'x';
      });
    }

    if (vpTimeline) {
      vpTimeline.addEventListener('click', function (e) {
        var rect = vpTimeline.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var pct = clickX / rect.width;
        var chapData = VP_DATA[curChap];
        curTimeSec = Math.max(0, Math.min(chapData.totalSec, pct * chapData.totalSec));
        renderVideoState();
      });
    }

    renderVideoState();
    play();
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  if (useGSAP) initGSAP();
  else initFallback();

  update();
})();
