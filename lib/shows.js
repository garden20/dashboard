var templates = require('duality/templates'),
    userTypes = require('./userType'),
    jsonp = require('jsonp');


exports.not_found = function (doc, req) {
    return {
        code: 404,
        title: 'Not found',
        content: templates.render('404.html', req, {})
    };
};

exports.redirectRoot = function(doc, req) {
    return {"code": 302, "body": "See other", "headers": {"Location": "/"}};
}

exports.configInfo = function(doc, req) {
    if (!doc) return;

    return jsonp.response(req.query.callback, doc.kanso);
}



exports.install = function(doc, req) {
    var is_auth = userTypes.isAdmin(req);

    var login_link =  './#/login/redirect/.%2Finstall';
    if (req.query.app_url) {
        login_link += '%3Fapp_url%3D' + encodeURIComponent(req.query.app_url);
    }
    return {
        code: 200,
        title: 'Install Application',
        content: templates.render('install.html', req, {
            app_url: req.query.app_url,
            is_auth : is_auth,
            login_link : login_link
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
