exports.tasks = {
    "cache-manifest-timestamp": "./tasks/cache-manifest-timestamp",
    "less-compile": "./tasks/less-compile",
    "jam-compile": "./tasks/jam-compile"
};

exports.builds = {
    assets: {
        "include": {paths: [
            "jam",
            "packages",
            "index.html",
            "kanso.json",
            "dashboard.appcache",
            "ddoc.js",
            "img"
        ]}
    },
    all: ['assets', {
        "@cache-manifest-timestamp": {
            update: ["dashboard.appcache"]
        },
        "@less-compile": {
            compile: {
                "less/dashboard.less": "css/dashboard.css"
            }
        },
        "@jam-compile": {
            output: "jam/require.js",
            includes: ["dashboard/app"],
            nominify: true
            // TODO: fix excluding plugins (and use of stubModules in r.js)
            //deepExcludes: ["hbt"]
        }
    }]
};
