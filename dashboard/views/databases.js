define([
    'require',
    'jquery',
    'hbt!../../tmpl/databases'
],
function (require, $) {

    return function () {
        $('#content').html(require('hbt!../../tmpl/databases')({
            databases: window.Dashboard.databases
        }));
    };

});
