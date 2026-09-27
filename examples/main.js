require.config({
  paths: {
    leaflet: "https://unpkg.com/leaflet@1.9.4/dist/leaflet",
    proj4: "https://unpkg.com/proj4@2.22.0/dist/proj4",
    proj4leaflet: "https://unpkg.com/proj4leaflet@1.0.2/src/proj4leaflet"
  }
});

define(["leaflet", "proj4leaflet", "../mmlLayers"], function (L) {
  // Get an API key from MML and open this page as requirejs.html?apiKey=YOUR_KEY
  var apiKey = new URLSearchParams(window.location.search).get("apiKey");

  var map = L.map("map", {
    crs: L.TileLayer.MML.get3067Proj()
  }).setView([61, 25], 6);

  L.tileLayer.mml_wmts({ layer: "maastokartta", apiKey: apiKey }).addTo(map);
});
