define('dashboard/collections/applist', [
    'exports',
    'require',
    'jquery',
    'underscore',
    'async',
    'couchr',
    'backbone',
    'backbone-pouchdb',
    '../models/app',
],
function (exports, require, $, _) {

    var Backbone = require('backbone'),
        App = require('../models/app').App,
        async = require('async'),
        couchr = require('couchr');


    var logErrorsCallback = function (err) {
        if (err) {
            console.error(err);
        }
    };

    exports.AppList = Backbone.Collection.extend({
        model: App,
        pouch: Backbone.sync.pouch('idb://dashboard', {
            reduce: false,
            include_docs: true,
            view: {
                map: function (doc) {
                    if (doc.type === 'app') {
                        emit([doc.title], null);
                    }
                }
            }
        }),
        update: function (/*optional*/callback) {
            callback = callback || logErrorsCallback;
            var that = this;

            couchr.get('/_all_dbs', function (err, dbs) {
                if (err) {
                    return callback('Failed to update app list\n' + err);
                }
                // do in with low concurrency otherwise chrome likes to cancel
                // the ajax calls with status 0
                var fn = _.bind(that.updateDB, that);
                async.forEachSeries(dbs, fn, callback);
            });
        },
        updateDB: function (db, /*optional*/callback) {
            callback = callback || logErrorsCallback;
            var that = this;

            var url = '/' + encodeURIComponent(db) + '/_all_docs';
            var q = {
                startkey: '"_design/"',
                endkey: '"_design0"'
            };
            couchr.get(url, q, function (err, data) {
                if (err) {
                    return callback(
                        'Failed to update apps from DB: ' + db + '\n' + err
                    );
                }
                // do in series otherwise chrome likes to cancel the ajax
                // calls with status 0
                async.forEachSeries(data.rows || [], function (r, cb) {
                    var ddoc_url = ['', db, r.id].join('/');

                    if (!that.exists(ddoc_url, r.value.rev)) {
                        // does not exist at this revision, update
                        that.updateDoc(ddoc_url, cb);
                    }
                    else {
                        console.log(['skip app', ddoc_url]);
                    }
                },
                callback);
            });
        },
        updateDoc: function (ddoc_url, /*optional*/callback) {
            callback = callback || logErrorsCallback;
            var that = this;

            couchr.get(ddoc_url, function (err, ddoc) {
                if (err) {
                    return callback(
                        'Failed to app from doc: ' + ddoc_url + '\n' + err
                    );
                }
                // open design doc in futon by default
                var app_url = '/_utils/document.html?' + ddoc_url;
                if (ddoc._attachments) {
                    if (ddoc._attachments['index.html']) {
                        app_url = ddoc_url + '/index.html';
                    }
                    else if (ddoc._attachments['index.htm']) {
                        app_url = ddoc_url + '/index.htm';
                    }
                }
                if (ddoc.rewrites && ddoc.rewrites.length) {
                    app_url = ddoc_url + '/_rewrite/';
                }
                var doc = {
                    _id: ddoc_url,
                    _rev: ddoc._rev,
                    url: app_url,
                    name: ddoc._id.split('/')[1]
                };
                var app = that.get(ddoc_url);
                if (app) {
                    console.log(['update app', doc._id, doc]);
                    app.set(doc);
                }
                else {
                    console.log(['create app', doc._id, doc]);
                    var app = new App(doc);
                    app.save();
                    that.add(app);
                }
                callback();
            });
        },
        exists: function (id, /*optional*/rev) {
            return this.any(function (m) {
                if (m._id === id) {
                    if (rev && m._rev === rev) {
                        return true;
                    }
                }
                return false;
            });
        }
    });

});
