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

$(function() {




    function showMarkets() {
        dashboard_core.getMarkets(function(err, data) {
            var dash_url = window.location.protocol + '//' + window.location.host + '/' + $('.container[role="main"]').data('dashboardurl');
            data = _.map(data, function(market){
                market.url = market.url + '?dashboard=' + dash_url;
                return market;
            });

            $('ul.gardens').html(handlebars.templates['garden_details.html'](data, {}));
        })

        $('.add-market').click(function() {
            $('.add-market').hide();
            $('.new-market').show(500);
            return false;
        });

        $('.cancel').click(function() {
            $('.add-market').show();
            $('.new-market').hide(500);
            return false;
        });

        $('#add-market-final').click(function() {

            var market = {
                type : 'market',
                url : $('#market-url').val(),
                name : $('#market-name').val()
            }

            current_db.saveDoc(market, function(err, response) {
                if (err) return alert('could not save');
                var d = {
                    gardens : [market]
                }
                d = addDashboardUrl(d);
                $('ul.gardens').append(handlebars.templates['garden_details.html'](d, {}));

                $('.add-market').show();
                $('.new-market').hide(500);
            })

            return false;

        });
    }

    

    function errorLoadingInfo() {
        $('.loading').html(handlebars.templates['install_app_error.html']({}, {}));
    }


    var appurl  = $('.loading').data('appurl');


    var remote_app_details;
    if (appurl) {
        var bestName = dashboard_links.friendlyName(window.location.protocol + '//' + window.location.host);
        $('.step-description').text(bestName);

        dashboard_core.getGardenAppDetails(appurl, function(err, results) {
            console.log(err, results);
            if (err) return errorLoadingInfo();

            console.log(results);

            $('#details_sidebar').html(handlebars.templates['second_bar.html']({meta : results}));

            $('#secondbar').show();
            $('.app_icon').attr('src', results.icon_url);
            $('.app_title').text(results.kanso.config.name);
            $('.uploaded_by').text(results.user).attr('href', results.user_url)
            $('.updated .readable').text(datelib.prettify(results.kanso.push_time));
            remote_app_details = results;
            //$('.loading').html(handlebars.templates['install_app_info.html'](remote_app_details, {}));
        })

    }




    showMarkets();


    function errorInstalling(err){
        alert(err);
    }




    $('.primary').live('click', function(){
        $('.form-actions').hide();
        $('.install-info').show();
        updateStatus('Installing App', '30%');


        dashboard_core.best_db_name(remote_app_details.doc_id, function(err, db_name) {
            if (err) return errorInstalling(err);
            dashboard_core.install_app(remote_app_details, db_name, updateStatus, function(err, app_install_doc) {
                if (err) return errorInstalling(err);
                updateStatus('Install Complete', '100%', true);

                db.getDoc('settings', function(err, settingsDoc) {
                    if (err) settingsDoc = {};
                    var settings = _.defaults(settingsDoc, dashboard_settings.defaultSettings);
                    var link = dashboard_links.appUrl(settings, app_install_doc);
                    $('.after-open').attr('href', link).show();

                    var settings_link = dashboard_links.appSettingsUrl(settings, app_install_doc);
                    $('.after-settings').attr('href', settings_link).show();
                })


            });
        })


       //
    })








});