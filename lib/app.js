define([
    'exports',
    'require',
    'director',
    './views/projects',
    './views/templates-installed',
    './views/templates-available',
    './views/settings',
    './projects'
],
function (exports, require) {

    var director = require('director'),
        projects = require('./projects');


    exports.routes = {
        '/':                    require('./views/projects'),
        '/templates':           require('./views/templates-installed'),
        '/templates/available': require('./views/templates-available'),
        '/settings':            require('./views/settings')
    };

    exports.init = function () {
        var router = new director.Router(exports.routes);
        router.init();

        if (!window.location.hash || window.location.hash === '#') {
            window.location = '#/';
            $(window).trigger('hashchange');
        }
        projects.saveLocal();
    };

});
