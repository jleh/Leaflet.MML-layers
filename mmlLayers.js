
L.TileLayer.MML = L.TileLayer.extend({
    options: {
        attribution : '&copy; <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501"' +
                      'target=new>Maanmittauslaitos</a>'
    },

    urls: {
        "peruskartta" : 'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg',
        "taustakartta" : 'http://tiles.kartat.kapsi.fi/taustakartta/{z}/{x}/{y}.jpg',
        "ortokuva" : 'http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg'
    },

    initialize: function (type, options) {
        L.setOptions(this, options);

        var url = this.urls[type.toLowerCase()];

        L.TileLayer.prototype.initialize.call(this, url, options);
    }
    
});

L.tileLayer.mml = function (type, options) {
    return new L.TileLayer.MML(type, options);
}