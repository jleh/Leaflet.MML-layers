const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stubLeaflet } = require("./helpers");

// Runs the plugin like a plain <script> tag: no AMD define and no CommonJS module
const source = fs.readFileSync(path.join(__dirname, "../../mmlLayers.js"), "utf8");

function runAsScript(globals) {
  vm.runInContext(source, vm.createContext(globals));
}

test("throws a clear error when Leaflet is not loaded", () => {
  const isLoadError = { name: "Error", message: "Leaflet must be loaded first." };
  assert.throws(() => runAsScript({ window: {} }), isLoadError);
  // A script context without window, such as a worker
  assert.throws(() => runAsScript({}), isLoadError);
});

test("extends the global L", () => {
  const L = stubLeaflet();
  const window = { L: L };

  runAsScript({ window: window });

  assert.strictEqual(window.L, L);
  assert.strictEqual(typeof L.tileLayer.mml, "function");
  assert.strictEqual(typeof L.tileLayer.mml_wmts, "function");
  assert.strictEqual(typeof L.TileLayer.MML, "function");
});
