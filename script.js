document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const header = document.getElementById('navbar');

    setTimeout(() => {
        document.querySelector('.preloader').classList.add('hidden');
    }, 600);

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('#navLinks a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
        updateActiveLink();
    }, { passive: true });

    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links .nav-link');

    function updateActiveLink() {
        const pos = window.scrollY + 120;
        let current = '';
        sections.forEach(section => {
            if (pos >= section.offsetTop) {
                current = section.id;
            }
        });
        navAnchors.forEach(anchor => {
            anchor.classList.toggle('active', anchor.getAttribute('href') === `#${current}`);
        });
    }

    const roles = [
        'Flutter Developer',
        'Mobile App Engineer',
        'Android & iOS Developer',
        'Problem Solver',
        'Tech Enthusiast'
    ];
    const typed = document.getElementById('typed');
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeLoop() {
        const current = roles[roleIndex];
        if (!deleting) {
            typed.textContent = current.slice(0, ++charIndex);
            if (charIndex === current.length) {
                deleting = true;
                setTimeout(typeLoop, 1900);
                return;
            }
            setTimeout(typeLoop, 75);
        } else {
            typed.textContent = current.slice(0, --charIndex);
            if (charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
            }
            setTimeout(typeLoop, 42);
        }
    }
    typeLoop();

    const statusEl = document.getElementById('statusText');
    const statuses = ['Compiling…', 'Refactoring…', 'Unit tests passed ✓', 'Deploying 🚀', 'All systems go'];
    let sIndex = 0;
    setInterval(() => {
        sIndex = (sIndex + 1) % statuses.length;
        statusEl.textContent = statuses[sIndex];
    }, 2600);

    const countTargets = document.querySelectorAll('.stat-num[data-count]');
    function runCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        const duration = 1600;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (entry.target.classList.contains('stat-num')) {
                    runCounter(entry.target);
                }
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => {
        revealObserver.observe(el);
    });

    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.bar span').forEach(bar => {
                    bar.style.width = bar.getAttribute('style').match(/width:(\d+)%/)[1] + '%';
                });
                barObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.skill-card').forEach(card => {
        barObserver.observe(card);
    });

    document.querySelectorAll('.skill-card, .service-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
            card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
    });

    const form = document.getElementById('contactForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const btn = form.querySelector('.submit-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
        setTimeout(() => {
            btn.innerHTML = '<span>Message Sent!</span><i class="fas fa-check"></i>';
            form.reset();
            setTimeout(() => {
                btn.innerHTML = original;
                btn.disabled = false;
            }, 2600);
        }, 1400);
    });
});