var _ = require('underscore')._;


exports.getBaseURL = function (/*optional*/req) {
    if (req.query.baseURL) {
        return req.query.baseURL;
    }
    if (req.query.db && req.query.ddoc) {
        return '/' + req.query.db + '/_design/' + req.query.ddoc + '/_rewrite/';
    }

    if (_.include(req.path, '_rewrite')) {
        return '/' + req.path.slice(0, 3).join('/') + '/_rewrite';
    }
    if (req.headers['x-couchdb-vhost-path']) {
        return '';
    }
    return '/' + req.path.slice(0, 3).join('/') + '/_rewrite';
};


exports.isAdminParty = function(req) {
    if (req.userCtx.name == null && req.userCtx.roles.indexOf('_admin') >= 0 ) return true;
    return false;
}


exports.isAdmin = function(req) {
    if (!req.userCtx) return false;
    if (!req.userCtx.name) return false;
    if (!req.userCtx.roles) return false;
    if (req.userCtx.roles.indexOf('_admin') === -1) return false;

    return true;
}


exports.isUser = function(req) {
    if (!req.userCtx) return false;
    if (!req.userCtx.name) return false;
    return true;
}

exports.getUsername = function(req) {
    return req.userCtx.name;
}