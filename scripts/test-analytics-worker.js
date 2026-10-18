const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto, randomUUID, timingSafeEqual } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const workerSource = fs.readFileSync(path.join(__dirname, "..", "justy-media-analytics-worker.js"), "utf8");
const trackerSource = fs.readFileSync(path.join(__dirname, "..", "site-analytics.js"), "utf8");

function createDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  // Use the existing production schema: the new features must not require altering it.
  sqlite.exec(`CREATE TABLE pageviews (
    ts TEXT, path TEXT, country TEXT, event_type TEXT, normalized_path TEXT,
    referrer TEXT, referrer_host TEXT, user_agent TEXT, is_bot INTEGER, tool_id TEXT, title TEXT
  )`);
  return {
    sqlite,
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async run() { sqlite.prepare(sql).run(...values); return { success: true }; },
        async first() { return sqlite.prepare(sql).get(...values) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) }; }
      };
    }
  };
}

function loadWorker() {
  const context = vm.createContext({
    Request, Response, URL, TextEncoder, Uint8Array, atob, console,
    crypto: {
      subtle: {
        digest: (...args) => webcrypto.subtle.digest(...args),
        timingSafeEqual: (a, b) => timingSafeEqual(new Uint8Array(a), new Uint8Array(b))
      }
    }
  });
  vm.runInContext(workerSource.replace("export default {", "globalThis.worker = {"), context);
  return context;
}

const desktop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0";
const phone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148";
const tablet = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";
const swift = "/photography/rush-magazine/suzuki-swift-sport/";

function trackerPage(storage, pathname = "/", now = Date.now()) {
  const payloads = [];
  let clickHandler;
  const clock = { now };
  const window = {
    location: { pathname, href: "https://justymedia.co.uk" + pathname, origin: "https://justymedia.co.uk" },
    sessionStorage: storage, crypto: { randomUUID }
  };
  const context = vm.createContext({
    window,
    document: { title: "Test | Justy Media", referrer: "", addEventListener(type, fn) { clickHandler = fn; } },
    fetch: async (_url, options) => { payloads.push(JSON.parse(options.body)); },
    Date: class extends Date { static now() { return clock.now; } },
    Element: class {}, URL
  });
  vm.runInContext(trackerSource, context);
  return { payloads, context, clock, click: () => clickHandler };
}

