define([
    'require',
    'jquery',
    '../dblist',
    '../../data/dashboard-data',
    'hbt!../../tmpl/databases',
    'hbt!../../tmpl/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $, dblist, DATA) {

    var tmpl = require('hbt!../../tmpl/databases');

    return function () {
        $('#content').html(tmpl({
            databases: DATA.databases
        }));

        $('.navbar .container-fluid').html(
            require('hbt!../../tmpl/navigation')({
                databases: true
            })
        );

        $('#databases-refresh-btn').click(function (ev) {
            ev.preventDefault();
            var that = this;

            $(this).button('loading');
            $('#admin-bar-status').html('');
            $('#main').html('');

            var refresher = dblist.refresh(function (err) {
                if (err) {
                    // TODO: add error alert box to status area
                    return console.error(err);
                }

                var bar = $('#admin-bar-status .progress .bar');
                var fn = function () {
                    $('#admin-bar-status .progress').fadeOut(function () {
                        //$('#admin-bar-status').html('');
                        $('#content').html(tmpl({
                            databases: DATA.databases
                        }));
                    });
                    $(that).button('reset');
                };
                bar.one('transitionEnd', fn);
                bar.one('oTransitionEnd', fn);       // opera
                bar.one('msTransitionEnd', fn);      // ie
                bar.one('transitionend', fn);        // mozilla
                bar.one('webkitTransitionEnd', fn);  // webkit
            });

            $('#admin-bar-status').html(
                '<div class="progress"><div class="bar"></div></div>'
            );
            refresher.on('progress', function (value) {
                $('#admin-bar-status .progress .bar').css({
                    width: value + '%'
                });
            });

            return false;
        });
    };

});
