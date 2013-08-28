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

    // if no trailing slash, for saftey of resource urls, rewrite to a trailing slash
    if (/\/_rewrite$/.test(req.headers["x-couchdb-requested-path"])) {
             return {
                code: 302,
                body: "See other",
                headers: {"Location": req.headers["x-couchdb-requested-path"] + '/'}
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
                title: 'Garden',
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

exports.go = function(doc, req) {
    var redirect =  req.query.location;
    var login_link =  './login?redirect=' + redirect;

    var content = templates['userRedirect.html']({
        username: req.userCtx.name,
        redirect: redirect,
        login_link: login_link
    });
    var scripts = ["static/js/redirect.js"];
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Redirecting',
            dont_cache: true,
            content: content,
            baseURL: utils.getBaseURL(req),
            scripts: scripts
        })
    }

}

exports.login = function (doc, req) {
    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);
    var dashboard_url = dashboard_links.dashboardURL(settings, 'dashboard', 'dashboard', req);

    if (utils.isUser(req)) {
        // if there is a redirect, have them go to a page that checks they can access
        if (req.query.redirect) {
            var redirect = './go?location=' + req.query.redirect;
            return {
                code: 302,
                body: 'Redirecting to go controller.',
                headers: {"Location": redirect}
            };
        }
        return {
            code: 302,
            body: 'You are already signed in.',
            headers: {"Location": dashboard_url}
        };
    }

    if (settings.sessions.type === "internal" && settings.sessions.internal.login_type === 'browserid') {
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

    if (!settings.sessions.type) settings.sessions.type = 'local';
    settings.sessions['login_type_' +  settings.sessions.internal.login_type] = true;
    settings.sessions['type_' + settings.sessions.type] = true;


    var content = templates['settings.html']({
        isAdmin : isAdmin,
        settings : settings,
        host_options : JSON.stringify(settings.host_options)
    });

    var scripts = [
        "static/js/settings.js",
        "static/js/lib/jquery.dom.form_params.js",
        "static/js/lib/jquery.form.js",
        "static/js/lib/chosen.jquery.min.js",
        "jam/jquery.lego/jquery.lego.js",
        "jam/underscore/underscore.js",
        "jam/select2/select2.js",
        "jam/json.edit/json.schema.js",
        "jam/json.edit/nsgen.js",
        "jam/json.edit/json.edit.js",
        "jam/json.edit/addons/autocomplete.js",
        "jam/events/events.js",
        "jam/couchr/couchr-browser.js",
        "jam/pico-couch-ddoc/pico-couch-ddoc.js",
        "jam/ractive/Ractive.js",
        "jam/ractive-couch/ractive-couch.js",
        "jam/gardener-status/gardener-status.js",
        "jam/couch-user-editor/couchdb-user-editor.js"

    ];
    var styles = [
        "jam/select2/select2.css"
    ];
    return {
        code: 200,
        body: templates['base.html']({
            dont_cache : true,
            title: 'Garden - Settings',
            content: content,
            baseURL: utils.getBaseURL(req),
            scripts : scripts,
            styles: styles,
            settings : settings
        }),
        "headers": {"Cache-Control": "no-cache"}
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
    var installation_location_type = 'Garden';
    var installation_location_description = dashboard_links.friendlyName(dashboard_url);
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
        host_options : JSON.stringify(settings.host_options),
        login_link : login_link,
        hosted : settings.host_options.hosted,
        installation_location_icon: installation_location_icon,
        installation_location_type : installation_location_type,
        installation_location_description : installation_location_description
    });





    var scripts = [
        "static/js/install.js",
        "jam/events/events.js",
        "jam/couchr/couchr-browser.js",
        "jam/pico-couch-ddoc/pico-couch-ddoc.js",
        "jam/ractive/Ractive.js",
        "jam/ractive-couch/ractive-couch.js",
        "jam/gardener-status/gardener-status.js"
    ];
    return {
        code: 200,
        body: templates['base.html']({
            dont_cache : true,
            title: 'Install Application1',
            content: content,
            scripts : scripts,
            dashboard_url : dashboard_url,
            baseURL: utils.getBaseURL(req)
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
