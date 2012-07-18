exports.tasks = {
    "cache-manifest-timestamp": "./tasks/cache-manifest-timestamp",
    "less-compile": "./tasks/less-compile",
    "jam-compile": "./tasks/jam-compile"
};

exports.builds = {
    assets: {
        "include": {paths: {
            "jam": "src/jam",
            "packages": "src/packages",
            "index.html": "src/index.html",
            "kanso.json": "src/kanso.json",
            "dashboard.appcache": "src/dashboard.appcache",
            "data": "src/data",
            "ddoc.js": "src/ddoc.js",
            "img": "src/img"
        }}
    },
    all: ['assets', {
        "@cache-manifest-timestamp": {
            update: ["dashboard.appcache"]
        },
        "@less-compile": {
            compile: {
                "src/less/dashboard.less": "css/dashboard.css"
            }
        },
        "@jam-compile": {
            dir: "src",
            output: "jam/require.js",
            deepExcludes: [
                'data/dashboard-data',
                'data/settings'
            ],
            includes: ["lib/app"],
            nominify: true
            // TODO: fix excluding plugins (and use of stubModules in r.js)
            //deepExcludes: ["hbt"]
        }
    }]
};
