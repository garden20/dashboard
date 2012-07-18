define([
    'require',
    'jquery',
    'hbt!../../templates/templates',
    'hbt!../../templates/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../templates/templates');

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../templates/navigation')({
                templates: true
            })
        );
    };

});
