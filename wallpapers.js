const wallpaperFiles = [
  "_DSC8927-Edit.jpg",
  "_DSC8937-Edit.jpg",
  "_DSC9634-Edit.JPG",
  "_DSC9814-Edit.JPG"
];

const wallpaperGrid = document.querySelector("[data-wallpapers]");

if (wallpaperGrid) {
  const files = wallpaperFiles.map((file) => `/phone-wallpapers/${encodeURIComponent(file)}`);
  Promise.all(files.map(checkImage)).then((available) => {
    const images = available.filter(Boolean);
    if (!images.length) {
      wallpaperGrid.replaceWith(createMessage("New wallpapers are being prepared. Check back soon."));
      return;
    }
    for (const source of images) wallpaperGrid.append(createWallpaper(source));
  });
}

async function checkImage(source) {
  try {
    const response = await fetch(source, { method: "HEAD" });
    return response.ok && response.headers.get("content-type")?.startsWith("image/") ? source : undefined;
  } catch {
    return undefined;
  }
}

function createWallpaper(source) {
  const figure = document.createElement("figure");
  figure.tabIndex = 0;
  const image = document.createElement("img");
  image.src = `/cdn-cgi/image/width=1200,fit=scale-down,quality=82,format=auto${source}`;
  image.alt = "Justy Media automotive phone wallpaper. Open full resolution image.";
  image.loading = "lazy";
  image.onerror = () => { image.src = source; };
  figure.append(image);
  figure.addEventListener("click", () => openWallpaper(source, image.alt));
  figure.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openWallpaper(source, image.alt); });
  return figure;
}

function createMessage(text) {
  const message = document.createElement("p");
  message.className = "empty-gallery";
  message.textContent = text;
  return message;
}

function openWallpaper(source, alt) {
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
