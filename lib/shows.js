var templates = require('handlebars').templates,
    jsonp = require('jsonp'),
    utils = require('./utils'),
    _ = require('underscore')._,
    showdown = require('lib/showdown-wiki');
var dashboard_shows = require('lib/dashboard_shows');
var dashboard_links = require('lib/dashboard_links');
var dashboard_settings = require('lib/settings');

exports.not_found = function (doc, req) {
    return {
        code: 404,
        body: templates['404.html']({})
    };
};


exports.configInfo = dashboard_shows.configInfo;
exports.info = dashboard_shows.info;

exports.frontpage = function(doc, req) {

    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    if (!utils.isUser(req) && settings.host_options.redirect_frontpage_on_anon) {
        var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);
        var login_url = dashboard_url + 'login';
        // not logged in, and please redirect.
        return {
                code: 302,
                body: "See other",
                headers: {"Location": login_url}
            };
    }


    if (settings.frontpage.use_link) {
        return {
                code: 302,
                body: "See other",
                headers: {"Location": doc.frontpage.link_url}
            };
    }

    var content;
    if (settings.frontpage.use_markdown) {
        settings.frontpage.markdown_content = showdown.convert( settings.frontpage.markdown );
        content = templates['frontpage_markdown.html'](settings.frontpage);
    } else {
        content = settings.frontpage.html;
    }

    return {
            code: 200,
            body: templates['base.html']({
                title: 'Install Application',
                content: content,
                baseURL: utils.getBaseURL(req)
            })
    };
}

function usersTableLogin(settingsDoc, req){
    var dashboard_url = dashboard_links.dashboardURL(settingsDoc, 'dashboard', 'dashboard', req);
    var content = templates['login.html']({
        dashboard_url : dashboard_url
    });
    var scripts = ["static/js/login.js"];
    return {
            code: 200,
            body: templates['base.html']({
                title: 'Login',
                content: content,
                baseURL: utils.getBaseURL(req),
                scripts : scripts
            })
    };
}

function browseridLogin(settingsDoc, req) {
    var dashboard_url = dashboard_links.dashboardURL(settingsDoc, 'dashboard', 'dashboard', req);
    var content = templates['browserid.html']({
        dashboard_url : dashboard_url
    });
    var scripts = ["_couch/_browserid/include.js", "_couch/_browserid/main.js", "static/js/browserid.js"];
    var styles = ["_couch/_browserid/style.css"];
    return {
            code: 200,
            body: templates['base.html']({
                title: 'Login',
                content: content,
                baseURL: utils.getBaseURL(req),
                styles : styles,
                scripts : scripts
            })
    };
}

exports.login = function (doc, req) {
    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    if (settings.host_options.login_type === 'browserid') {
        return browseridLogin(settings, req);
    } else {
        return usersTableLogin(settings, req);
    }
}

exports.settings = function(doc, req) {
    var isAdmin = utils.isAdmin(req) || utils.isAdminParty(req);


    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    if (!utils.isUser(req) && settings.host_options.redirect_frontpage_on_anon) {
        var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);
        var login_url = dashboard_url + 'login';
        // not logged in, and please redirect.
        return {
                code: 302,
                body: "See other",
                headers: {"Location": login_url}
            };
    }

    settings.host_options['login_type_' +  settings.host_options.login_type] = true;

    var content = templates['settings.html']({
        isAdmin : isAdmin,
        settings : settings
    });

    var scripts = ["static/js/settings.js", "static/js/lib/jquery.dom.form_params.js", "static/js/lib/jquery.form.js", "static/js/lib/chosen.jquery.min.js"];
    var styles = ["static/css/chosen.css"];
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Settings',
            content: content,
            baseURL: utils.getBaseURL(req),
            scripts : scripts,
            styles : styles,
            settings : settings
        })
    };
}

