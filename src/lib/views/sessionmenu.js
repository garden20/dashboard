define([
    'require',
    'jquery',
    '../session',
    'hbt!../../templates/sessionmenu'
],
function (require, $) {

    var session = require('../session');


    return function (data) {
        $('#session').html(
            require('hbt!../../templates/sessionmenu')(data)
        );
        $('#session .signout-link').click(function (ev) {
            ev.preventDefault();
            session.logout();
            return false;
        });
    };

});
