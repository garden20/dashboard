define([
    'exports',
    'require',
    'underscore',
    '../data/settings',
    'couchr',
    './env'
],
function (exports, require, _) {

    var couchr = require('couchr'),
        DATA = require('../data/settings'),
        env = require('./env');


    exports.DEFAULTS = {
        templates: {
            sources: []
        },
        projects: {
            show_no_templates: false,
            show_unknown_templates: false
        }
    };

    exports.update = function (cfg, callback) {
        // TODO: should this be a deep extend?
        var doc = _.extend(exports.DEFAULTS, DATA || {}, cfg);
        couchr.put('api/settings', doc, function (err, res) {
            if (err) {
                return callback(err);
            }
            doc._rev = res.rev;
            DATA = doc;
            $.get('data/settings.js', function (data) {
                // cache bust
            });
            exports.saveLocal();
            callback();
        });
    };

    exports.get = function () {
        if (!DATA) {
            return exports.DEFAULTS;
        }
        // TODO: should this be a deep extend?
        return _.extend(exports.DEFAULTS, DATA);
    };

    exports.saveLocal = function () {
        if (env.hasStorage) {
            localStorage.setItem('dashboard-settings', JSON.stringify(DATA));
        }
    };

});
