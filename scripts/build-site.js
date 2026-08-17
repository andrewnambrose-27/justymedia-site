const fs = require("node:fs");
const path = require("node:path");
const portfolioPages = require("../portfolio-data.js");
const { SITE_ORIGIN, normaliseImage, imageObjects } = require("../image-metadata.js");

const root = path.resolve(__dirname, "..");
const origin = SITE_ORIGIN;
const email = "andrew.n.ambrose@gmail.com";
const logo = "/logo%20final%20AI%20transparrent.png";
const defaultShareImage = "/photography/automotive-photography/honda-nsx/_DSC8937-Edit-2.jpg";
const modified = "2026-08-17";
const cameraTools = [
  {
    group: "metadata", slug: "sony-shutter-count", name: "Sony Shutter Count Checker", label: "Sony · JPG and ARW",
    description: "Check compatible original Sony JPG and ARW files for shutter-count information and view useful EXIF metadata directly in your browser.",
    cta: "Open Sony Tool", url: "https://27tools.co/tools/camera-tools/camera-shutter-count/"
  },
  {
    group: "metadata", slug: "canon-shutter-count", name: "Canon Shutter Count Checker", label: "Canon · CR3",
    description: "Inspect an original Canon CR3 file for available shutter-count information while keeping access to the full metadata found inside the image.",
    cta: "Open Canon Tool", url: "https://27tools.co/tools/camera-tools/canon-shutter-count/"
  },
  {
    group: "metadata", slug: "nikon-shutter-count", name: "Nikon Shutter Count Checker", label: "Nikon · NEF",
    description: "Read compatible Nikon NEF maker-note data to find an available shutter count and inspect useful camera and exposure metadata.",
    cta: "Open Nikon Tool", url: "https://27tools.co/tools/camera-tools/nikon-shutter-count/"
  },
  {
    group: "metadata", slug: "fujifilm-shutter-count", name: "Fujifilm Shutter Count Checker", label: "Fujifilm · RAF",
    description: "Check an original Fujifilm RAF file for available shutter-count information and inspect the metadata recorded by the camera.",
    cta: "Open Fujifilm Tool", url: "https://27tools.co/tools/camera-tools/fujifilm-shutter-count/"
  },
  {
    group: "planning", slug: "depth-of-field-calculator", name: "Depth of Field Calculator", label: "Photography · Focus planning",
    description: "Estimate near and far focus limits, total depth of field and hyperfocal distance using your camera format, focal length, aperture and focus distance.",
    cta: "Calculate Depth of Field", url: "https://27tools.co/tools/camera-tools/depth-of-field-calculator/"
  },
  {
    group: "planning", slug: "video-shutter-speed-calculator", name: "Video Shutter Speed Calculator", label: "Video · Frame rate and shutter angle",
    description: "Calculate a suitable video shutter speed from frame rate and shutter angle, with practical guidance for motion blur and 50Hz or 60Hz lighting.",
    cta: "Calculate Shutter Speed", url: "https://27tools.co/tools/camera-tools/video-shutter-speed-calculator/"
  },
  {
    group: "planning", slug: "video-recording-time-calculator", name: "Video Recording Time Calculator", label: "Video · Bitrate and storage",
    description: "Estimate how long a memory card can record at a chosen bitrate or calculate how much storage an upcoming video shoot may require.",
    cta: "Calculate Recording Time", url: "https://27tools.co/tools/camera-tools/video-recording-time-calculator/"
  }
];

function escapeHtml(value) {
  return String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function absolute(url) {
  return url.startsWith("http") ? url : `${origin}${url}`;
}

function encodedPath(url) {
  return url.split("/").map((part, index) => index === 0 ? "" : encodeURIComponent(decodeURIComponent(part))).join("/");
}

function imageUrl(url, width = 1200, fit = "scale-down") {
  return `/cdn-cgi/image/width=${width},fit=${fit},quality=82,format=auto${encodedPath(url)}`;
}

function responsiveImage({ src, alt, width, height, loading = "lazy", className = "" }) {
  const encoded = encodedPath(src);
  return `<img${className ? ` class="${className}"` : ""} src="${imageUrl(src, 960)}" srcset="${imageUrl(src, 640)} 640w, ${imageUrl(src, 960)} 960w, ${imageUrl(src, 1400)} 1400w" sizes="(max-width: 720px) 100vw, 50vw" width="${width}" height="${height}" alt="${escapeHtml(alt)}" loading="${loading}" decoding="async" data-original="${encoded}">`;
}

function ownedPhoto(src, alt, width, height, options = {}) {
  return { src, alt, width, height, ...options, structuredData: { licenseEligible: true, ...(options.structuredData || {}) } };
}

function portfolioPhoto(page, image) {
  const record = normaliseImage(image, page.structuredData);
  return { ...record, src: `${page.folder}${record.file}` };
}

function organisationSchema() {
  return {
    "@type": "ProfessionalService",
    "@id": `${origin}/#business`,
    name: "Justy Media",
    url: `${origin}/`,
    logo: `${origin}${logo}`,
    image: absolute(defaultShareImage),
    email,
    founder: { "@type": "Person", name: "Andrew Ambrose" },
    foundingDate: "2020",
    description: "An independent creative studio based in the Peak District, combining website development, graphic design, photography and digital marketing.",
    areaServed: [
      { "@type": "AdministrativeArea", name: "Peak District" },
      { "@type": "Country", name: "United Kingdom" }
    ],
    sameAs: ["https://www.instagram.com/justymedia/", "https://www.facebook.com/justymedia/"]
  };
}

function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absolute(item.href)
    }))
  };
}

function breadcrumbs(items) {
  if (!items || items.length < 2) return "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => {
    const current = index === items.length - 1;
    return current
      ? `<li><span aria-current="page">${escapeHtml(item.label)}</span></li>`
      : `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`;
  }).join("")}</ol></nav>`;
}

function currentSection(pagePath) {
  if (pagePath.startsWith("/services/")) return "services";
  if (pagePath.startsWith("/work/")) return "work";
  if (pagePath.startsWith("/photography/")) return "photography";
  if (pagePath.startsWith("/resources/") || pagePath.startsWith("/phone-wallpapers/")) return "resources";
  if (pagePath.startsWith("/about-us/")) return "about";
  if (pagePath.startsWith("/contact-us/")) return "contact";
  return "";
}

function header(pagePath) {
  const active = currentSection(pagePath);
  const navigation = [
    ["/services/", "Services", "services"],
    ["/work/", "Work", "work"],
    ["/photography/", "Photography", "photography"],
    ["/resources/", "Resources", "resources"],
    ["/about-us/", "About", "about"],
    ["/contact-us/", "Contact", "contact"]
  ];
  return `<a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <div class="top-strip"><div class="social-links"><a href="https://www.instagram.com/justymedia/" aria-label="Justy Media on Instagram" rel="me">IG</a><a href="https://www.facebook.com/justymedia/" aria-label="Justy Media on Facebook" rel="me">FB</a></div><a class="email-link" href="mailto:${email}">${email}</a></div>
      <nav class="main-nav" aria-label="Primary navigation">
        <a class="brand" href="/" aria-label="Justy Media home"><img src="${logo}" width="2639" height="1511" alt="Justy Media"></a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span><span class="sr-only">Open navigation</span></button>
        <ul id="nav-menu" class="nav-menu">${navigation.map(([href, label, section]) => `<li><a${section === active ? ' class="active"' : ""}${pagePath === href ? ' aria-current="page"' : ""} href="${href}">${label}</a></li>`).join("")}</ul>
      </nav>
    </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="footer-brand"><img src="${logo}" width="2639" height="1511" alt="Justy Media"><p>Independent creative studio<br>Peak District, UK</p></div>
    <div><p class="footer-heading">Explore</p><nav aria-label="Footer services"><a href="/services/">Services</a><a href="/services/web-design/">Web design</a><a href="/services/graphic-design/">Graphic design</a><a href="/services/photography-content/">Photography &amp; content</a><a href="/services/digital-marketing/">SEO &amp; digital marketing</a><a href="/work/">Work</a></nav></div>
    <div><p class="footer-heading">Photography &amp; resources</p><nav aria-label="Footer photography and resources"><a href="/photography/">Photography overview</a><a href="/photography/automotive-photography/">Automotive photography</a><a href="/photography/rush-magazine/">RUSH Magazine</a><a href="/phone-wallpapers/">Phone wallpapers</a><a href="/resources/camera-tools/">Camera tools</a><a href="/resources/">All resources</a></nav></div>
    <div><p class="footer-heading">Justy Media</p><nav aria-label="Footer information"><a href="/about-us/">About</a><a href="/contact-us/">Contact</a><a href="/image-licensing/">Image licensing</a><a href="/privacy-policy.html">Privacy policy</a><a href="/terms-and-conditions.html">Terms and conditions</a></nav><div class="footer-socials"><a href="https://www.instagram.com/justymedia/" aria-label="Instagram">IG</a><a href="https://www.facebook.com/justymedia/" aria-label="Facebook">FB</a></div></div>
    <small>&copy; 2026 Justy Media. Website and photography by Justy Media.</small>
  </footer>`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": data }).replace(/</g, "\\u003c")}</script>`;
}

