define('dashboard/app', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'backbone',
    'backbone-pouchdb',
    './routes',
    './collections/applist'
],
function (exports, require, $, _) {

    var Backbone = require('backbone'),
        routes = require('./routes'),
        AppList = require('./collections/applist').AppList;


    exports.init = function () {
        // refresh app list
        window.app_list = new AppList();
        window.app_list.fetch({
            error: function (err) {
                console.error(err);
            },
            success: function () {
                window.app_list.update();

                // setup URL router
                new routes.WorkspaceRouter();
                Backbone.history.start({pushstate: false});
            }
        });
    };

});
