(function () {
  if (window.__justyAnalyticsLoaded) return;
  window.__justyAnalyticsLoaded = true;

  const endpoint = "https://analytics.justymedia.co.uk/collect";

  function sendAnalytics(payload) {
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Object.assign({
        path: window.location.pathname,
        href: window.location.href,
        referrer: document.referrer || "",
        title: document.title || "",
        toolId: ""
      }, payload)),
      keepalive: true
    }).catch(() => {});
  }

  sendAnalytics({ eventType: "pageview" });

  document.addEventListener("click", function (event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = target ? target.closest("a[href]") : null;

    if (!link) return;

    const href = new URL(link.href, window.location.origin);
    let eventType = "";
    let label = "";

    if (link.dataset.cameraTool && href.hostname === "27tools.co") {
      eventType = "camera_tool_outbound_click";
      label = `${link.dataset.cameraTool}|${href.hostname}`;
    } else if (href.protocol === "mailto:" || href.protocol === "tel:") {
      eventType = "contact_click";
      label = href.protocol === "mailto:" ? "email" : "telephone";
    } else if (link.hasAttribute("download")) {
      eventType = "download_click";
      label = href.pathname.split("/").pop() || "download";
    } else if (["instagram.com", "www.instagram.com", "facebook.com", "www.facebook.com"].includes(href.hostname)) {
      eventType = "social_click";
      label = href.hostname.replace(/^www\./, "");
    } else if (href.origin !== window.location.origin && /^https?:$/.test(href.protocol)) {
      eventType = "outbound_click";
      label = href.hostname.replace(/^www\./, "");
    }

    if (!eventType) return;

    sendAnalytics({
      eventType,
      path: window.location.pathname,
      toolId: label
    });
  }, { capture: true });
})();