function documentHtml(page) {
  const canonical = absolute(page.path);
  const shareImage = absolute(page.shareImage || defaultShareImage);
  const schemas = [...(page.schemas || [])];
  const pageImages = imageObjects(page.structuredImages);
  if (pageImages.length) {
    const primaryIndex = schemas.findIndex((schema) => ["WebPage", "CollectionPage", "WebSite"].includes(schema["@type"]));
    if (primaryIndex >= 0) schemas[primaryIndex] = { ...schemas[primaryIndex], associatedMedia: pageImages };
    else schemas.push(...pageImages);
  }
  const robotsTag = page.robots ? `    <meta name="robots" content="${page.robots}">\n` : "";
  const preloadTag = page.preload ? `    ${page.preload}\n` : "";
  const galleryScript = page.gallery ? '\n    <script src="/portfolio-page.js"></script>' : "";
  if (page.breadcrumbs && page.breadcrumbs.length > 1) schemas.push(breadcrumbSchema(page.breadcrumbs));
  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}">
${robotsTag}    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="${page.ogType || "website"}">
    <meta property="og:site_name" content="Justy Media">
    <meta property="og:title" content="${escapeHtml(page.ogTitle || page.title)}">
    <meta property="og:description" content="${escapeHtml(page.ogDescription || page.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${shareImage}">
    <meta property="og:image:alt" content="${escapeHtml(page.shareAlt || "Automotive photography by Justy Media")}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(page.ogTitle || page.title)}">
    <meta name="twitter:description" content="${escapeHtml(page.ogDescription || page.description)}">
    <meta name="twitter:image" content="${shareImage}">
    <meta name="theme-color" content="#121212">
${preloadTag}    <link rel="stylesheet" href="/styles.css">
    ${jsonLd(schemas)}
  </head>
  <body class="${page.bodyClass || ""}">
    ${header(page.path)}
    ${page.body}
    ${footer()}
    <script src="/script.js"></script>${galleryScript}
  </body>
</html>
`;
}

function writeRoute(route, content) {
  const relative = route === "/" ? "index.html" : route.endsWith(".html") ? route.slice(1) : `${route.slice(1)}index.html`;
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

function pageIntro(eyebrow, heading, intro) {
  return `<section class="page-hero"><div class="content-width">${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}<h1>${escapeHtml(heading)}</h1><p class="lede">${escapeHtml(intro)}</p></div></section>`;
}

function cta(title = "Let’s make something useful.", copy = "Tell me what you are working on and where you need support. I’ll reply with a practical next step.") {
  return `<section class="final-cta"><div class="content-width"><p class="eyebrow">Start a project</p><h2>${title}</h2><p>${copy}</p><a class="button button-primary" href="/contact-us/">Start an enquiry</a></div></section>`;
}

function serviceCard(href, number, title, copy) {
  return `<article class="service-card"><span>${number}</span><h3><a href="${href}">${escapeHtml(title)}</a></h3><p>${escapeHtml(copy)}</p><a class="text-link" href="${href}">Explore ${escapeHtml(title.toLowerCase())}</a></article>`;
}

function homePage() {
  const pathName = "/";
  const title = "Web Design, Branding & Photography | Justy Media";
  const description = "Justy Media is a Peak District creative studio offering web design, branding, photography, SEO and digital marketing for small UK businesses.";
  const hero = ownedPhoto("/Automotive Photography/_DSC5553.jpg", "Classic Mini photographed by Justy Media", 3271, 5815, { loading: "eager" });
  const platformPhoto = ownedPhoto("/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8094-Edit.JPG", "Front wing and teledial wheel of a red Alfa Romeo GTV Cup", 3582, 4477);
  const editorialPhoto = ownedPhoto("/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8112-Edit-2.JPG", "Alfa Romeo badge on the red GTV Cup bodywork", 3706, 4632);
  const nsxPhoto = ownedPhoto("/photography/automotive-photography/honda-nsx/_DSC8937-Edit-2.jpg", "Red Honda NSX in woodland sunlight", 2828, 3535);
  const body = `<main id="main-content">
    <section class="hero studio-hero">
      <div class="hero-media">${responsiveImage(hero)}</div>
      <div class="hero-content"><p class="eyebrow">Independent Creative Studio</p><h1>Creative work that helps businesses look better and grow.</h1><p>Websites, branding, photography and practical digital marketing support from the Peak District, working with businesses across the UK.</p><div class="button-row"><a class="button button-primary" href="/services/">Explore Services</a><a class="button button-secondary" href="/work/">View Selected Work</a></div></div>
    </section>
    <section class="intro-section"><div class="content-width split-intro"><div><p class="eyebrow">Justy Media</p><h2>Creative thinking, made practical.</h2></div><div><p>Justy Media is an independent studio run by Andrew Ambrose in the Peak District. What began with photography in 2020 has grown into a joined-up creative service for businesses that need a clearer identity, a better website and useful support after launch.</p><p>You work directly with the person designing, building and creating the work—keeping communication straightforward and the result focused on what your business actually needs.</p></div></div></section>
    <section class="section-block services-overview"><div class="wide-width"><div class="section-heading"><div><p class="eyebrow">Services</p><h2>One studio, four connected disciplines.</h2></div><a class="text-link" href="/services/">View all services</a></div><div class="service-grid">${serviceCard("/services/web-design/", "01", "Web design & development", "Clear, responsive websites, landing pages, redesigns and lightweight tools built around your goals.")}${serviceCard("/services/graphic-design/", "02", "Graphic design & branding", "Identity, print and digital artwork that gives your business a consistent and recognisable visual voice.")}${serviceCard("/services/photography-content/", "03", "Photography & content", "Distinctive automotive, editorial, product and brand imagery for websites, campaigns and social media.")}${serviceCard("/services/digital-marketing/", "04", "SEO & digital marketing", "Understandable SEO, analytics, content improvements and ongoing support without inflated promises.")}</div></div></section>
    <section class="section-block selected-work"><div class="wide-width"><div class="section-heading"><div><p class="eyebrow">Selected work</p><h2>Real work, across disciplines.</h2></div><a class="text-link" href="/work/">Explore the work</a></div><div class="work-grid">
      <a class="work-card work-card-wide" href="/work/#justy-media-platform">${responsiveImage(platformPhoto)}<div><p class="work-type">Website &amp; digital system</p><h3>Justy Media web platform</h3><p>A fast static website, structured portfolio system and privacy-conscious analytics tool.</p></div></a>
      <a class="work-card" href="/work/#justy-media-identity"><div class="logo-panel"><img src="${logo}" width="2639" height="1511" alt="Justy Media identity mark" loading="lazy"></div><div><p class="work-type">Brand identity</p><h3>Justy Media identity</h3><p>The established monochrome mark, carried through a dark visual system with warm gold accents.</p></div></a>
      <a class="work-card" href="/photography/rush-magazine/alfa-romeo-gtv-cup/">${responsiveImage(editorialPhoto)}<div><p class="work-type">Editorial photography</p><h3>RUSH Magazine</h3><p>Automotive features combining detail, portrait and road imagery.</p></div></a>
    </div></div></section>
    <section class="photo-feature"><div class="photo-feature-media">${responsiveImage(nsxPhoto)}</div><div class="photo-feature-copy"><p class="eyebrow">Photography</p><h2>Automotive work with a point of view.</h2><p>Photography is where Justy Media started, and it remains a genuine strength. Browse complete vehicle collections and commissioned editorial work for RUSH Magazine.</p><div class="button-row"><a class="button button-primary" href="/photography/">Photography portfolio</a><a class="text-link" href="/services/photography-content/">Photography services</a></div></div></section>
    <section class="section-block process-section"><div class="content-width"><p class="eyebrow">How it works</p><h2>A clear route from idea to finished work.</h2><ol class="process-list"><li><span>01</span><div><h3>Understand</h3><p>We start with the problem, audience and practical constraints—not a predetermined package.</p></div></li><li><span>02</span><div><h3>Shape</h3><p>I define the useful scope, creative direction and deliverables so expectations are clear.</p></div></li><li><span>03</span><div><h3>Create</h3><p>Design, development or production moves forward with focused review points along the way.</p></div></li><li><span>04</span><div><h3>Launch &amp; support</h3><p>The finished work is delivered properly, with the option of sensible ongoing updates and improvement.</p></div></li></ol></div></section>
    <section class="section-block why-section"><div class="wide-width split-intro"><div><p class="eyebrow">Why Justy Media?</p><h2>Direct, joined-up creative support.</h2></div><div class="feature-list"><article><h3>One point of contact</h3><p>Work directly with Andrew from the first conversation through to delivery.</p></article><article><h3>Built around the brief</h3><p>No one-size-fits-all packages or invented complexity—just the work the project needs.</p></article><article><h3>Creative and technical together</h3><p>Visual quality, useful content and sound implementation are considered as one connected job.</p></article></div></div></section>
    ${cta()}
    <aside class="resource-strip"><div class="wide-width"><div><p class="eyebrow">Free Resources</p><h2>Useful tools and downloads.</h2><p>Download automotive phone wallpapers or use practical browser-based camera tools for photography, video and used-equipment checks.</p></div><div class="resource-strip-links"><a class="button button-secondary" href="/phone-wallpapers/">Browse Phone Wallpapers</a><a class="text-link" href="/resources/camera-tools/">Explore Camera Tools</a></div></div></aside>
  </main>`;
  return documentHtml({
    path: pathName, title, description, body, bodyClass: "home-page",
    preload: `<link rel="preload" as="image" href="${imageUrl(hero.src, 1400)}" fetchpriority="high">`,
    shareImage: defaultShareImage, shareAlt: "Red Honda NSX photographed by Justy Media",
    structuredImages: [hero, platformPhoto, editorialPhoto, nsxPhoto],
    schemas: [
      { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: "Justy Media", description, publisher: { "@id": `${origin}/#business` }, inLanguage: "en-GB" },
      organisationSchema()
    ]
  });
}

