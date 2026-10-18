/* Content stays visible by default. Finite entrance animations start only on entry. */
(function () {
  const main = document.querySelector('.home-page main');
  if (!main || !window.IntersectionObserver || !window.matchMedia) return;

  const groups = [
    '.intro-section .split-intro > div:first-child, .intro-section .split-intro > div:last-child > p',
    '.services-overview .section-heading',
    '.services-overview .service-card',
    '.selected-work .section-heading',
    '.selected-work .work-card',
    '.photo-feature-media',
    '.photo-feature-copy > *',
    '.process-section .eyebrow, .process-section h2',
    '.process-list > li',
    '.why-section .split-intro > div:first-child',
    '.feature-list > article',
    '.final-cta .content-width > *',
    '.resource-strip .wide-width > div'
  ];
  const targets = new Set();
  const shown = new WeakSet();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;

  function reveal(element, animate) {
    if (shown.has(element)) return;
    shown.add(element);
    observer.unobserve(element);
    if (animate && !motion.matches && !element.contains(document.activeElement)) {
      element.classList.add('home-reveal');
    }
  }

  function finish() {
    if (observer) observer.disconnect();
    targets.forEach(element => {
      shown.add(element);
      element.classList.remove('home-reveal');
    });
  }

  try {
    groups.forEach(selector => {
      main.querySelectorAll(selector).forEach((element, index) => {
        if (targets.has(element)) return;
        targets.add(element);
        element.setAttribute('data-home-reveal', '');
        element.style.setProperty('--home-reveal-delay', `${Math.min(index, 3) * 100}ms`);
      });
    });
    main.querySelectorAll('section:not(.hero) .eyebrow, .resource-strip .eyebrow').forEach(element => {
      if (!element.closest('.hero, .final-cta')) element.classList.add('home-accent');
    });
    if (motion.matches) return;

    observer = new window.IntersectionObserver(entries => {
      try {
        entries.forEach(entry => {
          if (entry.isIntersecting) reveal(entry.target, true);
        });
      } catch {
        finish();
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    targets.forEach(element => {
      // Skip content already on screen, including pages opened at an anchor.
      if (element.getBoundingClientRect().top < window.innerHeight || element.contains(document.activeElement)) {
        reveal(element, false);
      } else {
        observer.observe(element);
      }
    });
    main.addEventListener('focusin', event => {
      let element = event.target.closest('[data-home-reveal]');
      while (element) {
        reveal(element, false);
        element.classList.remove('home-reveal');
        element = element.parentElement && element.parentElement.closest('[data-home-reveal]');
      }
    });
    motion.addEventListener('change', () => {
      if (motion.matches) finish();
    });
  } catch {
    finish();
  }
})();
