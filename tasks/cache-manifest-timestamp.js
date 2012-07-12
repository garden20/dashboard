var fs = require('fs'),
    path = require('path'),
    async = require('async');


/**
 * Updates the data for each cache manifest file with a modified time.
 */

module.exports = function (tea, context, config, callback) {
    var paths = config.update || [];
    if (!Array.isArray(paths)) {
        paths = [paths];
    }

    var now = new Date().toString();

    async.forEach(paths, function (p, cb) {
        var filename = path.resolve(tea.target, p);
        fs.readFile(filename, function (err, content) {
            if (err) {
                return cb(err);
            }
            var newdata = content.toString() + '\n\n# ' + now;
            fs.writeFile(filename, newdata, cb);
        });
    },
    callback);
};
