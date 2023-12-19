# Leaflet.MML-layers

National Land Survey of Finland (MML) free maps on [Leaflet](http://leafletjs.com/).

Predefined Leafler tile layer settings for [kartat.kapsi.fi](http://kartat.kapsi.fi/) TMS service. Supports both `EPSG:900913` & `EPSG:3067` layers.
If you want to use `EPSG:3067` layers you must include [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet)

[WMTS layers](https://www.maanmittauslaitos.fi/karttakuvapalvelu). After 9.12.2020 using these layers requires an [API key](https://www.maanmittauslaitos.fi/rajapinnat/api-avaimen-ohje). API key can be provided as a parameter or using basic auth.
Proj4Leaflet must be loaded to use WMTS layers.

Since version 1.1.0 it's possible to use [WMTS layers](http://www.maanmittauslaitos.fi/aineistot-palvelut/rajapintapalvelut/paikkatiedon-palvelualustan-pilotti) from MML.

### [Demo](http://jleh.github.io/Leaflet.MML-layers)

## Changelog

- **3.0.1** Use HTTPS for Kapsi tiles.
- **3.0.0** Add support for MML api key. Move Leafltet to peerDependencies.
- **2.1.0** Use avoin-karttakuva MML endpoint. Tiles from old endpoint are not updated.
- **2.0.0** Compatible with Leaflet 1.0
- **1.3.1** Project can be installed as an npm package.
- **1.2.0** Added support for module JS module loaders (like RequireJS).

## Installation

Just download and include `mmlLayers.js` to your page after leaflet or install it from npm.

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

L.tileLayer.mml_wmts({ layer: "maastokartta", apiKey: 'key' }).addTo(map);
```

Available layers:
* taustakartta
* maastokartta
* selkokartta
* ortokuva
* kiinteistojaotus
* kiinteistotunnukset

### EPSG:900913 layers

```js
L.tileLayer.mml("Taustakartta");
L.tileLayer.mml("Peruskartta");
L.tileLayer.mml("Ortokuva");

// Or add to map
L.tileLayer.mml("Peruskartta").addTo(map);
```

### EPSG:3067 layers

```js
// Works like 900913 but set correct CRS to map
var map = new L.map("map", {
  crs: L.TileLayer.MML.get3067Proj(),
  continuousWorld: true,
  worldCopyJump: false
}).setView([61, 25], 6);

L.tileLayer.mml("Peruskartta_3067").addTo(map);
```

## Static methods

`L.TileLayer.MML.get3067Proj()` Returns `L.Proj.CRS.TMS` object for `EPSG:3067`
