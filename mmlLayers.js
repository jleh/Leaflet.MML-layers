/**
*   MML layers for Leaflet. https://github.com/jleh/Leaflet.MML-layers
*   Copyright (c) 2013-2015 Juuso Lehtinen
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
                return new L.Proj.CRS.TMS(
                    'EPSG:3067',
                    '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
                    [-548576, 6291456, 1548576, 8388608],
                    {
                        origin: [0, 0],
                        resolutions: [
                            8192, 4096, 2048, 1024, 512, 256,
                            128,64, 32, 16, 8, 4, 2, 1, 0.5,
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
            url: "http://avoindata.maanmittauslaitos.fi/mapcache/wmts",
            layer: "taustakartta",
            tileMatrixSet: "ETRS-TM35FIN",
            style: "default",
            tileSize: 256,
            maxZoom: 13,
            minZoom: 2,
            attribution : '&copy; <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501"' +
                          'target=new>Maanmittauslaitos</a>'
        },

        initialize: function (options) {
            this.options.matrixIds = this.getMMLMatrix();
            L.Util.setOptions(this, options);
        },

        getTileUrl: function(tilePoint) {
            var map = this._map;
            var crs = map.options.crs;
            var tileSize = this.options.tileSize;
            var zoom = map.getZoom();
            var point = tilePoint.multiplyBy(tileSize);
            var id = this.options.matrixIds[zoom].identifier;
            var cornerX = this.options.matrixIds[zoom].topLeftCorner.lng;
            var cornerY = this.options.matrixIds[zoom].topLeftCorner.lat;

            point.x+=1;
            point.y-=1;

            var tileCoord = crs.project(map.unproject(point, zoom));
            var col = Math.floor((tileCoord.x - cornerX)/ (tileSize * this.options.matrixIds[zoom].resolution));
            var row = -Math.floor((tileCoord.y - cornerY)/ (tileSize * this.options.matrixIds[zoom].resolution));
            var url = L.Util.template(this.options.url, {s: this._getSubdomain(tilePoint)});
            
            return url + "/1.0.0/" + this.options.layer +  "/" + this.options.style + "/ETRS-TM35FIN/"  + id + "/" + row +"/" + col +".png";
        },

        getMMLMatrix: function() {
            var matrixIds = [];

            for (var i = 0; i < 15; i++) {
                matrixIds[i] = {
                    identifier : "" + i,
                    topLeftCorner: new L.LatLng(8388608, -548576),
                    resolution: Math.pow(2, 13 - i)
                };
            }

            return matrixIds;
        }
    });

    L.tileLayer.mml_wmts = function (options) {
        return new L.TileLayer.MML_WMTS(options);
    };

    return L;
}, window));
