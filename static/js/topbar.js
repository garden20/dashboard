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
    // append the css if its not there
    var check = $('link[href="/dashboard/_design/dashboard/_rewrite/_topbar.css"]');
    if (check.length == 0 )  {
        $('head').append('<link rel="stylesheet" type="text/css" href="/dashboard/_design/dashboard/_rewrite/_topbar.css" />');
    }



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
            var link = $(this).find('a');
            var href = link.attr('href');
            if ($(this).hasClass('home')) {
                if (href == path){
                    $(this).addClass('active');
                    link.addClass('active')
                }
            } else {
                if (path.indexOf(href) == 0) {
                    $(this).addClass('active');
                    link.addClass('active');
                }
                addNotLoggedInHack(link);
            }


        })


    });

    /**
     * TODO - Implement this function. Should do a head check to the db. before allowing the link
     * to pass.
     * This double checks the user can login to the link.
     * THis is to prevent the dreaded json error.
     * @param link
     */
    function addNotLoggedInHack(link) {
        $(link).on('click', function(){
           return true;
        });
    }


});
