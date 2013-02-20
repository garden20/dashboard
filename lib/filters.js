exports.docs_only = function(doc, req) {
    if (doc._id && doc._id.indexOf('_design') === 0) return false;
    return true;
};