/* ============================================
   Portfolio JavaScript
   Modular architecture with separation of concerns.
   ============================================ */
(function () {
  'use strict';

  // ============================================
  // Config
  // ============================================
  const CONFIG = {
    preloaderDelay: 300,
    typeSpeed: 75,
    deleteSpeed: 42,
    typePause: 1900,
    statusInterval: 2600,
    counterDuration: 1600,
    formspreeId: 'xqpakgpk',
    resumeFile: 'Mohammed_Rinshad_Resume.pdf',
    // Served from GitHub via jsDelivr: CORS-enabled (*), no GitHub rate
    // limits, edge-cached. Falls back to the local copy if unreachable.
    resumeSources: [
      'https://cdn.jsdelivr.net/gh/MohammedRinshad/newportfolio@main/resume.pdf',
      'resume.pdf',
    ],
  };

  const ROLES = [
    'Flutter Developer',
    'Mobile App Engineer',
    'Android & iOS Developer',
    'Problem Solver',
    'Tech Enthusiast',
  ];

  const STATUS_MESSAGES = [
    'Compiling…',
    'Refactoring…',
    'Unit tests passed ✓',
    'Deploying 🚀',
    'All systems go',
  ];

  // ============================================
  // DOM Helpers
  // ============================================
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  // Older Safari (<12.1), Chrome (<51) and some Android in-app webviews have
  // no IntersectionObserver. Any module that constructs one unguarded throws,
  // which used to abort the whole init chain and silently kill every module
  // after it — including the resume button and the theme toggle. Detect once
  // here so the two call sites can fall back to showing content immediately.
  const HAS_IO = typeof window.IntersectionObserver === 'function';

  // ============================================
  // UI Modules
  // ============================================

  /**
   * Preloader
   * Hides the loading screen after a short delay, then kicks off the
   * choreographed hero entrance (title line-reveal + staggered fade).
   */
  const Preloader = {
    init() {
      setTimeout(() => {
        const preloader = $('.preloader');
        if (preloader) preloader.classList.add('hidden');
        document.body.classList.add('loaded');
        HeroEntrance.run();
      }, CONFIG.preloaderDelay);
    },
  };

  /**
   * Mobile Navigation
   * Toggles the hamburger menu and active nav state.
   */
  const MobileNav = {
    init() {
      this.hamburger = $('#hamburger');
      this.navLinks = $('#navLinks');

      this.hamburger.addEventListener('click', () => this.toggle());
      $$('#navLinks a').forEach((link) =>
        link.addEventListener('click', () => this.close())
      );
    },

    toggle() {
      const isOpen = this.navLinks.classList.contains('open');
      isOpen ? this.close() : this.open();
    },

    open() {
      this.hamburger.classList.add('open');
      this.hamburger.setAttribute('aria-expanded', 'true');
      this.navLinks.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.hamburger.classList.remove('open');
      this.hamburger.setAttribute('aria-expanded', 'false');
      this.navLinks.classList.remove('open');
      document.body.style.overflow = '';
    },
  };

  /**
   * Sticky Header & Active Nav Link
   * Adds the scrolled style and highlights the section in view.
   */
  const ScrollEffects = {
    init() {
      this.header = $('#navbar');
      this.sections = $$('section[id]');
      this.navAnchors = $$('.header__links .header__link');

      window.addEventListener(
        'scroll',
        () => {
          this.toggleHeader();
          this.updateActiveLink();
        },
        { passive: true }
      );

      this.toggleHeader();
      this.updateActiveLink();
    },

    toggleHeader() {
      this.header.classList.toggle('scrolled', window.scrollY > 40);
    },

    updateActiveLink() {
      const current = this.getCurrentSectionId();
      this.navAnchors.forEach((anchor) => {
        anchor.classList.toggle('active', anchor.getAttribute('href') === `#${current}`);
      });
    },

    getCurrentSectionId() {
      const scrollPos = window.scrollY + 120;
      let current = '';
      this.sections.forEach((section) => {
        if (scrollPos >= section.offsetTop) {
          current = section.id;
        }
      });
      return current;
    },
  };

  /**
   * Typed Text Effect
   * Cycles through role strings with type / delete animation.
   */
  const TypeWriter = {
    init() {
      this.el = $('#typed');
      this.roleIndex = 0;
      this.charIndex = 0;
      this.deleting = false;
      this.loop();
    },

    loop() {
      const current = ROLES[this.roleIndex];

      if (!this.deleting) {
        this.el.textContent = current.slice(0, ++this.charIndex);
        if (this.charIndex === current.length) {
          this.deleting = true;
          setTimeout(() => this.loop(), CONFIG.typePause);
          return;
        }
      } else {
        this.el.textContent = current.slice(0, --this.charIndex);
        if (this.charIndex === 0) {
          this.deleting = false;
          this.roleIndex = (this.roleIndex + 1) % ROLES.length;
        }
      }

      setTimeout(() => this.loop(), this.deleting ? CONFIG.deleteSpeed : CONFIG.typeSpeed);
    },
  };

  /**
   * Code Card Status Rotator
   * Cycles through fake compile statuses.
   */
  const StatusRotator = {
    init() {
      const el = $('#statusText');
      let index = 0;

      setInterval(() => {
        index = (index + 1) % STATUS_MESSAGES.length;
        el.textContent = STATUS_MESSAGES[index];
      }, CONFIG.statusInterval);
    },
  };

  /**
   * Count-Up Animation
   * Animates stat numbers with easing when scrolled into view.
   */
  const Counter = {
    init() {
      const counters = $$('.hero__stat-num[data-count]');
      counters.forEach((el) => this.animate(el));
    },

    animate(el) {
      const target = parseInt(el.dataset.count, 10);
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / CONFIG.counterDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    },
  };

  /**
   * Reveal-on-Scroll
   * IntersectionObserver that fades elements in with a premium blur-up.
   * Hero elements are excluded — they are choreographed by HeroEntrance.
   * Once fully revealed, the data-reveal attribute is stripped so hover
   * transforms (lift, tilt) are free to animate afterwards.
   */
  const RevealOnScroll = {
    init() {
      // No observer support: reveal everything at once rather than leaving
      // [data-reveal] content permanently invisible.
      if (!HAS_IO) return this.revealAll();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              el.classList.add('revealed');
              if (el.classList.contains('hero__stat-num')) {
                Counter.animate(el);
              }
              observer.unobserve(el);
              setTimeout(() => el.removeAttribute('data-reveal'), 1600);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );

      $$('[data-reveal]').forEach((el) => {
        if (el.closest('#hero')) return;
        observer.observe(el);
      });
    },

    revealAll() {
      $$('[data-reveal]').forEach((el) => {
        el.classList.add('revealed');
        if (el.classList.contains('hero__stat-num')) Counter.animate(el);
        el.removeAttribute('data-reveal');
      });
    },
  };

  /**
   * Skill Bars
   * Animates progress bars when cards enter the viewport.
   */
  const SkillBars = {
    init() {
      const cards = $$('.skill-card');

      // The percent labels do not depend on the observer, so build them first.
      cards.forEach((card) => this.addPercents(card));

      if (!HAS_IO) {
        cards.forEach((card) => this.fill(card));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.fill(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      cards.forEach((card) => observer.observe(card));
    },

    fill(card) {
      card.classList.add('in-view');
      card.querySelectorAll('.bar span').forEach((bar) => {
        const width = (bar.getAttribute('style') || '').match(/width:(\d+)%/);
        if (width) bar.style.width = `${width[1]}%`;
      });
    },

    addPercents(card) {
      card.querySelectorAll('.bar').forEach((bar) => {
        const fill = bar.querySelector('span');
        const width = (fill && (fill.getAttribute('style') || '').match(/width:(\d+)%/));
        if (!width) return;
        const percent = document.createElement('span');
        percent.className = 'skill-card__percent';
        percent.textContent = `${width[1]}%`;
        bar.closest('li').appendChild(percent);
      });
    },
  };

  /**
   * Timeline Progress
   * Draws the experience timeline line down as the section scrolls into view.
   */
  const TimelineProgress = {
    init() {
      this.timeline = $('.timeline');
      if (!this.timeline) return;

      const update = () => {
        const rect = this.timeline.getBoundingClientRect();
        const total = rect.height;
        const visible = Math.min(Math.max(window.innerHeight - rect.top, 0), total);
        this.timeline.style.setProperty('--tl-progress', total ? visible / total : 0);
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },
  };

  /**
   * Cursor Glow Effect
   * Tracks the mouse over skill / service cards.
   */
  const CursorGlow = {
    init() {
      $$('.skill-card, .service-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
      });
    },
  };

  /**
   * Contact Form
   * Simulates form submission with friendly UX states.
   */
  const ContactForm = {
    init() {
      const form = $('#contactForm');
      form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    },

    handleSubmit(e, form) {
      e.preventDefault();

      const btn = form.querySelector('.submit-btn');
      const originalHTML = btn.innerHTML;
      const id = CONFIG.formspreeId;

      const finish = (msg, icon) => {
        btn.innerHTML = `<span>${msg}</span><i class="fas ${icon}"></i>`;
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        }, 2600);
      };

      btn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      const payload = {
        name: form.querySelector('#name').value,
        email: form.querySelector('#email').value,
        message: form.querySelector('#message').value,
      };

      if (!id) {
        const missing = $('.form-status');
        if (missing) {
          missing.textContent = 'Form not connected yet — add your Formspree ID in script.js (CONFIG.formspreeId).';
        }
        const enable = () => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        };
        setTimeout(enable, 1400);
        return;
      }

      fetch(`https://formspree.io/f/${id}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Formspree request failed');
          return res.json();
        })
        .then(() => {
          form.reset();
          finish('Message Sent!', 'fa-check');
        })
        .catch(() => {
          finish('Failed — please try again', 'fa-exclamation-triangle');
        });
    },
  };

  /**
   * Scroll Progress Bar
   * Updates the width of the top progress bar as the page scrolls.
   */
  const ScrollProgress = {
    init() {
      const bar = $('#scrollProgress');
      if (!bar) return;

      const set = () => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const progress = total > 0 ? window.scrollY / total : 0;
        bar.style.setProperty('--progress', `${progress * 100}%`);
      };

      window.addEventListener('scroll', set, { passive: true });
      window.addEventListener('resize', set, { passive: true });
      set();
    },
  };

  /**
   * 3D Tilt Effect
   * Tilts project cards toward the cursor for a tactile, immersive feel.
   */
  const Tilt3D = {
    init() {
      $$('.project-card').forEach((card) => {
        card.classList.add('tilt-card');

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--rx', `${((0.5 - py) * 10).toFixed(2)}deg`);
          card.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`);
        });

        card.addEventListener('mouseleave', () => {
          card.style.setProperty('--rx', '0deg');
          card.style.setProperty('--ry', '0deg');
        });
      });
    },
  };

  /**
   * Back To Top
   * Reveals a floating button after scrolling and smooth-scrolls to the top.
   * A progress ring around the button mirrors the page scroll.
   */
  const BackToTop = {
    init() {
      this.btn = $('#backTop');
      if (!this.btn) return;
      this.ring = document.querySelector('.back-to-top__ring circle');
      this.circ = 125.66;

      const onScroll = () => {
        this.toggle();
        this.progress();
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      this.btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      onScroll();
    },

    toggle() {
      this.btn.classList.toggle('visible', window.scrollY > 480);
    },

    progress() {
      if (!this.ring || !this.circ) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max ? window.scrollY / max : 0;
      this.ring.style.setProperty('--ring-offset', this.circ * (1 - p));
    },
  };

  /**
   * Custom Cursor
   * Desktop-only dot + trailing ring. The ring lerps toward the pointer and
   * balloons over interactive elements for a tactile, premium feel.
   */
  const CustomCursor = {
    init() {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const dot = $('.cursor--dot');
      const ring = $('.cursor--ring');
      if (!dot || !ring) return;

      document.body.classList.add('has-cursor');

      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx;
      let ry = my;
      let raf = null;

      const loop = () => {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px) translate(-50%, -50%)`;
        raf = null;
      };

      document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx.toFixed(2)}px, ${my.toFixed(2)}px) translate(-50%, -50%)`;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });

      const interactive = 'a, button, input, textarea, select, .tilt-card, .skill-card, .service-card, .process__step, .timeline__content, .glow-card';
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactive)) ring.classList.add('is-hover');
        else ring.classList.remove('is-hover');
      }, { passive: true });

      document.documentElement.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
      });
      document.documentElement.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
      });
    },
  };

  /**
   * Magnetic Hover
   * Buttons and social icons gently gravitate toward the cursor.
   */
  const Magnetic = {
    init() {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      $$('.btn, .hero__social a, .store-link, .header__logo, .contact__social-btn').forEach((el) => {
        el.classList.add('magnetic');

        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          el.style.transition = 'transform 0.12s ease-out';
          el.style.transform = `translate(${(x * 0.3).toFixed(2)}px, ${(y * 0.3).toFixed(2)}px)`;
        });

        el.addEventListener('mouseleave', () => {
          el.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
          el.style.transform = '';
          setTimeout(() => { el.style.transition = ''; }, 460);
        });
      });
    },
  };

  /**
   * Hero Parallax
   * The code card and floating chips drift in depth while the mouse moves,
   * layered on top of their gentle float via CSS variables.
   */
  const HeroParallax = {
    init() {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const card = $('.hero__code-card');
      const chips = $$('.hero__chip');
      if (!card && chips.length === 0) return;

      let raf = null;

      const onMove = (e) => {
        if (!document.body.classList.contains('loaded')) return;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const cx = (e.clientX / window.innerWidth - 0.5) * 2;
          const cy = (e.clientY / window.innerHeight - 0.5) * 2;
          if (card) {
            card.style.setProperty('--pcx', `${(cx * 14).toFixed(2)}px`);
            card.style.setProperty('--pcy', `${(cy * 10).toFixed(2)}px`);
          }
          chips.forEach((chip, i) => {
            const depth = 12 + i * 5;
            chip.style.setProperty('--ccx', `${(cx * depth).toFixed(2)}px`);
            chip.style.setProperty('--ccy', `${(cy * depth).toFixed(2)}px`);
          });
          raf = null;
        });
      };

      document.addEventListener('mousemove', onMove, { passive: true });
    },
  };

  /**
   * Aurora Parallax
   * Background orbs drift vertically as the page scrolls for added depth,
   * fused into their float animation via the --oy CSS variable.
   */
  const AuroraParallax = {
    init() {
      const orbs = $$('.aurora__orb');
      if (orbs.length === 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let ticking = false;

      const update = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          orbs.forEach((orb, i) => {
            const speed = parseFloat(orb.dataset.speed || `${0.04 + i * 0.02}`);
            orb.style.setProperty('--oy', `${(y * speed).toFixed(2)}px`);
          });
          ticking = false;
        });
      };

      window.addEventListener('scroll', update, { passive: true });
      update();
    },
  };

  /**
   * Hero Entrance
   * Runs once the preloader fades: reveals the name line-by-line, then
   * staggers the fade-up of greeting / description / CTAs / stats.
   */
  const HeroEntrance = {
    run() {
      $$('.hero__title .hero__line-inner').forEach((el, i) => {
        el.style.setProperty('--d', `${(0.2 + i * 0.12).toFixed(2)}s`);
      });

      $$('.hero [data-reveal]').forEach((el, i) => {
        el.style.setProperty('--rd', `${(0.1 + i * 0.07).toFixed(2)}s`);
        el.classList.add('revealed');
      });

      $$('.hero__stat-num[data-count]').forEach((el) => {
        setTimeout(() => Counter.animate(el), 900);
      });
    },
  };

  /**
   * Theme Toggle
   * Light by default; the theme only changes when the user clicks the
   * toggle. The choice is persisted, and the initial theme is applied
   * early by an inline script in <head> to avoid any flash.
   */
  const ThemeToggle = {
    key: 'portfolio-theme',

    init() {
      this.btn = $('#themeToggle');
      if (!this.btn) return;

      this.setupIcon();

      this.btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        this.apply(next);
        try { localStorage.setItem(this.key, next); } catch (e) { /* ignore */ }
      });
    },

    apply(theme) {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = theme === 'dark' ? '#070b18' : '#ffffff';

      // Freeze CSS transitions for the swap so no text is caught mid-fade
      // blending into the old/new background.
      document.documentElement.classList.add('theme-switching');
      clearTimeout(this._guardTimer);
      this._guardTimer = setTimeout(() => {
        document.documentElement.classList.remove('theme-switching');
      }, 420);

      if (!this.btn) return;
      const icon = this.btn.querySelector('i');
      if (icon) {
        const goingDark = theme === 'dark';
        icon.className = goingDark ? 'fas fa-sun' : 'fas fa-moon';
        this.btn.classList.remove('spin');
        void this.btn.offsetWidth; // restart the CSS transition
        this.btn.classList.add('spin');
      }
    },

    setupIcon() {
      const dark = document.documentElement.dataset.theme === 'dark';
      const icon = this.btn.querySelector('i');
      if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    },
  };

  /**
   * Resume Download
   * The PDF is served from GitHub via jsDelivr, which returns
   * `Access-Control-Allow-Origin: *`. That CORS header is what lets us read
   * the file as a blob and force a real save dialog, because browsers ignore
   * the `download` attribute on cross-origin links.
   *
   * iOS Safari does not honour `download` for blob URLs, so there we let the
   * link navigate natively and the PDF opens in the viewer instead. If every
   * source fails we fall back to opening the CDN URL in a new tab, so a tap
   * always does something useful.
   */
  const ResumeDownload = {
    init() {
      this.btn = $('#resumeBtn');
      if (!this.btn) return;

      this.originalHTML = this.btn.innerHTML;
      this.sources = CONFIG.resumeSources;

      this.btn.addEventListener('click', (e) => this.handle(e));
    },

    handle(event) {
      if (this.busy) return;
      if (this.opensInViewer()) return;

      if (event) event.preventDefault();
      this.busy = true;
      this.setLoading(true);

      this.fetchBlob()
        .then((blob) => this.saveBlob(blob))
        .then(() => {
          this.setLoading(false, true);
          this.resetLater(2400);
        })
        .catch(() => {
          this.fallback();
          this.setLoading(false, false);
          this.resetLater(3000);
        });
    },

    // Ordered by reliability: the CDN first, the local copy as a backstop.
    fetchBlob() {
      const tryNext = (index) => {
        if (index >= this.sources.length) {
          return Promise.reject(new Error('All resume sources failed'));
        }
        return fetch(this.sources[index], { mode: 'cors' })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.blob();
          })
          .catch(() => tryNext(index + 1));
      };
      return tryNext(0);
    },

    saveBlob(blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = CONFIG.resumeFile;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    },

    fallback() {
      window.open(this.sources[0], '_blank', 'noopener');
    },

    // Blob downloads are unreliable on iOS, so let the native PDF viewer work.
    opensInViewer() {
      const ua = navigator.userAgent || '';
      const iOS = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      return iOS || typeof URL.createObjectURL !== 'function';
    },

    resetLater(delay) {
      setTimeout(() => {
        this.busy = false;
        this.btn.innerHTML = this.originalHTML;
      }, delay);
    },

    setLoading(loading, ok) {
      const text = loading
        ? 'Downloading…'
        : ok
          ? 'Downloaded!'
          : 'Opened in new tab';
      this.btn.innerHTML = `<i class="fas ${loading ? 'fa-spinner fa-spin' : ok ? 'fa-check' : 'fa-external-link-alt'}"></i> ${text}`;
    },
  };

  /**
   * Live Flutter Demo
   * Wires up the interactive mini-app: counter, task queue, its own
   * light/dark theme and a mock hot-reload — a working widget tree.
   */
  const LiveDemo = {
    init() {
      this.app = $('#demoApp');
      if (!this.app) return;

      this.countEl = $('#demoCount');
      this.stateNameEl = $('#demoStateName');
      this.progressEl = $('#demoProgress');
      this.progressTextEl = $('#demoProgressText');
      this.flashEl = $('#demoFlash');
      this.snackEl = $('#demoSnack');
      this.themeBtn = $('#demoTheme');
      this.themeIcon = $('#demoThemeIcon');

      this.count = parseInt(this.countEl.textContent, 10) || 0;
      this.snackTimer = null;

      $('#demoPlus').addEventListener('click', () => this.bump(1));
      $('#demoFab').addEventListener('click', () => this.bump(1));
      $('#demoMinus').addEventListener('click', () => this.bump(-1));
      $('#demoReload').addEventListener('click', () => this.reload());

      ['#demoTask1', '#demoTask2'].forEach((sel) => {
        $(sel).addEventListener('change', () => {
          this.render();
          const done = this.doneTasks();
          this.snack(`✓ Task ${done}/2 ${done === 2 ? ' — all done!' : `completed (${done}/2)`}`);
        });
      });

      if (this.themeBtn) {
        this.themeBtn.addEventListener('click', () => {
          const dark = this.app.classList.toggle('demo-app--dark');
          this.themeIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
          this.snack(`Demo theme → ${dark ? 'dark' : 'light'}`);
        });
      }

      this.render();
    },

    bump(delta) {
      this.count = Math.max(0, this.count + delta);
      this.render(true);
    },

    doneTasks() {
      return [1, 2].filter((n) => $(`#demoTask${n}`).checked).length;
    },

    render(pop) {
      this.countEl.textContent = this.count;

      const names = ['setState', 'Provider', 'Riverpod', 'Bloc'];
      const idx = this.count < 5 ? 0 : this.count < 10 ? 1 : this.count < 20 ? 2 : 3;
      if (this.stateNameEl.textContent !== names[idx]) {
        this.stateNameEl.textContent = names[idx];
        this.stateNameEl.classList.remove('chipPop');
        void this.stateNameEl.offsetWidth;
        this.stateNameEl.classList.add('chipPop');
      }

      const done = this.doneTasks();
      const pct = Math.round((done / 2) * 0.55 * 100 + (Math.min(this.count, 20) / 20) * 0.45 * 100);
      this.progressEl.style.width = `${Math.min(pct, 100)}%`;
      this.progressTextEl.textContent = `${pct}% shipped · ${done}/2 tasks done`;

      if (pop && this.countEl) {
        this.countEl.classList.remove('bump');
        void this.countEl.offsetWidth;
        this.countEl.classList.add('bump');
      }
    },

    reload() {
      if (this.flashEl) {
        this.flashEl.classList.remove('active');
        void this.flashEl.offsetWidth;
        this.flashEl.classList.add('active');
        setTimeout(() => this.flashEl.classList.remove('active'), 450);
      }
      const ms = 30 + Math.round(Math.random() * 45);
      this.snack(`⚡ Hot reloaded in ${ms} ms`);
      this.render(true);
    },

    snack(message) {
      if (!this.snackEl) return;
      this.snackEl.textContent = message;
      this.snackEl.classList.add('show');
      clearTimeout(this.snackTimer);
      this.snackTimer = setTimeout(() => this.snackEl.classList.remove('show'), 1800);
    },
  };

  // ============================================
  // Bootstrap
  // ============================================
  const init = () => {
    // Every module is isolated. A single throw — an unsupported API, a
    // renamed selector — must not prevent the modules after it from starting,
    // so each one is wrapped and failures are reported instead of swallowed.
    const modules = [
      ['Preloader', Preloader],
      ['MobileNav', MobileNav],
      ['ScrollEffects', ScrollEffects],
      ['TypeWriter', TypeWriter],
      ['StatusRotator', StatusRotator],
      ['RevealOnScroll', RevealOnScroll],
      ['SkillBars', SkillBars],
      ['TimelineProgress', TimelineProgress],
      ['CursorGlow', CursorGlow],
      ['ContactForm', ContactForm],
      ['ScrollProgress', ScrollProgress],
      ['Tilt3D', Tilt3D],
      ['BackToTop', BackToTop],
      ['CustomCursor', CustomCursor],
      ['Magnetic', Magnetic],
      ['HeroParallax', HeroParallax],
      ['AuroraParallax', AuroraParallax],
      ['ResumeDownload', ResumeDownload],
      ['ThemeToggle', ThemeToggle],
      ['LiveDemo', LiveDemo],
    ];

    modules.forEach(([name, module]) => {
      try {
        module.init();
      } catch (err) {
        console.warn(`[portfolio] ${name} failed to initialise:`, err);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();