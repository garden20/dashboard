define([
    'require',
    'jquery',
    '../session',
    'hbt!../../templates/login',
    'hbt!../../templates/navigation'
],
function (require, $) {

    var session = require('../session');


    function showError(err) {
        $('#login-form fieldset').prepend(
          '<div class="alert alert-error">' +
            '<a class="close" data-dismiss="alert">' +
              '&times;' +
            '</a>' +
            '<strong>Error</strong> ' +
            (err.message || err.toString()) +
          '</div>'
        );
    }


    return function (next) {
        var username, password;

        var signup_form = $('#signup-form');
        if (signup_form.length) {
            username = $('#signup_username', signup_form).val();
            password = $('#signup_password', signup_form).val();
        }
        $('#content').html(
            require('hbt!../../templates/login')({})
        );
        $('#navigation').html(
            require('hbt!../../templates/navigation')({})
        );

        if (username) {
            $('#login_username').val(username);
        }
        if (password) {
            $('#login_password').val(password);
        }

        $('#login_username').focus();

        $('#login-form').submit(function (ev) {
            ev.preventDefault();

            var username = $('#login_username').val();
            var password = $('#login_password').val();

            // clear validation/error messages
            $('.error', this).removeClass('error');
            $('.help-inline', this).text('');
            $('.alert', this).remove();

            if (!username) {
                var cg = $('#login_username').parents('.control-group');
                cg.addClass('error');
                $('.help-inline', cg).text('Required');
            }
            if (!password) {
                var cg = $('#login_password').parents('.control-group');
                cg.addClass('error');
                $('.help-inline', cg).text('Required');
            }
            if (!username || !password) {
                return;
            }

            $('#login_submit').button('loading');

            session.login(username, password, function (err, res) {
                if (err) {
                    $('#login_submit').button('reset');
                    if (err.status === 0) {
                        showError(new Error(
                            'Request timed out, please check your connection.'
                        ));
                    }
                    else {
                        showError(err);
                    }
                    return;
                }
                window.location = next ? decodeURIComponent(next): '#/';
            });

            return false;
        });
    };

});
