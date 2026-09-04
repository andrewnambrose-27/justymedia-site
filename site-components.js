(function () {
  const logo = "/logo%20final%20AI%20transparrent.png";
  const navigation = [
    ["/services/", "Services", "services"],
    ["/work/", "Work", "work"],
    ["/photography/", "Photography", "photography"],
    ["/resources/", "Resources", "resources"],
    ["/about-us/", "About", "about"],
    ["/contact-us/", "Contact", "contact"]
  ];

  function socialIcon(platform) {
    if (platform === "instagram") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>`;
    }
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d="M13.6 22v-8h2.7l.4-3.1h-3.1V9c0-.9.3-1.5 1.6-1.5h1.7V4.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.4V14h2.8v8h3.4Z"></path></svg>`;
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

  function headerMarkup(pagePath) {
    const active = currentSection(pagePath);
    const links = navigation.map(([href, label, section]) => {
      const activeClass = section === active ? ' class="active"' : "";
      const currentPage = pagePath === href ? ' aria-current="page"' : "";
      return `<li><a${activeClass}${currentPage} href="${href}">${label}</a></li>`;
    }).join("");

    return `<a class="skip-link" href="#main-content">Skip to main content</a>
      <header class="site-header">
        <div class="top-strip"><div class="social-links"><a href="https://www.instagram.com/justymedia/" aria-label="Justy Media on Instagram" target="_blank" rel="me noopener noreferrer">${socialIcon("instagram")}</a><a href="https://www.facebook.com/justymedia/" aria-label="Justy Media on Facebook" target="_blank" rel="me noopener noreferrer">${socialIcon("facebook")}</a></div></div>
        <nav class="main-nav" aria-label="Primary navigation">
          <a class="brand" href="/" aria-label="Justy Media home"><img src="${logo}" width="2639" height="1511" alt="Justy Media"></a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span><span class="sr-only">Open navigation</span></button>
          <ul id="nav-menu" class="nav-menu">${links}</ul>
        </nav>
      </header>`;
  }

  function footerMarkup() {
    return `<footer class="site-footer">
      <div class="footer-brand"><img src="${logo}" width="2639" height="1511" alt="Justy Media"><p>Independent creative studio<br>Peak District, UK</p></div>
      <div><p class="footer-heading">Explore</p><nav aria-label="Footer services"><a href="/services/">Services</a><a href="/services/web-design/">Web design</a><a href="/services/graphic-design/">Graphic design</a><a href="/services/photography-content/">Photography &amp; content</a><a href="/services/digital-marketing/">SEO &amp; digital marketing</a><a href="/work/">Work</a></nav></div>
      <div><p class="footer-heading">Photography &amp; resources</p><nav aria-label="Footer photography and resources"><a href="/photography/">Photography overview</a><a href="/photography/automotive-photography/">Automotive photography</a><a href="/photography/rush-magazine/">RUSH Magazine</a><a href="/phone-wallpapers/">Phone wallpapers</a><a href="/resources/camera-tools/">Camera tools</a><a href="/resources/">All resources</a></nav></div>
      <div><p class="footer-heading">Justy Media</p><nav aria-label="Footer information"><a href="/about-us/">About</a><a href="/contact-us/">Contact</a><a href="/image-licensing/">Image licensing</a><a href="/privacy-policy.html">Privacy policy</a><a href="/terms-and-conditions.html">Terms and conditions</a></nav><div class="footer-socials"><a href="https://www.instagram.com/justymedia/" aria-label="Justy Media on Instagram" target="_blank" rel="noopener noreferrer">${socialIcon("instagram")}</a><a href="https://www.facebook.com/justymedia/" aria-label="Justy Media on Facebook" target="_blank" rel="noopener noreferrer">${socialIcon("facebook")}</a></div></div>
      <small>&copy; 2026 Justy Media. Website and photography by Justy Media.</small>
    </footer>`;
  }

  class JustyHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = "true";
      this.style.display = "block";
      this.innerHTML = headerMarkup(this.dataset.pagePath || window.location.pathname);
    }
  }

  class JustyFooter extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = "true";
      this.style.display = "block";
      this.innerHTML = footerMarkup();
    }
  }

  if (!customElements.get("site-header")) customElements.define("site-header", JustyHeader);
  if (!customElements.get("site-footer")) customElements.define("site-footer", JustyFooter);

  function hideVisibleBreadcrumbs() {
    document.querySelectorAll("nav.breadcrumbs").forEach((breadcrumb) => {
      breadcrumb.hidden = true;
      breadcrumb.setAttribute("aria-hidden", "true");
    });
  }

  function replaceLegacyLayout() {
    if (!document.querySelector("site-header")) {
      const legacyHeader = document.querySelector("header.site-header");
      if (legacyHeader) {
        const component = document.createElement("site-header");
        component.dataset.pagePath = window.location.pathname;
        const skipLink = legacyHeader.previousElementSibling;
        legacyHeader.replaceWith(component);
        if (skipLink?.classList.contains("skip-link")) skipLink.remove();
      }
    }

    if (!document.querySelector("site-footer")) {
      const legacyFooter = document.querySelector("footer.site-footer");
      if (legacyFooter) legacyFooter.replaceWith(document.createElement("site-footer"));
    }
  }

  function initialiseNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector("#nav-menu");
    if (!toggle || !menu || toggle.dataset.ready) return;

    toggle.dataset.ready = "true";
    const closeMenu = (returnFocus = false) => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector(".sr-only").textContent = "Open navigation";
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.querySelector(".sr-only").textContent = isOpen ? "Close navigation" : "Open navigation";
    });

    menu.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
      closeMenu(true);
    });

    window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  function loadAnalytics() {
    if (document.querySelector("script[data-justy-analytics]")) return;
    const analytics = document.createElement("script");
    analytics.src = "/site-analytics.js";
    analytics.async = true;
    analytics.dataset.justyAnalytics = "true";
    document.head.append(analytics);
  }

  function mount() {
    hideVisibleBreadcrumbs();
    replaceLegacyLayout();
    initialiseNavigation();
    loadAnalytics();
  }

  window.JustySiteComponents = { hideVisibleBreadcrumbs, replaceLegacyLayout, initialiseNavigation, mount };
  mount();
})();
