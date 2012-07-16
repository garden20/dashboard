exports.rewrites = [
    {from: '/', to: 'index.html'},
    {from: '/api', to: '../..'},
    {from: '/api/*', to: '../../*'},
    {from: '/dashboard-data.js', to: '_list/datajs/databases', query: {
        include_docs: 'true'
    }},
    {from: '/*', to: '*'}
];

exports.views = {
    databases: {
        map: function (doc) {
            if (doc.type === 'database') {
                emit([doc.db, doc.title || doc.name], null);
            }
        }
    }
};

exports.lists = {
    datajs: function (head, req) {
        start({code: 200, headers: {'Content-Type': 'application/javascript'}});
        send(
            'define("dashboard-data", function () {\n' +
            '\n' +
            'return {databases: ['
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
