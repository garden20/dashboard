$(function(){
    var stored_user = amplify.store('user');
    if (stored_user) {
        $('#email').val(stored_user);
    }

    $('#login-btn').click(function() {
        var username = $('#email').val();
        var password = $('#password').val();
        session.login(username, password, function (err, info) {
            if (err) {
                var warning = $('.warning');
                    warning.show()
                    warning.find('strong').text(err.error);
                    warning.find('span').text(err.reason);
                    $('#password').val('');
            } else {
                amplify.store('user', username);
                var redirect = window.location.hash;
                if (redirect) {
                    redirect = decodeURIComponent(redirect);
                    window.location = redirect;
                } else {
                    //lame but, we can only get admin names for this.
                    window.location = '/';
                }

            }
        });
        return false;
    });
});
