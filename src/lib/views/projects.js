define([
    'require',
    'jquery',
    'underscore',
    '../projects',
    '../settings',
    'hbt!../../templates/projects',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $, _) {

    var tmpl = require('hbt!../../templates/projects'),
        projects = require('../projects'),
        settings = require('../settings');


    function getProjectList() {
        var plist = projects.get();
        var cfg = settings.get().projects;

        if (!cfg.show_no_templates) {
            plist = _.reject(plist, function (p) {
                return p.unknown_root;
            });
        }
        if (!cfg.show_unknown_templates) {
            plist = _.reject(plist, function (p) {
                return !p.unknown_root && !p.dashboard;
            });
        }
        return plist;
    }


    return function () {
        $('#content').html(tmpl({
            projects: getProjectList()
        }));

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                projects: true
            })
        );

        $('#projects-refresh-btn').click(function (ev) {
            ev.preventDefault();
            var that = this;

            $(this).button('loading');
            $('#admin-bar-status').html('');
            $('#main').html('');

            var refresher = projects.refresh(function (err) {
                if (err) {
                    // TODO: add error alert box to status area
                    return console.error(err);
                }

                var bar = $('#admin-bar-status .progress .bar');
                var fn = function () {
                    $('#admin-bar-status .progress').fadeOut(function () {
                        //$('#admin-bar-status').html('');
                        $('#content').html(tmpl({
                            projects: getProjectList()
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
