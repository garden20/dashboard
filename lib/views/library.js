define([
    'require',
    'jquery',
    'hbt!../../tmpl/library',
    'hbt!../../tmpl/navigation',
    'bootstrap/js/bootstrap-button'
],
function (require, $) {

    var tmpl = require('hbt!../../tmpl/library');

    return function () {
        $('#content').html(tmpl({}));

        $('.navbar .container-fluid').html(
            require('hbt!../../tmpl/navigation')({
                library: true
            })
        );
    };

});
