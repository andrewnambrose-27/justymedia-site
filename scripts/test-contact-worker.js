const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const workerPath = path.join(__dirname, "..", "justy-media-analytics-worker.js");
const source = fs.readFileSync(workerPath, "utf8")
  .replace("export default {", "globalThis.contactWorker = {");
const context = vm.createContext({
  Request,
  Response,
  URL,
  TextEncoder,
  Uint8Array,
  crypto: webcrypto,
  atob,
  console: { error(message) { logs.push(JSON.parse(message)); } }
});
const logs = [];
vm.runInContext(source, context, { filename: workerPath });

function createDatabase() {
  const state = { submissions: [], emailUpdates: 0 };
  return {
    state,
    prepare(sql) {
      let values = [];
      return {
        bind(...nextValues) {
          values = nextValues;
          return this;
        },
        async run() {
          if (/INSERT INTO contact_submissions/.test(sql)) state.submissions.push(values);
          if (/UPDATE contact_submissions SET email_sent/.test(sql)) state.emailUpdates += 1;
          return { success: true };
        },
        async first() {
          if (/SELECT COUNT\(\*\) AS total/.test(sql)) return { total: 0 };
          return null;
        },
        async all() {
          return { results: [] };
        }
      };
    }
  };
}

function contactRequest(overrides = {}, origin = "https://justymedia.co.uk") {
  const payload = {
    name: "Test Client",
    email: "client@example.com",
    business: "Example Studio",
    "project-type": "Website project",
    budget: "Not set or prefer not to say",
    message: "I would like to discuss a new website project.",
    "company-website": "",
    "started-at": String(Date.now() - 5000),
    ...overrides
  };
  const body = JSON.stringify(payload);
  return new Request("https://analytics.justymedia.co.uk/contact", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(body)),
      "CF-Connecting-IP": "203.0.113.10"
    },
    body
  });
}

(async () => {
  const database = createDatabase();
  const sent = [];
  const env = {
    DB: database,
    CONTACT_RECIPIENT: "private@example.com",
    CONTACT_SENDER: "website@justymedia.co.uk",
    EMAIL: { async send(message) { sent.push(message); } }
  };

  const success = await context.contactWorker.fetch(contactRequest(), env);
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { ok: true, emailSent: true });
  assert.equal(database.state.submissions.length, 1);
  assert.equal(database.state.emailUpdates, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo.email, "client@example.com");

  // Saving an enquiry must survive missing configuration and provider failures.
  for (const overrides of [
    { EMAIL: undefined },
    { CONTACT_RECIPIENT: undefined },
    { CONTACT_SENDER: undefined },
    { EMAIL: { async send() { throw new Error("Email service unavailable"); } } }
  ]) {
    const fallbackDatabase = createDatabase();
    const fallback = await context.contactWorker.fetch(contactRequest(), {
      ...env, ...overrides, DB: fallbackDatabase
    });
    assert.equal(fallback.status, 200);
    assert.deepEqual(await fallback.json(), { ok: true, emailSent: false });
    assert.equal(fallbackDatabase.state.submissions.length, 1);
    assert.equal(fallbackDatabase.state.emailUpdates, 0);
    assert.equal(logs.at(-1).message, "contact notification failed");
  }

  const beforeStorageFailure = sent.length;
  const unavailable = await context.contactWorker.fetch(contactRequest(), {
    ...env, DB: { prepare() { throw new Error("Database unavailable"); } }
  });
  assert.equal(unavailable.status, 500);
  assert.equal((await unavailable.json()).ok, false);
  assert.equal(sent.length, beforeStorageFailure);

  const updateDatabase = createDatabase();
  const originalPrepare = updateDatabase.prepare;
  updateDatabase.prepare = (sql) => /UPDATE contact_submissions SET email_sent/.test(sql)
    ? { bind() { return this; }, async run() { throw new Error("Status update unavailable"); } }
    : originalPrepare(sql);
  const updateFailure = await context.contactWorker.fetch(contactRequest(), { ...env, DB: updateDatabase });
  assert.equal(updateFailure.status, 200);
  assert.deepEqual(await updateFailure.json(), { ok: true, emailSent: true });
  assert.equal(logs.at(-1).message, "contact email status update failed");

  const beforeSpam = database.state.submissions.length;
  const spam = await context.contactWorker.fetch(contactRequest({ "company-website": "https://spam.example" }), env);
  assert.equal(spam.status, 200);
  assert.equal(database.state.submissions.length, beforeSpam);

  const forbidden = await context.contactWorker.fetch(contactRequest({}, "https://example.com"), env);
  assert.equal(forbidden.status, 403);

  console.log("Contact Worker notification, missing configuration, provider/storage failures, honeypot and origin checks passed.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
