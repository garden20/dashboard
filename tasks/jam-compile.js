var jam = require('jamjs'),
    path = require('path');


module.exports = function (tea, context, config, callback) {
    config.includes = config.includes || [];
    config.output = path.resolve(tea.target, config.output);
    if (!config.output) {
        return callback('You must specify and output file');
    }
    process.chdir(tea.source);
    jam.compile(config, callback);
};
