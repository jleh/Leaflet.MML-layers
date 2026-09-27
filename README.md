# Leaflet.MML-layers

National Land Survey of Finland (MML) free maps on [Leaflet](http://leafletjs.com/).

Predefined Leaflet tile layer settings for [kartat.kapsi.fi](http://kartat.kapsi.fi/) TMS service (`EPSG:3067` layers).
If you want to use `EPSG:3067` layers you must include [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet)

**Deprecated:** Kapsi's `EPSG:900913` tiles (`Peruskartta`, `Taustakartta` and `Ortokuva` without the `_3067` suffix) no longer work. These layer types will be removed in the next major version.

[WMTS layers](https://www.maanmittauslaitos.fi/karttakuvapalvelu). After 9.12.2020 using these layers requires an [API key](https://www.maanmittauslaitos.fi/rajapinnat/api-avaimen-ohje). API key can be provided as a parameter or using basic auth.
Proj4Leaflet must be loaded to use WMTS layers.

Since version 1.1.0 it's possible to use [WMTS layers](http://www.maanmittauslaitos.fi/aineistot-palvelut/rajapintapalvelut/paikkatiedon-palvelualustan-pilotti) from MML.

### [Demo](http://jleh.github.io/Leaflet.MML-layers)

## Changelog

- **3.0.2** The plugin wrapper no longer throws `window is not defined` when there is no global `window`. Allow calling `mml_wmts()` without options. Throw clear errors for unknown layer types and when Proj4Leaflet is missing for EPSG:3067 layers. Fix attribution link markup. Deprecate the Kapsi `EPSG:900913` layers, which no longer work.
- **3.0.1** Use HTTPS for Kapsi tiles.
- **3.0.0** Add support for MML api key. Move Leaflet to peerDependencies.
- **2.1.0** Use avoin-karttakuva MML endpoint. Tiles from old endpoint are not updated.
- **2.0.0** Compatible with Leaflet 1.0
- **1.3.1** Project can be installed as an npm package.
- **1.2.0** Added support for JS module loaders (like RequireJS).

## Installation

Just download and include `mmlLayers.js` in your page after Leaflet or install it from npm.

```js
$ npm install --save leaflet-mml-layers
```

Note for npm install: If you want to use EPSG:3067 projection you need to install `proj4leaflet`
and require it before this lib.

```js
require("proj4leaflet");
var L = require("leaflet-mml-layers");
```

## Usage

### WMTS layers

```js
var map = new L.map("map", {
  crs: L.TileLayer.MML.get3067Proj()
}).setView([61, 25], 6);

L.tileLayer.mml_wmts({ layer: "maastokartta", apiKey: "key" }).addTo(map);
```

Available layers:

- taustakartta
- maastokartta
- selkokartta
- ortokuva
- kiinteistojaotus
- kiinteistotunnukset

### EPSG:3067 layers

```js
// Set the EPSG:3067 CRS on the map
var map = new L.map("map", {
  crs: L.TileLayer.MML.get3067Proj()
}).setView([61, 25], 6);

L.tileLayer.mml("Peruskartta_3067").addTo(map);
```

Available layers:

- Peruskartta_3067
- Taustakartta_3067
- Ortokuva_3067

## Static methods

`L.TileLayer.MML.get3067Proj()` Returns `L.Proj.CRS` object for `EPSG:3067`

## Development

Requires Node.js 22.x (22.22.2 or newer), 24.x (24.15 or newer) or 26+, the versions jsdom supports.

```sh
npm ci
npm run check          # Prettier
npm test               # Unit tests (Node + jsdom)
npm run test:examples  # Loads the examples in headless Chromium
```

The examples test needs a Playwright browser: run `npx playwright install --only-shell chromium` once
(add `--with-deps` on Linux to also install system libraries). It serves the CDN files in the examples from
`node_modules`, so run `npm ci` again if you installed a different Leaflet version for the unit tests.
