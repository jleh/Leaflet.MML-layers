const test = require("node:test");
const assert = require("node:assert");
const { setupDom } = require("./helpers");

const window = setupDom();
const leaflet = require("leaflet");
// Leaflet also sets window.L. Remove it so the plugin takes its require("leaflet") path.
delete window.L;
const L = require("../../mmlLayers.js");

const KAPSI = "https://tiles.kartat.kapsi.fi/";
const WMTS = "https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/";

test("extends the required Leaflet instance", () => {
  assert.strictEqual(window.L, undefined);
  assert.strictEqual(L, leaflet);
  assert.strictEqual(typeof leaflet.tileLayer.mml, "function");
});

test("mml layers use Kapsi tile URLs", () => {
  assert.strictEqual(L.tileLayer.mml("Peruskartta")._url, KAPSI + "peruskartta/{z}/{x}/{y}.jpg");
  assert.strictEqual(L.tileLayer.mml("ORTOKUVA")._url, KAPSI + "ortokuva/{z}/{x}/{y}.jpg");
  assert.strictEqual(L.tileLayer.mml(new String("Taustakartta"))._url, KAPSI + "taustakartta/{z}/{x}/{y}.jpg");
});

test("unknown mml layer types throw a clear error", () => {
  for (const type of ["foo", undefined, null, Symbol("x"), "constructor", "__proto__", "toString"]) {
    assert.throws(
      () => L.tileLayer.mml(type),
      { name: "Error", message: /^Unknown MML layer type ".*"\. Available: peruskartta, taustakartta/ },
      "type: " + String(type)
    );
  }
});

test("subclasses can inherit and extend urls", () => {
  const Custom = L.TileLayer.MML.extend({
    urls: L.extend(Object.create(L.TileLayer.MML.prototype.urls), { custom: "https://example.com/{z}/{x}/{y}.png" })
  });
  assert.strictEqual(new Custom("peruskartta")._url, KAPSI + "peruskartta/{z}/{x}/{y}.jpg");
  assert.strictEqual(new Custom("custom")._url, "https://example.com/{z}/{x}/{y}.png");
});

test("mml_wmts builds MML WMTS URLs", () => {
  assert.strictEqual(L.tileLayer.mml_wmts()._url, WMTS + "taustakartta/default/ETRS-TM35FIN/{z}/{y}/{x}.png");
  assert.strictEqual(
    L.tileLayer.mml_wmts({ layer: "maastokartta", apiKey: "k" })._url,
    WMTS + "maastokartta/default/ETRS-TM35FIN/{z}/{y}/{x}.png?api-key=k"
  );
  assert.strictEqual(
    L.tileLayer.mml_wmts({ layer: "ortokuva", apiKey: "k" })._url,
    WMTS + "ortokuva/default/ETRS-TM35FIN/{z}/{y}/{x}.jpg?api-key=k"
  );
});

test("attribution links to the MML license", () => {
  const layers = [L.tileLayer.mml("Ortokuva"), L.tileLayer.mml_wmts()];
  for (const layer of layers) {
    const doc = new window.DOMParser().parseFromString(layer.options.attribution, "text/html");
    const link = doc.querySelector("a");
    assert.ok(link.getAttribute("href").startsWith("https://www.maanmittauslaitos.fi/"));
    assert.strictEqual(link.getAttribute("target"), "new");
    assert.strictEqual(link.getAttribute("rel"), "noopener noreferrer");
    assert.strictEqual(link.textContent, "Maanmittauslaitos");
  }
});
