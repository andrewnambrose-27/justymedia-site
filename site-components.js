(function () {
  function initialiseNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector("#nav-menu");
    if (!toggle || !menu || toggle.dataset.ready) return;

    toggle.dataset.ready = "true";
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.querySelector(".sr-only").textContent = isOpen ? "Close navigation" : "Open navigation";
    });

    menu.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector(".sr-only").textContent = "Open navigation";
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
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
    initialiseNavigation();
    loadAnalytics();
  }

  window.JustySiteComponents = { initialiseNavigation, mount };
  mount();
})();
