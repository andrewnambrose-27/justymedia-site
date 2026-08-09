(function () {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  let lightbox;
  let returnFocus;

  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("dialog");
    lightbox.className = "image-lightbox";
    lightbox.setAttribute("aria-label", "Image viewer");
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image viewer">&times;</button><div class="lightbox-media"><img alt=""></div><p class="lightbox-caption"></p><a class="lightbox-download" download>Download original</a>';
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("close", () => returnFocus?.focus());
    document.body.append(lightbox);
    return lightbox;
  }

  gallery.addEventListener("click", (event) => {
    const trigger = event.target.closest(".gallery-trigger");
    if (!trigger) return;
    event.preventDefault();
    const dialog = ensureLightbox();
    const source = trigger.dataset.full;
    const alt = trigger.dataset.alt || "Justy Media photograph";
    returnFocus = trigger;
    dialog.querySelector("img").src = source;
    dialog.querySelector("img").alt = alt;
    dialog.querySelector(".lightbox-caption").textContent = alt;
    dialog.querySelector(".lightbox-download").href = source;
    dialog.showModal();
    dialog.querySelector(".lightbox-close").focus();
  });

  for (const image of gallery.querySelectorAll("img[data-original]")) {
    image.addEventListener("error", () => {
      if (image.dataset.fallbackUsed) return;
      image.dataset.fallbackUsed = "true";
      image.removeAttribute("srcset");
      image.src = image.dataset.original;
    });
  }
})();
