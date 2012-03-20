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
        console.log('prepend topbar');
        $topbar = $('<div id="kanso-topbar"></div>');
        $('body').prepend($topbar);
    }
    $topbar.load('/dashboard/_design/dashboard/_rewrite/_topbar');
});
