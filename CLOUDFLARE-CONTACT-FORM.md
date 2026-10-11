# Cloudflare contact form setup

The contact page sends enquiries to:

`https://analytics.justymedia.co.uk/contact`

That address is handled by the existing analytics Worker. Publishing the static website to GitHub does **not** update the Worker automatically, so the Worker must be deployed separately in Cloudflare.

## Required: enable form submissions

1. In Cloudflare, open **Workers & Pages** and select the Worker connected to `analytics.justymedia.co.uk`.
2. Open **Edit code**.
3. Replace the Worker code with the full contents of `justy-media-analytics-worker.js` from this project.
4. Select **Deploy**.
5. Under the Worker's **Settings > Bindings**, confirm the existing D1 database binding is named `DB`. The analytics Worker already uses this binding.
6. Submit a test enquiry from `https://justymedia.co.uk/contact-us/`.

The Worker creates its `contact_submissions` table automatically. Once deployed, enquiries are saved privately in D1 and appear in the protected analytics dashboard even if email notifications have not been configured.

## Receive email notifications without a third-party form service

The form stores the enquiry first, then asks Cloudflare to send a notification. A successful form response confirms storage; it does not prove delivery to the inbox. The response includes `emailSent` to report whether Cloudflare accepted the notification. The protected dashboard shows the configuration status, enquiries without recorded email notifications, and the latest 20 enquiries.

For notifications to your own inbox, Cloudflare supports free sending to a verified destination address, including when only Email Routing is configured. There is no need to enable paid sending to arbitrary recipients.

1. In Cloudflare **Compute > Email Service > Email Routing**, enable routing for `justymedia.co.uk`. Check existing mail DNS records before enabling this on a domain with an existing mail provider.
2. Under **Destination Addresses**, add and verify the private inbox that should receive enquiries. If Cloudflare already shows it as verified, no further verification is needed.
3. Add a **Send Email** binding to the **justy-media-analytics Worker** named `EMAIL`. Restrict its allowed destination to the verified private inbox and its allowed sender to `website@justymedia.co.uk`.
4. Add these Worker variables/secrets:
   - `CONTACT_RECIPIENT`: the private inbox that should receive enquiries.
   - `CONTACT_SENDER`: `website@justymedia.co.uk` (the sender domain must be configured in Cloudflare Email Service).
   - `CONTACT_HASH_SALT`: a long random secret used when rate-limiting form submissions.
5. Deploy the Worker again, preserving its existing `DB` binding and dashboard settings.
6. Submit an enquiry from the production contact page. Confirm the entry appears in the dashboard, its status is **Email sent**, and the notification arrives in the inbox (check Spam too).

`CONTACT_RECIPIENT` stays inside Cloudflare and is never sent to visitors or included in the website source.

These settings belong to the analytics Worker, **not** the static website's Pages project. Adding variables to Pages alone cannot configure this endpoint.

Notifications that failed or were never configured stay saved with `email_sent = 0`. Configuring email does not automatically resend older enquiries. Review them at `https://analytics.justymedia.co.uk/dashboard`. To inspect all records, use the existing D1 database's console:

```sql
SELECT created_at, name, email, business, project_type, budget, message, email_sent
FROM contact_submissions
ORDER BY created_at DESC;
```

If a new enquiry is saved but no email is recorded, inspect the analytics Worker's logs for `contact notification failed`. If it is marked **Email sent** but is missing from Gmail, check Spam and Cloudflare's Email Service logs: provider acceptance is not an inbox-delivery guarantee.

Local regression checks: `npm run test:contact` and `npm run check`.

Cloudflare references:

- [Free sending to verified destinations](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Send binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [Workers email API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)

## Live configuration checked on 11 October 2026

The `justy-media-analytics` Worker has the `EMAIL` binding and private `CONTACT_RECIPIENT`, `CONTACT_SENDER` and `CONTACT_HASH_SALT` secrets. Email Routing is enabled and the destination is verified. The original database and dashboard variables were preserved. The deployed dashboard reports the configuration status and highlights saved enquiries without notifications.

An end-to-end test submitted by the owner at 12:37 BST was saved with `email_sent = 1`, and the owner confirmed the notification arrived in Gmail. The earlier 12:22 test remains saved with `email_sent = 0` and can be read in the dashboard. No older enquiries were present when the database was checked.

The updated success wording in `script.js` ("your enquiry has been received") is a local website change and needs the normal static-site publication to reach visitors. Worker deployments and Pages deployments are separate.

## Files to publish for the shared header/footer change

Publish these shared source files to GitHub:

- `site-components.js`
- `site-components.css`
- `script.js`
- `scripts/build-site.js`
- `scripts/verify-site.js`

The new `site-components.js` also replaces legacy copied headers and footers in the browser, so the visual correction reaches old pages immediately.

There is one important privacy cleanup: publish all of the rebuilt HTML files once. Until those files are replaced, the old email address can still exist in their downloaded source even though JavaScript removes it from the visible page. The build has already converted all 36 pages to small `<site-header>` and `<site-footer>` placeholders, so no manual page-by-page editing is needed.

After that one-time HTML publish, future header and footer content changes belong only in `site-components.js`; their styling belongs only in `site-components.css`.
