(function () {
  "use strict";
  const galleries = [...document.querySelectorAll("[data-gallery]")];
  if (!galleries.length) return;
  let lightbox;
  let items = [];
  let selected = 0;
  let returnFocus;
  let media;
  let message;
  const number = (value) => String(value).padStart(2, "0");

  function showImage(index) {
    selected = Math.min(items.length - 1, Math.max(0, index));
    const trigger = items[selected];
    const source = trigger.dataset.full;
    const alt = trigger.dataset.alt || trigger.querySelector("img").alt;
    message.hidden = false;
    message.textContent = "Loading photograph…";
    media.alt = alt;
    media.src = source;
    lightbox.querySelector(".lightbox-caption").textContent = alt;
    lightbox.querySelector(".viewer-count").textContent = `${number(selected + 1)} / ${number(items.length)}`;
    lightbox.querySelector("[data-viewer-previous]").disabled = selected === 0;
    lightbox.querySelector("[data-viewer-next]").disabled = selected === items.length - 1;
    lightbox.querySelector(".viewer-download").href = source;
    lightbox.querySelector(".viewer-original").href = source;
    if (media.complete && media.naturalWidth) message.hidden = true;
  }

  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("dialog");
    lightbox.className = "image-lightbox gallery-viewer";
    lightbox.setAttribute("aria-label", "Full-screen photograph viewer");
    lightbox.setAttribute("aria-describedby", "viewer-caption");
    lightbox.innerHTML = '<div class="viewer-toolbar"><p class="viewer-count" role="status" aria-live="polite"></p><button class="button button-secondary" type="button" data-viewer-close>Close <span class="sr-only">image viewer</span></button></div><div class="lightbox-media"><img alt=""><p class="viewer-message" role="status"></p></div><div class="viewer-footer"><p class="lightbox-caption" id="viewer-caption"></p><div class="button-row"><button class="button button-secondary" type="button" data-viewer-previous>Previous</button><button class="button button-secondary" type="button" data-viewer-next>Next</button><a class="button button-secondary viewer-original" target="_blank" rel="noopener">Open original</a><a class="button button-secondary viewer-download" download>Download original</a></div></div>';
    media = lightbox.querySelector("img");
    message = lightbox.querySelector(".viewer-message");
    media.addEventListener("load", () => { message.hidden = true; });
    media.addEventListener("error", () => {
      message.hidden = false;
      message.textContent = "This photograph could not load. Try Open original below.";
    });
    lightbox.querySelector("[data-viewer-close]").addEventListener("click", () => lightbox.close());
    lightbox.querySelector("[data-viewer-previous]").addEventListener("click", () => showImage(selected - 1));
    lightbox.querySelector("[data-viewer-next]").addEventListener("click", () => showImage(selected + 1));
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("keydown", (event) => {
      const navigation = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: items.length - 1 };
      if (!(event.key in navigation) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      showImage(navigation[event.key]);
    });
    lightbox.addEventListener("close", () => {
      const target = items[selected] || returnFocus;
      target?.focus({ preventScroll: true });
      if (target?.closest("[data-exhibition]")) target.dispatchEvent(new CustomEvent("photography:reveal", { bubbles: true }));
      else target?.scrollIntoView({ block: "nearest" });
      media.removeAttribute("src");
    });
    document.body.append(lightbox);
    return lightbox;
  }

  galleries.forEach((gallery) => {
    gallery.addEventListener("click", (event) => {
      const trigger = event.target.closest(".gallery-trigger");
      if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      ensureLightbox();
      items = [...gallery.querySelectorAll(".gallery-trigger")];
      returnFocus = trigger;
      showImage(items.indexOf(trigger));
      lightbox.showModal();
      lightbox.querySelector("[data-viewer-close]").focus();
    });
    gallery.querySelectorAll("img[data-original]").forEach((image) => {
      function fallback() {
        if (image.dataset.fallbackUsed) return;
        image.dataset.fallbackUsed = "true";
        image.removeAttribute("srcset");
        image.src = image.dataset.original;
      }
      image.addEventListener("error", fallback);
      if (image.complete && !image.naturalWidth) fallback();
    });
  });
})();
