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

    var loadTopbar = function() {
        var $topbar = $('#dashboard-topbar');
        if ($topbar.length === 0) {
            $topbar = $('<div id="dashboard-topbar"></div>');
            $('body').prepend($topbar);
        }
        var path = window.location.pathname;
        $topbar.load('/dashboard/_design/dashboard/_rewrite/_topbar?d=' + new Date().getTime(), function() {
            // highlight the best thing

            var dash = $topbar.find('a.home').attr('href');
            if (dash == path)  $topbar.find('a.home').addClass('active');

            var login = $topbar.find('#dashboard-topbar-session a').attr('href');
            if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');


            $('#dashboard-topbar ul.nav li').each(function(i) {
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
    }

    setTimeout(loadTopbar, 10);

    /**
     * TODO - Implement this function. Should do a head check to the db. before allowing the link
     * to pass.
     * This double checks the user can login to the link.
     * THis is to prevent the dreaded json error.
     * @param link
     */
    function addNotLoggedInHack(link) {
        $(link).bind('click', function(){
           $(this).removeClass('hover');
           return true;
        });
    }


});
