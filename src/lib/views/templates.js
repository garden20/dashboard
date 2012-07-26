define([
    'require',
    'jquery',
    'couchr',
    '../templates',
    '../projects',
    'hbt!../../templates/templates',
    'hbt!../../templates/templates-list',
    'hbt!../../templates/templates-row',
    'hbt!../../templates/templates-create-project-modal',
    'hbt!../../templates/templates-done-project-modal',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button',
    'bootstrap/js/bootstrap-modal'
],
function (require, $) {

    var tmpl = require('hbt!../../templates/templates'),
        templates = require('../templates'),
        projects = require('../projects'),
        couchr = require('couchr');


    function clearModals() {
        $('.modal').modal('hide').remove();
    }

    function showDoneModal(url) {
        console.log(['showDoneModal', url]);
        clearModals();
        var tmpl = require('hbt!../../templates/templates-done-project-modal');

        var m = $(tmpl({ url: url }));
        m.appendTo(document.body);
        m.modal('show');

        // so if you press enter you go to desired url
        $('.btn-primary', m).focus();
    };

    function showProjectModal(ddoc_id, db_name) {
        console.log(['showProjectModal', ddoc_id, db_name]);

        clearModals();

        var tmpl = require(
            'hbt!../../templates/templates-create-project-modal'
        );
        var m = $(tmpl({
            ddoc_id: ddoc_id,
            db_name: db_name || '',
            template_td: $('tr[data-ddoc-id=' + ddoc_id + '] .name').html()
        }));
        m.appendTo(document.body);

        $('.alert', m).remove();
        $('.progress', m).hide();
        $('.progress .bar', m).css({width: 0});
        $('.btn-primary', m).button('reset');
        $('#create-project-form', m).show();

        m.modal('show');

        $('#input-project-name', m).focus();

        $('.btn-primary', m).click(function (ev) {
            ev.preventDefault();
            $('form', m).submit();
            return false;
        });

        $('form', m).submit(function (ev) {
            ev.preventDefault();
            var name = $('#input-project-name', m).val();

            $('.btn-primary', m).button('loading');
            $('.progress', m).show();
            $('#create-project-form', m).hide();

            var bar = $('.progress .bar', m);
            var creator = projects.create(name, ddoc_id, function (err, doc) {
                if (err) {
                    showProjectModal(ddoc_id, name);
                    $('.modal-body', m).prepend(
                        '<div class="alert alert-error">' +
                            '<button class="close" data-dismiss="alert">' +
                                '×' +
                            '</button>' +
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
    }

    function renderRow(doc) {
        console.log(['renderRow', doc]);
        var tr = $(require('hbt!../../templates/templates-row')(doc));

        $('.template-install-btn', tr).click(function (ev) {
            ev.preventDefault();
            var that = this;

            var progress = $('<div class="progress" />');
            var bar = $('<div class="bar" />').appendTo(progress);
            var btn = $(this).replaceWith(progress);

            var installer = templates.install(
                doc.source, doc.ddoc_id, function (err, tdoc) {
                    if (err) {
                        // TODO: show error message to user
                        return console.error(err);
                    }
                    console.log(['installed', tdoc]);
                    var fn = function () {
                        progress.replaceWith(btn);
                        // redraw row
                        tr.replaceWith(renderRow(tdoc));
                    };
                    bar.one('transitionEnd', fn);
                    bar.one('oTransitionEnd', fn);       // opera
                    bar.one('msTransitionEnd', fn);      // ie
                    bar.one('transitionend', fn);        // mozilla
                    bar.one('webkitTransitionEnd', fn);  // webkit
                }
            );
            installer.on('progress', function (value) {
                bar.css({width: value + '%'});
            });
            return false;
        });

        $('.template-uninstall-btn', tr).click(function (ev) {
            ev.preventDefault();
            var that = this;

            $(that).button('loading');
            templates.uninstall(doc.ddoc_id, function (err, tdoc) {
                if (err) {
                    // TODO: show error message to user
                    return console.error(err);
                }
                console.log(['uninstalled', tdoc]);
                //$(that).button('reset');
                // redraw row
                tr.replaceWith(renderRow(tdoc));
            });
            return false;
        });

        $('.template-create-btn', tr).click(function (ev) {
            ev.preventDefault();
            showProjectModal(doc.ddoc_id);
            return false;
        });

        return tr;
    }

    function renderList() {
        // fetch template list from couchdb
        var vurl = 'api/_design/dashboard/_view/templates';
        couchr.get(vurl, {include_docs: true}, function (err, data) {
            if (err) {
                // TODO: show error message to user
                return console.error(err);
            }
            var rows = _.map(data.rows, function (r) {
                return renderRow(r.doc);
            });
            console.log(['renderList rows', rows]);
            $('#templates-list').html(
                require('hbt!../../templates/templates-list')({})
            );
            _.forEach(rows, function (tr) {
                $('#templates-list tbody').append(tr);
            });
            console.log(['renderList rows', $('#templates-list tbody').html()]);
        });
    }

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                templates: true
            })
        );

        renderList();

        $('#templates-refresh-btn').click(function (ev) {
            ev.preventDefault();
            var that = this;

            $('#templates-list').html('');
            $(this).button('loading');

            var updator = templates.update(function (err) {
                if (err) {
                    // TODO: show error message to user
                    return console.error(err);
                }
                var bar = $('#admin-bar-status .progress .bar');
                var fn = function () {
                    $('#admin-bar-status .progress').fadeOut(function () {
                        renderList();
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
            updator.on('progress', function (value) {
                console.log(['progress', value]);
                $('#admin-bar-status .progress .bar').css({
                    width: value + '%'
                });
            });
            return false;
        });
    };

});
