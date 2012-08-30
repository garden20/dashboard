var handlebars = require('handlebars');
var templates = handlebars.templates;
var gravatar = require('gravatar');
var utils = require('lib/utils');
var dashboard_links  = require('lib/dashboard_links');
var dashboard_settings = require('lib/settings');
var _ = require('underscore')._;


exports.topbar = function(head, req) {
    var settingsDoc = {};
    var selectedThemeDoc = null;
    var row;
    var apps = [];
    start({'headers' : {'Content-Type' : 'text/html'}});
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
        if (row.key[0] === 2) selectedThemeDoc = row.doc;
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
    var templateContext = {
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
        sessionType : settings.sessions.type,
        extraResources : []
    };


    if (selectedThemeDoc) {
        if (selectedThemeDoc._attachments) {
            _.each(selectedThemeDoc._attachments, function(value, name){
                if (name === 'modules.js') return ;
                if (value.content_type == "application/javascript") {
                    templateContext.extraResources.push({
                        doc : selectedThemeDoc._id,
                        attachment: name
                    });
                }
            });
        }
        log(templateContext.extraResources);
        var template = handlebars.compile(selectedThemeDoc['template.html']);
        send(template(templateContext));
    } else {
        send(templates['topbar.html'](templateContext));
    }
}

exports.topbar_css = function(head, req) {
    var settingsDoc = {};
    var selectedThemeDoc = null;
    start({'headers' : {'Content-Type' : 'text/css'}});
    while ((row = getRow())) {
        if (row.key === 0) settingsDoc = row.doc;
        if (row.key === 1) selectedThemeDoc = row.doc;
    }
    var settings = _.defaults(settingsDoc, dashboard_settings.defaultSettings);
    var position = 'relative';
    if (req.query.position) position = req.query.position;
    var theme_content;

    try {
        var not_theme = settings.top_nav_bar.notification_theme || 'libnotify';
        var theme = 'humane-' + not_theme + '.css';
        theme_content = templates[theme]({});
    } catch(ignore){}

    var default_height = 25;
    if (selectedThemeDoc && selectedThemeDoc.kanso && selectedThemeDoc.kanso.config && selectedThemeDoc.kanso.config.topbar && selectedThemeDoc.kanso.config.topbar.height){
        default_height = selectedThemeDoc.kanso.config.topbar.height;
    }
    var custom_icon_top_padding = 3;
    if (settings.top_nav_bar.icon_name && settings.top_nav_bar.icon_height) {
        custom_icon_top_padding = (default_height - settings.top_nav_bar.icon_height) / 2;

    }
    var template = templates['topbar.css'];
    if (selectedThemeDoc) {
        template = handlebars.compile(selectedThemeDoc['topbar.css']);
    }

    send (template({
        top_nav_bar : settings.top_nav_bar,
        custom_icon_top_padding : custom_icon_top_padding,
        theme_content : theme_content,
        position: position
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

exports.cache_manifest = function(head, req) {
    /*
     * We need to invalidate the cache manifest when the user changes settings, adds/removes apps, adds/removes links,
     * etc. We simply use all the revs of the dashboard assests to invalidate the appcache.
     */

    start({'headers' : {'Content-Type' : 'text/cache-manifest'}});
    var revs = "";
    while ((row = getRow())) {
        revs += row.doc._rev;
    }
    send (templates['dashboard.appcache']({
        revs : revs
    }));
}