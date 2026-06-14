(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.style.scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const backToTop = document.getElementById('back-to-top');
  const animateEls = document.querySelectorAll('.scroll-animate');

  if (!prefersReducedMotion && animateEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    animateEls.forEach((el, i) => {
      const delay = el.dataset.delay || Math.min(i * 0.08, 0.4);
      el.style.transitionDelay = `${delay}s`;
      observer.observe(el);
    });
  } else {
    animateEls.forEach((el) => el.classList.add('is-visible'));
  }

  function toggleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 400) {
      backToTop.classList.add('is-visible');
    } else {
      backToTop.classList.remove('is-visible');
    }
  }

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const hotelSlideshow = document.getElementById('hotelSlideshow');
  if (hotelSlideshow && !prefersReducedMotion) {
    const slides = hotelSlideshow.querySelectorAll('.home-hotel-slide');
    if (slides.length > 1) {
      let current = 0;
      setInterval(() => {
        slides[current].classList.remove('is-active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('is-active');
      }, 5000);
    }
  }
})();
