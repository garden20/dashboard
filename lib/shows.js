var templates = require('handlebars').templates,
    jsonp = require('jsonp'),
    utils = require('./utils'),
    showdown = require('lib/showdown-wiki');
var dashboard_shows = require('lib/dashboard_shows');
var dashboard_links = require('lib/dashboard_links');

exports.not_found = function (doc, req) {
    return {
        code: 404,
        body: templates['404.html']({})
    };
};

exports.redirectRoot = dashboard_shows.redirectRoot;
exports.configInfo = dashboard_shows.configInfo;
exports.info = dashboard_shows.info;

exports.frontpage = function(doc, req) {

    var default_front = {
        title : 'Dashboard'
    }

    if (doc) {
        if (doc.message) default_front.message = doc.message;
        if (doc.title) default_front.title = doc.title;
    } else {
        default_front.message = showdown.convert( templates['frontpage_default.md'](default_front) );
    }

    var content = templates['frontpage.html'](default_front);


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

    var settings = {
        front_page_type : 'built_in'
    };

    var content = templates['settings.html']({
        isAdmin : isAdmin,
        settings : settings
    });

    var scripts = ["settings.js"];
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


