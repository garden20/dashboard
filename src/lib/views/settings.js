define([
    'require',
    'jquery',
    'hbt!../../templates/settings',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../templates/settings');

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                settings: true
            })
        );
    };

});
