var jam = {
    "packages": [
        {
            "name": "couch-user-editor",
            "location": "jam/couch-user-editor",
            "main": "couchapp-settings.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "gardener-status",
            "location": "jam/gardener-status",
            "main": "gardener-status.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "pico-couch-ddoc",
            "location": "jam/pico-couch-ddoc",
            "main": "pico-couch-ddoc.js"
        },
        {
            "name": "ractive",
            "location": "jam/ractive",
            "main": "Ractive.js"
        },
        {
            "name": "ractive-couch",
            "location": "jam/ractive-couch",
            "main": "ractive-couch.js"
        },
        {
            "name": "select2",
            "location": "jam/select2",
            "main": "select2.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "version": "0.2.17",
    "shim": {
        "underscore": {
            "exports": "_"
        }
    }
};

if (typeof require !== "undefined" && require.config) {
    require.config({
    "packages": [
        {
            "name": "couch-user-editor",
            "location": "jam/couch-user-editor",
            "main": "couchapp-settings.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "gardener-status",
            "location": "jam/gardener-status",
            "main": "gardener-status.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "pico-couch-ddoc",
            "location": "jam/pico-couch-ddoc",
            "main": "pico-couch-ddoc.js"
        },
        {
            "name": "ractive",
            "location": "jam/ractive",
            "main": "Ractive.js"
        },
        {
            "name": "ractive-couch",
            "location": "jam/ractive-couch",
            "main": "ractive-couch.js"
        },
        {
            "name": "select2",
            "location": "jam/select2",
            "main": "select2.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "shim": {
        "underscore": {
            "exports": "_"
        }
    }
});
}
else {
    var require = {
    "packages": [
        {
            "name": "couch-user-editor",
            "location": "jam/couch-user-editor",
            "main": "couchapp-settings.js"
        },
        {
            "name": "couchr",
            "location": "jam/couchr",
            "main": "couchr-browser.js"
        },
        {
            "name": "events",
            "location": "jam/events",
            "main": "events.js"
        },
        {
            "name": "gardener-status",
            "location": "jam/gardener-status",
            "main": "gardener-status.js"
        },
        {
            "name": "jquery",
            "location": "jam/jquery",
            "main": "jquery.js"
        },
        {
            "name": "jquery.lego",
            "location": "jam/jquery.lego",
            "main": "jquery.lego.js"
        },
        {
            "name": "json.edit",
            "location": "jam/json.edit",
            "main": "json.edit.js"
        },
        {
            "name": "pico-couch-ddoc",
            "location": "jam/pico-couch-ddoc",
            "main": "pico-couch-ddoc.js"
        },
        {
            "name": "ractive",
            "location": "jam/ractive",
            "main": "Ractive.js"
        },
        {
            "name": "ractive-couch",
            "location": "jam/ractive-couch",
            "main": "ractive-couch.js"
        },
        {
            "name": "select2",
            "location": "jam/select2",
            "main": "select2.js"
        },
        {
            "name": "text",
            "location": "jam/text",
            "main": "text.js"
        },
        {
            "name": "underscore",
            "location": "jam/underscore",
            "main": "underscore.js"
        }
    ],
    "shim": {
        "underscore": {
            "exports": "_"
        }
    }
};
}

if (typeof exports !== "undefined" && typeof module !== "undefined") {
    module.exports = jam;
}