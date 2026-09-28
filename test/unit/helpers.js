// Leaflet 1.x reads window, document and navigator when it is loaded.
function setupDom() {
  // Loaded here so the tests that run without a DOM don't load jsdom
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><div id='map'></div>", { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  // Node 21+ defines navigator as a getter-only global, so plain assignment is ignored
  Object.defineProperty(global, "navigator", { value: dom.window.navigator, configurable: true });
  return dom.window;
}

// The parts of Leaflet the plugin touches while it loads, for tests that run without a DOM
function stubLeaflet() {
  return {
    TileLayer: {
      extend: function (props) {
        const Layer = function () {};
        Layer.prototype = props;
        return Layer;
      }
    },
    tileLayer: {}
  };
}

module.exports = { setupDom, stubLeaflet };
