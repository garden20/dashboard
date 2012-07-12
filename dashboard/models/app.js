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

});
