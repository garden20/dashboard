define([
    'require',
    'jquery',
    'underscore',
    '../settings',
    'hbt!../../templates/settings',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $, _) {

    var tmpl = require('hbt!../../templates/settings'),
        settings = require('../settings');


    return function () {
        $('#content').html(tmpl({
            settings: settings.get()
        }));

        $('#settings-form').submit(function () {
            $('#settings-save-btn').button('loading');

            var cfg = {templates: {}, projects: {}};
            cfg.templates.sources = _.compact(
                $('#template_sources').val().split('\n')
            );

            var no_templates = $('#projects_show_no_templates').is(':checked');
            cfg.projects.show_no_templates = no_templates;

            var unknown = $('#projects_show_unknown_templates').is(':checked');
            cfg.projects.show_unknown_templates = unknown;

            settings.update(cfg, function (err) {
                if (err) {
                    // TODO: add message to admin status bar
                    console.error(err);
                    return;
                }
                $('#settings-save-btn').button('reset');
            });
            return false;
        });

        $('#settings-save-btn').click(function (ev) {
            ev.preventDefault();
            $('#settings-form').submit();
            return false;
        });

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                settings: true
            })
        );
    };

});
