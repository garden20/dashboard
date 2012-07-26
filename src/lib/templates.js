define([
    'exports',
    'require',
    'jquery',
    'underscore',
    'async',
    'url',
    'couchr',
    'events',
    './settings',
    './replicate',
    './utils'
],
function (exports, require, $, _) {

    var settings = require('./settings'),
        couchr = require('couchr'),
        events = require('events'),
        async = require('async'),
        url = require('url'),
        replicate = require('./replicate').replicate,
        utils = require('./utils');


    exports.update = function (callback) {
        var ev = new events.EventEmitter();
        var cfg = settings.get();

        var completed_sources = 0;
        async.concat(cfg.templates.sources, function (s, cb) {

            // force trailing slash on library db url
            s = s.replace(/\/$/, '') + '/';

            $.ajax({
                type: 'GET',
                dataType: 'jsonp',
                url: url.resolve(s,'_design/library/_list/jsonp/templates'),
                success: function (data) {
                    completed_sources++;
                    ev.emit('progress', Math.floor(
                        completed_sources / cfg.templates.sources.length * 50
                    ));
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
            var completed_results = 0;
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
                    couchr.put(durl, doc, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        completed_results++;
                        ev.emit('progress', Math.floor(
                            50 + completed_results / results.length * 50
                        ));
                        cb();
                    });
                });
            },
            callback);
        });

        return ev;
    };

    /**
     * Searches the _changes feed for updates to a document. This is able to
     * find the last known _rev for _deleted documents.
     */

    exports.findLastEntry = function (id, callback) {
        var q = {
            filter: 'dashboard/id',
            id: id
        };
        couchr.get('api/_changes', q, function (err, data) {
            if (err) {
                return callback(err);
            }
            if (!data.results || !data.results.length) {
                // no document history found
                return callback(null, null);
            }
            var r = data.results[data.results.length - 1];
            var last_rev = r.changes[r.changes.length - 1].rev;
            return callback(null, last_rev);
        });
    };

    exports.clearCheckpoint = function (replication_id, callback) {
        var id = '_local/' + replication_id,
            cfg = settings.get(),
            db_name = cfg.info.db_name;

        utils.getRev(db_name, id, function (err, rev) {
            if (err) {
                return callback(err);
            }
            if (rev) {
                couchr.delete('api/' + id + '?rev=' + rev, callback);
            }
            else {
                // may be a deleted doc
                exports.findLastEntry(id, function (err, rev) {
                    if (rev) {
                        couchr.delete('api/' + id + '?rev=' + rev, callback);
                    }
                    else {
                        // unknown rev, may not exist
                        return callback();
                    }
                });
            }
        });
    };

    // replicates a ddoc from remote source and ensure it's installed
    exports.replicateDDoc = function (source, ddoc_id, callback) {
        var repdoc = {
            source: source,
            target: settings.get().info.db_name,
            doc_ids: [ddoc_id]
        };
        replicate(repdoc, function (err, repdoc) {
            if (err) {
                return callback(err);
            }
            // TODO: check for conflicts
            couchr.get('api/' + ddoc_id, function (err, ddoc) {
                if (err && err.status === 404) {
                    // checkpoint stopped the doc from being replicated
                    var rid = repdoc._replication_id;
                    exports.clearCheckpoint(rid, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        // retry replication
                        exports.replicateDDoc(source, ddoc_id, callback);
                    });
                    return;
                }
                return callback(err, ddoc);
            });
        });
    };

    // updates meta info on template with installed version
    exports.installTemplateDoc = function (ddoc, callback) {
        var tid = encodeURIComponent('template:' + ddoc._id);
        couchr.get('api/' + tid, function (err, tdoc) {
            if (err) {
                return callback(err);
            }
            tdoc.installed = {dashboard: ddoc.dashboard, rev: ddoc._rev};
            couchr.put('api/' + tid, tdoc, function (err, data) {
                if (err) {
                    return callback(err);
                }
                tdoc._rev = data.rev;
                return callback(null, tdoc);
            });
        });
    };

    // removes installed ddoc meta info on template doc
    exports.uninstallTemplateDoc = function (ddoc_id, callback) {
        var tid = encodeURIComponent('template:' + ddoc_id);
        couchr.get('api/' + tid, function (err, tdoc) {
            if (err) {
                return callback(err);
            }
            delete tdoc.installed;
            couchr.put('api/' + tid, tdoc, function (err, data) {
                if (err) {
                    return callback(err);
                }
                tdoc._rev = data.rev;
                return callback(null, tdoc);
            });
        });
    };

    exports.purgeDDoc = function (ddoc_id, callback) {
        var cfg = settings.get(),
            db_name = cfg.info.db_name;


        function withRev(rev) {
            var cfg = settings.get();
            var db = cfg.info.db_name;
            var q = {};
            // TODO: if there are conflicts, include them in this list of revs
            if (rev) {
                q[ddoc_id] = [rev];
                return couchr.post('/' + db + '/_purge', q, callback);
            }
            // nothing to purge
            return callback();
        }

        utils.getRev(db_name, ddoc_id, function (err, rev) {
            if (err) {
                return callback(err);
            }
            if (!rev) {
                // may be a deleted document
                exports.findLastEntry(ddoc_id, function (err, rev) {
                    if (err) {
                        return callback(err);
                    }
                    withRev(rev);
                });
            }
            else {
                withRev(rev);
            }
        });
    };

    exports.install = function (src, ddoc_id, callback) {
        exports.purgeDDoc(ddoc_id, function (err) {
            if (err) {
                return callback(err);
            }
            return exports.replicateDDoc(src, ddoc_id, function (err, ddoc) {
                if (err) {
                    return callback(err);
                }
                return exports.installTemplateDoc(ddoc, callback);
            });
        });
    };

    exports.uninstall = function (ddoc_id, callback) {
        exports.purgeDDoc(ddoc_id, function (err) {
            if (err) {
                return callback(err);
            }
            exports.uninstallTemplateDoc(ddoc_id, callback);
        });
    };

});
