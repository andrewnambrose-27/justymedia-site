const pageKey = document.body.dataset.portfolioPage;
const portfolioPage = portfolioPages[pageKey];

if (portfolioPage) {
  document.title = `${portfolioPage.title} | Justy Media`;
  document.querySelector("#site-shell").innerHTML = createPortfolioHeader();
  document.querySelector("#portfolio-content").replaceChildren(createPortfolioContent(portfolioPage));
  document.querySelector("#site-footer").innerHTML = createPortfolioFooter();
  initialisePortfolioMenu();
}

function createPortfolioHeader() {
  return `<header class="site-header"><div class="top-strip"><div class="social-links"><a href="https://www.instagram.com/justymedia/" aria-label="Instagram">IG</a><a href="https://www.facebook.com/justymedia/" aria-label="Facebook">FB</a><a href="#" aria-label="Behance">Be</a><a href="#" aria-label="Fiverr">Fi</a><a href="#" aria-label="YouTube">YT</a></div><a class="email-link" href="mailto:andrew.n.ambrose@gmail.com">Email: andrew.n.ambrose@gmail.com</a></div><nav class="main-nav" aria-label="Main navigation"><a class="brand" href="/" aria-label="Justy Media home"><img src="/logo final AI transparrent.png" alt="Justy Media"></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span><span class="sr-only">Menu</span></button><ul id="nav-menu" class="nav-menu"><li><a class="active" href="/photography/">Photography Portfolio</a></li><li><a href="/#design">Graphic Design Portfolio</a></li><li><a href="/phone-wallpapers/">Freebies!!</a></li><li><a href="/about-me.html">About</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/#blog">Blog</a></li><li><a class="store-button" href="/#store">Store</a></li></ul></nav></header>`;
}

function createPortfolioFooter() {
  return `<footer class="site-footer"><img src="/logo final AI transparrent.png" alt="Justy Media"><p>Follow Us On:</p><div class="footer-socials"><a href="https://www.facebook.com/justymedia/" aria-label="Facebook">f</a><a href="https://www.instagram.com/justymedia/" aria-label="Instagram">ig</a><a href="#" aria-label="YouTube">yt</a></div><nav aria-label="Footer links"><a href="/photography/automotive-photography/">Automotive Photography</a><a href="/photography/rush-magazine/">RUSH Magazine</a><a href="/phone-wallpapers/">Phone Wallpapers</a><a href="/services-pricing.html">Services &amp; Pricing</a><a href="/about-me.html">About Us</a><a href="/contact.html">Contact Us</a><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms-and-conditions.html">Terms And Conditions</a></nav><small>&copy; 2026 By Justy Media.</small></footer>`;
}

function createPortfolioContent(page) {
  const wrapper = document.createElement("div");
  const intro = document.createElement("section");
  intro.className = "portfolio-intro";
  intro.innerHTML = `${page.parent ? `<p class="breadcrumb"><a href="${page.parent.href}">${page.parent.label}</a> / ${page.title}</p>` : '<p class="portfolio-kicker">Portfolio</p>'}<h1>${page.title}</h1>${page.description ? `<p>${page.description}</p>` : ""}`;
  wrapper.append(intro);

  if (page.cards) {
    const grid = document.createElement("section");
    grid.className = "collection-grid";
    for (const card of page.cards) {
      const link = document.createElement("a");
      link.className = `collection-card${card.image || card.galleryKey ? "" : " is-empty"}`;
      link.href = card.href;
      link.innerHTML = `${card.image ? '<img alt="">' : ""}<div class="collection-card-copy"><h2>${card.title}</h2><p>${card.description}</p></div>`;
      const image = link.querySelector("img");
      if (image) {
        loadPortfolioImage(image, card.image, "thumbnail");
      }
      if (card.galleryKey) {
        populateCollectionCard(link, card, portfolioPages[card.galleryKey]);
      }
      grid.append(link);
    }
    wrapper.append(grid);
    return wrapper;
  }

  if (!page.images.length) {
    const message = document.createElement("p");
    message.className = "empty-gallery";
    message.textContent = "This gallery is ready for photographs to be added.";
    wrapper.append(message);
    return wrapper;
  }

  const grid = document.createElement("section");
  grid.className = "gallery-grid";
  wrapper.append(grid);
  populateGallery(grid, page);
  return wrapper;
}

async function populateCollectionCard(card, details) {
  const available = await getAvailableImages(details);
  const label = card.querySelector(".collection-card-copy p");
  label.textContent = available.length ? `${available.length} photograph${available.length === 1 ? "" : "s"}` : "Gallery coming soon";
  if (!available.length) {
    card.classList.add("is-empty");
    return;
  }
  const image = document.createElement("img");
  image.alt = "";
  card.prepend(image);
  loadPortfolioImage(image, available[0], "thumbnail");
}

async function populateGallery(grid, page) {
  const available = await getAvailableImages(page);
  if (!available.length) {
    const message = document.createElement("p");
    message.className = "empty-gallery";
    message.textContent = "This gallery is ready for photographs to be added.";
    grid.replaceWith(message);
    return;
  }
  for (const source of available) {
    const figure = document.createElement("figure");
    figure.tabIndex = 0;
    const image = document.createElement("img");
    image.alt = `${page.title} photography by Justy Media. Open full resolution image.`;
    image.loading = "lazy";
    image.decoding = "async";
    loadPortfolioImage(image, source, "gallery");
    figure.append(image);
    figure.addEventListener("click", () => openLightbox(source, image.alt));
    figure.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openLightbox(source, image.alt);
    });
    grid.append(figure);
  }
}

async function getAvailableImages(page) {
  const candidates = page.images.map((imageName) => encodeImagePath(`${page.folder}${imageName}`));
  const checks = await Promise.all(candidates.map(async (source) => {
    try {
      const response = await fetch(source, { method: "HEAD" });
      return response.ok && response.headers.get("content-type")?.startsWith("image/") ? source : undefined;
    } catch {
      return undefined;
    }
  }));
  return checks.filter(Boolean);
}

function openLightbox(source, alt) {
  let lightbox = document.querySelector(".image-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("dialog");
    lightbox.className = "image-lightbox";
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image">&times;</button><img alt=""><a class="lightbox-download" download>Download full resolution</a>';
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
    document.body.append(lightbox);
  }
  lightbox.querySelector("img").src = source;
  lightbox.querySelector("img").alt = alt;
  lightbox.querySelector("a").href = source;
  lightbox.showModal();
}

function loadPortfolioImage(image, source, kind) {
  const original = encodeImagePath(source);
  image.src = cloudflareImageUrl(original, kind);
  image.addEventListener("error", () => {
    if (!image.dataset.triedOriginal) {
      image.dataset.triedOriginal = "true";
      image.src = original;
    }
  });
}

function cloudflareImageUrl(source, kind) {
  const options = kind === "thumbnail"
    ? "width=960,height=720,fit=cover,quality=78,format=auto"
    : "width=1400,fit=scale-down,quality=82,format=auto";
  return `/cdn-cgi/image/${options}${source}`;
}

function encodeImagePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function initialisePortfolioMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#nav-menu");
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}
