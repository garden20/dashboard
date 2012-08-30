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

exports.appUrl = function(settingsDoc, app_install_doc, req) {
    if (settingsDoc && settingsDoc.host_options.short_urls && settingsDoc.host_options.short_app_urls) {
        return '/' + app_install_doc.installed.db + '/';
    }

    return '/' + app_install_doc.installed.db + '/_design/' + app_install_doc.doc_id  + app_install_doc.open_path;
}