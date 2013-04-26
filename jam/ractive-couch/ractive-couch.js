/**
 * Universal module definition
 */

(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('couchr'), require('ractive'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['couchr', 'ractive'], factory);
    } else {
        // Browser globals (root is window)
        root.RactiveCouch = factory(root.couchr, root.Ractive);
    }
}(this, function (couchr, Ractive) {


return {
    Doc: RactiveCouchDoc,
    View: RactiveCouchView
};


function RactiveCouchDoc(db_url, doc_id, options) {
    var doc_url = [db_url, '/', doc_id].join('/');
    var view,
        rows,
        feed_options = {};

    if (options.include_docs) feed_options.include_docs = true;

    var feed = couchr.changes(db_url, feed_options);
    feed.on('change', function (change) {
        if ( change.id === doc_id){
            if (options.include_docs) {
                view.set('doc', change.doc);
            } else {
                couchr.get(doc_url, function(err, doc) {
                    if (err) return console.log(err);
                    view.set('doc', doc);
                });
            }
        }
    });
    feed.on('error', function (err) {
        console.log(err);
    });

    var start = function(doc) {
        options.data = options.data || {};
        options.data.doc = doc;
        view = new Ractive(options);
    };

    couchr.get(doc_url, function(err, doc) {
        if (err) return console.log(err);
        start(doc);
    });
}




function RactiveCouchView(db_url, view_name, options) {
    var view_short_name,
        view_long_name,
        view,
        rows;

    var view_parts = view_name.split('/');
    if (view_parts.length === 2) {
        view_short_name = [ view_parts[0], view_parts[1] ].join('/');
        view_long_name  = [ '_design',  view_parts[0], '_view',  view_parts[1]  ].join('/');
    } else if (view_parts === 4) {
        view_short_name = [ view_parts[1], view_parts[3] ].join('/');
        view_long_name  = [ '_design',  view_parts[1], '_view',  view_parts[3]  ].join('/');
    } else {
        throw Error('view name needs to be either "ddoc/viewname" or "_design/ddoc/_view/viewname"');
    }

    var get_options = options.view_options || {};

    var findIndex = function(change) {
        if (!rows) rows = [];

        for (var i=0; i < rows.length; i++) {
            var row = rows[i];

            // use supplied isSame function to determine if row and change are equal
            if (options.is_same && options.is_same(row, change) ) return i;

            // falback to comparing id's
            if (row.id === change.id) return i;
        }
        return null;
    };

    var deleted = function(change, index) {
        rows.splice(index, 1);
    };

    var added = function(change) {
        if (!options.watch_added) return;

        if (options.map_change) {
            return rows.push(options.map_change(change));
        }

        if (options.include_docs) {
            return rows.push(change);
        }
        var doc_url = [db_url, '/', change.id].join('/');
        couchr.get(doc_url, function(err, doc) {
            if (err) return console.log(err);
            rows.push({doc: doc});
        });

    };

    var modified = function(change, index) {

        if (options.map_change) {
            return view.set('rows['+ index+']', options.map_change(change));
        }
        if (options.include_docs) {
            return view.set('rows['+ index+']', change);
        }
        var doc_url = [db_url, '/', change.id].join('/');
        couchr.get(doc_url, function(err, doc) {
            if (err) return console.log(err);

            view.set('rows['+ index+']', {doc: doc});
        });

    };

    var onChange = function(change) {
        var index = findIndex(change);
        if (change.deleted) deleted(change, index);
        else if (index === null) added(change);
        else modified(change, index);
    };



    // changes feed1, for inserts, updates
    var view_url = [db_url, '/', view_long_name].join('/');
    var feed_options = {
            filter: '_view',
            view: view_short_name
        };

    if (options.include_docs) feed_options.include_docs = true;
    var feed = couchr.changes(db_url, feed_options);
    feed.on('change', onChange);
    feed.on('error', function (err) {
        console.log(err);
    });


    if (options.watch_deletes) {
        // changes feed2 for deletes
        var feed2 = couchr.changes(db_url);
        feed2.on('change', function (change) {
            if (change.deleted) onChange(change);
        });
        feed2.on('error', function (err) {
            console.log(err);
        });
    }



    var start = function(results) {
        options.data = options.data || {};
        rows = results.rows;
        options.data.rows = rows;
        view = new Ractive(options);

    };

    couchr.get(view_url, get_options, function(err, results) {
        if (err) return console.log(err);
        start(results);
    });
}


// end of UMD
}));