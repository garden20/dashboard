define('dashboard/views/dashboard', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'backbone',
    './apps',
    'hbt!../../tmpl/dashboard'
],
function (exports, require, $, _) {

    var Backbone = require('backbone'),
        AppsView = require('./apps').AppsView;


    exports.DashboardView = Backbone.View.extend({
        el: $('#content'),
        template: require('hbt!../../tmpl/dashboard'),
        initialize: function () {
            this.render();
        },
        render: function () {
            $(this.el).html(this.template({}));
            return this;
        },
        showAppList: function (apps) {
            this.apps_view = new AppsView(apps);
            this.$('#apps').html(this.apps_view.render().el);
        }
    });

});
