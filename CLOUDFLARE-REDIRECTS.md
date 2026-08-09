# Canonical hostname redirects

The repository is deployed as a static Cloudflare Pages site. Pages `_redirects`
supports path redirects, but Cloudflare explicitly does not support domain-level
redirects in that file. The hostname rules therefore need to be configured at the
zone level in Cloudflare.

## Required DNS/custom-domain setup

1. Keep `justymedia.co.uk` attached to the Pages project as the production custom
   domain.
2. Ensure a proxied DNS record exists for `www.justymedia.co.uk`. It may be the
   custom-domain CNAME created by Pages, or a proxied placeholder record used only
   so Cloudflare can evaluate redirect rules.
3. Ensure Universal SSL covers both the apex and `www` hostnames before testing
   the HTTPS redirect.

## Required Single Redirect rules

Create these in **Cloudflare Dashboard → Rules → Redirect Rules → Single Redirects**,
in this order. Enable **Preserve query string** on both rules.

### 1. Redirect every www request directly to canonical HTTPS

- Match type: Wildcard pattern
- Request URL: `http*://www.justymedia.co.uk/*`
- Target URL: `https://justymedia.co.uk/${2}`
- Status: `301`
- Preserve query string: enabled

This handles both HTTP and HTTPS `www` requests in one hop while preserving the
path and query string.

### 2. Upgrade apex HTTP requests

- Match type: Wildcard pattern
- Request URL: `http://justymedia.co.uk/*`
- Target URL: `https://justymedia.co.uk/${1}`
- Status: `301`
- Preserve query string: enabled

Do not add a catch-all redirect from the canonical HTTPS hostname back to itself.
After deployment, test root URLs, nested paths, and a URL containing a query string.