const servicePages = [
  {
    path: "/services/web-design/", title: "Website Design & Development | Justy Media", heading: "Website design & development", eyebrow: "Web design",
    description: "Custom websites, WordPress builds, landing pages, redesigns and ongoing website support for small businesses across the Peak District and the UK.",
    intro: "Clear, responsive websites and lightweight digital tools designed around what your business needs people to understand and do.",
    serviceType: "Website design and development",
    content: `<section class="section-block"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">Who it is for</p><h2>For smaller businesses that need a more useful website.</h2></div><div><p>This service suits new businesses building a credible first presence, established organisations whose site no longer reflects them, and teams that need a focused campaign page or practical online tool.</p><p>The aim is not to add technology for its own sake. It is to make the message clearer, the experience easier and the route to enquiry more direct.</p></div></div></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">What can be created</p><h2>From focused pages to complete small-business sites.</h2><div class="capability-grid"><article><h3>Small-business websites</h3><p>Structured, responsive sites with clear services, useful content and an enquiry route.</p></article><article><h3>Landing pages &amp; redesigns</h3><p>Campaign pages and careful improvements to websites that have outgrown their current design.</p></article><article><h3>Custom tools</h3><p>Lightweight web applications and practical internal or customer-facing utilities where a standard page is not enough.</p></article><article><h3>Analytics &amp; conversion tracking</h3><p>Measurement planned around meaningful actions, with setup that helps you understand what the site is doing.</p></article><article><h3>Responsive development</h3><p>Layouts built to work across phones, tablets and larger screens, with accessibility and performance considered.</p></article><article><h3>Updates &amp; maintenance</h3><p>Ongoing content changes, technical upkeep and measured improvements after launch.</p></article></div><p class="note">Content management or e-commerce requirements are discussed during scoping so the platform and responsibilities are clear before work begins.</p></div></section>
      <section class="section-block"><div class="content-width"><p class="eyebrow">Process</p><h2>Design and development in one practical workflow.</h2><ol class="numbered-list"><li><strong>Discovery and content</strong><span>Clarify the audience, goals, pages, content and any systems the website must connect with.</span></li><li><strong>Structure and design</strong><span>Shape the journey and visual direction before detailed development.</span></li><li><strong>Build and test</strong><span>Develop responsive pages, add tracking where required and test core journeys across devices.</span></li><li><strong>Launch and handover</strong><span>Complete final checks, publish carefully and provide the information needed to use the finished site.</span></li></ol></div></section>
      <section class="section-block contrast"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">Ongoing support</p><h2>A website should not stop at launch.</h2></div><div><p>Support can continue with content updates, landing pages, technical housekeeping, analytics reviews and small improvements. The scope can be agreed around genuine needs rather than a fixed retainer.</p><a class="text-link" href="/services/digital-marketing/">Explore SEO and digital marketing support</a></div></div></div></section>
      <section class="section-block"><div class="wide-width"><p class="eyebrow">Relevant work</p><h2>Justy Media website &amp; analytics</h2><p class="lede narrow">This site is a genuine example of the approach: a static, responsive platform with reusable portfolio data, crawlable galleries, Cloudflare image delivery and a lightweight first-party analytics tool.</p><a class="button button-secondary" href="/work/#justy-media-platform">View the project overview</a></div></section>`
  },
  {
    path: "/services/graphic-design/", title: "Graphic Design & Branding | Justy Media", heading: "Graphic design & branding", eyebrow: "Graphic design",
    description: "Branding, graphic design, print artwork and digital marketing assets created by Justy Media for businesses, organisations and events.",
    intro: "Considered visual design for businesses that need to look consistent, recognisable and ready to communicate across print and digital channels.",
    serviceType: "Graphic design and branding",
    content: `<section class="section-block"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">A coherent visual system</p><h2>More than an isolated logo or one-off post.</h2></div><div><p>Graphic design works best when every piece feels connected. Justy Media can develop a new visual direction or extend the identity you already have into useful, consistent materials.</p><p>The scope can be a focused piece of artwork or ongoing design support, with files prepared for the channel and people who will actually use them.</p></div></div></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">Capabilities</p><h2>Design support across identity, print and screen.</h2><div class="capability-grid"><article><h3>Brand identities</h3><p>Core visual direction, colour, typography and practical guidance for consistent use.</p></article><article><h3>Logo development</h3><p>New marks and considered refinements, supplied in useful formats for print and digital work.</p></article><article><h3>Print artwork</h3><p>Brochures, leaflets, marketing materials and event graphics prepared for production.</p></article><article><h3>Social media artwork</h3><p>Reusable post, story and campaign assets that stay recognisably on brand.</p></article><article><h3>Website graphics</h3><p>Image treatments, diagrams, campaign graphics and supporting visual content for web pages.</p></article><article><h3>Ongoing design support</h3><p>A reliable route for new materials without reinventing the visual approach each time.</p></article></div></div></section>
      <section class="section-block"><div class="content-width"><p class="eyebrow">Process</p><h2>Start with what the design needs to communicate.</h2><ol class="numbered-list"><li><strong>Brief</strong><span>Define the audience, message, format, practical requirements and existing brand context.</span></li><li><strong>Direction</strong><span>Establish the strongest visual route and agree it before expanding the work.</span></li><li><strong>Refinement</strong><span>Develop the selected direction with focused feedback and careful production detail.</span></li><li><strong>Delivery</strong><span>Supply correctly prepared files and a clear explanation of what each one is for.</span></li></ol></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">Relevant work</p><h2>Justy Media identity</h2><p class="lede narrow">The established Justy Media mark and its dark, monochrome-led visual identity are the genuine design project currently available to publish.</p><a class="button button-secondary" href="/work/#justy-media-identity">View the identity overview</a></div></section>`
  },
  {
    path: "/services/photography-content/", title: "Commercial Photography & Content | Justy Media", heading: "Photography & content", eyebrow: "Photography",
    description: "Automotive, brand and commercial photography from Justy Media, creating polished images for websites, campaigns and social media.",
    intro: "Purposeful photography shaped for the place it needs to work—from an editorial feature or automotive story to a website, campaign or social feed.",
    serviceType: "Commercial photography and content",
    content: `<section class="section-block"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">Established strength</p><h2>Photography with context, not just isolated images.</h2></div><div><p>Justy Media began as a photography project in 2020. That experience now supports businesses and publications that need a coherent set of images rather than a disconnected collection of files.</p><p>The repository and historic site material demonstrate automotive, editorial, product and landscape work. New briefs are scoped around subjects and environments that can be handled properly.</p></div></div></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">Capabilities</p><h2>Images made for real channels.</h2><div class="capability-grid"><article><h3>Automotive photography</h3><p>Vehicle portraits, details, road scenes and complete collections for owners, features and brands.</p></article><article><h3>Commercial &amp; brand photography</h3><p>Purposeful product, place and brand imagery for websites and marketing materials.</p></article><article><h3>Website photography</h3><p>Image sets planned around page layouts, crops, loading requirements and the story the website needs to tell.</p></article><article><h3>Social media content</h3><p>Consistent stills prepared for the formats and rhythm of ongoing social communication.</p></article><article><h3>Editorial photography</h3><p>Feature-led image stories, supported by genuine commissioned work for RUSH Magazine.</p></article><article><h3>Editing &amp; delivery</h3><p>Careful selection, colour work and organised delivery in practical formats for their intended use.</p></article></div></div></section>
      <section class="section-block"><div class="content-width"><p class="eyebrow">Approach</p><h2>Plan the use before the shoot.</h2><ol class="numbered-list"><li><strong>Brief and shot needs</strong><span>Define where the images will appear, the subject, location and required formats.</span></li><li><strong>Visual plan</strong><span>Shape a practical shot list while leaving room for the strongest opportunities on the day.</span></li><li><strong>Photography</strong><span>Create a coherent set with enough variety for wide, close and channel-specific uses.</span></li><li><strong>Edit and delivery</strong><span>Select, finish and organise images so they are straightforward to put to work.</span></li></ol></div></section>
      <section class="section-block contrast"><div class="wide-width"><div class="section-heading"><div><p class="eyebrow">Relevant work</p><h2>Established photography collections</h2></div><a class="text-link" href="/photography/">View all photography</a></div><div class="link-card-grid"><a href="/photography/automotive-photography/"><span>Automotive portfolio</span><strong>Six complete vehicle collections</strong></a><a href="/photography/rush-magazine/"><span>Editorial photography</span><strong>RUSH Magazine features</strong></a></div></div></section>`
  },
  {
    path: "/services/digital-marketing/", title: "SEO & Digital Marketing Support | Justy Media", heading: "SEO & digital marketing", eyebrow: "Practical digital support",
    description: "Practical SEO, analytics, content and digital marketing support to help small businesses improve their websites and online visibility.",
    intro: "Understandable support for smaller businesses that want to improve their website, measurement and marketing materials without guarantees or unnecessary jargon.",
    serviceType: "SEO and digital marketing support",
    content: `<section class="section-block"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">Useful, measurable support</p><h2>Improve the foundations before chasing shortcuts.</h2></div><div><p>Digital marketing support starts with what you already have: the website, its content, the way enquiries are measured and the materials used to promote it.</p><p>Recommendations are explained in plain language and prioritised by likely usefulness. No rankings, traffic or revenue are guaranteed.</p></div></div></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">Capabilities</p><h2>Practical ways to strengthen your online presence.</h2><div class="capability-grid"><article><h3>On-page SEO</h3><p>Titles, descriptions, headings, internal links and page content improved around real search intent.</p></article><article><h3>Technical SEO reviews</h3><p>Crawlability, canonical URLs, redirects, structured data, sitemaps and performance risks checked methodically.</p></article><article><h3>Search Console &amp; analytics</h3><p>Setup and configuration that helps you see meaningful website activity and spot problems.</p></article><article><h3>Conversion tracking</h3><p>Measurement for enquiries, downloads and useful actions—not just a page-view total.</p></article><article><h3>Content improvements</h3><p>Clearer service pages, calls to action and supporting content shaped around audience questions.</p></article><article><h3>Campaign creative</h3><p>Email, social and campaign assets that connect the message back to a coherent website journey.</p></article><article><h3>Reporting &amp; support</h3><p>Regular, understandable review with priorities for the next useful improvements.</p></article></div></div></section>
      <section class="section-block"><div class="content-width"><p class="eyebrow">Approach</p><h2>Review, prioritise, improve, learn.</h2><ol class="numbered-list"><li><strong>Review</strong><span>Understand the current site, tracking, content and active marketing work.</span></li><li><strong>Prioritise</strong><span>Separate essential fixes from worthwhile experiments and lower-value busywork.</span></li><li><strong>Implement</strong><span>Make agreed technical, content and creative improvements carefully.</span></li><li><strong>Report and refine</strong><span>Look at useful signals, explain what they mean and decide what comes next.</span></li></ol></div></section>
      <section class="section-block contrast"><div class="wide-width"><p class="eyebrow">Relevant work</p><h2>First-party analytics for Justy Media</h2><p class="lede narrow">The website includes a genuine lightweight analytics system for page views, contact clicks, downloads and outbound actions, with a separate reporting dashboard.</p><a class="button button-secondary" href="/work/#justy-media-platform">View the project overview</a></div></section>`
  }
];

