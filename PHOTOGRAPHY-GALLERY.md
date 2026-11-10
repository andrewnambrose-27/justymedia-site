# Photography gallery

Photography still uses the existing static build. Edit collection names, introductions, links, image order, dimensions and alt text in `portfolio-data.js`, then run `npm run build`. The work portfolio's photography introduction and feature descriptions remain in `scripts/build-site.js`.

`exhibitionGallery()` in `scripts/build-site.js` renders the overview, Automotive and RUSH indexes, all fourteen individual collections, and `/work/photography/`. `photography-gallery.css` supplies their shared presentation; navigation, branding, footer and button styles remain the existing shared components. Individual photographs use `object-fit: contain` in gallery, grid and full-screen views. Category covers use a wide crop in the pinned exhibition; their original files and alt text are unchanged.

`photography-gallery.js` enables the pinned exhibition for fine-pointer, hover-capable viewports at least 1000px wide and 600px high, unless reduced motion is requested. Small screens, touch-focused devices, reduced motion and no-JavaScript visits use normal page flow. Grid is also normal flow and removes all inline pinning height and transforms.

The sticky stage is one viewport high. The surrounding section's height is the stage height plus `track.scrollWidth - viewport.clientWidth`. A passive document scroll listener maps that exact distance to track translation in an animation frame. The browser handles entry, exit and reverse scrolling; wheel and touch events are never intercepted. Resize observers, image events and viewport changes recalculate panel sizes, wrapped caption space and travel. Resizing during the pinned section preserves the scroll fraction. Viewports without sufficient space for captions fall back to normal flow.

`portfolio-page.js` enhances image links with a native modal dialog. It supports Previous/Next, arrow keys, Home/End, Escape, counts, original-file links, loading/error messages and focus restoration. The same viewer remains available on phone wallpapers. CDN image failures fall back to the original file, including failures that occur before the enhancement script starts.

## Validation

- `npm run build` and `npm run check` pass for the production build: 38 canonical pages, 74 unique structured images and 98 redirects. The existing verifier also checks the exhibition's item counts, unchanged introductions, collection descriptions, links, photograph sources and alt text against `portfolio-data.js`.
- Chromium browser checks covered `/photography/`, the Automotive and RUSH indexes, Honda Civic EJ6 Coupe (mixed proportions), Honda NSX (portraits), Alfa Romeo GTV Cup (portraits), Suzuki Swift Sport (two landscapes), and `/work/photography/`.
- Observed desktop entry, horizontal movement, reverse scrolling, end-of-gallery release to the footer, live progress/count changes, and grid/gallery switching with no residual scroll height or transform.
- Observed resizing from 1440×900 to 1100×700 during progression: the gallery retained 35% progress, remained pinned and kept captions inside the viewport. At 390×844, pinning and its extra height were removed and there was no horizontal page overflow.
- Observed full-screen opening, Previous/Next, arrow keys, End, boundary disabling, Escape and focus restoration. Portrait and landscape compositions remained complete. The mobile viewer's controls stayed within the viewport, and the mobile grid used two columns without page overflow.
- Checked the short two-image gallery and navigation back from the end of a portrait collection. Destinations are distributed over the measured travel so multiple final visible panels do not share a navigation destination.

Browser checks used Chromium and responsive viewport sizes. Safari, Firefox, physical touch devices and a live OS reduced-motion preference have not been tested. Reduced-motion and coarse-pointer fallbacks are implemented in both the JavaScript eligibility checks and CSS media queries. Browser validation was completed before production publication.

The production publish was prepared from the latest `main` branch, retaining the Toyota GR Yaris and Lotus Exige V6 S collections, the seven-image Suzuki feature, and the existing homepage updates.
