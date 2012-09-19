$(function(){
    var stored_user = amplify.store('user');
    if (stored_user) {
        $('#email').val(stored_user);
        $('#password').focus();
    } else {
        $('#email').focus();
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
                eraseCookie('last-dashboard-cache');
                var redirect = urlParams['redirect'];
                if (redirect) {
                    redirect = decodeURIComponent(redirect);
                    window.location = redirect;
                } else {
                    var dashboard_url = $('form').attr('action');
                    //lame but, we can only get admin names for this.
                    window.location = dashboard_url;
                }

            }
        });
        return false;
    });

    if (urlParams['message']) {
        $('.alert-message').show().find('span').text(urlParams['message']);
    }
    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
        else var expires = "";


        document.cookie = name + "=" + value + expires + "; path=/";
    }
    function eraseCookie(name) {
        createCookie(name, "", -1);
    }

});
var urlParams = {};
(function () {
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);

    while (e = r.exec(q))
       urlParams[d(e[1])] = d(e[2]);
})();