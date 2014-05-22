var _ = require('underscore')._;
var handlebars = require('handlebars');
var async = require('async');
var session = require('session');
var users = require("users");
var dashboard_core = require('lib/dashboard_core');
var dashboard_links = require('lib/dashboard_links');
var dashboard_settings = require('lib/settings');
var db = require('db').use('_db');
var datelib = require('datelib');
var showdown = require('showdown');

$(function() {

    function errorLoadingInfo() {
        $('.loading').html(handlebars.templates['install_app_error.html']({}, {}));
    }

    function getGithubChangelog(repoUrl, callback) {
        if (repoUrl.indexOf('github.com') != -1) {
            var parts = repoUrl.substring(repoUrl.indexOf('github.com')).split('/');
            var user = parts[1];
            var repo = parts[2];
            $.ajax({
                url: 'https://api.github.com/repos/' + user + '/' + repo + '/contents/Changes.md',
                dataType: 'jsonp',
                success: function(changelog) {
                    if (changelog.data.content) {
                        callback(atob(changelog.data.content.replace(/\s/g, '')));
                    }
                }
            });
        }
    }

    function updateChangelog(markdown) {
        var sd = new showdown.converter();
        $('#changelog').html(sd.makeHtml(markdown));
    }

    var appurl  = $('.loading').data('appurl');

    var host_options = $('.install_where').data('host_options');
    if (appurl) {
        $.ajax({
            url: '/' + dashboard_db_name + '/' + appurl,
            dataType: 'json',
            jsonp: true,
            success: function(installed_app_data) {

                var bestName = dashboard_links.friendlyName(window.location.protocol + '//' + window.location.host);
                $('.step-description').text(bestName);

                dashboard_core.getGardenAppDetails(installed_app_data.src, function(err, results) {

                    if (err) {
                        return errorLoadingInfo();
                    }

                    var hosted = $('#details_sidebar').data('hosted');
                    var display_name = dashboard_core.display_name(results);
                    var app = installed_app_data.couchapp || installed_app_data.kanso;

                    results.display_name = display_name;
                    results.installed_version = app.config.version;
                    results.id = installed_app_data._id;

                    $('#details_sidebar').html(handlebars.templates['update_sidebar.html']({meta: results, hosted: hosted, display_name: display_name}));
                    $('.loading').html(handlebars.templates['update_app_info.html'](results, {}));

                    if (results.kanso.changelog) {
                        updateChangelog(atob(results.kanso.changelog));
                    } else {
                        getGithubChangelog(installed_app_data.kanso.config.url, updateChangelog);
                    }
                });

            }
        });

    }

    $('.primary').live('click', function() {
        $('.form-actions').hide();
        $('.install-info').show();
        updateStatus('Updating App', '0%');

        var id = $(this).data('id');
        var version = $(this).data('version');
        dashboard_core.updateApp(id, version, updateStatus, function(err, app_data) {

            if (err) {
                console.log(err);
                updateStatus('Update failed: ' + err, '100%', true, false);
            } else {
                updateStatus('Update Complete', '100%', true, true);

                var settings = {
                    host_options: host_options
                };

                var link = dashboard_links.appUrl(settings, app_data);
                $('.after-open').attr('href', link).show();

                var settings_link = dashboard_links.appSettingsUrl(settings, app_data);
                $('.after-settings').attr('href', settings_link).show();

                // add gardener status
                var ddoc = '/' + app_data.installed.db + '/_design/' + app_data.doc_id;
                GardenerStatus('/dashboard', ddoc, 'gardener');
            }
        });

    });

});