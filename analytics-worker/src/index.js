function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

function unauthorizedResponse() {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Justy Media Analytics"',
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

async function isAuthorized(request, env) {
  if (!env.ADMIN_USER || !env.ADMIN_PASS) {
    return false;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return await secretsMatch(username, env.ADMIN_USER)
      && await secretsMatch(password, env.ADMIN_PASS);
  } catch {
    return false;
  }
}

async function secretsMatch(provided = "", expected = "") {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);

  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function getInternalIps(env) {
  return new Set(
    String(env.INTERNAL_IPS || "")
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
  );
}

const BOT_PATTERNS = [
  "bot",
  "crawl",
  "spider",
  "slurp",
  "bingpreview",
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "discordbot",
  "linkedinbot",
  "pinterest",
  "preview",
  "monitor",
  "uptime",
  "lighthouse",
  "pagespeed",
  "headless"
];

const ALLOWED_ORIGINS = new Set([
  "https://justymedia.co.uk",
  "https://www.justymedia.co.uk"
]);

function isAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function normalizePath(value = "/") {
  try {
    const parsed = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "https://justymedia.co.uk");
    let path = parsed.pathname || "/";

    path = decodeURIComponent(path).trim().toLowerCase();
    path = path.replace(/\/index\.html$/, "/");
    path = path.replace(/\/{2,}/g, "/");

    if (path !== "/" && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    return path || "/";
  } catch {
    return "/";
  }
}

function getReferrerHost(referrer = "") {
  if (!referrer) {
    return "direct";
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host || "direct";
  } catch {
    return "unknown";
  }
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "";
}

function isBotUserAgent(userAgent = "") {
  const lower = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => lower.includes(pattern));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      const origin = request.headers.get("Origin");
      if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        return textResponse("Forbidden", 403);
      }

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    // Track page view
    if (url.pathname === "/collect" && request.method === "POST") {
      try {
        if (!isAllowedOrigin(request)) {
          return textResponse("Forbidden", 403);
        }

        const contentLength = Number(request.headers.get("Content-Length") || 0);
        if (contentLength > 8192) {
          return jsonResponse({ ok: false, error: "Payload too large" }, 413);
        }

        const data = await request.json();
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
        }
        const clientIp = getClientIp(request);

        if (getInternalIps(env).has(clientIp)) {
          return jsonResponse({ ok: true, ignored: "internal" });
        }

        const rawPath = String(data.path || "/").slice(0, 500);
        const normalizedPath = normalizePath(rawPath);
        const referrer = String(data.referrer || "").slice(0, 500);
        const userAgent = request.headers.get("User-Agent") || "";
        const eventType = String(data.eventType || "pageview").slice(0, 40);
        const toolId = String(data.toolId || "").slice(0, 120);
        const title = String(data.title || "").slice(0, 180);

        await env.DB.prepare(`
          INSERT INTO pageviews (
            ts,
            path,
            country,
            event_type,
            normalized_path,
            referrer,
            referrer_host,
            user_agent,
            is_bot,
            tool_id,
            title
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          new Date().toISOString(),
          rawPath,
          request.cf?.country || "unknown",
          eventType,
          normalizedPath,
          referrer,
          getReferrerHost(referrer),
          userAgent.slice(0, 500),
          isBotUserAgent(userAgent) ? 1 : 0,
          toolId,
          title
        ).run();

        return jsonResponse({ ok: true });
      } catch (error) {
        console.error(JSON.stringify({
          message: "analytics collection failed",
          error: error instanceof Error ? error.message : String(error)
        }));
        return jsonResponse({
          ok: false,
          error: "Failed to record pageview"
        }, 500);
      }
    }

    // Protect analytics endpoints
    if (url.pathname.startsWith("/api/") || url.pathname === "/dashboard") {
      if (!await isAuthorized(request, env)) {
        return unauthorizedResponse();
      }
    }

    // Main stats endpoint
    if (url.pathname === "/api/stats" && request.method === "GET") {
      try {
        const trafficFilter = url.searchParams.get("traffic") || "human";
        const botClause = trafficFilter === "all"
          ? "1 = 1"
          : trafficFilter === "bot"
            ? "COALESCE(is_bot, 0) = 1"
            : "COALESCE(is_bot, 0) = 0";
        const pageviewClause = `COALESCE(event_type, 'pageview') = 'pageview' AND ${botClause}`;
        const today = new Date().toISOString().slice(0, 10);

        const totalViews = await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM pageviews
          WHERE ${pageviewClause}
        `).first();

        const thisMonthViews = await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM pageviews
          WHERE ${pageviewClause}
            AND substr(ts, 1, 7) = substr(?, 1, 7)
        `).bind(new Date().toISOString()).first();

        const todayViews = await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM pageviews
          WHERE ${pageviewClause}
            AND substr(ts, 1, 10) = ?
        `).bind(today).first();

        const sevenDayViews = await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM pageviews
          WHERE ${pageviewClause}
            AND date(substr(ts, 1, 10)) >= date(?, '-6 days')
        `).bind(today).first();

        const thirtyDayViews = await env.DB.prepare(`
          SELECT COUNT(*) AS total
          FROM pageviews
          WHERE ${pageviewClause}
            AND date(substr(ts, 1, 10)) >= date(?, '-29 days')
        `).bind(today).first();

        const monthlyViews = await env.DB.prepare(`
          SELECT
            substr(ts, 1, 7) AS month,
            COUNT(*) AS views
          FROM pageviews
          WHERE ${pageviewClause}
          GROUP BY month
          ORDER BY month DESC
        `).all();

        const dailyViews = await env.DB.prepare(`
          SELECT
            substr(ts, 1, 10) AS day,
            COUNT(*) AS views
          FROM pageviews
          WHERE ${pageviewClause}
            AND date(substr(ts, 1, 10)) >= date(?, '-29 days')
          GROUP BY day
          ORDER BY day ASC
        `).bind(today).all();

        const topPages = await env.DB.prepare(`
          SELECT
            COALESCE(normalized_path, path, '/') AS path,
            COUNT(*) AS views
          FROM pageviews
          WHERE ${pageviewClause}
          GROUP BY path
          ORDER BY views DESC, path ASC
          LIMIT 10
        `).all();

        const topInteractions = await env.DB.prepare(`
          SELECT
            COALESCE(NULLIF(tool_id, ''), event_type) AS interaction,
            COUNT(*) AS total
          FROM pageviews
          WHERE COALESCE(event_type, 'pageview') <> 'pageview'
            AND ${botClause}
          GROUP BY interaction
          ORDER BY total DESC, interaction ASC
          LIMIT 10
        `).all();

        const topCountries = await env.DB.prepare(`
          SELECT
            country,
            COUNT(*) AS views
          FROM pageviews
          WHERE ${pageviewClause}
          GROUP BY country
          ORDER BY views DESC, country ASC
          LIMIT 10
        `).all();

        const topReferrers = await env.DB.prepare(`
          SELECT
            COALESCE(referrer_host, 'direct') AS referrer,
            COUNT(*) AS views
          FROM pageviews
          WHERE ${pageviewClause}
          GROUP BY referrer
          ORDER BY views DESC, referrer ASC
          LIMIT 10
        `).all();

        const recentVisits = await env.DB.prepare(`
          SELECT
            ts,
            COALESCE(normalized_path, path, '/') AS path,
            country,
            COALESCE(referrer_host, 'direct') AS referrer,
            COALESCE(is_bot, 0) AS isBot,
            COALESCE(NULLIF(tool_id, ''), '') AS tool
          FROM pageviews
          WHERE ${pageviewClause}
          ORDER BY ts DESC
          LIMIT 20
        `).all();

        const trafficMix = await env.DB.prepare(`
          SELECT
            CASE WHEN COALESCE(is_bot, 0) = 1 THEN 'bot' ELSE 'human' END AS type,
            COUNT(*) AS views
          FROM pageviews
          WHERE COALESCE(event_type, 'pageview') = 'pageview'
          GROUP BY type
        `).all();

        const interactionEvents = await env.DB.prepare(`
          SELECT
            COALESCE(event_type, 'pageview') AS event,
            COALESCE(NULLIF(tool_id, ''), COALESCE(normalized_path, path, '/')) AS interaction,
            COUNT(*) AS total
          FROM pageviews
          WHERE COALESCE(event_type, 'pageview') <> 'pageview'
            AND ${botClause}
          GROUP BY event, interaction
          ORDER BY total DESC, interaction ASC
          LIMIT 20
        `).all();

        return jsonResponse({
          ok: true,
          trafficFilter,
          totals: {
            allTimeViews: totalViews?.total || 0,
            thisMonthViews: thisMonthViews?.total || 0,
            todayViews: todayViews?.total || 0,
            sevenDayViews: sevenDayViews?.total || 0,
            thirtyDayViews: thirtyDayViews?.total || 0,
            activeGoals: [
              {
                label: "30-day visits",
                current: thirtyDayViews?.total || 0,
                target: 1000
              },
              {
                label: "7-day visits",
                current: sevenDayViews?.total || 0,
                target: 250
              }
            ]
          },
          exclusions: {
            internalIps: getInternalIps(env).size,
            internalTrafficSaved: false
          },
          monthly: monthlyViews.results || [],
          daily: dailyViews.results || [],
          topPages: topPages.results || [],
          topInteractions: topInteractions.results || [],
          topCountries: topCountries.results || []
          ,
          topReferrers: topReferrers.results || [],
          recentVisits: recentVisits.results || [],
          trafficMix: trafficMix.results || [],
          interactionEvents: interactionEvents.results || []
        });
      } catch (error) {
        console.error(JSON.stringify({
          message: "analytics stats failed",
          error: error instanceof Error ? error.message : String(error)
        }));
        return jsonResponse({
          ok: false,
          error: "Failed to load stats"
        }, 500);
      }
    }

    if (url.pathname === "/dashboard" && request.method === "GET") {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Justy Media Analytics Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --bg: #0b0b0d;
      --panel: rgba(255,255,255,0.06);
      --panel-border: rgba(255,255,255,0.10);
      --text: #f3f3f5;
      --muted: #a7a7b0;
      --accent: #f5a000;
      --accent-soft: rgba(245,160,0,0.16);
      --shadow: 0 20px 60px rgba(0,0,0,0.45);
      --radius: 26px;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      font-family: Arial, Helvetica, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at 20% 20%, rgba(245,160,0,0.12), transparent 30%),
        radial-gradient(circle at 80% 70%, rgba(245,160,0,0.08), transparent 28%),
        linear-gradient(180deg, #0a0a0c 0%, #0d0d10 100%);
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(
          90deg,
          rgba(255,255,255,0.015) 0px,
          rgba(255,255,255,0.015) 1px,
          transparent 1px,
          transparent 90px
        );
      opacity: 0.2;
    }

    .wrap {
      width: min(1180px, calc(100% - 32px));
      margin: 36px auto;
      position: relative;
      z-index: 1;
    }

    .hero {
      background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.045));
      border: 1px solid var(--panel-border);
      border-radius: 34px;
      box-shadow: var(--shadow);
      padding: 28px 28px 22px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      margin-bottom: 22px;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 999px;
      padding: 8px 12px;
      margin-bottom: 16px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: clamp(34px, 5vw, 56px);
      line-height: 1;
      letter-spacing: -0.03em;
      font-weight: 700;
    }

    .accent {
      color: var(--accent);
    }

    .sub {
      margin: 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.6;
      max-width: 780px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 18px;
    }

    .card {
      background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.04));
      border: 1px solid var(--panel-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 22px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      overflow: hidden;
    }

    .stat-card {
      grid-column: span 3;
      min-height: 145px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .stat-label {
      color: var(--muted);
      font-size: 14px;
      letter-spacing: 0.02em;
    }

    .stat-value {
      font-size: clamp(32px, 4vw, 52px);
      font-weight: 700;
      line-height: 1;
      margin: 8px 0;
    }

    .stat-foot {
      color: var(--muted);
      font-size: 13px;
    }

    .chart-card {
      grid-column: span 8;
    }

    .table-card {
      grid-column: span 4;
    }

    .full {
      grid-column: span 12;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .card-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: #ffd082;
      border: 1px solid rgba(245,160,0,0.18);
      font-size: 12px;
      white-space: nowrap;
    }

    .chart-wrap {
      height: 320px;
      position: relative;
    }

    .chart-wrap-scroll {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 12px;
      scrollbar-color: rgba(245,160,0,0.75) rgba(255,255,255,0.08);
      scrollbar-width: thin;
    }

    .chart-wrap-scroll::-webkit-scrollbar {
      height: 10px;
    }

    .chart-wrap-scroll::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
    }

    .chart-wrap-scroll::-webkit-scrollbar-thumb {
      background: rgba(245,160,0,0.75);
      border-radius: 999px;
    }

    .bar-chart {
      display: flex;
      align-items: end;
      gap: 12px;
      height: 100%;
      padding: 14px 0 6px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .bar-col {
      flex: 1 1 0;
      min-width: 44px;
      display: flex;
      flex-direction: column;
      justify-content: end;
      align-items: center;
      height: 100%;
      gap: 10px;
    }

    .bar {
      width: 100%;
      max-width: 68px;
      border-radius: 18px 18px 8px 8px;
      background: linear-gradient(180deg, #ffb11c 0%, #db8700 100%);
      box-shadow: 0 10px 30px rgba(245,160,0,0.28);
      min-height: 12px;
      position: relative;
      transition: transform 0.18s ease;
    }

    .bar:hover {
      transform: translateY(-2px);
    }

    .bar-value {
      font-size: 13px;
      color: #fff2d0;
      margin-bottom: 6px;
      text-align: center;
      min-height: 16px;
    }

    .bar-label {
      font-size: 12px;
      color: var(--muted);
      text-align: center;
      line-height: 1.3;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 14px;
    }

    th {
      color: var(--muted);
      font-weight: 600;
      font-size: 13px;
    }

    td:last-child, th:last-child {
      text-align: right;
    }

    .muted {
      color: var(--muted);
    }

    .empty {
      color: var(--muted);
      padding: 10px 0 2px;
    }

    .footer-note {
      margin-top: 18px;
      color: var(--muted);
      font-size: 13px;
    }

    .top-links {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .dashboard-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.08);
      flex-wrap: wrap;
    }

    .segmented {
      display: inline-flex;
      gap: 6px;
      padding: 5px;
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 999px;
      background: rgba(255,255,255,0.04);
    }

    .segment {
      border: 0;
      border-radius: 999px;
      min-height: 36px;
      padding: 0 13px;
      color: var(--muted);
      background: transparent;
      font-weight: 700;
      cursor: pointer;
    }

    .segment.active {
      color: #111;
      background: var(--accent);
    }

    .goal-list,
    .visit-feed {
      display: grid;
      gap: 12px;
    }

    .goal-row {
      display: grid;
      gap: 8px;
    }

    .goal-meta,
    .visit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 13px;
    }

    .progress-track {
      height: 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #ffb61f, #ffd082);
    }

    .visit-row {
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .chart-wrap-scroll .bar-chart {
      width: max-content;
      min-width: 100%;
    }

    .chart-wrap-scroll .bar-col {
      flex: 0 0 54px;
    }

    .visit-path {
      color: var(--text);
      font-weight: 700;
      word-break: break-word;
    }

    .visit-meta {
      color: var(--muted);
      margin-top: 4px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 46px;
      padding: 0 18px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      transition: 0.18s ease;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .btn-primary {
      background: linear-gradient(180deg, #ffb61f, #f0a100);
      color: #111;
      box-shadow: 0 10px 30px rgba(245,160,0,0.22);
    }

    .btn-secondary {
      color: #fff;
      background: rgba(255,255,255,0.04);
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    @media (max-width: 980px) {
      .stat-card {
        grid-column: span 6;
      }
      .chart-card, .table-card {
        grid-column: span 12;
      }
    }

    @media (max-width: 640px) {
      .wrap {
        width: min(100% - 18px, 100%);
        margin: 18px auto;
      }
      .hero, .card {
        padding: 18px;
        border-radius: 24px;
      }
      .stat-card {
        grid-column: span 12;
      }
      .bar-chart {
        gap: 8px;
      }
      .bar-col {
        min-width: 36px;
      }
      .bar-label {
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <div class="eyebrow">Private dashboard · Justy Media analytics</div>
      <h1><span class="accent">Justy Media</span> Analytics</h1>
      <p class="sub">
        A simple view of how the site is performing, with monthly page views, top pages, and country data.
      </p>
      <div class="top-links">
        <a class="btn btn-primary" href="/api/stats" target="_blank" rel="noopener noreferrer">Open raw JSON</a>
        <a class="btn btn-secondary" href="https://justymedia.co.uk" target="_blank" rel="noopener noreferrer">Open main site</a>
      </div>
      <div class="dashboard-controls">
        <span class="muted">Internal IPs are excluded before data is stored.</span>
        <div class="segmented" aria-label="Traffic filter">
          <button class="segment active" type="button" data-traffic="human">Humans</button>
          <button class="segment" type="button" data-traffic="all">All</button>
          <button class="segment" type="button" data-traffic="bot">Bots</button>
        </div>
      </div>
    </section>

    <section class="grid">
      <div class="card stat-card">
        <div class="stat-label">All-time page views</div>
        <div class="stat-value" id="allTimeViews">—</div>
        <div class="stat-foot">Every tracked visit saved in D1</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Today</div>
        <div class="stat-value" id="todayViews">—</div>
        <div class="stat-foot">Current UTC date</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Last 7 days</div>
        <div class="stat-value" id="sevenDayViews">—</div>
        <div class="stat-foot">Rolling 7-day total</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Last 30 days</div>
        <div class="stat-value" id="thirtyDayViews">—</div>
        <div class="stat-foot">Rolling 30-day total</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">This month</div>
        <div class="stat-value" id="thisMonthViews">—</div>
        <div class="stat-foot">Current calendar month total</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Top page</div>
        <div class="stat-value" id="topPageValue">—</div>
        <div class="stat-foot" id="topPageLabel">Waiting for data</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Top interaction</div>
        <div class="stat-value" id="topToolValue">—</div>
        <div class="stat-foot" id="topToolLabel">Waiting for data</div>
      </div>

      <div class="card stat-card">
        <div class="stat-label">Top country</div>
        <div class="stat-value" id="topCountryValue">—</div>
        <div class="stat-foot" id="topCountryLabel">Waiting for data</div>
      </div>

      <div class="card chart-card">
        <div class="card-title-row">
          <h2 class="card-title">Daily page views</h2>
          <div class="pill">Live from /api/stats</div>
        </div>
        <div class="chart-wrap chart-wrap-scroll">
          <div class="bar-chart" id="dailyChart"></div>
        </div>
        <div class="footer-note">The last 30 days, after URL normalisation and traffic filtering.</div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Goals</h2>
        </div>
        <div id="goalsWrap"></div>
      </div>

      <div class="card chart-card">
        <div class="card-title-row">
          <h2 class="card-title">Monthly page views</h2>
        </div>
        <div class="chart-wrap">
          <div class="bar-chart" id="monthlyChart"></div>
        </div>
        <div class="footer-note">This chart uses the monthly totals stored in your Cloudflare D1 database.</div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Top pages</h2>
        </div>
        <div id="topPagesWrap"></div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Top countries</h2>
        </div>
        <div id="topCountriesWrap"></div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Top referrers</h2>
        </div>
        <div id="topReferrersWrap"></div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Top interactions</h2>
        </div>
        <div id="topToolsWrap"></div>
      </div>

      <div class="card table-card">
        <div class="card-title-row">
          <h2 class="card-title">Interaction events</h2>
        </div>
        <div id="toolEventsWrap"></div>
      </div>

      <div class="card chart-card">
        <div class="card-title-row">
          <h2 class="card-title">Monthly breakdown</h2>
        </div>
        <div id="monthlyTableWrap"></div>
      </div>

      <div class="card full">
        <div class="card-title-row">
          <h2 class="card-title">Recent visits</h2>
        </div>
        <div id="recentVisitsWrap"></div>
      </div>
    </section>
  </div>

  <script>
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatMonthLabel(monthStr) {
      const [year, month] = monthStr.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleString("en-GB", { month: "short", year: "numeric" });
    }

    function formatDayLabel(dayStr) {
      const date = new Date(dayStr + "T00:00:00Z");
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }

    function renderSimpleTable(items, columns, emptyMessage) {
      if (!items || !items.length) {
        return '<div class="empty">' + escapeHtml(emptyMessage) + '</div>';
      }

      const head = columns.map(col => '<th>' + escapeHtml(col.label) + '</th>').join("");
      const rows = items.map(item => {
        return "<tr>" + columns.map(col => {
          const value = col.render ? col.render(item) : item[col.key];
          return "<td>" + value + "</td>";
        }).join("") + "</tr>";
      }).join("");

      return '<table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
    }

    function renderChart(chartId, items, labelKey, valueKey, formatLabel, emptyMessage) {
      const chart = document.getElementById(chartId);
      chart.innerHTML = "";

      if (!items || !items.length) {
        chart.innerHTML = '<div class="empty">' + escapeHtml(emptyMessage) + '</div>';
        return;
      }

      const ordered = [...items];
      const maxViews = Math.max(...ordered.map(item => Number(item[valueKey]) || 0), 1);

      ordered.forEach(item => {
        const views = Number(item[valueKey]) || 0;
        const height = Math.max((views / maxViews) * 220, 12);
        const label = formatLabel(item[labelKey]);

        const col = document.createElement("div");
        col.className = "bar-col";

        col.innerHTML = \`
          <div class="bar-value">\${views}</div>
          <div class="bar" style="height:\${height}px" title="\${escapeHtml(label)}: \${views} views"></div>
          <div class="bar-label">\${escapeHtml(label)}</div>
        \`;

        chart.appendChild(col);
      });
    }

    function renderGoals(goals) {
      if (!goals || !goals.length) {
        return '<div class="empty">No goals configured.</div>';
      }

      const rows = goals.map(goal => {
        const current = Number(goal.current) || 0;
        const target = Math.max(Number(goal.target) || 1, 1);
        const percent = Math.min(Math.round((current / target) * 100), 100);

        return \`
          <div class="goal-row">
            <div class="goal-meta">
              <strong>\${escapeHtml(goal.label)}</strong>
              <span>\${current} / \${target} (\${percent}%)</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:\${percent}%"></div></div>
          </div>
        \`;
      }).join("");

      return '<div class="goal-list">' + rows + '</div>';
    }

    function renderRecentVisits(visits) {
      if (!visits || !visits.length) {
        return '<div class="empty">No recent visits yet.</div>';
      }

      return '<div class="visit-feed">' + visits.map(visit => {
        const date = new Date(visit.ts);
        const label = Number.isNaN(date.getTime()) ? visit.ts : date.toLocaleString("en-GB");

        return \`
          <div class="visit-row">
            <div>
              <div class="visit-path">\${escapeHtml(visit.path)}</div>
              <div class="visit-meta">\${escapeHtml(visit.referrer)} - \${escapeHtml(visit.country || "unknown")}\${visit.tool ? " - " + escapeHtml(visit.tool) : ""}</div>
            </div>
            <span>\${escapeHtml(label)}</span>
          </div>
        \`;
      }).join("") + '</div>';
    }

    let activeTraffic = "human";

    async function loadDashboard() {
      try {
        const res = await fetch("/api/stats?traffic=" + encodeURIComponent(activeTraffic), {
          headers: {
            "Accept": "application/json"
          }
        });

        if (!res.ok) {
          throw new Error("Failed to load stats");
        }

        const data = await res.json();

        document.getElementById("allTimeViews").textContent = data.totals?.allTimeViews ?? "0";
        document.getElementById("thisMonthViews").textContent = data.totals?.thisMonthViews ?? "0";
        document.getElementById("todayViews").textContent = data.totals?.todayViews ?? "0";
        document.getElementById("sevenDayViews").textContent = data.totals?.sevenDayViews ?? "0";
        document.getElementById("thirtyDayViews").textContent = data.totals?.thirtyDayViews ?? "0";

        const topPage = data.topPages && data.topPages.length ? data.topPages[0] : null;
        document.getElementById("topPageValue").textContent = topPage ? topPage.views : "—";
        document.getElementById("topPageLabel").textContent = topPage ? topPage.path : "No pages tracked yet";

        const topInteraction = data.topInteractions && data.topInteractions.length ? data.topInteractions[0] : null;
        document.getElementById("topToolValue").textContent = topInteraction ? topInteraction.total : "—";
        document.getElementById("topToolLabel").textContent = topInteraction ? topInteraction.interaction : "No interactions tracked yet";

        const topCountry = data.topCountries && data.topCountries.length ? data.topCountries[0] : null;
        document.getElementById("topCountryValue").textContent = topCountry ? topCountry.views : "—";
        document.getElementById("topCountryLabel").textContent = topCountry ? topCountry.country : "No countries tracked yet";

        renderChart("monthlyChart", [...(data.monthly || [])].reverse(), "month", "views", formatMonthLabel, "No monthly data yet.");
        renderChart("dailyChart", data.daily || [], "day", "views", formatDayLabel, "No daily data yet.");
        document.getElementById("goalsWrap").innerHTML = renderGoals(data.totals?.activeGoals || []);

        document.getElementById("topPagesWrap").innerHTML = renderSimpleTable(
          data.topPages || [],
          [
            { label: "Page", render: item => escapeHtml(item.path) },
            { label: "Views", render: item => escapeHtml(item.views) }
          ],
          "No page data yet."
        );

        document.getElementById("topCountriesWrap").innerHTML = renderSimpleTable(
          data.topCountries || [],
          [
            { label: "Country", render: item => escapeHtml(item.country) },
            { label: "Views", render: item => escapeHtml(item.views) }
          ],
          "No country data yet."
        );

        document.getElementById("topReferrersWrap").innerHTML = renderSimpleTable(
          data.topReferrers || [],
          [
            { label: "Referrer", render: item => escapeHtml(item.referrer) },
            { label: "Views", render: item => escapeHtml(item.views) }
          ],
          "No referrer data yet."
        );

        document.getElementById("topToolsWrap").innerHTML = renderSimpleTable(
          data.topInteractions || [],
          [
            { label: "Interaction", render: item => escapeHtml(item.interaction) },
            { label: "Total", render: item => escapeHtml(item.total) }
          ],
          "No interaction data yet."
        );

        document.getElementById("toolEventsWrap").innerHTML = renderSimpleTable(
          data.interactionEvents || [],
          [
            { label: "Event", render: item => escapeHtml(item.event + " - " + item.interaction) },
            { label: "Total", render: item => escapeHtml(item.total) }
          ],
          "No interaction events yet."
        );

        document.getElementById("monthlyTableWrap").innerHTML = renderSimpleTable(
          data.monthly || [],
          [
            { label: "Month", render: item => escapeHtml(formatMonthLabel(item.month)) },
            { label: "Views", render: item => escapeHtml(item.views) }
          ],
          "No monthly data yet."
        );

        document.getElementById("recentVisitsWrap").innerHTML = renderRecentVisits(data.recentVisits || []);
      } catch (error) {
        document.getElementById("dailyChart").innerHTML = '<div class="empty">Could not load daily analytics data.</div>';
        document.getElementById("monthlyChart").innerHTML = '<div class="empty">Could not load analytics data.</div>';
        document.getElementById("topPagesWrap").innerHTML = '<div class="empty">Could not load top pages.</div>';
        document.getElementById("topCountriesWrap").innerHTML = '<div class="empty">Could not load top countries.</div>';
        document.getElementById("topReferrersWrap").innerHTML = '<div class="empty">Could not load referrers.</div>';
        document.getElementById("topToolsWrap").innerHTML = '<div class="empty">Could not load top interactions.</div>';
        document.getElementById("toolEventsWrap").innerHTML = '<div class="empty">Could not load interaction events.</div>';
        document.getElementById("goalsWrap").innerHTML = '<div class="empty">Could not load goals.</div>';
        document.getElementById("recentVisitsWrap").innerHTML = '<div class="empty">Could not load recent visits.</div>';
        document.getElementById("monthlyTableWrap").innerHTML = '<div class="empty">Could not load monthly data.</div>';
      }
    }

    document.querySelectorAll("[data-traffic]").forEach(button => {
      button.addEventListener("click", () => {
        activeTraffic = button.dataset.traffic;
        document.querySelectorAll("[data-traffic]").forEach(item => item.classList.toggle("active", item === button));
        loadDashboard();
      });
    });

    loadDashboard();
  </script>
</body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    }
  );
}

    if (url.pathname === "/" && request.method === "GET") {
      return Response.redirect(`${url.origin}/dashboard`, 302);
    }

    // Legacy stats path redirect
    if (url.pathname === "/stats") {
      return Response.redirect(`${url.origin}/api/stats`, 302);
    }

    return textResponse("Not found", 404);
  }
};
