require.config({
    paths: {
        "leaflet": "https://unpkg.com/leaflet@1.0.1/dist/leaflet-src",
        "proj4": "../lib/proj4-compressed"
    }
});

define(["leaflet", "../lib/proj4leaflet-refactored", "../mmlLayers"], function() {
    var map = new L.map('map', {
        crs: L.TileLayer.MML.get3067Proj()
    }).setView([61, 25], 6);
   
    L.tileLayer.mml_wmts({ layer: "maastokartta" }).addTo(map);
});
