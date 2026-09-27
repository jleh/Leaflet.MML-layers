const test = require("node:test");
const assert = require("node:assert");
const { setupDom } = require("./helpers");

setupDom();
const L = require("leaflet");
require("../../mmlLayers.js");

// Proj4Leaflet is loaded part way through, so the steps run in order within one test
test("EPSG:3067 needs Proj4Leaflet", async (t) => {
  await t.test("throws before Proj4Leaflet is loaded", () => {
    assert.strictEqual(L.Proj, undefined);
    const proj4LeafletError = { name: "Error", message: /requires Proj4Leaflet/ };
    assert.throws(() => L.TileLayer.MML.get3067Proj(), proj4LeafletError);
    assert.throws(() => L.tileLayer.mml("Peruskartta_3067"), proj4LeafletError);
  });

  await t.test("works after Proj4Leaflet is loaded", () => {
    require("proj4leaflet");
    const crs = L.TileLayer.MML.get3067Proj();
    assert.ok(crs instanceof L.Proj.CRS);
    assert.strictEqual(crs.code, "EPSG:3067");
    assert.strictEqual(
      L.tileLayer.mml("Peruskartta_3067")._url,
      "https://tiles.kartat.kapsi.fi/peruskartta_3067/{z}/{x}/{y}.jpg"
    );
  });
});
