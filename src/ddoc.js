exports.rewrites = [
    {from: '/', to: 'index.html'},
    {from: '/api', to: '../..'},
    {from: '/api/*', to: '../../*'},
    {from: '/data/dashboard-data.js', to: '_list/datajs/projects', query: {
        include_docs: 'true'
    }},
    {from: '/*', to: '*'}
];

exports.views = {
    projects: {
        map: function (doc) {
            if (doc.type === 'project') {
                emit([doc.db, doc.title || doc.name], null);
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
