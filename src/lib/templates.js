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
                        return callback(err, doc);
                    }
                    if (doc._replication_state === 'error') {
                        return callback(new Error(
                            'Error replicating from ' + repdoc.source +
                            ' to ' + repdoc.target
                        ), doc);
                    }
                    if (doc._replication_state === 'completed') {
                        // clean up completed doc
                        var id = doc._id;
                        var rurl = '/_replicator/' + id + '?rev=' + doc._rev;
                        couchr.delete(rurl, function (err) {
                            if (err) {
                                // is this important enough to stop processing??
                                return callback(err, doc);
                            }
                            return callback(null, doc);
                        });
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

    exports.clearCheckpoint = function (replication_id, callback) {
        var id = '_local/' + replication_id;
        exports.getRev(id, function (err, rev) {
            if (err) {
                return callback(err);
            }
            if (rev) {
                couchr.delete('api/' + id + '?rev=' + rev, callback);
            }
            else {
                // unknown rev, may not exist
                return callback();
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
        exports.replicate(repdoc, function (err, repdoc) {
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

    exports.getRev = function (id, callback) {
        // test if revision is available locally
        couchr.head('api/' + id, function (err, data, req) {
            if (err) {
                if (err.status === 404) {
                    // if status is 404 then the current head rev may be a
                    // deleted doc
                    return exports.findLastEntry(id, callback);
                }
                return callback(err);
            }
            var etag = req.getResponseHeader('ETag') || '',
                rev = etag.replace(/^"/, '').replace(/"$/, '');

            return callback(null, rev || null);
        });
    };

    exports.purgeDDoc = function (ddoc_id, callback) {
        exports.getRev(ddoc_id, function (err, rev) {
            if (err) {
                return callback(err);
            }
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
