define([
    'require',
    'jquery',
    '../dblist',
    '../../dashboard-data',
    'hbt!../../tmpl/databases',
    'bootstrap/js/bootstrap-button'
],
function (require, $, dblist, DATA) {

    return function () {
        $('#content').html(require('hbt!../../tmpl/databases')({
            databases: DATA.databases
        }));

        $('#databases-refresh-btn').click(function (ev) {
            ev.preventDefault();
            var that = this;

            $(this).button('loading');
            $('#admin-bar-status').html('');

            var refresher = dblist.refresh(function (err) {
                if (err) {
                    // TODO: add error alert box to status area
                    return console.error(err);
                }

                var bar = $('#admin-bar-status .progress .bar');
                var fn = function () {
                    $('#admin-bar-status .progress').fadeOut(function () {
                        $('#admin-bar-status').html('');
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
