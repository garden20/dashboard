/**
 * Called server side
 *
 * @param settingsDoc
 * @param req
 */
exports.dashboardURL = function(settingsDoc, dashboard_db_name, dashboard_ddoc_name, req) {
    if (settingsDoc) {
        if (settingsDoc.host_options.rootDashboard) {
            return '/';
        }

    }
    return  '/' + dashboard_db_name + '/_design/' + dashboard_ddoc_name + '/_rewrite/';
}

exports.hostRoot = function(location) {
    return location.protocol + '//' + location.host + '/';
}