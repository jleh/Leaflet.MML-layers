const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const NODE_MODULES = path.join(ROOT, "node_modules");
// The local server only serves the example pages, main.js and mmlLayers.js
const TYPES = { ".html": "text/html", ".js": "application/javascript" };
// Answers tile requests so the examples render without network access
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const API_KEY_WARNING = /require an API key/;

const kapsiTile = (layer) => new RegExp(`^https://tiles\\.kartat\\.kapsi\\.fi/${layer}/\\d+/\\d+/\\d+\\.jpg$`);
const wmtsTile = (layer, query) =>
  new RegExp(
    "^https://avoin-karttakuva\\.maanmittauslaitos\\.fi/avoin/wmts/1\\.0\\.0/" +
      layer +
      "/default/ETRS-TM35FIN/\\d+/\\d+/\\d+\\." +
      (layer === "ortokuva" ? "jpg" : "png") +
      query +
      "$"
  );

let server, browser, baseUrl;

test.before(async () => {
  server = http.createServer((req, res) => {
    let file, stat;
    try {
      file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://localhost").pathname));
      stat = file.startsWith(ROOT + path.sep) && fs.statSync(file, { throwIfNoEntry: false });
    } catch (e) {
      res.writeHead(400);
      return res.end();
    }
    if (!stat || !stat.isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file)
      .on("error", () => res.destroy())
      .pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/examples/`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
});

test.after(async () => {
  try {
    if (browser) await browser.close();
  } finally {
    if (server) server.close();
  }
});

async function openExample(page) {
  const result = { errors: [], warnings: [], tiles: [] };
  // Resolves on the first page error, so the test doesn't wait for tiles that will never load
  result.broken = new Promise((resolve) => {
    result.markBroken = resolve;
  });

  // Leaflet never marks a failed tile as loaded, so record failures to stop waiting for them
  await page.addInitScript(() => {
    window.__tileErrors = [];
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.classList && e.target.classList.contains("leaflet-tile")) window.__tileErrors.push(e.target.src);
      },
      true
    );
  });

  page.on("pageerror", (e) => {
    result.errors.push("page error: " + e.message);
    result.markBroken();
  });
  page.on("console", (msg) => {
    // Failed resource loads only name the URL in the message location
    if (msg.type() === "error") result.errors.push(`console error: ${msg.text()} (${msg.location().url})`);
    if (msg.type() === "warning") result.warnings.push(msg.text());
  });

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());

    if (url.host === new URL(baseUrl).host) return route.continue();

    if (url.hostname === "unpkg.com") {
      // Serve CDN files from the matching devDependency, so examples and package.json stay in sync
      const match = url.pathname.match(/^\/([^@/]+)@([^/]+)\/(.+)$/);
      if (!match) {
        result.errors.push("unexpected CDN URL: " + url.href);
        return route.abort();
      }
      const [, name, version, file] = match;
      const pkgJson = path.join(NODE_MODULES, name, "package.json");
      const installed = fs.existsSync(pkgJson) ? require(pkgJson).version : "not installed";
      const local = path.join(NODE_MODULES, name, file);
      if (installed !== version) {
        result.errors.push(`${url.href}: devDependency ${name} is ${installed}`);
        return route.abort();
      }
      const localStat = fs.statSync(local, { throwIfNoEntry: false });
      if (!localStat || !localStat.isFile()) {
        result.errors.push(`${url.href}: file not found in ${name}@${version}`);
        return route.abort();
      }
      return route.fulfill({ path: local });
    }

    if (url.hostname === "tiles.kartat.kapsi.fi" || url.hostname === "avoin-karttakuva.maanmittauslaitos.fi") {
      result.tiles.push(url.href);
      return route.fulfill({ body: PNG, contentType: "image/png" });
    }

    result.errors.push("unexpected request: " + url.href);
    return route.abort();
  });

  return result;
}

async function checkExample(file, expected) {
  const page = await browser.newPage();
  try {
    const result = await openExample(page);
    // Record navigation failures with the page errors, so the assertion shows what went wrong
    await page.goto(baseUrl + file).catch((e) => {
      result.errors.push("navigation failed: " + e.message);
      result.markBroken();
    });
    // Wait until every tile Leaflet created has loaded, so errors from late tiles are caught too
    const tilesDone = page
      .waitForFunction(
        () => {
          const tiles = document.querySelectorAll(".leaflet-tile").length;
          const done = document.querySelectorAll(".leaflet-tile-loaded").length + window.__tileErrors.length;
          return tiles > 0 && done >= tiles;
        },
        null,
        { timeout: 15000 }
      )
      .catch((e) => result.errors.push("tiles did not finish loading: " + e.message));
    await Promise.race([tilesDone, result.broken]);
    const tileErrors = await page
      .evaluate(() => window.__tileErrors)
      .catch((e) => ["(could not read: " + e.message + ")"]);
    for (const src of tileErrors) result.errors.push("tile failed: " + src);

    assert.deepStrictEqual(result.errors, []);
    assert.ok(result.tiles.length > 0, "no tiles requested");
    for (const tile of result.tiles) assert.match(tile, expected.tile);
    // The tile under the map centre [61, 25] at zoom 6 is only requested when the EPSG:3067 CRS is in use
    assert.ok(
      result.tiles.some((tile) => tile.includes(expected.centerTile)),
      `centre tile ${expected.centerTile} not requested`
    );

    if (expected.crs) {
      assert.strictEqual(await page.evaluate(() => window.map.options.crs.code), expected.crs);
    }

    const apiKeyWarning = result.warnings.some((w) => API_KEY_WARNING.test(w));
    assert.strictEqual(apiKeyWarning, Boolean(expected.apiKeyWarning), "API key warning: " + result.warnings);
  } finally {
    // Tile requests can still be in flight when the test is done
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.close();
  }
}

// Kapsi TMS tiles are {z}/{x}/{y}, MML WMTS tiles are {z}/{y}/{x}
const KAPSI_CENTER = "/6/28/49.jpg";
const WMTS_CENTER = "/6/49/28.png";

test("3067.html", () =>
  checkExample("3067.html", { tile: kapsiTile("taustakartta_3067"), centerTile: KAPSI_CENTER, crs: "EPSG:3067" }));

test("wmts.html without an API key", () =>
  checkExample("wmts.html", {
    tile: wmtsTile("maastokartta", ""),
    centerTile: WMTS_CENTER,
    crs: "EPSG:3067",
    apiKeyWarning: true
  }));

test("wmts.html with an API key", () =>
  checkExample("wmts.html?apiKey=abc123", {
    tile: wmtsTile("maastokartta", "\\?api-key=abc123"),
    centerTile: WMTS_CENTER,
    crs: "EPSG:3067"
  }));

test("requirejs.html without an API key", () =>
  checkExample("requirejs.html", { tile: wmtsTile("maastokartta", ""), centerTile: WMTS_CENTER }));

test("requirejs.html with an API key", () =>
  checkExample("requirejs.html?apiKey=abc123", {
    tile: wmtsTile("maastokartta", "\\?api-key=abc123"),
    centerTile: WMTS_CENTER
  }));

test("wmts.html layer switcher", async () => {
  const baseLayers = ["taustakartta", "maastokartta", "selkokartta", "ortokuva"];
  const overlays = ["kiinteistojaotus", "kiinteistotunnukset"];
  const page = await browser.newPage();
  try {
    const result = await openExample(page);
    await page
      .goto(baseUrl + "wmts.html?apiKey=abc123")
      .catch((e) => result.errors.push("navigation failed: " + e.message));
    assert.deepStrictEqual(result.errors, []);
    const labels = await page.locator(".leaflet-control-layers label").allTextContents();
    assert.deepStrictEqual(
      labels.map((label) => label.trim()),
      baseLayers.concat(overlays)
    );

    const input = (layer) => page.locator(".leaflet-control-layers label", { hasText: layer }).locator("input");
    const switchTo = async (layer) => {
      const tile = wmtsTile(layer, "\\?api-key=abc123");
      // Record a missing tile as an error, so the wait never rejects unhandled after a page error
      const requested = page
        .waitForRequest((req) => tile.test(req.url()), { timeout: 15000 })
        .catch((e) => result.errors.push(`${layer} tile not requested: ${e.message}`));
      await input(layer).click();
      await Promise.race([requested, result.broken]);
    };

    for (const layer of baseLayers.filter((layer) => layer !== "maastokartta")) {
      await switchTo(layer);
      if (result.errors.length) break;
    }
    assert.deepStrictEqual(result.errors, []);

    // MML only has property tiles from zoom 10 up, so the overlays are disabled at the start view
    for (const layer of overlays) assert.ok(await input(layer).isDisabled(), `${layer} enabled at zoom 6`);
    await page.evaluate(() => window.map.setZoom(10, { animate: false }));
    for (const layer of overlays) {
      await switchTo(layer);
      if (result.errors.length) break;
    }
    assert.deepStrictEqual(result.errors, []);
  } finally {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.close();
  }
});
