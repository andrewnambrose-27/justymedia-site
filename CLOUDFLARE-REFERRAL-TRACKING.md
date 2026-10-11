# Vulcan Sports footer tracking

Use this destination for the Justy Media footer credit on Vulcan Sports:

`https://analytics.justymedia.co.uk/go/vulcan-sports`

For example:

```html
<a href="https://analytics.justymedia.co.uk/go/vulcan-sports">Justy Media</a>
```

The Worker records a `referral_click` and redirects to the Justy Media homepage with fixed campaign tags. The redirect has `Cache-Control: no-store` so repeated clicks can reach the Worker. Its destination cannot be overridden through URL parameters. A database failure is logged but does not prevent the redirect.

The existing `site-analytics.js` already sends the landing URL. The Worker recognises the tags on a canonical Justy Media URL and records the landing page view as a Vulcan Sports referral even when the browser omits its referrer. No extra website JavaScript or cookies are needed.

The dashboard's **Website credit referrals** section reports:

- Link clicks, all time and over the last 30 UTC dates.
- Referred page views, all time and over the last 30 UTC dates.

Clicks are requests through the dedicated tracking URL. Referred page views include tagged arrivals and ordinary page views whose referrer is `vulcansports.co.uk` or `www.vulcansports.co.uk`. Existing recorded Vulcan referrals therefore appear immediately, but historic direct-link clicks cannot be reconstructed.

The dashboard traffic filter applies to both counts. Known bots are classified using the existing user-agent rules. Internal IPs, HEAD requests and requests marked as prefetch/prerender do not add clicks. These are request/page-view counts, not unique visitors or enquiry conversions.

The live Vulcan Sports footer originally linked directly to `https://justymedia.co.uk/`. It must be updated to the tracking URL for the separate click counter to work. The ordinary referral page-view count works with the original link when the browser supplies its referrer.

Deploy `justy-media-analytics-worker.js` to the existing `justy-media-analytics` Worker, preserving its D1 `DB` binding, `EMAIL` binding, variables and contact secrets. Publishing this file to GitHub does not redeploy the Worker automatically.

Checks: `npm run test:referrals`, `npm run test:contact`, and `npm run check`.
