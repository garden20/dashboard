define([
    'exports',
    'require',
    'couchr'
],
function (exports, require) {

    var couchr = require('couchr');


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

});
