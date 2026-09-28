const test = require("node:test");
const assert = require("node:assert");
const { setupDom } = require("./helpers");

const window = setupDom();
const leaflet = require("leaflet");
// A global L that is a different object from require("leaflet"), with its own tileLayer factories,
// so the test shows which one the plugin extended
window.L = Object.assign(Object.create(leaflet), { TileLayer: leaflet.TileLayer.extend({}), tileLayer: {} });

test("uses window.L when Leaflet is already a global", () => {
  const L = require("../../mmlLayers.js");
  assert.strictEqual(L, window.L);
  assert.notStrictEqual(L, leaflet);
  assert.strictEqual(typeof L.tileLayer.mml, "function");
  assert.strictEqual(typeof L.TileLayer.MML.extend, "function");
  assert.strictEqual(leaflet.tileLayer.mml, undefined);
  assert.strictEqual(leaflet.TileLayer.MML, undefined);
});
