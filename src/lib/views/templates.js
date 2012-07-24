define([
    'require',
    'jquery',
    'couchr',
    '../templates',
    'hbt!../../templates/templates',
    'hbt!../../templates/templates-list',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../templates/templates'),
        templates = require('../templates'),
        couchr = require('couchr');


    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                templates: true
            })
        );

        // fetch template list from couchdb
        var vurl = 'api/_design/dashboard/_view/templates';
        couchr.get(vurl, {include_docs: true}, function (err, data) {
            if (err) {
                // TODO: show error message to user
                return console.error(err);
            }
            $('#templates-list').html(
                require('hbt!../../templates/templates-list')({
                    templates: data.rows
                })
            );
            $('#templates-list .template-install-btn').click(function (ev) {
                ev.preventDefault();
                var tr = $(this).parents('tr'),
                    source = tr.data('source'),
                    ddoc_id = tr.data('ddoc');

                templates.install(source, ddoc_id, function (err) {
                    if (err) {
                        // TODO: show error message to user
                        return console.error(err);
                    }
                });
                return false;
            });
        });

        $('#templates-refresh-btn').click(function (ev) {
            ev.preventDefault();
            templates.update(function (err) {
                if (err) {
                    // TODO: show error message to user
                    return console.error(err);
                }
                // TODO: refresh templates row
                console.log('done');
            });
            return false;
        });
    };

});
