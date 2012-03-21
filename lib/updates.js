
var dashboard_updates = require('lib/dashboard_updates');
var _ = require('underscore')._;
var settings = require('lib/settings');
var utils = require('lib/utils');

exports.modifyAppRewrites  = dashboard_updates.modifyAppRewrites;

exports.frontpage = function(doc, req) {
    if (!req.query.isMarkdown) return [null, "Provide the isMarkDown"];
    if (!req.query.showActivityFeed) return [null, "Provide the showActivityFeed"];
    if (!req.query.text) return [null, "Provide the text"];
    if (!utils.isAdmin(req)) return [null, "Only an admin can update"];

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



