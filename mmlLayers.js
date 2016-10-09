/**
*   MML layers for Leaflet. https://github.com/jleh/Leaflet.MML-layers
*   Copyright (c) 2013-2016 Juuso Lehtinen
*/

(function (factory, window) {
    var L;

    if (typeof define === "function" && define.amd) {
        define(["leaflet"], factory);
    } else if (typeof module !== "undefined") {
        if(window.L) {
            module.exports = factory(window.L);
        } else {
            module.exports = factory(require("leaflet"));
        }
    } else {
        if (typeof window.L === "undefined") {
            throw "Leaflet must be loaded first.";
        }

        window.L = factory(window.L);
    }

}(function (L) {
    L.TileLayer.MML = L.TileLayer.extend({
        options: {
            attribution : '&copy; <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501"' +
                          'target=new>Maanmittauslaitos</a>'
        },

        statics: {
            /**
            *   Get EPSG:3067 CRS Projection.
            */
            get3067Proj: function () {
                return new L.Proj.CRS(
                    'EPSG:3067',
                    '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
                    {
                        origin: [-548576, 8388608],
                        bounds: L.bounds([-548576, 8388608], [1548576, 6291456]),
                        resolutions: [
                            8192, 4096, 2048, 1024, 512, 256,
                            128, 64, 32, 16, 8, 4, 2, 1, 0.5,
                            0.25, 0.125, 0.0625, 0.03125, 0.015625
                        ]
                    }
                );
            }
        },

        urls: {
            "peruskartta" : 'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg',
            "taustakartta" : 'http://tiles.kartat.kapsi.fi/taustakartta/{z}/{x}/{y}.jpg',
            "ortokuva" : 'http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg',
            "peruskartta_3067" : 'http://tiles.kartat.kapsi.fi/peruskartta_3067/{z}/{x}/{y}.jpg',
            "taustakartta_3067" : 'http://tiles.kartat.kapsi.fi/taustakartta_3067/{z}/{x}/{y}.jpg',
            "ortokuva_3067" : 'http://tiles.kartat.kapsi.fi/ortokuva_3067/{z}/{x}/{y}.jpg'
        },

        initialize: function (type, options) {
            L.setOptions(this, options);
            var url = this.urls[type.toLowerCase()];

            if (type.indexOf('3067') != -1) {
                // Check that Proj4Leaflet is loaded
                if (L.Proj === undefined) {
                    throw "Use of EPSG:3067 layers requires Proj4Leaflet plugin.";
                }
            }
            
            L.TileLayer.prototype.initialize.call(this, url, options);
        },
        
    });

    L.tileLayer.mml = function (type, options) {
        return new L.TileLayer.MML(type, options);
    };

    // WMTS Layer

    L.TileLayer.MML_WMTS = L.TileLayer.extend({
        
        options: {
            style: "default",
            maxZoom: 15,
            minZoom: 0,
            attribution : '&copy; <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501"' +
                          'target=new>Maanmittauslaitos</a>'
        }
    });

    L.tileLayer.mml_wmts = function (options) {
        var layer = options.layer || "taustakartta";
        var url = "http://avoindata.maanmittauslaitos.fi/mapcache/wmts/1.0.0/" + layer + "/default/"
                + "ETRS-TM35FIN/{z}/{y}/{x}.png";

        return new L.TileLayer.MML_WMTS(url, options);
    };

    return L;

}, window));