function servicePage(service) {
  const crumbs = [{ label: "Home", href: "/" }, { label: "Services", href: "/services/" }, { label: service.heading, href: service.path }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro(service.eyebrow, service.heading, service.intro)}${service.content}${cta("Have a project in mind?", "Share the brief, the stage you are at and what would make the work useful. I’ll come back with a practical next step.")}</main>`;
  return documentHtml({
    ...service, breadcrumbs: crumbs, body,
    schemas: [{ "@type": "Service", "@id": `${origin}${service.path}#service`, name: service.heading, serviceType: service.serviceType, description: service.description, url: absolute(service.path), provider: { "@id": `${origin}/#business` }, areaServed: { "@type": "Country", name: "United Kingdom" } }]
  });
}

function servicesHub() {
  const pagePath = "/services/";
  const title = "Creative Services | Justy Media";
  const description = "Explore web design, graphic design, photography, SEO and digital marketing services from Justy Media, an independent Peak District creative studio.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Services", href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("Independent creative studio", "Creative services", "Website development, graphic design, photography and practical digital marketing—connected by one clear creative approach.")}
    <section class="section-block"><div class="wide-width"><div class="service-grid service-grid-large">${serviceCard("/services/web-design/", "01", "Web design & development", "Small-business websites, landing pages, redesigns, responsive development, analytics and ongoing support.")}${serviceCard("/services/graphic-design/", "02", "Graphic design & branding", "Identity, logo development, print artwork, social and website graphics, plus ongoing design help.")}${serviceCard("/services/photography-content/", "03", "Photography & content", "Automotive, editorial, product and brand imagery created for websites, campaigns and social channels.")}${serviceCard("/services/digital-marketing/", "04", "SEO & digital marketing", "On-page and technical SEO, analytics, content improvements, campaign assets and understandable reporting.")}</div></div></section>
    <section class="section-block contrast"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">Connected support</p><h2>Bring in the disciplines the project actually needs.</h2></div><div><p>A website may need new photography. A campaign may need a landing page and social artwork. An SEO review may reveal that the content and page structure need rebuilding.</p><p>Justy Media can connect those parts without presenting itself as a large agency. You work directly with Andrew, and the scope stays honest about what is being delivered.</p></div></div></div></section>
    <section class="section-block"><div class="content-width"><p class="eyebrow">Starting a project</p><h2>A straightforward first conversation.</h2><p class="lede">You do not need a finished brief. Share what the business is trying to achieve, what already exists and where you feel stuck. From there, I can help define a useful scope.</p><a class="button button-primary" href="/contact-us/">Discuss your project</a></div></section>${cta()}</main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, schemas: [{ "@type": "CollectionPage", name: "Justy Media creative services", url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` }, about: servicePages.map((item) => ({ "@type": "Service", name: item.heading, url: absolute(item.path) })) }] });
}

function workPage() {
  const pagePath = "/work/";
  const title = "Creative Portfolio & Case Studies | Justy Media";
  const description = "Explore website, graphic design, marketing and photography projects completed by Justy Media for businesses, publications and personal brands.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Work", href: pagePath }];
  const structuredImages = [
    ownedPhoto("/photography/automotive-photography/mazda-mx5-mk2/_DSC9930-Edit-Edit-2.jpg", "Silver Mazda MX-5 used within the Justy Media website portfolio", 2828, 3535),
    ownedPhoto("/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8098-Edit.JPG", "Driver's view into the Alfa Romeo GTV Cup cabin", 4000, 5000),
    ownedPhoto("/photography/automotive-photography/honda-nsx/_DSC8923-Edit-2.jpg", "Close view of a red Honda NSX bonnet", 2828, 3535)
  ];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("Selected work", "Creative work with real foundations.", "A growing collection of website, identity, marketing and photography work. Every published item below is supported by material in the Justy Media project—no invented clients or results.")}
    <section id="justy-media-platform" class="case-study"><div class="wide-width case-study-grid"><div class="case-study-media">${responsiveImage({ src: "/photography/automotive-photography/mazda-mx5-mk2/_DSC9930-Edit-Edit-2.jpg", alt: "Silver Mazda MX-5 used within the Justy Media website portfolio", width: 2828, height: 3535 })}</div><div class="case-study-copy"><p class="eyebrow">Website · custom tool · analytics</p><h2>Justy Media web platform</h2><p>A self-owned digital project combining a static creative-studio website, reusable gallery data, build-time HTML generation, responsive Cloudflare image delivery and a lightweight first-party analytics system.</p><ul class="tag-list"><li>Web design</li><li>Responsive development</li><li>Technical SEO</li><li>Analytics</li><li>Content architecture</li></ul><a class="text-link" href="/services/web-design/">Explore web design services</a></div></div></section>
    <section id="justy-media-identity" class="case-study contrast"><div class="wide-width case-study-grid reverse"><div class="case-study-media logo-panel"><img src="${logo}" width="2639" height="1511" alt="Justy Media monochrome identity mark" loading="lazy"></div><div class="case-study-copy"><p class="eyebrow">Identity · digital application</p><h2>Justy Media identity</h2><p>The genuine identity used across the studio: an established monochrome mark paired here with a dark visual system, warm gold emphasis and an editorial approach to large photography.</p><ul class="tag-list"><li>Logo application</li><li>Colour system</li><li>Typography</li><li>Digital design</li></ul><a class="text-link" href="/services/graphic-design/">Explore graphic design services</a></div></div></section>
    <section class="case-study"><div class="wide-width case-study-grid"><div class="case-study-media">${responsiveImage({ src: "/photography/rush-magazine/alfa-romeo-gtv-cup/_DSC8098-Edit.JPG", alt: "Driver's view into the Alfa Romeo GTV Cup cabin", width: 4000, height: 5000 })}</div><div class="case-study-copy"><p class="eyebrow">Editorial photography</p><h2>RUSH Magazine features</h2><p>Two complete automotive editorials covering an Alfa Romeo GTV Cup and a Eunos Roadster Mk1. Each feature combines details, portraits and road imagery into a coherent visual sequence.</p><ul class="tag-list"><li>Editorial photography</li><li>Automotive</li><li>Location work</li><li>Image editing</li></ul><div class="button-row"><a class="text-link" href="/photography/rush-magazine/alfa-romeo-gtv-cup/">Alfa Romeo feature</a><a class="text-link" href="/photography/rush-magazine/eunos-roadster-mk1/">Eunos Roadster feature</a></div></div></div></section>
    <section class="case-study contrast"><div class="wide-width case-study-grid reverse"><div class="case-study-media">${responsiveImage({ src: "/photography/automotive-photography/honda-nsx/_DSC8923-Edit-2.jpg", alt: "Close view of a red Honda NSX bonnet", width: 2828, height: 3535 })}</div><div class="case-study-copy"><p class="eyebrow">Photography &amp; content</p><h2>Automotive collections</h2><p>Six published vehicle collections ranging from moorland and woodland portraits to road, cabin and mechanical details.</p><ul class="tag-list"><li>Automotive photography</li><li>Location portraits</li><li>Detail imagery</li><li>Image delivery</li></ul><a class="text-link" href="/photography/automotive-photography/">Browse all collections</a></div></div></section>
    <section class="section-block"><div class="content-width"><p class="eyebrow">Marketing work</p><h2>Published only when there is enough to show.</h2><p class="lede">SEO, analytics and campaign support are part of the service offer, and the Justy Media platform demonstrates the technical foundations. Separate client marketing cards will be added only when suitable public material exists.</p></div></section>${cta()}</main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, structuredImages, schemas: [{ "@type": "CollectionPage", name: "Justy Media creative portfolio", url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` } }] });
}

