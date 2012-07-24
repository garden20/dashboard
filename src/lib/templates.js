define([
    'exports',
    'require',
    'jquery',
    'underscore',
    'async',
    'url',
    'couchr',
    './settings',
],
function (exports, require, $, _) {

    var settings = require('./settings'),
        couchr = require('couchr'),
        async = require('async'),
        url = require('url');


    exports.update = function (callback) {
        var cfg = settings.get();

        async.concat(cfg.templates.sources, function (s, cb) {

            // force trailing slash on library db url
            s = s.replace(/\/$/, '') + '/';

            $.ajax({
                type: 'GET',
                dataType: 'jsonp',
                url: url.resolve(s,'_design/library/_list/jsonp/templates'),
                success: function (data) {
                    cb(null, _.map(data.rows, function (r) {
                        r.source = s;
                        return r;
                    }));
                },
                error: function () {
                    cb('Could not load templates from source: ' + s);
                }
            });
        },
        function (err, results) {
            if (err) {
                return callback(err);
            }
            async.forEach(results, function (r, cb) {
                var id = 'template:' + r.id;
                var durl = 'api/' + encodeURIComponent(id);
                couchr.get(durl, function (err, doc) {
                    if (err) {
                        if (err.status === 404) {
                            doc = {_id: id};
                        }
                        else {
                            return cb(err);
                        }
                    }
                    doc = _.extend(doc, {
                        type: 'template',
                        remote: r.value,
                        source: r.source,
                        ddoc_id: r.id
                    });
                    if (r.value.icons && r.value.icons['22']) {
                        doc.dashicon = url.resolve(
                            r.source, r.id + '/' + r.value.icons['22']
                        );
                    }
                    couchr.put(durl, doc, cb);
                });
            },
            callback);
        });
    };


    exports.install = function (source, ddoc_id, callback) {
        var repdoc = {
            source: source,
            target: url.resolve(window.location, 'api'),
            doc_ids: [ddoc_id]
        };
        couchr.post('/_replicate', repdoc, function (err, data) {
            console.log(['replicate callback', err, data]);
        });
    };

});
