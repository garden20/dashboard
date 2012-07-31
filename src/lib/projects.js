define([
    'exports',
    'require',
    'jquery',
    'underscore',
    'couchr',
    'async',
    '../data/dashboard-data',
    'events',
    './utils',
    './env',
    './replicate',
    './settings'
],
function (exports, require, $, _) {

    var couchr = require('couchr'),
        async = require('async'),
        events = require('events'),
        utils = require('./utils'),
        DATA = require('../data/dashboard-data'),
        env = require('./env'),
        replicate = require('./replicate').replicate,
        settings = require('./settings');


    exports.get = function (id) {
        if (id) {
            return _.detect(DATA.projects, function (db) {
                return db._id === id;
            });
        }
        return DATA.projects;
    };

    exports.update = function (newDoc, /*optional*/callback) {
        callback = callback || utils.logErrorsCallback;

        var oldDoc = exports.get(newDoc._id);
        var doc = oldDoc ? _.extend(oldDoc, newDoc): newDoc;

        var url = 'api/' + encodeURIComponent(doc._id);
        couchr.put(url, doc, function (err, data) {
            if (err) {
                return callback(err);
            }
            doc._rev = data.rev;

            // update if already exists
            for (var i = 0; i < DATA.projects.length; i++) {
                var db = DATA.projects[i];
                if (db._id === doc._id) {
                    DATA.projects.splice(i, 1, doc);
                    return callback(null, doc);
                }
            };

            // does not exist, create new project doc
            var plist = DATA.projects;
            plist.push(doc);
            plist = _.sortBy(plist, function (p) {
                return [p.db, (p.dashboard && p.dashboard.title) || p.name];
            });
            DATA.projects = _.uniq(plist, true, function (p) {
                return p._id;
            });
            return callback(null, doc);
        });
    };

    exports.saveLocal = function () {
        if (env.hasStorage) {
            localStorage.setItem(
                'dashboard-projects', JSON.stringify(DATA.projects)
            );
        }
    };

    exports.refresh = function (/*optional*/callback) {
        callback = callback || utils.logErrorsCallback;
        var ev = new events.EventEmitter();

        couchr.get('/_api/_all_dbs', function (err, dbs) {
            if (err) {
                return callback('Failed to update project list\n' + err);
            }
            var completed = 0;
            async.forEachLimit(dbs, 4, function (db, cb) {
                exports.refreshDB(db, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    completed++;
                    ev.emit(
                        'progress',
                        Math.floor(completed / dbs.length * 100)
                    );
                    cb();
                });
            },
            function (err) {
                if (err) {
                    return callback(err);
                }
                exports.saveLocal();
                $.get('data/dashboard-data.js', function (data) {
                    // cache bust
                });
                callback();
            });
        });
        return ev;
    };

    exports.refreshDB = function (db, /*optional*/callback) {
        callback = callback || utils.logErrorsCallback;

        var url = '/_api/' + encodeURIComponent(db) + '/_all_docs';
        var q = {
            startkey: '"_design/"',
            endkey: '"_design0"'
        };
        couchr.get(url, q, function (err, data) {
            if (err) {
                return callback(
                    'Failed to update projects from DB: ' + db + '\n' + err
                );
            }
            async.forEachSeries(data.rows || [], function (r, cb) {
                // For now, update all documents on refresh
                exports.refreshDoc(db, r.id, cb);
            },
            callback);
        });
    };

    exports.refreshDoc = function (db_name, ddoc_id, /*optional*/callback) {
        callback = callback || utils.logErrorsCallback;

        var ddoc_url = '/' + db_name + '/' + ddoc_id;
        couchr.get('/_api' + ddoc_url, function (err, ddoc) {
            if (err) {
                return callback(
                    'Failed to read: ' + ddoc_url + '\n' + err
                );
            }
            var project_url = utils.getProjectURL(db_name, ddoc);

            var doc = {
                // TODO: use base64 encoding polyfill for older browsers?
                _id: 'project:' + window.btoa(ddoc_url),
                ddoc_url: ddoc_url,
                ddoc_rev: ddoc._rev,
                type: 'project',
                url: project_url,
                db: db_name,
                name: ddoc_id.split('/')[1]
            };
            if (!project_url) {
                // show document in futon
                //doc.url = '/_utils/document.html?' +
                //    ddoc_url.replace(/^\//,'');

                // show db in futon
                doc.url = utils.futonDatabaseURL(doc.db);
                doc.unknown_root = true;
            }
            if (ddoc.dashboard) {
                doc.dashboard = ddoc.dashboard;
            }

            async.parallel([
                function (cb) {
                    var dash = doc.dashboard;
                    if (dash && dash.icons && dash.icons['22']) {
                        var dashicon_url = '/_api/' + doc.ddoc_url + '/' +
                            dash.icons['22'];

                        utils.imgToDataURI(dashicon_url, function (err, url) {
                            if (!err && url) {
                                doc.dashicon = url;
                            }
                            cb();
                        });
                    }
                    else {
                        cb();
                    }
                },
                function (cb) {
                    couchr.get(
                        '/_api/' + doc.db + '/_security',
                        function (err, data) {
                            if (err) {
                                return cb(err);
                            }
                            doc.security = data;
                            cb();
                        }
                    );
                }
            ],
            function () {
                console.log(['update', ddoc_url, doc]);
                exports.update(doc, callback);
            })

        });
    };

    exports.create = function (db_name, ddoc_id, callback) {
        var ev = new events.EventEmitter(),
            cfg = settings.get(),
            dashboard_db = cfg.info.db_name;

        // stores the final project document created in dashboard db
        var pdoc;

        async.series([

            // Create database
            async.apply(couchr.put, '/' + db_name),

            // Replicate template to new database
            function (cb) {
                ev.emit('progress', 10);
                var repdoc = {
                    source: dashboard_db,
                    target: db_name,
                    doc_ids: [ddoc_id]
                };
                replicate(repdoc, cb);
            },

            // Copy replicated template to _design doc id
            function (cb) {
                ev.emit('progress', 60);
                var from = '/' + db_name + '/' + ddoc_id;
                var to = '_design/' + ddoc_id;
                couchr.copy(from, to, cb);
            },

            // Get a copy of the design doc for inspection
            function (cb) {
                ev.emit('progress', 70);
                couchr.get('/' + db_name + '/' + ddoc_id, function (err, ddoc) {
                    if (err) {
                        return cb(err);
                    }
                    ddoc = ddoc;
                    return cb();
                });
            },

            // Delete the old template doc replicated initially
            function (cb) {
                ev.emit('progress', 80);
                utils.getRev(db_name, ddoc_id, function (err, rev) {
                    if (err) {
                        return cb(err);
                    }
                    var q = { rev: rev };
                    couchr.delete('/' + db_name + '/' + ddoc_id, q, cb);
                });
            },

            // Create project document in dashboard db
            function (cb) {
                ev.emit('progress', 90);
                var id = '_design/' + ddoc_id;
                exports.refreshDoc(db_name, id, function (err, doc) {
                    pdoc = doc;
                    exports.saveLocal();
                    $.get('data/dashboard-data.js', function (data) {
                        // cache bust
                    });
                    cb(err);
                });
            }
        ],
        function (err) {
            if (err) {
                return callback(err);
            }
            ev.emit('progress', 100);
            console.log(['pdoc', pdoc]);
            callback(null, pdoc);
        });
        return ev;
    };

});
