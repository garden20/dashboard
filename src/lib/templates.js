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
                    var rdash = r.value.dashboard;
                    if (rdash.icons && rdash.icons['22']) {
                        doc.dashicon = url.resolve(
                            r.source, r.id + '/' + rdash.icons['22']
                        );
                    }
                    couchr.put(durl, doc, cb);
                });
            },
            callback);
        });
    };

    exports.replicate = function (repdoc, callback) {
        couchr.post('/_replicator', repdoc, function (err, data) {
            if (err) {
                return callback(err);
            }
            // polls for change in replication state
            function poll() {
                couchr.get('/_replicator/' + data.id, function (err, doc) {
                    if (err) {
                        return callback(err);
                    }
                    if (doc._replication_state === 'error') {
                        return callback(new Error(
                            'Error replicating from ' + repdoc.source +
                            ' to ' + repdoc.target
                        ));
                    }
                    if (doc._replication_state === 'completed') {
                        return callback();
                    }
                    else {
                        // poll again after delay
                        setTimeout(poll, 1000);
                    }
                });
            }
            // start polling
            poll();
        });
    };


    // checks if the design ddoc rev already exists locally
    exports.checkForLocalRev = function (ddoc_id, ddoc_rev, callback) {
        console.log(['checkForLocalRev', ddoc_id, ddoc_rev]);
        couchr.get('api/' + ddoc_id, {rev: ddoc_rev}, function (err, ddoc) {
            if (err && err.status === 404) {
                return callback(null, null);
            }
            return callback(err, ddoc);
        });
    };

    exports.promoteDDocRev = function (ddoc, callback) {
        console.log(['promoteDDocRev', ddoc._id, ddoc._rev]);
        // get current _rev number
        couchr.head('api/' + ddoc._id, function (err, data, req) {
            // if status is 404 then the current head rev is a deleted doc
            if (err && err.status !== 404) {
                return callback(err);
            }
            var cfg = settings.get();
                db = cfg.info.db_name,
                etag = (req.getResponseHeader('ETag') || ''),
                rev = etag.replace(/^"/,'').replace(/"$/,''),
                source = '/' + db + '/' + ddoc._id + '?rev=' + ddoc._rev,
                dest = '/' + db + '/' + ddoc._id + (rev ? '?rev=' + rev: '');

            if (source === dest) {
                return exports.updateTemplateDoc(ddoc, callback);
            }
            couchr.copy(source, dest, function (err, info) {
                if (err) {
                    return callback(err);
                }
                ddoc._rev = info.rev;
                return exports.updateTemplateDoc(ddoc, callback);
            });
        });
    };

    // replicates a ddoc from remote source and ensure it's installed
    exports.replicateDDoc = function (source, ddoc_id, ddoc_rev, callback) {
        var repdoc = {
            source: source,
            target: settings.get().info.db_name,
            doc_ids: [ddoc_id]
        };
        // TODO: reset any previous replication checkpoints stored on template
        // meta doc by doing DELETE /<db_name>/_local/<_replication_id>
        exports.replicate(repdoc, function (err) {
            if (err) {
                return callback(err);
            }
            // TODO: check for conflicts
            couchr.get('api/' + ddoc_id, function (err, ddoc) {
                if (err) {
                    return callback(err);
                }
                return exports.updateTemplateDoc(ddoc, callback);
            });
        });
    };

    // updates meta info on template with installed version
    exports.updateTemplateDoc = function (ddoc, callback) {
        var tid = encodeURIComponent('template:' + ddoc._id);
        couchr.get('api/' + tid, function (err, tdoc) {
            if (err) {
                return callback(err);
            }
            tdoc.installed = ddoc.dashboard;
            couchr.put('api/' + tid, tdoc, function (err, data) {
                if (err) {
                    return callback(err);
                }
                tdoc._rev = data.rev;
                return callback(null, tdoc);
            });
        });
    };

    exports.install = function (src, ddoc_id, ddoc_rev, callback) {
        exports.checkForLocalRev(ddoc_id, ddoc_rev, function (err, ddoc) {
            if (err) {
                return callback(err);
            }
            if (ddoc) {
                return exports.promoteDDocRev(ddoc, callback);
            }
            return exports.replicateDDoc(src, ddoc_id, ddoc_rev, callback);
        });
    };

});
