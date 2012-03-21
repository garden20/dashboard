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

exports.login = function (settingsDoc, req) {
    var dashboard_url = dashboard_links.dashboardURL(settingsDoc, 'dashboard', 'dashboard', req);
    var content = templates['login.html']({
        dashboard_url : dashboard_url
    });
    var scripts = ["login.js"];
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

exports.settings = function(doc, req) {
    var isAdmin = utils.isAdmin(req);


    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    var content = templates['settings.html']({
        isAdmin : isAdmin,
        settings : settings
    });

    var scripts = ["settings.js", "lib/jquery.dom.form_params.js"];
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Settings',
            content: content,
            baseURL: utils.getBaseURL(req),
            scripts : scripts,
            settings : settings
        })
    };
}

exports.topbar_css = function(doc, req) {
    if (!doc) doc = {};
    var settings = _.defaults(doc, dashboard_settings.defaultSettings);

    return {
        code: 200,
        headers: {'content-type' : 'text/css'},
        body: templates['topbar.css']({
            top_nav_bar : settings.top_nav_bar
        })
    };
}

exports.install = function(doc, req) {
    var is_auth = utils.isAdmin(req);

    var login_link =  './#/login/redirect/.%2Finstall';
    if (req.query.app_url) {
        login_link += '%3Fapp_url%3D' + encodeURIComponent(req.query.app_url);
    }
    var content = templates['install.html']({
        app_url: req.query.app_url,
        is_auth : is_auth,
        login_link : login_link
    });
    return {
        code: 200,
        body: templates['base.html']({
            title: 'Install Application',
            content: content,
            baseURL: utils.getBaseURL(req)
        })
    };
}


