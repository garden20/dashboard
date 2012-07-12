define('dashboard/views/apps', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'backbone',
    '../models/app',
    'hbt!../../tmpl/apps'
],
function (exports, require, $, _) {

    var Backbone = require('backbone'),
        App = require('../models/app').App;


    exports.AppsView = Backbone.View.extend({
        tagname: 'ul',
        className: 'app-list',
        template: require('hbt!../../tmpl/apps'),
        initialize: function (apps) {
            this.apps = apps;
            //this.apps.on('add', this.addOne, this);
            // ...
        },
        render: function () {
            $(this.el).html(this.template({apps: this.apps}));
            return this;
        }
    });

});
