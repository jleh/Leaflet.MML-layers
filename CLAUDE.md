# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`leaflet-mml-layers` (published to npm) is a Leaflet 1.x plugin with predefined tile layers for the National Land Survey of Finland (MML) maps. The whole library is one file, `mmlLayers.js`. There is no build step: `package.json` `main` points at the source file, and `.npmignore` limits the package to `LICENSE`, `README.md`, `mmlLayers.js` and `package.json`. Check with `npm pack --dry-run` after adding files.

`mmlLayers.js` ships to browsers untranspiled, so keep it in the same ES5 style (`var`, `function`, no arrow functions or template literals).

## Commands

```sh
npm ci
npm run check                 # Prettier 2.2.1 (printWidth 120, no trailing commas); fix with: npx prettier --write .
npm test                      # Unit tests: node --test "test/unit/*.test.js"
npm run test:examples         # Loads every example in headless Chromium via Playwright

node --test test/unit/layers.test.js                                    # one test file
node --test --test-name-pattern="mml_wmts" "test/unit/*.test.js"        # tests matching a name
npm install --no-save leaflet@1.0.1 && npm test                         # oldest supported Leaflet; run `npm ci` afterwards
```

- The examples test needs a Playwright browser: `npx playwright install --only-shell chromium`. Set `CHROMIUM_PATH` to use a different Chromium binary.
- The examples test fails while a non-default Leaflet is installed with `--no-save`. Run `npm ci` to restore.
- Node 22.22.2+, 24.15+ or 26+ is required, because jsdom needs it.

CI (`.github/workflows/ci.yml`) runs on pushes to `master` and on PRs:

- **lint:** `npm run check`
- **unit:** Node 22/24 × Leaflet 1.0.1/1.9.4. Leaflet 1.0.1 is the bottom of the `^1.0.1` peer range.
- **examples:** `npm run test:examples`

## Architecture of `mmlLayers.js`

**UMD wrapper.** It supports three ways of loading:

- AMD: `define(["leaflet"], ...)`
- CommonJS: uses `window.L` if it exists, otherwise `require("leaflet")`
- plain `<script>`: requires a global `L`, otherwise throws `Error("Leaflet must be loaded first.")`

The global object is read through a guarded `root` variable. Never reference `window` directly outside that guard, because the plugin must load without a global `window`. The factory mutates the `L` it is given and returns it.

**`L.TileLayer.MML` / `L.tileLayer.mml(type, options)`: Kapsi TMS tiles.**

- `type` is looked up case-insensitively in the `urls` map, and an unknown type throws an `Error` that lists the available keys.
- `*_3067` types need Proj4Leaflet, checked by `checkProj4Leaflet()`.
- The types without `_3067` (EPSG:900913: `peruskartta`, `taustakartta`, `ortokuva`) are deprecated because Kapsi's tiles no longer work. Removing them from `urls` is a breaking change reserved for the next major version.
- Kapsi tile URLs use `{z}/{x}/{y}`.

**`L.TileLayer.MML.get3067Proj()`** returns the EPSG:3067 `L.Proj.CRS` (TM35FIN origin, bounds and 20 resolutions) that maps must use for the `_3067` and WMTS layers.

**`L.tileLayer.mml_wmts(options)`: MML's WMTS service.**

- URL: `avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/<layer>/default/ETRS-TM35FIN/{z}/{y}/{x}.png`. Note the `{y}/{x}` order.
- `options.layer` defaults to `taustakartta`.
- `options.apiKey` is appended as `?api-key=`. MML requires a key (or basic auth).
- `maxZoom` is 15.

**Conventions:**

- Thrown values are `Error` objects, never strings.
- Attribution links use `target="new" rel="noopener noreferrer"`.

## Tests

- **Unit tests (`test/unit/`, `node:test`, no framework).** `node --test` runs each file in its own process, and each file sets up global state differently:

  - `no-window.test.js`: no DOM, Leaflet stubbed through `require.cache`
  - `browser-global.test.js`: plain-script loading via `vm`
  - `global-leaflet.test.js`: jsdom with a separate `window.L`
  - `layers.test.js`: jsdom, `require("leaflet")` path
  - `proj4leaflet.test.js`: Proj4Leaflet loaded partway through

  Add new tests to the file whose setup matches instead of combining setups. Shared helpers (`setupDom`, `stubLeaflet`) are in `test/unit/helpers.js`.

- **Examples test (`test/examples/examples.test.js`).**
  - It serves the repo from a local HTTP server and answers `unpkg.com/<pkg>@<version>/<path>` from `node_modules`.
  - It fails unless `<version>` exactly matches the installed devDependency. When changing a library version in `examples/`, update the pinned devDependency in `package.json` to match, and the other way round.
  - Tile requests get a 1×1 PNG.
  - The test fails on page errors, console errors, failed tiles and any unexpected external request.
  - It checks that the map-centre tile (`/6/28/49` Kapsi, `/6/49/28` WMTS) is requested, which only happens with the EPSG:3067 CRS.

## Examples and demo site

- `examples/` pages load Leaflet, proj4, Proj4Leaflet and RequireJS from unpkg, plus `../mmlLayers.js`. The WMTS examples read the MML API key from `?apiKey=` in the page URL.
- The public demo (https://jleh.github.io/Leaflet.MML-layers) is served from the `gh-pages` branch. That branch is `master` plus a root `index.html` landing page, and it is updated by merging `master` into it.

## Releases

- Bump `version` in both `package.json` and `package-lock.json`.
- Add an entry at the top of the README "Changelog" list.
- Publish manually with `npm publish`.
