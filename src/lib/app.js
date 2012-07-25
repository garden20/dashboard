define([
    'exports',
    'require',
    'director',
    './views/projects',
    './views/templates',
    './views/settings',
    './projects'
],
function (exports, require) {

    var director = require('director'),
        projects = require('./projects'),
        settings = require('./settings');


    exports.routes = {
        '/':            require('./views/projects'),
        '/templates':   require('./views/templates'),
        '/settings':    require('./views/settings')
    };

    exports.init = function () {
        var router = new director.Router(exports.routes);
        router.init();

        if (!window.location.hash || window.location.hash === '#') {
            window.location = '#/';
            $(window).trigger('hashchange');
        }
        projects.saveLocal();
        settings.saveLocal();
    };

});
