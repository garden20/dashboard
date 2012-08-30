
var dashboard_views = require('lib/dashboard_views');

exports.by_active_install = dashboard_views.by_active_install;
exports.dashboard_assets = dashboard_views.dashboard_assets;
exports.app_version_by_market = dashboard_views.app_version_by_market;
exports.get_markets = dashboard_views.get_markets;
exports.get_roles = dashboard_views.get_roles;
exports.cache_manifest = dashboard_views.cache_manifest;

exports.links_only = {
    map : function(doc) {
        if (doc.type && doc.type === 'link') {
            emit(doc.dashboard_title, doc.url);
        }
    }
}

exports.redirect_assets = {
    map : function(doc) {
        if (doc.type && doc.type === 'redirect') {

            var rule = {
                route: doc.route,
                to_path: doc.to_path
            }

            var priority = Number.MAX_VALUE;
            if (doc.priority) priority = doc.priority;

            emit(priority, rule);
        }
    }
}

exports.selected_theme = {
    map : function(doc) {
        if (doc._id == 'settings') {
            emit(0, null);
        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit(1, null );
        }
    }
}