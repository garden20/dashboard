var exec = require('child_process').exec;


function runCommand (cmd, callback) {
    exec(cmd, function(err, stdout, stderr) {
        console.log(stdout);
        callback(null);
    });
}


module.exports = {
    before : ["properties", "modules", "attachments"],
    run : function(root, path, settings, doc, callback) {
        if (settings.shell) {
            runCommand(settings.shell, function(err){
                callback(null, doc);
            });
        }
    }
}