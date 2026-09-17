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
    preloaderDelay: 600,
    typeSpeed: 75,
    deleteSpeed: 42,
    typePause: 1900,
    statusInterval: 2600,
    counterDuration: 1600,
    formspreeId: 'xqpakgpk',
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

  // ============================================
  // UI Modules
  // ============================================

  /**
   * Preloader
   * Hides the loading screen after a short delay.
   */
  const Preloader = {
    init() {
      setTimeout(() => {
        $('.preloader').classList.add('hidden');
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
      this.navLinks.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.hamburger.classList.remove('open');
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
   * IntersectionObserver that fades elements in.
   */
  const RevealOnScroll = {
    init() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              if (entry.target.classList.contains('hero__stat-num')) {
                Counter.animate(entry.target);
              }
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );

      $$('[data-reveal]').forEach((el) => observer.observe(el));
    },
  };

  /**
   * Skill Bars
   * Animates progress bars when cards enter the viewport.
   */
  const SkillBars = {
    init() {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const card = entry.target;
              card.classList.add('in-view');
              card.querySelectorAll('.bar span').forEach((bar) => {
                const width = bar.getAttribute('style').match(/width:(\d+)%/)[1];
                bar.style.width = `${width}%`;
              });
              observer.unobserve(card);
            }
          });
        },
        { threshold: 0.3 }
      );

      $$('.skill-card').forEach((card) => {
        card.querySelectorAll('.bar').forEach((bar) => {
          const percent = document.createElement('span');
          percent.className = 'skill-card__percent';
          const width = bar.getAttribute('style').match(/width:(\d+)%/)[1];
          percent.textContent = `${width}%`;
          bar.closest('li').appendChild(percent);
        });
        observer.observe(card);
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

  // ============================================
  // Bootstrap
  // ============================================
  const init = () => {
    Preloader.init();
    MobileNav.init();
    ScrollEffects.init();
    TypeWriter.init();
    StatusRotator.init();
    Counter.init();
    RevealOnScroll.init();
    SkillBars.init();
    TimelineProgress.init();
    CursorGlow.init();
    ContactForm.init();
    ScrollProgress.init();
    Tilt3D.init();
    BackToTop.init();
  };

  document.addEventListener('DOMContentLoaded', init);
})();