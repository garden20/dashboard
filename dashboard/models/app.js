define('dashboard/models/app', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'backbone'
],
function (exports, require, $, _) {

    var Backbone = require('backbone');

    exports.App = Backbone.Model.extend({
        pouch: Backbone.sync.pouch('idb://dashboard'),
        idAttribute: '_id',
        type: 'app'
    });

    // increment this value to force update of
    // all existing app documents to a new format
    exports.App.format_version = 1;

});