function portfolioPage(page) {
  const gallery = Array.isArray(page.images);
  const shareImage = gallery ? `${page.folder}${page.images[0][0]}` : (page.cards[0].image || `${portfolioPages[page.cards[0].galleryKey].folder}${portfolioPages[page.cards[0].galleryKey].images[0][0]}`);
  const cardPhotos = (page.cards || []).map((card) => {
    if (card.image) return { src: card.image, alt: card.alt, width: card.width, height: card.height, structuredData: card.structuredData };
    const collection = portfolioPages[card.galleryKey];
    return portfolioPhoto(collection, collection.images[0]);
  });
  let content;
  if (page.cards) {
    content = `<section class="section-block"><div class="wide-width"><div class="collection-grid">${page.cards.map((card) => {
      const details = card.galleryKey ? portfolioPages[card.galleryKey] : null;
      const image = card.image || `${details.folder}${details.images[0][0]}`;
      const alt = card.alt || details.images[0][1];
      const width = card.width || details.images[0][2];
      const height = card.height || details.images[0][3];
      return `<a class="collection-card" href="${card.href}">${responsiveImage({ src: image, alt, width, height })}<div><p class="work-type">${card.description}</p><h2>${card.title}</h2><span class="text-link">View collection</span></div></a>`;
    }).join("")}</div></div></section>`;
  } else {
    content = `<section class="section-block gallery-section"><div class="wide-width"><div class="gallery-grid" data-gallery>${page.images.map(([file, alt, width, height]) => {
      const source = `${page.folder}${file}`;
      const orientationClass = width > height ? ' class="gallery-landscape"' : "";
      return `<figure${orientationClass}><a class="gallery-trigger" href="${encodedPath(source)}" data-full="${encodedPath(source)}" data-alt="${escapeHtml(alt)}">${responsiveImage({ src: source, alt, width, height })}<span class="sr-only">View larger image</span></a><figcaption><span>${escapeHtml(alt)}</span><a href="${encodedPath(source)}" download>Download original</a></figcaption></figure>`;
    }).join("")}</div></div></section>`;
  }
  const photographyResource = page.path === "/photography/"
    ? `<aside class="photography-resource-panel"><div class="content-width"><div><p class="eyebrow">Free resource</p><h2>Planning a shoot or checking camera equipment?</h2><p>Use free tools for depth of field, shutter counts, video shutter speed and recording-time calculations.</p></div><a class="button button-secondary" href="/resources/camera-tools/">Explore Free Camera Tools</a></div></aside>`
    : "";
  const body = `<main id="main-content">${breadcrumbs(page.breadcrumbs)}${pageIntro(gallery ? "Photography collection" : "Photography portfolio", page.heading, page.intro)}${content}${photographyResource}<section class="portfolio-next"><div class="content-width"><p>Need photography for a website, campaign or editorial feature?</p><a class="text-link" href="/services/photography-content/">Explore photography &amp; content services</a></div></section></main>`;
  const schema = gallery
    ? { "@type": "ImageGallery", name: page.heading, url: absolute(page.path), description: page.description, author: { "@id": `${origin}/#business` }, associatedMedia: imageObjects(page.images.map((image) => portfolioPhoto(page, image))) }
    : { "@type": "CollectionPage", name: page.heading, url: absolute(page.path), description: page.description, isPartOf: { "@id": `${origin}/#website` }, associatedMedia: imageObjects(cardPhotos) };
  return documentHtml({ path: page.path, title: page.title, description: page.description, breadcrumbs: page.breadcrumbs, body, gallery, shareImage, shareAlt: gallery ? page.images[0][1] : page.cards[0].alt, schemas: [schema] });
}

