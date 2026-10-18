const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'hero-typewriter.js'), 'utf8');
const expected = ['Web Design', 'Graphic Design', 'Photography', 'Digital Marketing', 'SEO', 'GEO', 'AI Integration', 'Branding & Identity', 'E-commerce Development', 'Content Creation', 'Website Maintenance'];
const names = [...html.matchAll(/<span data-hero-service>(.*?)<\/span>/g)].map(match => match[1].replaceAll('&amp;', '&'));
assert.deepEqual(names, expected, 'All requested services must be server-rendered in order');
assert.match(html, /class="hero-heading-fallback">Web Design, Graphic Design &amp; Digital Marketing <span class="hero-location">in the Peak District<\/span>/);
assert.match(html, /class="hero-heading-animation" aria-hidden="true"/);
assert.doesNotMatch(html.match(/<h1\b.*?<\/h1>/s)[0], /aria-live|role="status"/);

function setup(reduced = false) {
  const timers = new Map();
  const classes = new Set();
  const handlers = {};
  let id = 0;
  let text = '';
  const current = {
    get textContent() { return text; },
    set textContent(value) {
      if (current.fail) throw new Error('Simulated animation failure');
      text = value;
    }
  };
  const motion = { matches: reduced, addEventListener: (_, handler) => { handlers.motion = handler; } };
  const heading = {
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
    querySelector: () => current,
    querySelectorAll: () => names.map(textContent => ({ textContent }))
  };
  const document = { hidden: false, querySelector: () => heading, addEventListener: (_, handler) => { handlers.visibility = handler; } };
  vm.runInNewContext(script, {
    document, window: { matchMedia: () => motion },
    setTimeout: (callback, delay) => { timers.set(++id, { callback, delay }); return id; },
    clearTimeout: key => timers.delete(key)
  });
  return { timers, classes, current, motion, handlers, document, next() {
    const [key, timer] = timers.entries().next().value;
    timers.delete(key);
    timer.callback();
    return timer.delay;
  } };
}

const loop = setup();
assert.equal(loop.current.textContent, names[0]);
assert.equal(loop.timers.values().next().value.delay, 2500);
const completed = [names[0]];
const speeds = new Set();
for (let step = 0; step < 1000 && completed.length < names.length + 1; step++) {
  const before = loop.current.textContent;
  const delay = loop.next();
  speeds.add(delay);
  const after = loop.current.textContent;
  assert.equal(Math.abs(after.length - before.length), 1, 'One character changes at each step');
  if (after.length > before.length && names.includes(after)) completed.push(after);
}
assert.deepEqual(completed, [...names, names[0]], 'The complete service loop must return to the first name');
for (const delay of [75, 45, 2500, 350]) assert.ok(speeds.has(delay));
loop.document.hidden = true;
loop.handlers.visibility();
assert.equal(loop.timers.size, 0, 'Background tabs must stop scheduling');
loop.document.hidden = false;
loop.handlers.visibility();
assert.equal(loop.timers.size, 1);
loop.motion.matches = true;
loop.handlers.motion();
assert.equal(loop.timers.size, 0);
assert.ok(!loop.classes.has('is-typewriter'), 'Enabling reduced motion restores the static heading');
loop.motion.matches = false;
loop.handlers.motion();
assert.ok(loop.classes.has('is-typewriter'));
loop.current.fail = true;
loop.next();
assert.equal(loop.timers.size, 0);
assert.ok(!loop.classes.has('is-typewriter'), 'An animation error restores the static heading');
const reduced = setup(true);
assert.equal(reduced.timers.size, 0);
assert.ok(!reduced.classes.has('is-typewriter'), 'Initial reduced motion must never start the animation');
vm.runInNewContext(script, { document: { querySelector: () => null } });
console.log('Verified HTML services, static accessible H1, complete loop, 75/45ms speeds, pauses, reduced-motion changes, background pause, and failure recovery.');
