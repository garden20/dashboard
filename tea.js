exports.tasks = {
    "cache-manifest-timestamp": "./tasks/cache-manifest-timestamp",
    "less-compile": "./tasks/less-compile"//,
    //"jam-compile": "./tasks/jam-compile"
};

exports.builds = {
    assets: {
        "include": {paths: {
            "src/jam": "jam",
            "src/packages": "packages",
            "src/index.html": "index.html",
            "src/kanso.json": "kanso.json",
            "src/dashboard.appcache": "dashboard.appcache",
            "src/data": "data",
            "src/ddoc.js": "ddoc.js",
            "src/img": "img"
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