function aboutPage() {
  const pagePath = "/about-us/";
  const title = "About Justy Media | Peak District Creative Studio";
  const description = "Meet Justy Media, an independent Peak District creative studio combining website development, graphic design, photography and digital marketing.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "About", href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("About Justy Media", "Independent by design.", "Justy Media is Andrew Ambrose’s independent creative studio, based in the Peak District and working with businesses across the UK.")}
    <section class="section-block"><div class="content-width story-layout"><div class="logo-panel about-mark"><img src="${logo}" width="2639" height="1511" alt="Justy Media logo" loading="lazy"></div><div><h2>From photography to a broader creative studio.</h2><p>Andrew’s interest in image-making started with a five-megapixel point-and-shoot camera and developed through years of photographing cars, landscapes, products and editorial features.</p><p>Justy Media was founded in 2020 as a home for that photography. Over time, the work expanded naturally into graphic design, websites and the practical digital support that helps creative work perform in the real world.</p><p>Today, Justy Media brings those disciplines together: website development, graphic design, photography and digital marketing, delivered directly by Andrew rather than presented as the output of a large team.</p></div></div></section>
    <section class="section-block contrast"><div class="content-width"><div class="prose-grid"><div><p class="eyebrow">The approach</p><h2>Good creative work should also be useful.</h2></div><div><p>The visual result matters, but so do clarity, accessibility, performance, maintainability and the experience someone has when they encounter it.</p><p>That is why the studio works across connected disciplines. Photography can be planned around a website. A visual identity can carry through campaign assets. SEO can inform better page structure and content without flattening the creative idea.</p></div></div></div></section>
    <section class="section-block"><div class="wide-width"><p class="eyebrow">Established work</p><h2>See where the studio started.</h2><div class="link-card-grid"><a href="/photography/automotive-photography/"><span>Automotive photography</span><strong>Six vehicle collections</strong></a><a href="/photography/rush-magazine/"><span>Editorial photography</span><strong>RUSH Magazine features</strong></a><a href="/work/"><span>Studio work</span><strong>Website, identity and digital systems</strong></a></div></div></section>${cta("Work directly with Justy Media.", "If you have a website, design, photography or digital project in mind, tell me where you are and what you would like to improve.")}</main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, schemas: [{ "@type": "AboutPage", name: title, url: absolute(pagePath), description, mainEntity: { "@id": `${origin}/#business` }, isPartOf: { "@id": `${origin}/#website` } }, organisationSchema()] });
}

function contactPage() {
  const pagePath = "/contact-us/";
  const title = "Contact Justy Media | Start Your Project";
  const description = "Contact Justy Media to discuss a website, design, photography or digital marketing project in the Peak District or elsewhere in the UK.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Contact", href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("Start a conversation", "Tell me what you’re working on.", "Enquire about a website, graphic design, photography, SEO, digital marketing or ongoing creative support. You do not need a finished brief.")}
    <section class="section-block"><div class="wide-width contact-layout"><div class="contact-details"><p class="eyebrow">Direct contact</p><h2>Based in the Peak District, working across the UK.</h2><p>Email is the most reliable way to begin. Share the context, where the project is now and what a good outcome would look like.</p><p><strong>Email</strong><br><a href="mailto:${email}">${email}</a></p><p><strong>Social</strong><br><a href="https://www.instagram.com/justymedia/">Instagram</a> · <a href="https://www.facebook.com/justymedia/">Facebook</a></p><p class="note">Submitting the form opens your email application with the enquiry details prepared. No form data is stored by this website.</p></div>
      <form class="enquiry-form" action="mailto:${email}" method="get" data-email-form>
        <div class="form-row"><label for="name">Name <span aria-hidden="true">*</span></label><input id="name" name="name" type="text" autocomplete="name" required></div>
        <div class="form-row"><label for="email">Email <span aria-hidden="true">*</span></label><input id="email" name="email" type="email" autocomplete="email" required></div>
        <div class="form-row"><label for="business">Business or organisation <span>(optional)</span></label><input id="business" name="business" type="text" autocomplete="organization"></div>
        <div class="form-row"><label for="project-type">Project type <span>(optional)</span></label><select id="project-type" name="project-type"><option value="">Please choose</option><option>Website project</option><option>Graphic design</option><option>Photography</option><option>SEO and digital marketing</option><option>Ongoing creative support</option><option>General enquiry</option></select></div>
        <div class="form-row"><label for="budget">Budget range <span>(optional)</span></label><select id="budget" name="budget"><option value="">Not set or prefer not to say</option><option>Under £1,000</option><option>£1,000–£2,500</option><option>£2,500–£5,000</option><option>£5,000+</option></select></div>
        <div class="form-row full"><label for="message">Tell me about the project <span aria-hidden="true">*</span></label><textarea id="message" name="message" rows="7" required placeholder="What are you trying to create or improve? Include any useful timings or links."></textarea></div>
        <div class="form-row full"><button class="button button-primary" type="submit">Prepare email enquiry</button><p class="form-help">Your email application will open so you can review and send the message. Read the <a href="/privacy-policy.html">privacy policy</a>.</p></div>
      </form></div></section></main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, schemas: [{ "@type": "ContactPage", name: title, url: absolute(pagePath), description, mainEntity: { "@id": `${origin}/#business` }, isPartOf: { "@id": `${origin}/#website` } }] });
}

