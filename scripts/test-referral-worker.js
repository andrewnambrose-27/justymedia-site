const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const source = fs.readFileSync(path.join(__dirname, "..", "justy-media-analytics-worker.js"), "utf8")
  .replace("export default {", "globalThis.worker = {");
const logs = [];
const context = vm.createContext({
  Request, Response, URL, TextEncoder, Uint8Array, crypto: webcrypto, atob,
  console: { error(message) { logs.push(JSON.parse(message)); } }
});
vm.runInContext(source, context);

function database(fail = false) {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      assert.match(sql, /INSERT INTO pageviews/);
      let values;
      return {
        bind(...args) { values = args; return this; },
        async run() {
          if (fail) throw new Error("Database unavailable");
          rows.push(values);
          return { success: true };
        }
      };
    }
  };
}

function linkRequest(method = "GET", headers = {}) {
  return new Request("https://analytics.justymedia.co.uk/go/vulcan-sports?url=https://example.com", {
    method,
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://vulcansports.co.uk/", ...headers }
  });
}

function collectionRequest(href, referrer = "", eventType = "pageview") {
  return new Request("https://analytics.justymedia.co.uk/collect", {
    method: "POST",
    headers: { Origin: "https://justymedia.co.uk", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ path: "/", href, referrer, eventType, toolId: "", title: "Justy Media" })
  });
}

(async () => {
  const DB = database();
  const response = await context.worker.fetch(linkRequest(), { DB });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const destination = new URL(response.headers.get("Location"));
  assert.equal(destination.origin, "https://justymedia.co.uk");
  assert.equal(destination.searchParams.get("utm_source"), "vulcan-sports");
  assert.equal(DB.rows.length, 1);
  assert.equal(DB.rows[0][3], "referral_click");
  assert.equal(DB.rows[0][6], "vulcansports.co.uk");
  assert.equal(DB.rows[0][9], "vulcan-sports-footer");

  // Health checks and speculative fetches must not inflate the click count.
  for (const request of [linkRequest("HEAD"), linkRequest("GET", { "Sec-Purpose": "prefetch" }), linkRequest("GET", { Purpose: "prerender" })]) {
    assert.equal((await context.worker.fetch(request, { DB })).status, 302);
  }
  assert.equal(DB.rows.length, 1);
  assert.equal((await context.worker.fetch(linkRequest("POST"), { DB })).status, 405);
  assert.equal(DB.rows.length, 1);

  const internal = await context.worker.fetch(linkRequest("GET", { "CF-Connecting-IP": "203.0.113.10" }), {
    DB, INTERNAL_IPS: "203.0.113.10"
  });
  assert.equal(internal.status, 302);
  assert.equal(DB.rows.length, 1);

  await context.worker.fetch(linkRequest("GET", { "User-Agent": "ExampleBot/1.0" }), { DB });
  assert.equal(DB.rows.at(-1)[8], 1);

  // Losing analytics must never stop a prospective customer reaching the site.
  assert.equal((await context.worker.fetch(linkRequest(), { DB: database(true) })).status, 302);
  assert.equal(logs.at(-1).message, "referral tracking failed");

  const arrivals = database();
  const arrival = await context.worker.fetch(collectionRequest(destination.href), { DB: arrivals });
  assert.equal(arrival.status, 200);
  assert.equal(arrivals.rows.length, 1);
  assert.equal(arrivals.rows[0][3], "pageview");
  assert.equal(arrivals.rows[0][6], "vulcansports.co.uk");
  assert.equal(arrivals.rows[0][9], "vulcan-sports-footer");

  // Existing untagged links are still recognised through ordinary referrers.
  await context.worker.fetch(collectionRequest("https://justymedia.co.uk/", "https://www.vulcansports.co.uk/shop/"), { DB: arrivals });
  assert.equal(arrivals.rows.at(-1)[6], "vulcansports.co.uk");
  assert.equal(arrivals.rows.at(-1)[9], "");

  for (const href of [destination.href.replace("justymedia.co.uk", "example.com"), "https://justymedia.co.uk/?utm_source=vulcan-sports", "invalid"]) {
    await context.worker.fetch(collectionRequest(href), { DB: arrivals });
    assert.equal(arrivals.rows.at(-1)[6], "direct");
    assert.equal(arrivals.rows.at(-1)[9], "");
  }
  await context.worker.fetch(collectionRequest(destination.href, "https://justymedia.co.uk/", "social_click"), { DB: arrivals });
  assert.equal(arrivals.rows.at(-1)[3], "social_click");
  assert.equal(arrivals.rows.at(-1)[9], "");

  console.log("Referral redirects, fixed destination, bot/internal/prefetch filtering, storage failures and arrival attribution passed.");
})().catch(error => { console.error(error); process.exit(1); });
