exports.rewrites = [
    {from: '/', to: 'index.html'},
    {from: '/api', to: '../..'},
    {from: '/api/*', to: '../../*'},
    {from: '/data/dashboard-data.js', to: '_list/datajs/projects', query: {
        include_docs: 'true'
    }},
    {from: '/data/settings.js', to: '_show/settingsjs/settings'},
    {from: '/*', to: '*'}
];

exports.views = {
    projects: {
        map: function (doc) {
            if (doc.type === 'project') {
                emit(
                    [
                        doc.db,
                        (doc.dashboard && doc.dashboard.title) || doc.name
                    ],
                    null
                );
            }
        }
    },
    templates: {
        map: function (doc) {
            if (doc.type === 'template') {
                emit(
                    [doc.ddoc_id, (doc.dashboard && doc.dashboard.title) || {}],
                    null
                );
            }
        }
    }
};

exports.lists = {
    datajs: function (head, req) {
        start({code: 200, headers: {'Content-Type': 'application/javascript'}});
        send(
            'define("data/dashboard-data", function () {\n' +
            '\n' +
            'return {projects: ['
        );
        var first = true;
        var row;
        while (row = getRow()) {
            send((first ? '\n': ',\n') + JSON.stringify(row.doc));
            first = false;
        }
        send('\n]};\n\n});');
    }
};

exports.shows = {
    settingsjs: function (doc, req) {
        // don't send this property to client
        delete doc._revisions;

        return {
            code: 200,
            headers: {
                'Content-Type': 'application/javascript'
            },
            body: 'define("data/settings", function () {\n' +
                '\n' +
                'return ' + JSON.stringify(doc) + ';\n' +
                '\n' +
                '});'
        };
    }
};