function resourcesPage() {
  const pagePath = "/resources/";
  const title = "Free Creative Resources | Justy Media";
  const description = "Explore free resources from Justy Media, including automotive phone wallpapers and practical camera tools for photographers and videographers.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Resources", href: pagePath }];
  const structuredImages = [
    ownedPhoto("/phone-wallpapers/_DSC8937-Edit.jpg", "Red Honda NSX in woodland sunlight, available as a Justy Media phone wallpaper", 2372, 4216),
    ownedPhoto("/photography/automotive-photography/mk1-audi-r8/_DSC9950-Edit-2.JPG", "Driver-focused Audi R8 interior photographed by Justy Media", 3966, 4957)
  ];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("Free Resources", "Useful extras for photographers and creatives.", "A small collection of free resources created around photography, content and practical creative work. Download automotive wallpapers from the Justy Media archive or use browser-based camera tools to plan a shoot, inspect image data and check used equipment.")}
    <section class="section-block resources-overview"><div class="wide-width"><div class="resource-card-grid">
      <article class="resource-card"><div class="resource-card-media">${responsiveImage({ src: "/phone-wallpapers/_DSC8937-Edit.jpg", alt: "Red Honda NSX in woodland sunlight, available as a Justy Media phone wallpaper", width: 2372, height: 4216 })}</div><div class="resource-card-copy"><p class="eyebrow">Free download</p><h2>Free Phone Wallpapers</h2><p>Download a selection of Justy Media automotive photographs prepared as high-resolution phone wallpapers for personal use.</p><a class="button button-secondary" href="/phone-wallpapers/">Browse Wallpapers</a></div></article>
      <article class="resource-card"><div class="resource-card-media">${responsiveImage({ src: "/photography/automotive-photography/mk1-audi-r8/_DSC9950-Edit-2.JPG", alt: "Driver-focused Audi R8 interior photographed by Justy Media", width: 3966, height: 4957 })}</div><div class="resource-card-copy"><p class="eyebrow">Browser-based tools</p><h2>Free Camera Tools</h2><p>Use practical browser-based tools for checking shutter counts, reading camera metadata, calculating depth of field and planning video settings or storage.</p><a class="button button-secondary" href="/resources/camera-tools/">Explore Camera Tools</a></div></article>
    </div><div class="free-resource-note"><p class="eyebrow">Made to be useful</p><h2>Free to use, with no account required.</h2><p>The wallpapers are available for personal use, while the camera tools open directly in a browser. Each resource has clear guidance on its own page.</p></div></div></section>
    <section class="portfolio-next"><div class="content-width"><p>Looking for more photography or support with a creative project?</p><div class="button-row"><a class="text-link" href="/photography/">Explore Photography</a><a class="text-link" href="/contact-us/">Contact Justy Media</a></div></div></section></main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, shareImage: "/phone-wallpapers/_DSC8937-Edit.jpg", shareAlt: "Red Honda NSX photographed by Justy Media", structuredImages, schemas: [{ "@type": "CollectionPage", name: "Free creative resources", url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` }, hasPart: [{ "@id": `${origin}/phone-wallpapers/` }, { "@id": `${origin}/resources/camera-tools/` }] }] });
}

function cameraToolCard(tool) {
  return `<article class="tool-card"><p class="tool-label">${escapeHtml(tool.label)}</p><h3>${escapeHtml(tool.name)}</h3><p>${escapeHtml(tool.description)}</p><a class="text-link external-tool-link" href="${tool.url}" data-camera-tool="${tool.slug}">${escapeHtml(tool.cta)} <span class="external-destination">on 27tools <span aria-hidden="true">↗</span></span></a></article>`;
}

function cameraToolsPage() {
  const pagePath = "/resources/camera-tools/";
  const title = "Free Camera Tools for Photographers | Justy Media";
  const description = "Use free camera tools for shutter counts, EXIF data, depth of field, video shutter speed and recording-time planning, powered by 27tools.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Resources", href: "/resources/" }, { label: "Camera Tools", href: pagePath }];
  const metadataTools = cameraTools.filter((tool) => tool.group === "metadata");
  const planningTools = cameraTools.filter((tool) => tool.group === "planning");
  const body = `<main id="main-content">${breadcrumbs(crumbs)}<section class="page-hero camera-tools-hero"><div class="content-width"><p class="eyebrow">Photography Resources</p><h1>Free camera tools for photographers and videographers.</h1><p class="lede">Whether you are checking a used camera, planning depth of field or working out the storage required for a video shoot, these free browser-based tools provide quick, practical answers without installing additional software.</p><p class="resource-disclosure">These tools are built and maintained on <a href="https://27tools.co/tools/camera-tools/">27tools <span aria-hidden="true">↗</span></a>, another independent project by Andrew Ambrose. Selecting a tool will take you to 27tools to use it.</p></div></section>
    <section class="section-block tool-collection"><div class="wide-width"><div class="tool-section-heading"><p class="eyebrow">Camera files</p><h2>Shutter count and camera metadata</h2><p>Original camera files can contain useful metadata about the camera, lens and exposure settings. Compatible files may also include the camera’s shutter count, which can provide additional context when buying or selling used equipment.</p></div><div class="tool-grid tool-grid-four">${metadataTools.map(cameraToolCard).join("")}</div><aside class="information-panel"><p class="eyebrow">File guidance</p><h3>Use an original camera file</h3><p>Edited, exported, compressed or social-media images often have their metadata removed. For the best chance of finding shutter-count or EXIF information, use an untouched file taken directly from the camera. Not every camera model records shutter count in a readable field, so a result cannot be guaranteed.</p><p>A shutter-count result is one piece of context and does not, by itself, determine a camera’s condition or remaining life.</p></aside></div></section>
    <section class="section-block contrast tool-collection"><div class="wide-width"><div class="tool-section-heading"><p class="eyebrow">Before the shoot</p><h2>Photography and video planning</h2><p>Use these calculators to plan focus, motion and storage before a photography or video shoot.</p></div><div class="tool-grid">${planningTools.map(cameraToolCard).join("")}</div></div></section>
    <section class="portfolio-next"><div class="content-width"><p>Explore Justy Media photography or return to all free resources.</p><div class="button-row"><a class="text-link" href="/photography/">View Photography</a><a class="text-link" href="/resources/">All Resources</a></div></div></section></main>`;
  const itemList = { "@type": "ItemList", "@id": `${origin}${pagePath}#tools`, name: "Free camera tools for photographers and videographers", numberOfItems: cameraTools.length, itemListElement: cameraTools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, url: tool.url })) };
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, shareImage: "/photography/automotive-photography/mk1-audi-r8/_DSC9950-Edit-2.JPG", shareAlt: "Driver-focused Audi R8 interior photographed by Justy Media", schemas: [{ "@type": "CollectionPage", name: "Free camera tools for photographers and videographers", url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` }, mainEntity: { "@id": itemList["@id"] } }, itemList] });
}

function wallpapersPage() {
  const pagePath = "/phone-wallpapers/";
  const title = "Free Automotive Phone Wallpapers | Justy Media";
  const description = "Download free automotive phone wallpapers photographed and edited by Justy Media for personal use.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Phone Wallpapers", href: pagePath }];
  const images = [
    ["_DSC8927-Edit.jpg", "Red Recaro seat in a Honda NSX phone wallpaper", 2371, 4216],
    ["_DSC8937-Edit.jpg", "Red Honda NSX in woodland sunlight phone wallpaper", 2372, 4216],
    ["_DSC9634-Edit.JPG", "Close view of a silver performance car wheel phone wallpaper", 3375, 6000],
    ["_DSC9814-Edit.JPG", "Black sports car beneath a dramatic sunset phone wallpaper", 3311, 5886]
  ];
  const folder = "/phone-wallpapers/";
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("Free resource", "Automotive phone wallpapers", "Download a small selection of Justy Media automotive photographs prepared for personal phone use.")}
    <section class="section-block gallery-section"><div class="wide-width"><p class="resource-note">Choose an image to view it larger, then download the original file. These wallpapers are for personal use; the website terms still apply.</p><div class="gallery-grid wallpaper-grid" data-gallery>${images.map(([file, alt, width, height]) => { const source = `${folder}${file}`; return `<figure><a class="gallery-trigger" href="${encodedPath(source)}" data-full="${encodedPath(source)}" data-alt="${escapeHtml(alt)}">${responsiveImage({ src: source, alt, width, height })}<span class="sr-only">View wallpaper larger</span></a><figcaption><span>${escapeHtml(alt)}</span><a href="${encodedPath(source)}" download>Download original</a></figcaption></figure>`; }).join("")}</div></div></section><section class="portfolio-next"><div class="content-width"><p>Looking for commercial or editorial photography?</p><a class="text-link" href="/services/photography-content/">Explore photography &amp; content services</a></div></section></main>`;
  const structuredImages = images.map(([file, alt, width, height]) => ownedPhoto(`${folder}${file}`, alt, width, height));
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, gallery: true, shareImage: `${folder}${images[1][0]}`, shareAlt: images[1][1], schemas: [{ "@type": "ImageGallery", name: "Justy Media automotive phone wallpapers", url: absolute(pagePath), description, associatedMedia: imageObjects(structuredImages) }] });
}

function legalHtml(source) {
  const text = fs.readFileSync(path.join(root, source), "utf8");
  const lines = text.split(/\r?\n/);
  let output = "";
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { if (inList) { output += "</ul>"; inList = false; } continue; }
    if (line.startsWith("# ")) output += `<h2>${escapeHtml(line.slice(2))}</h2>`;
    else if (line.startsWith("## ")) output += `<h3>${escapeHtml(line.slice(3))}</h3>`;
    else if (line.startsWith("- ")) { if (!inList) { output += "<ul>"; inList = true; } output += `<li>${linkEmail(escapeHtml(line.slice(2)))}</li>`; }
    else output += `<p>${linkEmail(escapeHtml(line))}</p>`;
  }
  if (inList) output += "</ul>";
  return output;
}

