Leaflet.MML-layers
==================

Predefined Leafler tile layer settings for [kartat.kapsi.fi](http://kartat.kapsi.fi/) TMS service. Supports both `EPSG:900913` & `EPSG:3067` layers.
If you want to use `EPSG:3067` layers you must include [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet)

Usage
-----
##### EPSG:900913 layers
```js
  new L.tileLayer.mml('Taustakartta');
  new L.tileLayer.mml('Peruskartta');
  new L.tileLayer.mml('Ortokuva');
  
  // Or add to map
  L.tileLayer.mml("Peruskartta").addTo(map);
```

##### EPSG:3067 layers
```js
  // Works like 900913 but set correct CRS to map
  var map = new L.map('map', {
                crs: L.TileLayer.MML.get3067Proj(),
                continuousWorld: true,
                worldCopyJump: false
            }).setView([61, 25], 6);
  
  L.tileLayer.mml("Peruskartta_3067").addTo(map);
```

Static methods
--------------

`L.TileLayer.MML.3067Proj()` Returns L.Proj.CRS.TMS object for `EPSG:3067`
