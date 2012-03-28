var _ = require('underscore')._;
var handlebars = require('handlebars');
var async = require('async');
var session = require('session');
var users = require("users");
var dashboard_core = require('lib/dashboard_core');
var dashboard_links = require('lib/dashboard_links');
var db = require('db').use('_db');

$(function() {




    function showMarkets() {
        dashboard_core.getMarkets(function(err, data) {
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
        dashboard_core.getGardenAppDetails(appurl, function(err, results) {
            console.log(err, results);
            if (err) return errorLoadingInfo();
            remote_app_details = results;
            $('.loading').html(handlebars.templates['install_app_info.html'](remote_app_details, {}));
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
                console.log(app_install_doc);
                db.getDoc('settings', function(err, settings) {
                    if (err) return console.log("cant get settings");
                    var link = dashboard_links.appUrl(settings, app_install_doc);
                    $('.success').attr('href', link).show();
                })


            });
        })


       //
    })








});