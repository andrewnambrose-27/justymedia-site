const fs = require("node:fs");
const path = require("node:path");
const portfolioPages = require("../portfolio-data.js");
const { imageObjects, normaliseImage } = require("../image-metadata.js");

const root = path.resolve(__dirname, "..");
const origin = "https://justymedia.co.uk";
const errors = [];

function fail(message) { errors.push(message); }
function count(source, pattern) { return (source.match(pattern) || []).length; }
function decode(value) {
  return value
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&pound;/g, "£");
}
function stripHtml(value) { return decode(value.replace(/<[^>]*>/g, "").trim()); }
function routeFile(route) {
  const pathname = new URL(route, origin).pathname;
  if (pathname === "/") return path.join(root, "index.html");
  if (path.extname(pathname)) return path.join(root, decodeURIComponent(pathname.slice(1)));
  return path.join(root, decodeURIComponent(pathname.slice(1)), "index.html");
}
function localAsset(url) {
  const pathname = new URL(url, origin).pathname;
  if (pathname.startsWith("/cdn-cgi/image/")) {
    const match = pathname.match(/\/cdn-cgi\/image\/[^/]+(\/.*)$/);
    return match ? path.join(root, decodeURIComponent(match[1].slice(1))) : null;
  }
  return path.join(root, decodeURIComponent(pathname.slice(1)));
}
function tagContent(html, pattern) {
  const match = html.match(pattern);
  return match ? decode(match[1]) : "";
}
function collectType(value, type, results = []) {
  if (!value || typeof value !== "object") return results;
  if (value["@type"] === type) results.push(value);
  for (const child of Object.values(value)) collectType(child, type, results);
  return results;
}
function portfolioRecord(page, image) {
  const record = normaliseImage(image, page.structuredData);
  return { ...record, src: `${page.folder}${record.file}` };
}

