define([
    'couchr',
    'events',
    './utils'
],
function (couchr, events, utils) {
    var exports = new events.EventEmitter();


    // updated by calling refresh
    exports.sessionInfo = null;


    exports.refresh = function (/*optional*/callback) {
        callback = callback || utils.logErrorsCallback;

        couchr.get('/_session', function (err, data) {
            if (err) {
                return callback(err);
            }
            if (JSON.stringify(data) !== JSON.stringify(exports.sessionInfo)) {
                exports.sessionInfo = data;
                exports.emit('change', data);
            }
            return callback(null, data);
        });
    };


    exports.logout = function (callback) {
        callback = callback || utils.logErrorsCallback;

        var data = {username: '_', password: '_'};
        couchr.delete('/_session', data, function (err, resp) {
            if (err) {
                return callback(err);
            }
            exports.session = {userCtx: {name: null, roles: []}}
            exports.emit('change', exports.session);
            callback(null, exports.session);
        });
    };


    exports.login = function (username, password, callback) {
        var data = {name: username, password: password};
        couchr.post('/_session', data, function (err, resp) {
            if (err) {
                return callback(err);
            }
            exports.session = {userCtx: {name: username, roles: resp.roles}}
            exports.emit('change', exports.session);
            callback(null, exports.session);
        });
    };


    return exports;
});
