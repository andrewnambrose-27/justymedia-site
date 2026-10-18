const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'homepage-motion.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<script src="\/homepage-motion\.js\?v=20261018-2"><\/script>/);
assert.ok(!fs.readFileSync(path.join(root, 'services/index.html'), 'utf8').includes('homepage-motion.js'), 'Motion is homepage-only');

function element(top = 1500) {
  const classes = new Set();
  const attributes = new Map();
  const properties = new Map();
  let additions = 0;
  return {
    classes, attributes, properties,
    get additions() { return additions; },
    classList: {
      add(name) { classes.add(name); if (name === 'home-reveal') additions++; },
      remove: name => classes.delete(name)
    },
    setAttribute: (name, value) => attributes.set(name, value),
    style: { setProperty: (name, value) => properties.set(name, value) },
    getBoundingClientRect: () => ({ top }),
    setTop(value) { top = value; },
    contains: node => node === null ? false : node === 'focused',
    closest: () => null,
    parentElement: null
  };
}

function setup({ reduced = false, unsupported = false, failObserve = false } = {}) {
  const cards = Array.from({ length: 4 }, () => element());
  const visible = element(100);
  const accent = element();
  const targets = [visible, ...cards];
  targets.forEach(item => { item.closest = selector => selector === '[data-home-reveal]' ? item : null; });
  const handlers = {};
  const motion = { matches: reduced, addEventListener: (_, handler) => { handlers.motion = handler; } };
  let observer;
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; this.observed = new Set(); this.unobserved = []; observer = this; }
    observe(item) { if (failObserve) throw new Error('Observer failed'); this.observed.add(item); }
    unobserve(item) { this.observed.delete(item); this.unobserved.push(item); }
    disconnect() { this.disconnected = true; this.observed.clear(); }
  }
  const main = {
    querySelectorAll(selector) {
      if (selector === '.services-overview .section-heading') return [visible];
      if (selector === '.services-overview .service-card') return cards;
      if (selector.startsWith('section:not')) return [accent];
      return [];
    },
    addEventListener: (name, handler) => { handlers[name] = handler; }
  };
  vm.runInNewContext(script, {
    document: { querySelector: () => main, activeElement: null },
    window: { IntersectionObserver: unsupported ? undefined : Observer, matchMedia: () => motion, innerHeight: 900 }
  });
  return { cards, visible, accent, targets, handlers, motion, observer };
}

const app = setup();
assert.equal(app.observer.options.threshold, 0);
assert.equal(app.observer.options.rootMargin, '0px 0px 120px 0px');
assert.deepEqual(app.cards.map(card => card.properties.get('--home-reveal-delay')), ['0ms', '100ms', '200ms', '300ms']);
assert.ok(app.targets.every(item => !item.classes.has('home-reveal')), 'Content is visible before observation');
assert.ok(!app.observer.observed.has(app.visible), 'Already-visible content must not flash or replay');
app.observer.callback([{ target: app.cards[0], isIntersecting: false }]);
assert.equal(app.cards[0].additions, 0);
app.observer.callback([{ target: app.cards[0], isIntersecting: true }]);
app.observer.callback([{ target: app.cards[0], isIntersecting: true }]);
assert.equal(app.cards[0].additions, 1, 'Each entrance plays only once');
assert.ok(!app.observer.observed.has(app.cards[0]));
app.handlers.focusin({ target: app.cards[0] });
assert.ok(!app.cards[0].classes.has('home-reveal'), 'Keyboard focus cancels an active entrance immediately');
app.handlers.focusin({ target: app.cards[1] });
app.observer.callback([{ target: app.cards[1], isIntersecting: true }]);
assert.equal(app.cards[1].additions, 0, 'A keyboard-reached card must not animate later');
app.observer.callback([{ target: app.cards[2], isIntersecting: true }]);
app.motion.matches = true;
app.handlers.motion();
assert.ok(app.observer.disconnected);
assert.ok(app.targets.every(item => !item.classes.has('home-reveal')), 'Reduced motion removes all running entrances');
const reduced = setup({ reduced: true });
assert.equal(reduced.observer, undefined);
assert.ok(reduced.targets.every(item => !item.classes.has('home-reveal')));
assert.equal(setup({ unsupported: true }).observer, undefined);
const failed = setup({ failObserve: true });
assert.ok(failed.observer.disconnected);
assert.ok(failed.targets.every(item => !item.classes.has('home-reveal')), 'Observer failures leave every element visible');
const callbackFailure = setup();
callbackFailure.observer.unobserve = () => { throw new Error('Callback failed'); };
callbackFailure.observer.callback([{ target: callbackFailure.cards[0], isIntersecting: true }]);
assert.ok(callbackFailure.observer.disconnected);
assert.ok(callbackFailure.targets.every(item => !item.classes.has('home-reveal')));
const lateEntry = setup();
lateEntry.cards[0].setTop(850);
lateEntry.observer.callback([{ target: lateEntry.cards[0], isIntersecting: true }]);
assert.equal(lateEntry.cards[0].additions, 0, 'Fast scrolling must not hide content already inside the viewport');
assert.ok(!lateEntry.observer.observed.has(lateEntry.cards[0]));
lateEntry.cards[0].setTop(960);
lateEntry.observer.callback([{ target: lateEntry.cards[0], isIntersecting: true }]);
assert.equal(lateEntry.cards[0].additions, 0, 'A skipped entrance must never replay later');
const earlyEntry = setup();
earlyEntry.cards[0].setTop(960);
earlyEntry.observer.callback([{ target: earlyEntry.cards[0], isIntersecting: true }]);
assert.equal(earlyEntry.cards[0].additions, 1, 'Entrances may start in the buffer below the screen');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.ok(!css.includes('home-image-reveal'), 'Images should use one entrance instead of a second opacity/clip animation');
console.log('Verified offscreen preparation, visible-content skip, visible defaults, 100ms stagger, once-only entrances, keyboard cancellation, reduced-motion changes, unsupported browsers, and observer failure recovery.');
