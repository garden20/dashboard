define([
    'exports',
    'require',
    'director',
    './views/databases',
    './views/templates',
    './views/library',
    './views/settings',
    './dblist'
],
function (exports, require) {

    var director = require('director'),
        dblist = require('./dblist');


    exports.routes = {
        '/': require('./views/databases'),
        '/templates': require('./views/templates'),
        '/library': require('./views/library'),
        '/settings': require('./views/settings')
    };

    exports.init = function () {
        var router = new director.Router(exports.routes);
        router.init();

        if (!window.location.hash || window.location.hash === '#') {
            window.location = '#/';
            $(window).trigger('hashchange');
        }
        dblist.saveLocal();
    };

});
