define([
    'exports',
    'require',
    'director',
    './views/databases'
],
function (exports, require) {

    var director = require('director');


    exports.routes = {
        '/': require('./views/databases')
    };

    exports.init = function () {
        // TODO: refresh db list
        window.Dashboard = {
            databases: [
                {title: 'Kujua', url: '/kujua/_design/kujua-base/_rewrite/'},
                {title: 'Todo List', url: '/todo/_design/todo/_rewrite/'}
            ]
        };

        var router = new director.Router(exports.routes);
        router.init();

        if (!window.location.hash || window.location.hash === '#') {
            window.location = '#/';
            $(window).trigger('hashchange');
        }
    };

});