async function run() {
  const { worker, interactionWithPage } = loadWorker();
  const DB = createDatabase();
  const env = { DB, ADMIN_USER: "test", ADMIN_PASS: "test", INTERNAL_IPS: "203.0.113.10" };
  async function collect(route, sessionId, agent = desktop, extra = {}) {
    const response = await worker.fetch(new Request("https://analytics.justymedia.co.uk/collect", {
      method: "POST",
      headers: { Origin: "https://justymedia.co.uk", "Content-Type": "application/json", "User-Agent": agent },
      body: JSON.stringify({ path: route, eventType: "pageview", sessionId, ...extra })
    }), env);
    assert.equal(response.status, 200, await response.text());
  }
  async function stats(traffic = "human") {
    const response = await worker.fetch(new Request("https://analytics.justymedia.co.uk/api/stats?traffic=" + traffic, {
      headers: { Authorization: "Basic " + btoa("test:test") }
    }), env);
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    return data;
  }

  assert.equal((await worker.fetch(new Request("https://analytics.justymedia.co.uk/api/stats"), env)).status, 401);
  let data = await stats();
  assert.equal(data.funnel.homeSessions, 0);
  assert.equal(data.funnel.conversionRate, 0);
  assert.equal(data.funnel.startedAt, null);
  assert.deepEqual(data.devices, []);

  // Legacy pageviews contribute to devices, but cannot fabricate historical journeys.
  await collect("/", undefined, desktop);
  await collect("/contact-us/", undefined, phone);
  data = await stats();
  assert.equal(data.funnel.homeSessions, 0);
  assert.deepEqual(data.devices, [{ device: "Desktop", views: 1 }, { device: "Mobile", views: 1 }]);

  const indirect = randomUUID();
  await collect("/index.html", indirect);
  await collect(swift, indirect);
  await collect("/contact-us/", indirect);
  await collect("/contact-us/index.html", indirect);
  await collect("/", indirect); // Reloading either stage must not add another conversion.

  const direct = randomUUID();
  await collect("/", direct, phone);
  await collect("/contact-us/", direct, phone);
  const reversed = randomUUID();
  await collect("/contact-us/", reversed, tablet);
  await collect("/", reversed, tablet); // Contact before Home is not a conversion.
  const unfinished = randomUUID();
  await collect("/", unfinished, "");
  await collect("/contact-us/", randomUUID()); // Another session cannot complete the first.
  const bot = randomUUID();
  await collect("/", bot, "ExampleBot/1.0");
  await collect("/contact-us/", bot, "ExampleBot/1.0");
  await collect("/", "invalid-session");
  await collect("/contact-us/", "invalid-session");

  data = await stats();
  assert.equal(data.funnel.homeSessions, 4);
  assert.equal(data.funnel.contactSessions, 2);
  assert.equal(data.funnel.conversionRate, 50);
  assert.ok(data.funnel.startedAt);
  assert.equal((await stats("all")).funnel.homeSessions, 5);
  assert.equal((await stats("bot")).funnel.contactSessions, 1);
  assert.equal(data.devices.reduce((sum, item) => sum + item.views, 0), data.totals.allTimeViews);
  assert.ok(data.devices.find(item => item.device === "Tablet" && item.views === 2));
  assert.ok(data.devices.find(item => item.device === "Unknown" && item.views === 1));
  assert.equal(data.recentVisits[0].device, "Desktop");

  // A closed, old cohort is outside the last 30 UTC dates.
  DB.sqlite.prepare("UPDATE analytics_journey_events SET ts = datetime('now', '-40 days') WHERE session_id = ?").run(direct);
  assert.equal((await stats()).funnel.homeSessions, 3);
  assert.equal((await stats()).funnel.contactSessions, 1);

  const download = { eventType: "download_click", toolId: "same-photo.jpg", title: "Suzuki Swift Sport Photography | Justy Media" };
  await collect(swift, indirect, desktop, download);
  await collect(swift, indirect, desktop, download);
  await collect("/phone-wallpapers/", indirect, phone, { ...download, title: "Free Automotive Phone Wallpapers | Justy Media" });
  data = await stats();
  assert.equal(data.topInteractions.length, 2);
  assert.equal(data.topInteractions[0].pageName, "Suzuki Swift Sport");
  assert.equal(data.topInteractions[0].interaction, "same-photo.jpg");
  assert.equal(data.topInteractions[0].total, 2);
  assert.equal(data.interactionEvents[1].pageName, "Phone wallpapers");
  assert.equal(interactionWithPage({ pagePath: swift, title: "" }).pageName, "Suzuki Swift Sport");
  assert.equal((await stats()).funnel.homeSessions, 3); // Click events cannot add funnel stages.

  const internal = await worker.fetch(new Request("https://analytics.justymedia.co.uk/collect", {
    method: "POST", headers: { "CF-Connecting-IP": "203.0.113.10" },
    body: JSON.stringify({ path: "/", sessionId: randomUUID() })
  }), env);
  assert.equal((await internal.json()).ignored, "internal");
  assert.equal((await stats()).funnel.homeSessions, 3);

  // Verify generated dashboard JavaScript, rendering, empty states, and escaping.
  const response = await worker.fetch(new Request("https://analytics.justymedia.co.uk/dashboard", {
    headers: { Authorization: "Basic " + btoa("test:test") }
  }), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  new vm.Script(script);
  const elements = new Map();
  const ui = vm.createContext({
    document: {
      getElementById(id) { if (!elements.has(id)) elements.set(id, { innerHTML: "", textContent: "", appendChild() {} }); return elements.get(id); },
      querySelectorAll() { return []; }, createElement() { return {}; }
    },
    fetch: async () => ({ ok: true, json: async () => data }), console
  });
  vm.runInContext(script, ui);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(elements.get("devicesWrap").innerHTML, /Tablet/);
  assert.match(elements.get("funnelWrap").innerHTML, /33\.3%/);
  assert.match(elements.get("topToolsWrap").innerHTML, /Suzuki Swift Sport/);
  assert.ok(elements.get("toolEventsWrap").innerHTML.indexOf("Suzuki Swift Sport") < elements.get("toolEventsWrap").innerHTML.indexOf("same-photo.jpg"));
  const escaped = ui.renderInteraction({ pageName: '<img src=x onerror=alert(1)>', pagePath: '/" onclick="bad', event: 'download_click', interaction: '<script>' }, true);
  assert.ok(!escaped.includes("<img"));
  assert.ok(!escaped.includes("<script>"));
  assert.match(ui.renderFunnel({ homeSessions: 0 }), /No tracked Home sessions/);
  assert.match(ui.renderFunnel({ homeSessions: 1, contactSessions: 0, conversionRate: 0 }), /width:0%/);

  const storageMap = new Map();
  const storage = { getItem: key => storageMap.get(key) || null, setItem: (key, value) => storageMap.set(key, value) };
  const homePage = trackerPage(storage);
  const id = homePage.payloads[0].sessionId;
  assert.match(id, /^[a-f0-9-]{36}$/);
  vm.runInContext(trackerSource, homePage.context);
  assert.equal(homePage.payloads.length, 1);
  const contactPage = trackerPage(storage, "/contact-us/", homePage.clock.now + 1000);
  assert.equal(contactPage.payloads[0].sessionId, id);
  const later = trackerPage(storage, "/contact-us/", contactPage.clock.now + 30 * 60 * 1000);
  assert.notEqual(later.payloads[0].sessionId, id);
  storageMap.set("justy-analytics-session", "broken JSON");
  assert.equal(trackerPage(storage).payloads.length, 1);
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(trackerPage(blocked).payloads.length, 1);
  assert.notEqual(trackerPage(storage).payloads[0].sessionId, trackerPage({ getItem() {}, setItem() {} }).payloads[0].sessionId);

  console.log("Analytics passed: real SQLite queries, legacy data, ordered session funnel, deduplication, 30-day cohort, traffic filters, device totals, page attribution, dashboard rendering/escaping and tracker session expiry.");
  return { worker, env, DB };
}

module.exports = { createDatabase, loadWorker, run };
if (require.main === module) run().catch(error => { console.error(error); process.exit(1); });
