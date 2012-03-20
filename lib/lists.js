var templates = require('handlebars').templates;
var gravatar = require('gravatar');
var utils = require('lib/utils');
var dashboard_links  = require('lib/dashboard_links');

exports.topbar = function(head, req) {



    var username, avatar = null;
    var isAdmin = false;

    if (req.userCtx.name) {
        username = req.userCtx.name;
        avatar = gravatar.avatarURL({
            email : req.userCtx.name,
            size : 20,
            default_image : 'mm'
        });
    }
    if (utils.isAdmin(req)) {
        isAdmin = true;
    }

    var settingsDoc = null;
    var row;
    var apps = [];
    start({'headers' : {'Content-Type' : 'text/html'}});
    while ((row = getRow())) {
        if (row.key[0] === 0) settingsDoc = row.value;

        if (row.key[0] === 1) {
            apps.push({
                title : row.key[2],
                db :row.value.db
            })
        }
    }

    var dashboard_url = dashboard_links.dashboardURL(settingsDoc, 'dashboard', 'dashboard', req);
    var settings_url  = dashboard_url + "settings";
    var login_url = dashboard_url + 'login';



    send(templates['topbar.html']({
        dashboard_url : dashboard_url,
        settings_url : settings_url,
        login_url : login_url,
        apps : apps,
        username : username,
        avatar : avatar,
        isAdmin: isAdmin
    }));
}