function linkEmail(value) {
  return value.replace(email, `<a href="mailto:${email}">${email}</a>`);
}

function legalPage(pagePath, title, description, heading, source) {
  const crumbs = [{ label: "Home", href: "/" }, { label: heading, href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}<section class="page-hero compact-hero"><div class="content-width"><p class="eyebrow">Website information</p><h1>${heading}</h1></div></section><section class="section-block"><div class="content-width"><article class="legal-content">${legalHtml(source)}</article></div></section></main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, schemas: [{ "@type": "WebPage", name: title, url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` } }] });
}

function imageLicensingPage() {
  const pagePath = "/image-licensing/";
  const title = "Image Licensing | Justy Media";
  const description = "Request permission or a licence to use original photography by Andrew Ambrose and Justy Media for editorial, commercial, web, print or promotional purposes.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Image licensing", href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}<section class="page-hero compact-hero"><div class="content-width"><p class="eyebrow">Photography rights</p><h1>Image licensing</h1></div></section><section class="section-block"><div class="content-width"><article class="legal-content"><h2>Using Justy Media photography</h2><p>Unless expressly stated otherwise, photographs displayed on Justy Media were created by Andrew Ambrose and are protected by copyright.</p><p>Images may not be copied, republished, redistributed, edited or used commercially without prior written permission. Displaying a photograph on this website does not grant a licence or permission to reuse it.</p><h2>Request a licence</h2><p>Licensing may be available for editorial, commercial, web, print and promotional use. Terms depend on the particular image, intended use, duration, territory and distribution.</p><p><a href="/contact-us/">Contact Justy Media</a> with the image URL and details of the proposed use to request permission or a licence.</p><h2>Separate usage terms</h2><p>Where a free resource, wallpaper or individual download has separately stated usage terms, those terms take precedence for that particular download. They do not extend to other images on this website.</p></article></div></section></main>`;
  return documentHtml({ path: pagePath, title, description, breadcrumbs: crumbs, body, schemas: [{ "@type": "WebPage", name: title, url: absolute(pagePath), description, isPartOf: { "@id": `${origin}/#website` } }] });
}

function notFoundPage() {
  const pagePath = "/404.html";
  const title = "Page Not Found | Justy Media";
  const description = "The page you requested could not be found on Justy Media.";
  const crumbs = [{ label: "Home", href: "/" }, { label: "Page not found", href: pagePath }];
  const body = `<main id="main-content">${breadcrumbs(crumbs)}${pageIntro("404", "That page could not be found.", "It may have moved, been retired or never existed. The links below will take you back to genuine parts of the site.")}<section class="section-block"><div class="content-width"><div class="link-card-grid"><a href="/services/"><span>Explore</span><strong>Creative services</strong></a><a href="/work/"><span>Browse</span><strong>Selected work</strong></a><a href="/photography/"><span>View</span><strong>Photography portfolio</strong></a><a href="/contact-us/"><span>Start</span><strong>A project enquiry</strong></a></div></div></section></main>`;
  return documentHtml({ path: pagePath, title, description, robots: "noindex,follow", breadcrumbs: crumbs, body, schemas: [] });
}

function legacyFallback(title, destination) {
  return `<!doctype html>\n<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${absolute(destination)}"><meta http-equiv="refresh" content="0;url=${destination}"></head><body><p>This page has moved to <a href="${destination}">${absolute(destination)}</a>.</p></body></html>\n`;
}

function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${absolute(url)}</loc>\n    <lastmod>${modified}</lastmod>\n  </url>`).join("\n")}\n</urlset>\n`;
}

writeRoute("/", homePage());
writeRoute("/services/", servicesHub());
for (const service of servicePages) writeRoute(service.path, servicePage(service));
writeRoute("/work/", workPage());
for (const page of Object.values(portfolioPages)) writeRoute(page.path, portfolioPage(page));
writeRoute("/phone-wallpapers/", wallpapersPage());
writeRoute("/resources/", resourcesPage());
writeRoute("/resources/camera-tools/", cameraToolsPage());
writeRoute("/about-us/", aboutPage());
writeRoute("/contact-us/", contactPage());
writeRoute("/image-licensing/", imageLicensingPage());
writeRoute("/privacy-policy.html", legalPage("/privacy-policy.html", "Privacy Policy | Justy Media", "How Justy Media handles personal information, website usage data and enquiries.", "Privacy policy", "privacy-policy.txt"));
writeRoute("/terms-and-conditions.html", legalPage("/terms-and-conditions.html", "Terms and Conditions | Justy Media", "Terms and conditions for using the Justy Media website and discussing creative services.", "Terms and conditions", "terms-and-conditions.txt"));
writeRoute("/404.html", notFoundPage());
writeRoute("/about-me.html", legacyFallback("About page moved | Justy Media", "/about-us/"));
writeRoute("/contact.html", legacyFallback("Contact page moved | Justy Media", "/contact-us/"));
writeRoute("/services-pricing.html", legacyFallback("Services page moved | Justy Media", "/services/"));

const sitemapUrls = [
  "/", "/services/", ...servicePages.map((page) => page.path), "/work/",
  ...Object.values(portfolioPages).map((page) => page.path), "/phone-wallpapers/",
  "/resources/", "/resources/camera-tools/",
  "/about-us/", "/contact-us/", "/image-licensing/", "/privacy-policy.html", "/terms-and-conditions.html"
];
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap(sitemapUrls));
console.log(`Built ${sitemapUrls.length} canonical pages and sitemap.xml`);
