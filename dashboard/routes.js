define([
    'exports',
    'require',
    'director',
    './views/databases'
],
function (exports, require, director) {

    exports.routes = {
        '/': require('./views/databases')
    };

    exports.router = new director.Router(exports.routes);

});
