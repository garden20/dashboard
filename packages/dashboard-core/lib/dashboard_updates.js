
var _ = require('underscore')._;

exports.modifyAppRewrites  = function(doc, req) {
      if (!doc) {
          return [null, "Need an existing doc"];
      } 
      if (!req.query.db) {
          return [null, "Provide the db name"];
      }
      if (!req.query.ddoc) {
          return [null, "Provide the ddoc name"];
      }

      var current_rewrites = doc.rewrites;

      var prev_name = req.query.prev_name;
      var new_name  = req.query.new_name;
      if (prev_name) {
          current_rewrites = _.reject(current_rewrites, function(rewrite) {
              if (rewrite.from && rewrite.from.indexOf('/apps/' + prev_name) == 0) {
                  return true
              }
              return false;

          });
      }
      if (new_name) {
          // add the rules to the start.
          current_rewrites.unshift({
              from : '/apps/' + new_name + '/*',
              to : '../../../' + req.query.db +'/_design/'+ req.query.ddoc +'/_rewrite/*',
              query : {
                  baseURL : '/apps/' + new_name
              }
          });
          current_rewrites.unshift({
              from : '/apps/' + new_name,
              to : '../../../' + req.query.db +'/_design/'+ req.query.ddoc +'/_rewrite/',
              query : {
                  baseURL : '/apps/' + new_name
              }
          });
      }

      doc.rewrites = current_rewrites;
      return [doc, 'update complete'];
      
  }



