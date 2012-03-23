var templates = require('handlebars').templates;
var gravatar = require('gravatar');
var utils = require('lib/utils');
var dashboard_links  = require('lib/dashboard_links');
var dashboard_settings = require('lib/settings');
var _ = require('underscore')._;

exports.topbar = function(head, req) {
    var settingsDoc = {};
    var row;
    var apps = [];
    while ((row = getRow())) {
        if (row.key[0] === 0) settingsDoc = row.value;

        if (row.key[0] === 1) {
            apps.push({
                title : row.key[2],
                db :row.value.db,
                doc : row.doc
            })
        }
    }
    var settings = _.defaults(settingsDoc, dashboard_settings.defaultSettings);
    var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);
    var settings_url  = dashboard_url + "settings";
    var login_url = dashboard_url + 'login';
    var username, avatar = null;
    var isAdmin = false;
    var isUser  = utils.isUser(req);
    if (utils.isAdmin(req)) {
        isAdmin = true;
    }
    if (isUser) {
        username = req.userCtx.name;
        avatar = gravatar.avatarURL({
            email : req.userCtx.name,
            size : 20,
            default_image : 'mm'
        });
    }

    var hide_apps = (!isUser && settings.host_options.redirect_frontpage_on_anon);

    apps = _.map(apps, function(app) {
        app.link = dashboard_links.appUrl(settingsDoc, app.doc, req);
        log(app.link);
        return app;
    })


    start({'headers' : {'Content-Type' : 'text/html'}});
    send(templates['topbar.html']({
        dashboard_url : dashboard_url,
        settings_url : settings_url,
        login_url : login_url,
        apps : apps,
        username : username,
        avatar : avatar,
        isAdmin: isAdmin,
        hide_apps : hide_apps,
        settings : settings
    }));
}