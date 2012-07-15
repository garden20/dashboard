define('dashboard/routes', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'backbone',
    './views/dashboard'
],
function (exports, require, $, _) {

    var Backbone = require('backbone'),
        DashboardView = require('./views/dashboard').DashboardView;


    exports.WorkspaceRouter = Backbone.Router.extend({
        routes: {
            "": "home"
        },
        home: function () {
            // create global DashboardView instance
            window.dashboard_view = new DashboardView();

            window.dashboard_view.render();
            window.dashboard_view.showAppList(window.app_list);
            console.log([
                'Time to icon list',
                (new Date().getTime() - window.dashboard_start_time) + 'ms'
            ]);
        }
    });

});
