/*global window define*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'select2', 'json.edit', 'underscore'],
               function ($, $ui, JsonEdit, _) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.JsonEdit = factory($, select2, JsonEdit, _));
        });
    } else {
        // Browser globals
        root.autocomplete_select = factory(root.$, root.select2, root.JsonEdit, root._);
    }
}(this, function ($, select2, JsonEdit, _) {

    // ****************************

    var formatHints = JsonEdit.defaults.hintedFormatters,
        collectHints = JsonEdit.defaults.hintedCollectors;

    formatHints.string = formatHints.string || {};
    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    formatHints.string.autocomplete = function (name, type, id, opts, required, priv, util) {

        var options = opts["je:autocomplete"] || {};
        var defaultValue = opts["default"] || ""
        var dataUrlTemplate, availableValues;

        if (opts["je:url"]) {
            dataUrlTemplate =  _.template(opts["je:url"]);
        }
        if (opts["je:availableValues"]) {
            availableValues = opts["je:availableValues"];
        }

        util.events.rendered.handleOnce(function () {
            var widget = $("#" + id);
            var appdata = widget.closest('.appdata').data();
            widget.css('width', '300px');

            if (dataUrlTemplate) {
                var dataUrl = dataUrlTemplate(appdata);
                $.getJSON(dataUrl, function(data) {
                    doWidget(widget, data, defaultValue);
                });
            }
            if (availableValues) {
                availableValues = _.map(availableValues, function(value){
                    return {text: value, id: value};
                });
                doWidget(widget, availableValues, defaultValue);
            }
        });

        return {
            "input": {
                "id" : id,
                "type": "text"
            }
        };
    };

    function doWidget(widget, data, defaultValue) {
        var defaultText;

        if (defaultValue) {
            var row = _.find(data, function(value){
                return (value.id === defaultValue) ;
            });
            if (row) defaultText = row.text;
        }


        widget.select2({
            data: data,
            initSelection : function (element, callback) {
                var data = {id: element.val(), text: defaultText};
                callback(data);
            }
        });
        if (defaultValue) {
            widget.select2("val", defaultValue);
        }
    }




    return JsonEdit;



    // *******************


}));