const expectedImageCounts = new Map([
  ["/", 4],
  ["/work/", 3],
  ["/resources/", 2],
  ["/phone-wallpapers/", 4]
]);
for (const page of Object.values(portfolioPages)) {
  const images = page.images
    ? page.images.map((image) => portfolioRecord(page, image))
    : page.cards.map((card) => {
      if (card.image) return { src: card.image, alt: card.alt, width: card.width, height: card.height, structuredData: card.structuredData };
      const collection = portfolioPages[card.galleryKey];
      return portfolioRecord(collection, collection.images[0]);
    });
  expectedImageCounts.set(page.path, imageObjects(images).length);
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (!urls.length) fail("Sitemap contains no URLs");
if (urls.some((url) => !url.startsWith(`${origin}/`))) fail("Sitemap contains a non-canonical hostname");
if (new Set(urls).size !== urls.length) fail("Sitemap contains duplicate URLs");

const redirects = fs.readFileSync(path.join(root, "_redirects"), "utf8")
  .split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
  .map((line) => { const [from, to, status] = line.split(/\s+/); return { from, to, status: Number(status) }; });
const redirectMap = new Map(redirects.map((item) => [item.from, item]));
for (const redirect of redirects) {
  if (redirect.status !== 301) fail(`Redirect is not permanent: ${redirect.from}`);
  if (redirect.from === redirect.to) fail(`Self redirect found: ${redirect.from}`);
}

function resolveRedirect(route) {
  const seen = new Set();
  let current = route;
  let hops = 0;
  while (redirectMap.has(current)) {
    if (seen.has(current)) return { loop: true, current, hops };
    seen.add(current);
    current = redirectMap.get(current).to;
    hops += 1;
    if (hops > 10) return { loop: true, current, hops };
  }
  return { loop: false, current, hops };
}

const requiredRedirects = {
  "/services-pricing.html": "/services/",
  "/services-pricing": "/services/",
  "/services-pricing/": "/services/",
  "/automotive-photography": "/photography/automotive-photography/",
  "/about-me": "/about-us/",
  "/vwnewbeetle": "/photography/automotive-photography/vw-new-beetle/",
  "/subaru-outback-2-5se-mk3": "/photography/automotive-photography/subaru-outback/",
  "/alfaromeogtvcup": "/photography/rush-magazine/alfa-romeo-gtv-cup/",
  "/alfaromeogtvcupmultilocationshoot": "/photography/rush-magazine/alfa-romeo-gtv-cup/",
  "/copy-of-product-photography": "/services/photography-content/"
};
for (const [from, expected] of Object.entries(requiredRedirects)) {
  const result = resolveRedirect(from);
  if (result.loop) fail(`Redirect loop from ${from}`);
  if (result.current !== expected) fail(`${from} resolves to ${result.current}, expected ${expected}`);
  if (result.hops !== 1) fail(`${from} takes ${result.hops} redirects, expected one`);
  if (!fs.existsSync(routeFile(expected))) fail(`Redirect target is missing: ${expected}`);
}
for (const intentionallyMissing of ["/bmwr50mini", "/gear-i-use", "/unknown-verification-path"]) {
  if (redirectMap.has(intentionallyMissing) || fs.existsSync(routeFile(intentionallyMissing))) fail(`${intentionallyMissing} should be a genuine 404`);
}

const titles = new Map();
const descriptions = new Map();
const allImageMetadataUrls = new Set();
let imageMetadataInstances = 0;
for (const url of urls) {
  const file = routeFile(url);
  if (!fs.existsSync(file)) { fail(`Sitemap URL has no page: ${url}`); continue; }
  const html = fs.readFileSync(file, "utf8");
  const route = new URL(url).pathname;

  if (redirectMap.has(route)) fail(`Sitemap URL redirects: ${url}`);
  if (/noindex/i.test(html)) fail(`Sitemap URL is noindex: ${url}`);
  if (html.includes("www.justymedia.co.uk")) fail(`www canonical hostname remains in ${route}`);
  if (count(html, /<title>/g) !== 1) fail(`${route} does not have exactly one title`);
  if (count(html, /<meta name="description"/g) !== 1) fail(`${route} does not have exactly one description`);
  if (count(html, /<link rel="canonical"/g) !== 1) fail(`${route} does not have exactly one canonical`);
  if (count(html, /<h1(?:\s|>)/g) !== 1) fail(`${route} does not have exactly one H1`);
  if (count(html, /<main(?:\s|>)/g) !== 1) fail(`${route} does not have exactly one main`);
  if (!/<header class="site-header">/.test(html) || !/<footer class="site-footer">/.test(html)) fail(`${route} lacks an initial header or footer`);
  if (!/class="nav-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="nav-menu"/.test(html)) fail(`${route} lacks an accessible mobile navigation control`);
  if (!html.includes('href="/styles.css?v=20260818-5"')) fail(`${route} is missing the page stylesheet`);
  if (!html.includes('href="/site-components.css?v=20260818-2"')) fail(`${route} is missing the shared component stylesheet`);
  for (const faviconHref of ["/favicon.ico?v=20260818-2", "/favicons/favicon.svg?v=20260818-2", "/favicons/favicon-96x96.png?v=20260818-2", "/favicons/apple-touch-icon.png?v=20260818-2", "/favicons/site.webmanifest?v=20260818-2"]) {
    if (!html.includes(`href="${faviconHref}"`)) fail(`${route} is missing favicon link ${faviconHref}`);
    if (!fs.existsSync(localAsset(faviconHref))) fail(`${route} references missing favicon asset ${faviconHref}`);
  }

  const title = tagContent(html, /<title>(.*?)<\/title>/s);
  const description = tagContent(html, /<meta name="description" content="(.*?)">/s);
  const canonical = tagContent(html, /<link rel="canonical" href="(.*?)">/s);
  if (canonical !== url) fail(`${route} canonical ${canonical} does not match sitemap URL ${url}`);
  if (titles.has(title)) fail(`Duplicate title on ${route} and ${titles.get(title)}: ${title}`); else titles.set(title, route);
  if (descriptions.has(description)) fail(`Duplicate description on ${route} and ${descriptions.get(description)}`); else descriptions.set(description, route);

  const requiredMeta = [
    /<meta property="og:type"/, /<meta property="og:site_name"/, /<meta property="og:title"/,
    /<meta property="og:description"/, /<meta property="og:url"/, /<meta property="og:image"/,
    /<meta name="twitter:card"/, /<meta name="twitter:title"/, /<meta name="twitter:description"/,
    /<meta name="twitter:image"/
  ];
  for (const pattern of requiredMeta) if (!pattern.test(html)) fail(`${route} is missing social metadata matching ${pattern}`);
  const ogUrl = tagContent(html, /<meta property="og:url" content="(.*?)">/s);
  if (ogUrl !== url) fail(`${route} og:url does not match canonical`);

  const jsonBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  if (!jsonBlocks.length) fail(`${route} has no JSON-LD`);
  const schemaGraphs = [];
  for (const block of jsonBlocks) {
    try { schemaGraphs.push(JSON.parse(block[1])); } catch (error) { fail(`${route} has invalid JSON-LD: ${error.message}`); }
  }
  const imageSchemas = schemaGraphs.flatMap((schema) => collectType(schema, "ImageObject"));
  const expectedImageCount = expectedImageCounts.get(route) || 0;
  if (imageSchemas.length !== expectedImageCount) fail(`${route} has ${imageSchemas.length} ImageObject entries, expected ${expectedImageCount}`);
  const contentUrls = imageSchemas.map((image) => image.contentUrl);
  if (new Set(contentUrls).size !== contentUrls.length) fail(`${route} contains duplicate ImageObject contentUrl values`);
  const renderedImages = new Set([...html.matchAll(/<img\b([^>]*)>/g)].map((match) => {
    const attrs = match[1];
    const source = attrs.match(/\bdata-original="([^"]+)"/) || attrs.match(/\bsrc="([^"]+)"/);
    return source ? decodeURIComponent(new URL(source[1], origin).pathname) : "";
  }));
  for (const image of imageSchemas) {
    for (const property of ["contentUrl", "creator", "creditText", "copyrightNotice", "license", "acquireLicensePage"]) {
      if (!image[property]) fail(`${route} ImageObject is missing ${property}`);
    }
    if (!image.creator || image.creator["@type"] !== "Person" || !image.creator.name) fail(`${route} ImageObject creator is not a named Person`);
    for (const property of ["contentUrl", "license", "acquireLicensePage"]) {
      try { if (new URL(image[property]).origin !== origin) fail(`${route} ImageObject ${property} is not on the canonical origin`); }
      catch { fail(`${route} ImageObject ${property} is not an absolute URL`); }
    }
    if (image.contentUrl && !renderedImages.has(decodeURIComponent(new URL(image.contentUrl).pathname))) fail(`${route} ImageObject does not match a rendered image: ${image.contentUrl}`);
    if (image.contentUrl) allImageMetadataUrls.add(image.contentUrl);
  }
  imageMetadataInstances += imageSchemas.length;
  if (route !== "/") {
    const breadcrumb = html.match(/<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>(.*?)<\/ol><\/nav>/s);
    const graph = schemaGraphs.flatMap((item) => item["@graph"] || []).find((item) => item["@type"] === "BreadcrumbList");
    if (!graph) fail(`${route} has no BreadcrumbList schema`);
    else if (graph.itemListElement.length >= 3) {
      if (!breadcrumb) fail(`${route} has no visible breadcrumb`);
      else {
      const visibleNames = [...breadcrumb[1].matchAll(/<li>(.*?)<\/li>/gs)].map((match) => stripHtml(match[1]));
      const schemaNames = graph.itemListElement.map((item) => item.name);
      if (JSON.stringify(visibleNames) !== JSON.stringify(schemaNames)) fail(`${route} breadcrumb text and schema differ`);
      }
    } else if (breadcrumb) {
      fail(`${route} displays a redundant top-level breadcrumb`);
    }
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    const attrs = match[1];
    const alt = attrs.match(/\balt="([^"]*)"/);
    if (!alt) fail(`${route} contains an image without alt text`);
    if (!/\bwidth="\d+"/.test(attrs) || !/\bheight="\d+"/.test(attrs)) fail(`${route} contains an image without dimensions`);
    const source = attrs.match(/\bdata-original="([^"]+)"/) || attrs.match(/\bsrc="([^"]+)"/);
    if (source && source[1].startsWith("/")) {
      const asset = localAsset(source[1]);
      if (asset && !fs.existsSync(asset)) fail(`${route} references missing image ${source[1]}`);
    }
  }

  const internalLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].map((match) => match[1]);
  for (const href of internalLinks) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const targetUrl = new URL(href, origin);
    const targetRoute = targetUrl.pathname;
    const assetExtensions = /\.(?:jpg|jpeg|png|xml|txt|css|js)$/i;
    if (assetExtensions.test(targetRoute)) {
      if (!fs.existsSync(localAsset(targetRoute))) fail(`${route} links to missing asset ${href}`);
      continue;
    }
    const resolved = resolveRedirect(targetRoute);
    if (!fs.existsSync(routeFile(resolved.current))) fail(`${route} links to missing page ${href}`);
    if (targetUrl.hash) {
      const targetHtml = fs.readFileSync(routeFile(resolved.current), "utf8");
      const id = decodeURIComponent(targetUrl.hash.slice(1));
      if (!new RegExp(`\\bid=["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(targetHtml)) fail(`${route} links to missing fragment ${href}`);
    }
  }

  if (/data-gallery/.test(html)) {
    if (!/<script src="\/portfolio-page\.js"><\/script>/.test(html)) fail(`${route} gallery lacks progressive enhancement script`);
    const alts = [...html.matchAll(/<a class="gallery-trigger"[^>]*data-alt="([^"]+)"/g)].map((match) => decode(match[1]));
    if (!alts.length) fail(`${route} gallery has no initial figures`);
    if (new Set(alts).size !== alts.length) fail(`${route} gallery contains duplicate image descriptions`);
  }
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) fail("robots.txt has the wrong sitemap declaration");
if (robots.includes("www.justymedia.co.uk")) fail("robots.txt contains www hostname");

const contact = fs.readFileSync(routeFile("/contact-us/"), "utf8");
if (!/action="mailto:andrew\.n\.ambrose@gmail\.com"/.test(contact)) fail("Contact form no longer uses the established email route");
if (!/id="project-type"/.test(contact) || !/id="budget"/.test(contact)) fail("Contact form lacks project type or optional budget fields");

const licensing = fs.readFileSync(routeFile("/image-licensing/"), "utf8");
if (!licensing.includes('href="/contact-us/"')) fail("Image licensing page does not link to Contact");
if (!licensing.includes("does not grant a licence or permission to reuse it")) fail("Image licensing page could be read as granting public reuse rights");
if (imageObjects([{ src: "/not-owned.jpg", structuredData: { licenseEligible: false } }]).length !== 0) fail("Ineligible images receive owned-photography metadata");
const overrideSchema = imageObjects([{ src: "/override.jpg", structuredData: { licenseEligible: true, creator: "Another Photographer", copyrightOwner: "Another Rights Holder", license: "https://justymedia.co.uk/alternate-license/", acquireLicensePage: "https://justymedia.co.uk/contact-us/" } }])[0];
if (overrideSchema.creator["@type"] !== "Person" || overrideSchema.creator.name !== "Another Photographer" || overrideSchema.copyrightNotice !== "© Another Rights Holder" || overrideSchema.license !== "https://justymedia.co.uk/alternate-license/" || overrideSchema.acquireLicensePage !== "https://justymedia.co.uk/contact-us/") fail("Per-image rights overrides are not preserved");

const legacy = ["about-me.html", "contact.html", "services-pricing.html"];
for (const file of legacy) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  if (!/noindex,follow/.test(html)) fail(`${file} fallback is not noindex`);
}

if (errors.length) {
  console.error(`Verification failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verified ${urls.length} sitemap URLs, ${imageMetadataInstances} ImageObject page instances covering ${allImageMetadataUrls.size} unique images, ${redirects.length} redirects, JSON-LD, breadcrumbs, internal links, images, no-JS content, navigation and contact routing.`);
