define([
    'exports',
    'require',
    'couchr'
],
function (exports, require) {

    var couchr = require('couchr');


    exports.imgToDataURI = function (src, callback) {
        var img = new Image();
        img.src = src;
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            return callback(null, canvas.toDataURL());
        };
        img.onerror = function () {
            return callback(new Error('Error loading image: ' + src));
        };
        img.onabort = function () {
            return callback(new Error('Loading of image aborted: ' + src));
        };
    };

    exports.getProjectURL = function (db_name, ddoc) {
        var id = ddoc._id;
        if (!/^_design\//.test(id)) {
            id = '_design/' + id;
        }
        if (ddoc.rewrites && ddoc.rewrites.length) {
            return '/' + db_name + '/' + id + '/_rewrite/';
        }
        if (ddoc._attachments) {
            if (ddoc._attachments['index.html']) {
                return '/' + db_name + '/' + id + '/index.html';
            }
            else if (ddoc._attachments['index.htm']) {
                return '/' + db_name + '/' + id + '/index.htm';
            }
        }
        return null;
    };

    exports.futonDatabaseURL = function (db_name) {
        return '/_utils/database.html?' + db_name;
    };

    exports.getRev = function (db_name, id, callback) {
        // test if revision is available locally
        couchr.head('/' + db_name + '/' + id, function (err, data, req) {
            if (err) {
                if (err.status === 404) {
                    // if status is 404 then the current head rev may be a
                    // deleted doc - search changes feed if you need that info
                    return callback(null, null);
                }
                return callback(err);
            }
            var etag = req.getResponseHeader('ETag') || '',
                rev = etag.replace(/^"/, '').replace(/"$/, '');

            return callback(null, rev || null);
        });
    };

});
