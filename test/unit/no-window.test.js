const test = require("node:test");
const assert = require("node:assert");
const Module = require("node:module");
const path = require("node:path");
const { stubLeaflet } = require("./helpers");

test("loads without a global window", () => {
  assert.strictEqual(typeof window, "undefined");

  // Leaflet itself needs a DOM, so stub it to check that the plugin wrapper doesn't touch window.
  const stub = stubLeaflet();
  // Resolve leaflet the same way mmlLayers.js does
  const id = require.resolve("leaflet", { paths: [path.join(__dirname, "../..")] });
  const cached = new Module(id);
  cached.exports = stub;
  cached.loaded = true;
  require.cache[id] = cached;

  try {
    const L = require("../../mmlLayers.js");
    assert.strictEqual(L, stub);
    assert.strictEqual(typeof L.tileLayer.mml, "function");
    assert.strictEqual(typeof L.tileLayer.mml_wmts, "function");
  } finally {
    delete require.cache[id];
  }
});