exports.topbar_css = function(doc, req) {
    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    var custom_icon_top_padding = 3;
    if (settings.top_nav_bar.icon_name && settings.top_nav_bar.icon_height) {
        custom_icon_top_padding = (25 - settings.top_nav_bar.icon_height) / 2;

    }
    var position = 'relative';
    if (req.query.position) position = req.query.position;
    var theme_content;

    try {
        var not_theme = settings.top_nav_bar.notification_theme || 'libnotify';
        var theme = 'humane-' + not_theme + '.css';
        theme_content = templates[theme]({});
    } catch(ignore){}
    return {
        code: 200,
        headers: {'content-type' : 'text/css'},
        body: templates['topbar.css']({
            top_nav_bar : settings.top_nav_bar,
            custom_icon_top_padding : custom_icon_top_padding,
            theme_content : theme_content,
            position: position
        })
    };
}

exports.install = function(doc, req) {
    var is_auth = utils.isAdmin(req) || utils.isAdminParty(req) ;

    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);
    var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);

    var login_link =  './login?redirect=install';
    if (req.query.app_url) {
        login_link += '%3Fapp_url%3D' + encodeURIComponent(req.query.app_url);
    }
    var installation_location_icon = 'install_to_dashboard.png';
    var installation_location_type = 'dashboard';
    var installation_location_description = dashboard_url;
    if (settings.host_options.hosted) {
        var installation_location_icon = 'garden20.png';
        var installation_location_type = 'hosted';
        var installation_location_description = settings.host_options.hosted_name;
        if (!installation_location_description) {
            installation_location_description = "Garden20";
        }

    }

    var content = templates['install.html']({
        app_url: req.query.app_url,
        is_auth : is_auth,
        login_link : login_link,
        hosted : settings.host_options.hosted,
        installation_location_icon: installation_location_icon,
        installation_location_type : installation_location_type,
        installation_location_description : installation_location_description
    });

    var second_bar = templates['second_bar.html']({

    });



    var scripts = ["static/js/install.js"];
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Install Application',
            content: content,
            scripts : scripts,
            dashboard_url : dashboard_url,
            baseURL: utils.getBaseURL(req),
            second_bar : second_bar
        })
    };
}

exports.redirect = function(doc, req) {
    if (!doc) doc = { rewrites: [] };

    var path = req.query.path;

    var crossroads = require('lib/crossroads').create();
    crossroads.normalizeFn = crossroads.NORM_AS_OBJECT;
    _.templateSettings = {
        interpolate: /\{(.+?)\}/g
    }

    // since crossroads has callbacks, and the show function needs to return something,
    // we have this try catch crazy
    try {
        var resultFn = function(vals, to_path) {
            var template = _.template(to_path);

            var url = template(vals);

            var msg =  {
                found : true,
                url : url
            }
            throw msg;
        }
        crossroads.bypassed.add(function(request){
            // no route matched!
            var msg = {
                not_found : true,
                info : {
                    path : path,
                    crossroads : request,
                    req : req
                }
            }
            throw msg;
        });
        _.each(doc.rewrites, function(rewrite) {
            var route = rewrite.route;
            var to_path = rewrite.to;
            log('add route: ' + route);
            crossroads.addRoute(route, function(vals){
                resultFn(vals, to_path);
            });
        })
        crossroads.parse(path);

    } catch(e) {
        if (e.found) {
            return {
                code: 302,
                headers: {"Location":e.url},
                body: "See other"
            };
        }
        else  {
            var isAdmin = utils.isAdmin(req) || utils.isAdminParty(req);
            var isUser = utils.isUser(req);
            var content = templates['redirect_no_match.html']({
                path : path,
                isAdmin: isAdmin,
                isUser : isUser
            });
            var scripts = ["static/js/register_redirect.js"];
            return {
                code: 200,
                body: templates['base.html']({
                    title: 'Redirect Not Found',
                    content: content,
                    scripts: scripts,
                    baseURL: utils.getBaseURL(req)
                })
            };
        }
    }

}
