define([
    'require',
    'jquery',
    'hbt!../../tmpl/templates',
    'hbt!../../tmpl/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../tmpl/templates');

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../tmpl/navigation')({
                templates: true
            })
        );
    };

});
