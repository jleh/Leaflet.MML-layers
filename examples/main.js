require.config({
    paths: {
        "leaflet": "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet",
        "proj4": "../lib/proj4-compressed"
    }
});

define(["leaflet", "../lib/proj4leaflet", "../mmlLayers"], function() {
    var map = new L.map('map', {
        crs: L.TileLayer.MML.get3067Proj()
    }).setView([61, 25], 6);
   
    L.tileLayer.mml_wmts({ layer: "maastokartta" }).addTo(map);
});
