define([
    'exports',
    'couchr',
    'underscore'
],
function (exports, couchr, _) {

    exports.authDB = function (callback) {
        couchr.get('/_session', function (err, resp) {
            if (err) {
                return callback(err);
            }
            return callback(null, resp.info.authentication_db);
        });
    };

    exports.create = function (name, password, /*opt*/prop, callback) {
        if (!callback) {
            callback = prop;
            prop = {};
        }
        var doc = _.extend({
            _id: 'org.couchdb.user:' + name,
            type: 'user',
            name: name,
            password: password,
            roles: []
        }, prop);

        exports.authDB(function (err, db_name) {
            if (err) {
                return callback(err);
            }
            var url = '/' + db_name + '/' + encodeURIComponent(doc._id);
            couchr.put(url, doc, callback);
        });
    };

    // TODO: exports.makeAdmin (posts to /_config/admins)

});
