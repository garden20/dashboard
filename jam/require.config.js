var jam = {
    "packages": [
        {
            "name": "async",
            "location": "jam/async",
            "main": "./lib/async"
        },
        {
            "name": "garden-dashboard-core",
            "location": "jam/garden-dashboard-core",
            "main": "garden-dashboard-core.js"
        },
        {
            "name": "garden-default-settings",
            "location": "jam/garden-default-settings",
            "main": "garden-default-settings.js"
        },
        {
            "name": "garden-menu",
            "location": "jam/garden-menu",
            "main": "garden-menu.js"
        },
        {
            "name": "garden-menu-widget",
            "location": "jam/garden-menu-widget",
            "main": "garden-menu-widget.js"
        },
        {
            "name": "garden-views",
            "location": "jam/garden-views",
            "main": "garden-views.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery-1.9.1.min.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "jscss",
            "location": "jam/jscss",
            "main": "lib/index.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "md5",
            "location": "jam/md5",
            "main": "md5.js"
        },
        {
            "name": "modernizer",
            "location": "jam/modernizer",
            "main": "modernizr-development.js"
        },
        {
            "name": "pouchdb",
            "location": "jam/pouchdb",
            "main": "dist/pouchdb.amd-nightly.js"
        },
        {
            "name": "querystring",
            "location": "jam/querystring",
            "main": "querystring.js"
        },
        {
            "name": "simple-uuid",
            "location": "jam/simple-uuid",
            "main": "uuid.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        },
        {
            "name": "url",
            "location": "jam/url",
            "main": "url.js"
        }
    ],
    "version": "0.2.11",
    "shim": {}
};

if (typeof require !== "undefined" && require.config) {
    require.config({packages: jam.packages, shim: jam.shim});
}
else {
    var require = {packages: jam.packages, shim: jam.shim};
}

if (typeof exports !== "undefined" && typeof module !== "undefined") {
    module.exports = jam;
}