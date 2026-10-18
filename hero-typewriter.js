/* The HTML owns the service names and the permanent accessible heading. */
(function () {
  const heading = document.querySelector('[data-hero-typewriter]');
  if (!heading || !window.matchMedia) return;

  const current = heading.querySelector('.hero-service-current');
  const services = Array.from(heading.querySelectorAll('[data-hero-service]'), item => item.textContent.trim());
  if (!current || !services.length || services.some(name => !name)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let index;
  let length;
  let deleting;

  function stop() {
    clearTimeout(timer);
    heading.classList.remove('is-typewriter');
  }

  function tick() {
    try {
      if (motion.matches) return stop();
      if (document.hidden) return;
      const service = services[index];
      length += deleting ? -1 : 1;
      current.textContent = service.slice(0, length);
      let delay = deleting ? 25 : 40;
      if (!length) {
        index = (index + 1) % services.length;
        deleting = false;
        delay = 150;
      } else if (length === service.length) {
        deleting = true;
        delay = 1200;
      }
      timer = setTimeout(tick, delay);
    } catch {
      stop();
    }
  }

  function start() {
    stop();
    if (motion.matches) return;
    index = 0;
    length = services[0].length;
    deleting = true;
    current.textContent = services[0];
    heading.classList.add('is-typewriter');
    if (!document.hidden) timer = setTimeout(tick, 1200);
  }

  try {
    motion.addEventListener('change', start);
    document.addEventListener('visibilitychange', () => {
      clearTimeout(timer);
      if (!document.hidden && heading.classList.contains('is-typewriter')) {
        timer = setTimeout(tick, 1200);
      }
    });
    start();
  } catch {
    stop();
  }
})();
