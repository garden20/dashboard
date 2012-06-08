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
            if (row.key[3] == 'install') {
                apps.push({
                    title : row.key[2],
                    db :row.value.db,
                    doc : row.doc
                })
            }
            if (row.key[3] == 'link') {
                apps.push({
                    title : row.key[2],
                    link :row.value.url,
                    doc  : row.doc,
                    external : true
                })
            }
        }
    }
    var settings = _.defaults(settingsDoc, dashboard_settings.defaultSettings);
    var username, avatar, avatar_large = null;
    var isAdmin = false;
    var isUser  = utils.isUser(req);
    var isAdminParty = utils.isAdminParty(req);
    if (utils.isAdmin(req) || isAdminParty) {
        isAdmin = true;
    }
    if (isUser) {
        username = req.userCtx.name;
        avatar = gravatar.avatarURL({
            email : req.userCtx.name,
            size : 20,
            default_image : 'mm'
        });
        avatar_large = gravatar.avatarURL({
            email : req.userCtx.name,
            size : 96,
            default_image : 'mm'
        });

    }

    var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);
    var home_url = dashboard_url;
    if (settings.frontpage.use_link) {
        home_url = settings.frontpage.link_url;
    }
    var settings_url  = dashboard_url + "settings";
    var login_url = dashboard_url + 'login';
    var profile_url = null;

    if (settings.sessions.type == 'other') {
        login_url = settings.sessions.other.login_url;
        _.templateSettings = {
            interpolate: /\{(.+?)\}/g
        }
        var template = _.template(settings.sessions.other.profile_url);
        profile_url = template({username : username});

    }

    var hide_apps = (!isUser && settings.host_options.redirect_frontpage_on_anon);

    apps = _.map(apps, function(app) {
        if (app.db) {
            app.link = dashboard_links.appUrl(settingsDoc, app.doc, req);
        }
        return app;
    });

    var grouped_apps = _.groupBy(apps, function(app) {
        if (app.doc.onDropdownMenu) return "more_apps"
        else return "apps";
    });



    var usrCtxString = encodeURI(JSON.stringify(req.userCtx));

    start({'headers' : {'Content-Type' : 'text/html'}});
    send(templates['topbar.html']({
        dashboard_url : dashboard_url,
        home_url : home_url,
        settings_url : settings_url,
        login_url : login_url,
        profile_url : profile_url,
        apps : grouped_apps,
        username : username,
        avatar : avatar,
        avatar_large : avatar_large,
        isAdmin: isAdmin,
        isAdminParty : isAdminParty,
        hide_apps : hide_apps,
        settings : settings,
        usrCtxString : usrCtxString,
        sessionType : settings.sessions.type
    }));
}

exports.redirect = function(head, req) {

    var path = req.query.path;

    var crossroads = require('lib/crossroads').create();
    crossroads.normalizeFn = crossroads.NORM_AS_OBJECT;
    crossroads.bypassed.add(function(request){
        // no route matched!
        start({'headers' : {'Content-Type' : 'text/html'}});

        var info = {
            path : path,
            crossroads : request,
            req : req
        }

        send(templates['redirect_no_match.html'](info));
    });
    _.templateSettings = {
        interpolate: /\{(.+?)\}/g
    }

    var resultFn = function(vals, to_path) {
        var template = _.template(to_path);
        var url = template(vals);
        start({"code": 302, "headers": {"Location": url}, "body": "See other"});
        send('redirect to : ' + url);
    }

    var row;
    while ((row = getRow())) {
        var route = row.value.route;
        var to_path = row.value.to_path;
        crossroads.addRoute(route, function(vals){
            resultFn(vals, to_path);
        });
    }
    crossroads.parse(path);

}

