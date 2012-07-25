define([
    'require',
    'jquery',
    'couchr',
    '../templates',
    '../projects',
    'hbt!../../templates/templates',
    'hbt!../../templates/templates-list',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button',
    'bootstrap/js/bootstrap-modal'
],
function (require, $) {

    var tmpl = require('hbt!../../templates/templates'),
        templates = require('../templates'),
        projects = require('../projects'),
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
                var that = this,
                    tr = $(this).parents('tr'),
                    src = tr.data('source'),
                    ddoc_id = tr.data('ddoc-id');

                $(that).button('loading');
                templates.install(src, ddoc_id, function (err, tdoc) {
                    if (err) {
                        // TODO: show error message to user
                        return console.error(err);
                    }
                    console.log(['installed', tdoc]);
                    $(that).button('reset');
                });
                return false;
            });

            $('#templates-list .template-uninstall-btn').click(function (ev) {
                ev.preventDefault();
                var that = this,
                    tr = $(this).parents('tr'),
                    ddoc_id = tr.data('ddoc-id');

                $(that).button('loading');
                templates.uninstall(ddoc_id, function (err, tdoc) {
                    if (err) {
                        // TODO: show error message to user
                        return console.error(err);
                    }
                    console.log(['uninstalled', tdoc]);
                    $(that).button('reset');
                });
                return false;
            });

            function resetModal(template_tr, db_name) {
                $('#done-project-modal').modal('hide');
                var ddoc_id = $(template_tr).data('ddoc-id');
                var m = $('#create-project-modal');
                $('.alert', m).remove();
                $('.template', m).html($('.name', template_tr).html());
                $('#input-project-template', m).val(ddoc_id);
                $('.progress', m).hide();
                $('.progress .bar', m).css({width: 0});
                $('.btn-primary', m).button('reset');
                $('#create-project-form', m).show();
                $('#input-project-name', m).val(db_name || '');
            }

            $('#templates-list .template-create-btn').click(function (ev) {
                ev.preventDefault();
                var that = this,
                    tr = $(this).parents('tr'),
                    ddoc_id = tr.data('ddoc-id');

                resetModal(tr);
                var m = $('#create-project-modal');
                m.modal('show');
                $('#input-project-name', m).focus();
                return false;
            });

            $('#create-project-modal .btn-primary').click(function (ev) {
                ev.preventDefault();
                $('#create-project-modal').submit();
                return false;
            });

            function showDoneModal(url) {
                $('#create-project-modal').modal('hide');
                var m = $('#done-project-modal');
                $('.project-url', m).attr('href', url).text(url);
                $('.btn-primary', m).attr('href', url);
                m.modal('show');
                // so if you press enter you go to desired url
                $('.btn-primary', m).focus();
            };

            $('#create-project-modal').submit(function (ev) {
                ev.preventDefault();
                var name = $('#input-project-name').val(),
                    tmpl = $('#input-project-template').val(),
                    m = $(this);

                $('.btn-primary', m).button('loading');
                $('.progress', m).show();
                $('#create-project-form', m).hide();

                var bar = $('.progress .bar', m);
                var creator = projects.create(name, tmpl, function (err, doc) {
                    if (err) {
                        resetModal($('tr[data-ddoc-id=' + tmpl + ']'), name);
                        $('.modal-body', m).prepend(
                            '<div class="alert alert-error">' +
                                '<button class="close" data-dismiss="alert">×</button>' +
                                '<strong>Error</strong> ' +
                                (err.message || err.toString()) +
                            '</div>'
                        );
                        return;
                    }
                    var fn = function () {
                        $('.btn-primary', m).button('reset');
                        $(m).modal('hide');
                        showDoneModal(doc.url);
                    };
                    bar.one('transitionEnd', fn);
                    bar.one('oTransitionEnd', fn);       // opera
                    bar.one('msTransitionEnd', fn);      // ie
                    bar.one('transitionend', fn);        // mozilla
                    bar.one('webkitTransitionEnd', fn);  // webkit
                });
                creator.on('progress', function (value) {
                    bar.css({width: value + '%'});
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
