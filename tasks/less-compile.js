var less = require('less'),
    async = require('async'),
    fs = require('fs'),
    path = require('path'),
    pathExists = fs.exists || path.exists;


module.exports = function (tea, context, config, callback) {
    var compilelist = Object.keys(config.compile || {});

    async.forEach(compilelist, function (p, cb) {
        var f = path.resolve(tea.source, p),
            less_paths = (config.paths || []).concat([path.dirname(f)]),
            compress = config.compress;

        compileLess(less_paths, tea.source, f, compress, function (err, css) {
            if (err) {
                return cb(err);
            }
            var dest = path.resolve(tea.target, config.compile[p]);
            tea.emit(dest, css);
            cb();
        });
    },
    callback);
};


function compileLess(less_paths, project_path, f, compress, callback) {
    /**
     * we get a rather cryptic error when trying to compile a file that
     * doesn't exist, so check early for that and report something
     * sensible
     */
    pathExists(f, function (exists) {
        if (!exists) {
            return callback(new Error('File does not exist: ' + f));
        }
        console.log('Compiling ' + path.relative(project_path, f));

        fs.readFile(f, 'utf-8', function (err, data) {
            if (err) {
                return callback(err);
            }
            var dir = path.dirname(f);

            var options = {
                silent: false,
                verbose: true,
                color: true,
                compress: compress,
                paths: less_paths || [],
                filename: f
            }
            var parser = new (less.Parser)(options);

            try {
                parser.parse(data, function (err, root) {
                    if (err) {
                        less.writeError(err, options);
                        return callback(err);
                    }
                    try {
                        callback(null, root.toCSS(options));
                    }
                    catch (e) {
                        less.writeError(e, options);
                        callback(e);
                    }
                });
            }
            catch (e) {
                // sometimes errors are synchronous
                less.writeError(e, options);
                return callback(e);
            }
        });
    });
};
