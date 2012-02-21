var templates = require('handlebars').templates,
    userTypes = require('./userType'),
    jsonp = require('jsonp'),
    utils = require('./utils');


exports.not_found = function (doc, req) {
    return {
        code: 404,
        body: templates['404.html']({})
    };
};

exports.redirectRoot = function(doc, req) {
    return {
        code: 302,
        body: "See other",
        headers: {"Location": "/"}
    };
}

exports.configInfo = function(doc, req) {
    if (!doc) return;

    var resp = doc.kanso;
    // The dashboard property is used by the garden and kanso-topbar to
    // confirm the existence of a dashboard
    resp.dashboard = true;

    return jsonp.response(req.query.callback, resp);
}



exports.install = function(doc, req) {
    var is_auth = userTypes.isAdmin(req);

    var login_link =  './#/login/redirect/.%2Finstall';
    if (req.query.app_url) {
        login_link += '%3Fapp_url%3D' + encodeURIComponent(req.query.app_url);
    }
    var content = templates['install.html']({
        app_url: req.query.app_url,
        is_auth : is_auth,
        login_link : login_link
    });
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Install Application',
            content: content,
            baseURL: utils.getBaseURL(req)
        })
    };
}

/**
 * Used by the garden to check the existence of a dashboard over jsonp
 */

exports.info = function(doc, req) {
    return jsonp.response(req.query.callback, {
        dashboard: true,
        ok: true
    });
}
