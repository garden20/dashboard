var jam = require('jamjs'),
    path = require('path');


module.exports = function (tea, context, config, callback) {
    config.includes = config.includes || [];
    config.output = path.resolve(tea.target, config.output);
    if (!config.output) {
        return callback('You must specify and output file');
    }
    var wd = config.dir ? path.resolve(tea.source, config.dir): tea.source;
    var _cwd = process.cwd();
    process.chdir(wd);
    jam.compile(config, function () {
        process.chdir(_cwd);
        callback.apply(this, arguments);
    });
};
