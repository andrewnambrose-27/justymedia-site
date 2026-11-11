# Portfolio presentation and enquiry journey

Work is prepared in the `codex/portfolio-enquiry` checkout, based on production commit `9b6ce0c`. The published About local coverage section and the original working checkout are preserved.

## Website preview

`website-projects.js` owns the project title, domain, live URL, lightweight listing thumbnail, full screenshot configuration and Vulcan case-study content. `scripts/website-preview.js` renders the shared browser frame. `website-preview.js` adds the native dialog and optional real-layout switching. Styling lives in `portfolio-journey.css` and uses the existing design tokens and buttons.

Vulcan Sports and CompRadar use full-height screenshots supplied on 11 November 2026. Their original dimensions are 2560 × 7348 and 2560 × 5863. The 960, 1600 and 2400px WebP variants retain the entire screenshot and its aspect ratio. The largest variants are approximately 654KB and 495KB. Listing thumbnails are approximately 57KB and 38KB. Vulcan detail images are labelled crops from the same homepage screenshot, rather than separate page designs.

To add a genuine mobile screenshot later, add `preview.mobile` alongside `preview.desktop`, with `base`, `width`, `height`, `alt` and optional `widths`. Supply matching `<base>-<width>.webp` files. The Desktop/Mobile controls are rendered only when both layouts exist. There is no simulated mobile layout.

The preview uses native overflow scrolling and a keyboard-focusable region. The toolbar and controls sit outside that region. Expanded viewing uses `dialog.showModal()`, a visible close control, Escape, native modal focus behaviour and focus restoration. Without JavaScript, scrolling remains available and Expand preview opens the full screenshot directly. No iframe, mapping dependency, wheel handler or tracking was added.

## Content and enquiry routes

- Vulcan has a client/sector/location/contribution summary, business challenge, specific navigation and presentation decisions, screenshot details, delivered improvements and future review opportunities.
- Homepage selected work features Vulcan as a client website, CompRadar as an independent project, and RUSH photography. The Justy Media identity remains in the graphic-design portfolio.
- The website portfolio has a shorter opening section. Listings remain static images.
- All four main service pages have relevant enquiry and portfolio actions immediately after their introduction.
- The contact introduction is shorter. The form comes before the supporting copy in document order and on mobile, while the desktop layout retains the supporting copy beside the form. The form markup and submission script are unchanged.

## Evidence and remaining assets

The existing repository credits Justy Media with Vulcan website design and development. Vulcan’s public homepage also credits Justy Media and confirms Leek, Staffordshire, the product-range routes, club shops and factory story: https://vulcansports.co.uk/. No ownership of the underlying kit-design, checkout or club-shop systems is claimed. No dates, testimonials or performance metrics were invented.

Useful evidence for a future case-study update: a confirmed breakdown of custom development versus existing integrations, before/after screenshots, launch scope, approved client feedback, and dated enquiry/conversion or usability evidence. The ongoing-improvement copy describes review opportunities, not a claimed maintenance contract.

No public enquiry inbox or suitable Andrew portrait was found. The `website@justymedia.co.uk` address in contact-worker setup documentation is an automated sender, not evidence of a public monitored enquiry inbox. It has not been added as an email link. Genuine mobile screenshots would enable the optional layout toggle. The contact copy explains email replies and the option of a local meeting without promising response times.

## Verification

- `npm run build`, `npm run check` and `npm run test:contact` pass.
- The site verifier covers 38 canonical URLs, image metadata, internal links and anchors, navigation, no-JavaScript content and contact routing.
- Browser layouts checked at 1440, 390 and 320px across both preview case studies, website listing, homepage, contact page and the four service pages. No page-level horizontal overflow was found.
- At 1440px, the first website-portfolio image starts around 592px from the top. The contact form starts around 403px at 1440px and 423px at 390px.
- Native keyboard scrolling, expanded desktop/mobile-sized viewing, close/Escape, focus visibility and return focus were checked. Mobile-sized expansion retains an inspectable desktop screenshot with horizontal scrolling.
- Native required-field validation was checked in the browser. Submission success, server error and network error handling were exercised with a local mocked fetch harness. No real enquiry was sent. The contact Worker’s existing notification, configuration, provider/storage failure, honeypot and origin tests pass.
- Phone checks use browser viewport sizes; no physical touchscreen, Safari or Firefox checks were performed.

Publication uses the repository’s production branch and Cloudflare Pages. Deployment details are recorded in the workspace publication record.
