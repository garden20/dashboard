/**
 * topbar.js
 *
 * Used to get page navigation for garden apps.
 *
 */

/*
 *  Ensure the page has jquery
 */
if ($ === undefined) {
    $ = require('jquery');
}

$(function(){
    $('head').append('<link rel="stylesheet" type="text/css" href="/dashboard/_design/dashboard/_rewrite/static/css/topbar.css" />')


    var $topbar = $('#kanso-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="kanso-topbar"></div>');
        $('body').prepend($topbar);
    }
    var path = window.location.pathname;
    $topbar.load('/dashboard/_design/dashboard/_rewrite/_topbar', function() {
        // highlight the best thing

        var dash = $topbar.find('a.home').attr('href');
        if (dash == path)  $topbar.find('a.home').addClass('active');

        var login = $topbar.find('#kanso-topbar-session a').attr('href');
        if (login == path)  $topbar.find('#kanso-topbar-session').addClass('active');


        $('#kanso-topbar ul.nav li').each(function(i) {
            var href = $(this).find('a').attr('href');
            if ($(this).hasClass('home')) {
                if (href == path)return $(this).addClass('active');
            } else {
                if (path.indexOf(href) == 0) return $(this).addClass('active');
            }


        })


    });

});
