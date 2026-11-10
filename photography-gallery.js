(function () {
  "use strict";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const number = (value) => String(value).padStart(2, "0");
  const desktop = matchMedia("(min-width: 1000px) and (min-height: 600px) and (hover: hover) and (pointer: fine)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-exhibition]").forEach((gallery) => {
    const stage = gallery.querySelector(".exhibition-stage");
    const viewport = gallery.querySelector(".exhibition-viewport");
    const track = gallery.querySelector(".exhibition-track");
    const panels = [...track.querySelectorAll(".exhibition-panel")];
    const toolbar = gallery.querySelector(".exhibition-toolbar");
    const current = gallery.querySelector("[data-gallery-current]");
    const progress = gallery.querySelector(".exhibition-progress");
    const hint = gallery.querySelector("[data-gallery-hint]");
    const previous = gallery.querySelector("[data-gallery-previous]");
    const next = gallery.querySelector("[data-gallery-next]");
    const steps = gallery.querySelector(".exhibition-step");
    const layouts = [...gallery.querySelectorAll("[data-gallery-layout]")];
    const collections = gallery.classList.contains("exhibition-collections");
    let grid = false;
    let pinned = false;
    let travel = 0;
    let start = 0;
    let active = 0;
    let positions = [];
    let scrollFrame = 0;
    let measureFrame = 0;
    let stageHeight = 0;

    // Uses the real document scroll. No wheel/touch interception or nested scrollbar.
    function update() {
      scrollFrame = 0;
      let fraction = 0;
      let index = 0;
      if (pinned && travel > 0) {
        const offset = clamp(window.scrollY - start, 0, travel);
        fraction = offset / travel;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        let distance = Infinity;
        positions.forEach((position, i) => {
          const candidate = Math.abs(position - offset);
          if (candidate <= distance) { index = i; distance = candidate; }
        });
        if (offset === 0) index = 0;
        if (offset === travel) index = panels.length - 1;
      } else {
        // The same count works in normal-flow gallery and grid modes.
        let distance = Infinity;
        panels.forEach((panel, i) => {
          const candidate = Math.abs(panel.getBoundingClientRect().top - window.innerHeight * .3);
          if (candidate < distance) { index = i; distance = candidate; }
        });
        fraction = panels.length > 1 ? index / (panels.length - 1) : 1;
      }
      active = index;
      const label = number(index + 1);
      if (current.textContent !== label) current.textContent = label;
      progress.firstElementChild.style.transform = `scaleX(${fraction})`;
      progress.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
      progress.setAttribute("aria-valuetext", `${index + 1} of ${panels.length} ${collections ? "collections" : "photographs"}`);
      previous.disabled = pinned ? fraction <= .0001 : index === 0;
      next.disabled = pinned ? fraction >= .9999 : index === panels.length - 1;
    }

    function onScroll() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(update);
    }

    function unpin() {
      pinned = false;
      travel = 0;
      positions = [];
      gallery.classList.remove("is-pinned");
      gallery.style.removeProperty("height");
      gallery.style.removeProperty("--gallery-height");
      gallery.style.removeProperty("--media-height");
      panels.forEach((panel) => panel.style.removeProperty("--panel-width"));
      track.style.removeProperty("transform");
      steps.hidden = true;
    }

    function measure({ preserve = true } = {}) {
      measureFrame = 0;
      const oldTravel = travel;
      const oldHeight = stageHeight;
      const oldPinned = pinned;
      const oldStart = start;
      const oldY = window.scrollY;
      const inside = oldPinned && oldY >= oldStart && oldY <= oldStart + oldTravel;
      const after = oldPinned && oldY > oldStart + oldTravel;
      const fraction = oldTravel ? clamp((oldY - oldStart) / oldTravel, 0, 1) : 0;
      if (grid || !desktop.matches || reducedMotion.matches || panels.length < 2) {
        unpin();
      } else {
        pinned = true;
        gallery.classList.add("is-pinned");
        stageHeight = window.innerHeight;
        gallery.style.setProperty("--gallery-height", `${stageHeight}px`);
        const gutter = parseFloat(getComputedStyle(track).paddingLeft) || 20;
        const maxWidth = Math.max(240, viewport.clientWidth - gutter * 2 - 80);
        const available = viewport.clientHeight - 32;
        let mediaHeight = available - 110;
        // Caption height is measured at the actual panel width, including wrapped text.
        // Iteration also handles a change in width when portrait/landscape panels resize.
        for (let pass = 0; pass < 5; pass++) {
          gallery.style.setProperty("--media-height", `${Math.max(0, mediaHeight)}px`);
          panels.forEach((panel) => {
            const width = collections ? Math.min(viewport.clientWidth * .72, maxWidth) : clamp(mediaHeight * Number(panel.dataset.ratio), 240, maxWidth);
            panel.style.setProperty("--panel-width", `${width}px`);
          });
          const caption = Math.max(...panels.map((panel) => panel.querySelector(".exhibition-caption").getBoundingClientRect().height));
          const nextHeight = Math.floor(available - caption);
          if (Math.abs(nextHeight - mediaHeight) <= 1) break;
          // A descending bound avoids caption-wrap oscillation at narrow widths.
          mediaHeight = pass ? Math.min(mediaHeight, nextHeight) : nextHeight;
        }
        gallery.style.setProperty("--media-height", `${Math.max(0, mediaHeight)}px`);
        travel = Math.max(0, track.scrollWidth - viewport.clientWidth);
        const captionsFit = panels.every((panel) => mediaHeight + panel.querySelector(".exhibition-caption").getBoundingClientRect().height <= available + 1);
        if (travel <= 1 || mediaHeight < 160 || !captionsFit) {
          unpin();
        } else {
          // Exactly one vertical pixel per horizontal pixel, plus the sticky viewport.
          gallery.style.height = `${stageHeight + travel}px`;
          start = gallery.getBoundingClientRect().top + window.scrollY;
          const first = panels[0].offsetLeft;
          const last = panels[panels.length - 1].offsetLeft - first;
          // Spread destinations across the real travel. Clamping every panel's left
          // edge would give the final visible panels identical destinations, making
          // Previous/Next stick at the end of a row of portrait photographs.
          positions = panels.map((panel) => last ? (panel.offsetLeft - first) / last * travel : 0);
          steps.hidden = false;
        }
      }
      hint.textContent = pinned ? "Scroll down to explore · scroll up to return" : grid ? "Collection overview · select an image or collection" : collections ? "Explore the collections" : "Select a photograph to view full screen";
      if (preserve && oldPinned) {
        let target = oldY;
        if (pinned && inside) target = start + fraction * travel;
        else if (pinned && after) target = oldY + travel - oldTravel + stageHeight - oldHeight;
        else if (!pinned && inside) target = gallery.getBoundingClientRect().top + window.scrollY + panels[active].offsetTop - toolbar.offsetHeight;
        else if (!pinned && after) target = oldY + gallery.offsetHeight - oldTravel - oldHeight;
        if (Math.abs(target - window.scrollY) > 1) window.scrollTo({ top: target, behavior: "instant" });
      }
      update();
    }

    function scheduleMeasure() {
      if (!measureFrame) measureFrame = requestAnimationFrame(() => measure());
    }

    function goTo(index, smooth = true) {
      index = clamp(index, 0, panels.length - 1);
      if (pinned) {
        window.scrollTo({ top: start + positions[index], behavior: smooth && !reducedMotion.matches ? "smooth" : "instant" });
      } else {
        panels[index].scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "instant" : "smooth" });
      }
    }

    layouts.forEach((button) => button.addEventListener("click", () => {
      const wantGrid = button.dataset.galleryLayout === "grid";
      if (grid === wantGrid) return;
      // Keep the toolbar under the visitor when the shell's extra height disappears.
      const top = stage.getBoundingClientRect().top;
      const anchor = gallery.getBoundingClientRect().top + window.scrollY;
      grid = wantGrid;
      gallery.classList.toggle("is-grid", grid);
      layouts.forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
      measure({ preserve: false });
      window.scrollTo({ top: Math.max(0, anchor - Math.max(0, top)), behavior: "instant" });
      update();
    }));

    previous.addEventListener("click", () => goTo(active - 1));
    next.addEventListener("click", () => goTo(active + 1));
    track.addEventListener("focusin", (event) => {
      if (!pinned || !event.target.matches(":focus-visible")) return;
      const index = panels.indexOf(event.target.closest(".exhibition-panel"));
      // Tab navigation must reveal off-screen links instead of scrolling a clipped box.
      if (index !== -1) {
        viewport.scrollLeft = 0;
        const rect = panels[index].getBoundingClientRect();
        if (rect.left < 0 || rect.right > viewport.clientWidth) goTo(index, false);
      }
    });
    track.addEventListener("photography:reveal", (event) => {
      const index = panels.indexOf(event.target.closest(".exhibition-panel"));
      if (index === -1) return;
      viewport.scrollLeft = 0;
      if (pinned) goTo(index, false);
      else panels[index].scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    track.addEventListener("click", () => { viewport.scrollLeft = 0; });
    gallery.querySelector(".exhibition-switch").hidden = false;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("pageshow", scheduleMeasure);
    desktop.addEventListener("change", scheduleMeasure);
    reducedMotion.addEventListener("change", scheduleMeasure);
    track.querySelectorAll("img").forEach((image) => {
      // Transformed off-screen slides are unreliable candidates for native lazy loading.
      // Fetch them on approach; reserve dimensions in HTML before any request completes.
      image.addEventListener("load", scheduleMeasure);
      image.addEventListener("error", scheduleMeasure);
    });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleMeasure);
      [viewport, toolbar, gallery.querySelector(".exhibition-footer"), ...gallery.querySelectorAll(".exhibition-caption")].forEach((element) => observer.observe(element));
    }
    if ("IntersectionObserver" in window) {
      const approaching = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        track.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
        observer.disconnect();
      }, { rootMargin: "800px 0px" });
      approaching.observe(gallery);
    } else {
      track.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
    }
    document.fonts?.ready.then(scheduleMeasure);
    measure({ preserve: false });
  });

  // Collection cover images need the same CDN-to-original fallback as photographs.
  document.querySelectorAll("[data-exhibition] img[data-original]").forEach((image) => {
    function fallback() {
      if (image.dataset.fallbackUsed) return;
      image.dataset.fallbackUsed = "true";
      image.removeAttribute("srcset");
      image.src = image.dataset.original;
    }
    image.addEventListener("error", fallback);
    if (image.complete && !image.naturalWidth) fallback();
  });
})();
