
var dashboard_updates = require('lib/dashboard_updates');
var _ = require('underscore')._;
var settings = require('lib/settings');
var utils = require('lib/utils');

exports.modifyAppRewrites  = dashboard_updates.modifyAppRewrites;
exports.updateNavOrder = dashboard_updates.updateNavOrder;

exports.frontpage = function(doc, req) {
    if (!req.query.isMarkdown) return [null, "Provide the isMarkDown"];
    if (!req.query.showActivityFeed) return [null, "Provide the showActivityFeed"];
    if (!req.query.text) return [null, "Provide the text"];
    if (!utils.isAdmin(req) && !utils.isAdminParty(req)) return [null, "Only an admin can update"];

    var text = unescape(req.query.text);
    var use_markdown = req.query.isMarkdown == 'true';
    var show_activity_feed = req.query.showActivityFeed == 'true';

    if (!doc) {
        var doc = _.defaults({}, settings.defaultSettings);
        doc._id = 'settings';
        doc.frontpage.use_markdown =  use_markdown;
        doc.frontpage.use_html = !use_markdown;
        doc.frontpage.show_activity_feed = show_activity_feed;
        if (doc.frontpage.use_markdown) doc.frontpage.markdown = text;
        else doc.frontpage.html = text;


        return [doc, 'update complete'];

    } else {
        // the id must match
        doc.frontpage.use_markdown =  use_markdown;
        doc.frontpage.use_html = !use_markdown;
        doc.frontpage.show_activity_feed = show_activity_feed;
        if (doc.frontpage.use_markdown) doc.frontpage.markdown = text;
        else doc.frontpage.html = text;

        return [doc, 'update complete'];
    }
}

function kindyTruthy(req_param) {

    if (_.isString(req_param)) {
        if (req_param == 'true') return true;
        if (req_param == 'on') return true;
        return false;
    }
    if (_.isNumber(req_param)) return req_param;
    if (_.isBoolean(req_param)) return req_param;
}


exports.navigation = function(doc, req) {
    if (!utils.isAdmin(req) && !utils.isAdminParty(req)) return [null, "Only an admin can update"];

    var text = unescape(req.query.text);
    var use_markdown = req.query.isMarkdown == 'true';
    var show_activity_feed = req.query.showActivityFeed == 'true';

    if (!doc) {
        doc = _.defaults({}, settings.defaultSettings);
        doc._id = 'settings';
    }

    if (!doc.host_options) doc.host_options = {};
    doc.host_options.short_urls = kindyTruthy(req.query.short_urls);
    doc.host_options.hostnames = req.query.hostnames;
    doc.host_options.short_app_urls = kindyTruthy(req.query.short_app_urls);
    doc.host_options.rootDashboard = kindyTruthy(req.query.rootDashboard);
    doc.host_options.redirect_frontpage_on_anon = kindyTruthy(req.query.redirect_frontpage_on_anon);
    doc.host_options.login_type = req.query.login_type;


    if (!doc.top_nav_bar) doc.top_nav_bar = {};
    doc.top_nav_bar.bg_color = req.query.bg_color;
    doc.top_nav_bar.link_color = req.query.link_color;
    doc.top_nav_bar.active_link_color = req.query.active_link_color;
    doc.top_nav_bar.active_bar_color = req.query.active_bar_color;
    doc.top_nav_bar.show_brand = kindyTruthy(req.query.show_brand);
    if (_.isString(req.query.icon_name) && req.query.icon_name != '') {
        doc.top_nav_bar.icon_name = req.query.icon_name;
        doc.top_nav_bar.icon_height = req.query.icon_height;
        doc.top_nav_bar.icon_width  = req.query.icon_width;
    }
    doc.top_nav_bar.brand_link = req.query.brand_link;
    doc.top_nav_bar.show_gravatar = kindyTruthy(req.query.show_gravatar);
    doc.top_nav_bar.show_username = kindyTruthy(req.query.show_username);
    doc.top_nav_bar.admin_show_futon = kindyTruthy(req.query.admin_show_futon);

    return [doc, 'update complete'];

}

