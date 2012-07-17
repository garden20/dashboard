define([
    'require',
    'jquery',
    'hbt!../../tmpl/settings',
    'hbt!../../tmpl/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../tmpl/settings');

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../tmpl/navigation')({
                settings: true
            })
        );
    };

});
