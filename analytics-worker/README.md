# Justy Media analytics dashboard

Private Cloudflare Worker dashboard for `analytics.justymedia.co.uk`. It receives privacy-friendly first-party site events, stores them in D1, and protects the dashboard and JSON API with HTTP Basic Authentication.

## What it tracks

- Page views, normalized page paths, visit time, country, referrer host, page title and bot/human classification
- Email/telephone clicks, social clicks, downloads and outbound-link clicks
- No cookies, advertising identifiers or full visitor IP addresses are stored
- Optional internal IP addresses are checked before insertion and never written to D1

## First deployment

Run these commands from this directory:

```powershell
npm install
npx wrangler login
npx wrangler d1 create justy-media-analytics
```

Copy the returned database UUID into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`, then run:

```powershell
npm run db:migrate:remote
npm run deploy
npx wrangler secret put ADMIN_USER
npx wrangler secret put ADMIN_PASS
```

Wrangler prompts for secret values securely. Do not add the username or password to `wrangler.jsonc`.

To exclude your own public IP address(es), optionally run:

```powershell
npx wrangler secret put INTERNAL_IPS
```

Enter one address or a comma-separated list. Requests from those addresses return successfully but are not stored.

The custom domain is declared in `wrangler.jsonc`; Cloudflare creates its DNS record and certificate during deployment. Remove any existing CNAME for `analytics.justymedia.co.uk` before deploying, because a Worker Custom Domain cannot replace an existing CNAME.

## Local check

Copy `.dev.vars.example` to `.dev.vars`, replace its sample values, then run:

```powershell
npm run db:migrate:local
npm run dev
```

Open `http://localhost:8787/dashboard`. The browser will ask for the username and password from `.dev.vars`.

## Production URLs

- Dashboard: `https://analytics.justymedia.co.uk/dashboard`
- JSON API: `https://analytics.justymedia.co.uk/api/stats`
- Collector: `https://analytics.justymedia.co.uk/collect`

The dashboard defaults to human traffic and includes controls for all traffic or detected bots.
