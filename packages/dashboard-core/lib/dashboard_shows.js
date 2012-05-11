var jsonp = require('jsonp');




exports.configInfo = function(doc, req) {
    if (!doc) return;

    var resp = doc.kanso;
    // The dashboard property is used by the garden and kanso-topbar to
    // confirm the existence of a dashboard
    resp.dashboard = true;

    return jsonp.response(req.query.callback, resp);
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
