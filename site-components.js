(function () {
  const navigation = [
    ["/photography/", "Photography Portfolio", "photography"],
    ["/#design", "Graphic Design Portfolio", "design"],
    ["/phone-wallpapers/", "Freebies!!", "wallpapers"],
    ["/about-us/", "About", "about"],
    ["/contact-us/", "Contact", "contact"],
    ["/#blog", "Blog", "blog"],
  ];

  const footerLinks = [
    ["/photography/automotive-photography/", "Automotive Photography"],
    ["/photography/rush-magazine/", "RUSH Magazine"],
    ["/phone-wallpapers/", "Phone Wallpapers"],
    ["/services-pricing.html", "Services & Pricing"],
    ["/about-us/", "About Us"],
    ["/contact-us/", "Contact Us"],
    ["/privacy-policy.html", "Privacy Policy"],
    ["/terms-and-conditions.html", "Terms And Conditions"],
  ];

  function currentSection() {
    const path = window.location.pathname;
    if (path.includes("about-me") || path.includes("about-us")) return "about";
    if (path.includes("contact")) return "contact";
    if (path.includes("phone-wallpapers")) return "wallpapers";
    if (path.includes("photography")) return "photography";
    return "";
  }

  function header() {
    const activeSection = currentSection();
    const links = navigation
      .map(([href, label, section]) => `<li><a${section === activeSection ? ' class="active"' : ""} href="${href}">${label}</a></li>`)
      .join("");

    return `<header class="site-header"><div class="top-strip"><div class="social-links"><a href="https://www.instagram.com/justymedia/" aria-label="Instagram">IG</a><a href="https://www.facebook.com/justymedia/" aria-label="Facebook">FB</a></div><a class="email-link" href="mailto:andrew.n.ambrose@gmail.com">Email: andrew.n.ambrose@gmail.com</a></div><nav class="main-nav" aria-label="Main navigation"><a class="brand" href="/" aria-label="Justy Media home"><img src="/logo final AI transparrent.png" alt="Justy Media"></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span><span class="sr-only">Menu</span></button><ul id="nav-menu" class="nav-menu">${links}<li><a class="store-button" href="/#store">Store</a></li></ul></nav></header>`;
  }

  function footer() {
    const links = footerLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("");
    return `<footer class="site-footer"><img src="/logo final AI transparrent.png" alt="Justy Media"><p>Follow Us On:</p><div class="footer-socials"><a href="https://www.facebook.com/justymedia/" aria-label="Facebook">f</a><a href="https://www.instagram.com/justymedia/" aria-label="Instagram">ig</a></div><nav aria-label="Footer links">${links}</nav><small>&copy; 2026 By Justy Media.</small></footer>`;
  }

  function initialiseNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector("#nav-menu");

    if (!toggle || !menu || toggle.dataset.ready) return;
    toggle.dataset.ready = "true";
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    menu.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function mount() {
    const existingHeader = document.querySelector(".site-header");
    const existingFooter = document.querySelector(".site-footer");
    if (existingHeader) existingHeader.outerHTML = header();
    if (existingFooter) existingFooter.outerHTML = footer();
    initialiseNavigation();
  }

  window.JustySiteComponents = { footer, header, initialiseNavigation, mount };
})();
