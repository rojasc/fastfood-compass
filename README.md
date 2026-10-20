# 🍔 Fast Food Plot

Drag fast food chains around a 2×2 chart, argue with your friends about it.

Inspired by the "Food Quality × 2 A.M. Reliability" chart from @everythingplotted.

Two charts, same chains:

- `/` **Fast Food Chains**: food quality × 2 A.M. reliability
- `/ibs/` **IBS Food Compass**: delicious ↔ disgusting × normal poop ↔ repeated diarrhea

Each page keeps its own autosave and share links.

## What it does

- **Drag things around.** Tap a chain in the tray to drop it on the chart, then drag it into place. With a mouse you can drag straight from the tray.
- **Edit every label.** Title, subtitle, axis labels and the four quadrant names are all editable. Tap and type.
- **Add your own.** Upload an image (or pick a badge color) and give it a name. The image is shrunk to a tiny thumbnail in the browser.
- **Share a link.** The whole chart, custom images included, is compressed into the URL itself (`#s=...`). There's no backend and nothing is stored on a server.
- **Save an image.** Exports a PNG of the poster. On phones it opens the share sheet.
- Your work autosaves to your browser (localStorage).

## Running it

It's plain HTML/CSS/JS with no build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying

Served by GitHub Pages straight from `main` (Settings → Pages → Deploy from a branch → `main` / root).
Live at https://rojasc.github.io/fastfood-compass/

## Files

- `index.html`, `styles.css`: layout. The chart scales with container query units, so it looks the same at every size.
- `js/app.js`: UI, dragging, tray, dialogs.
- `js/state.js`: state validation, localStorage, share-link encoding (deflate + base64url).
- `js/export.js`: paints the poster onto a canvas for PNG export.
- `js/chains.js`: the built-in chain list and the fast food example chart.
- `js/ibs.js`: labels and example layout for the IBS page (reuses the chain list).
- `js/variant.js`: picks the variant from `<html data-variant>`. `ibs/index.html` is a copy of `index.html` with paths one level up, so markup changes go in both.
- `logos/`: chain icons (each brand's own site icon). Logos are trademarks of their owners and are used here just for fun.
