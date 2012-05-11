var session = require('session');
var _ = require('underscore')._;
var async = require('async');
var users = require("users");
var $ = require('jquery');
$.couch = require('jquery.couch');

exports.dashboard_db_name = 'dashboard';
exports.dashboard_ddoc_name = 'dashboard';

$.couch.urlPrefix = '_couch';

exports.getGardenAppDetails = function(app_url, callback) {
    var app_json_url = app_details_json(app_url);
    $.ajax({
        url : app_json_url + "?callback=?",
        dataType : 'json',
        jsonp : true,
        success : function(remote_app_data) {
            remote_app_data.src = app_url
            callback(null, remote_app_data);
        },
        error : function() {
            callback('Error loading app details');
        }
    });
}

exports.install_app = function(remote_app_details, new_db_name, update_status_function, callback) {
    update_status_function('Installing App', '30%');
    async.waterfall([
        function(callback) {
            app_replicate(remote_app_details.db_src, new_db_name, remote_app_details.doc_id, callback);
        },
        function(callback) {
            update_status_function('Configuring App', '60%');
            var couch_db = $.couch.db(new_db_name);
            copyDoc(couch_db, remote_app_details.doc_id, '_design/' + remote_app_details.doc_id, callback);
        },
        function(callback) {
            update_status_function('Cleaning Up', '70%');
            var couch_db = $.couch.db(new_db_name);
            deleteDoc(couch_db, new_db_name, remote_app_details.doc_id, callback);
        },
        function(callback) {
            update_status_function('Recording Install', '85%');
            var dashboard_couch_db = $.couch.db(exports.dashboard_db_name);
            saveAppDetails(dashboard_couch_db, new_db_name, remote_app_details, callback);
        },
        function(install_doc, callback) {
            update_status_function('Setting security', '90%', true);
            var couch_db = $.couch.db(new_db_name);
            exports.addDBReaderRole(new_db_name, '_admin', function(err) {
                callback(err, install_doc);
            });
        },
        function(install_doc, callback) {
            update_status_function('Configuring URL', '98%', true);
            addVhostRule(install_doc, function(err) {
                callback(err, install_doc);
            });
        }

    ], function(err, install_doc) {
        update_status_function('Install Complete', '100%', true);
        callback(err, install_doc);
    });

}

function app_replicate(src, target, doc_id, callback) {
    $.couch.replicate(src, target, {
            success : function() {
                return callback(null);
            },
            error : function() {
                return callback('error replicating');
            }
        }, {
       create_target:true,
       doc_ids : [doc_id]
    });
}

exports.getInstalledApps = function (callback) {
    $.couch.db(exports.dashboard_db_name).view(exports.dashboard_ddoc_name + '/by_active_install', {
        include_docs : true,
        success: function(response) {
            var apps = _.map(response.rows, function(row) {

                // we should verify these by checking the db and design docs exist.

                var app_data = row.doc;
                return {
                    id   : app_data._id,
                    img  : exports.bestIcon128(app_data),
                    name : app_data.dashboard_title,
                    db   : app_data.installed.db,
                    start_url : exports.get_launch_url(app_data, window.location.pathname)
                }
            });
            callback(null, apps);
        }
    })
}

exports.getInstalledAppsByMarket = function(callback) {
    $.couch.db(exports.dashboard_db_name).view(exports.dashboard_ddoc_name + '/app_version_by_market', {
        success: function(response) {
            var data = _.groupBy(response.rows, function(row) {
                return row.key;
            })
            callback(data);
        }
    });
}

exports.checkUpdates = function(apps, callback){
    var checkLocation = apps.location + "/_db/_design/garden/_list/app_versions/apps?callback=?";

    var ajaxReturned = false;
    setTimeout(function() {
        if (!ajaxReturned) callback(apps);
    }, 7000);

    $.ajax({
        url :  checkLocation,
        dataType : 'json',
        jsonp : true,
        success : function(remote_data) {
            ajaxReturned = true;
            apps.apps = _.map(apps.apps, function(app) {
                app.value.availableVersion = remote_data[app.value.app];
                app.value.needsUpdate = semver.lt(app.value.version, app.value.availableVersion);
                if (!app.value.needsUpdate) {
                    app.value.needsUpdate = false;
                }
                return app;
            });
            callback(apps);
        },
        error : function() {
            console.log('error');
        }
    });
}

exports.getMarkets = function(callback) {
    $.couch.db(exports.dashboard_db_name).view(exports.dashboard_ddoc_name + '/get_markets', {
        include_docs: true,
        success : function(response) {
            var markets =  _.map(response.rows, function(row) {
                return {
                    name : row.key,
                    url : row.value
                }
            });
            markets.push({
                type: 'market',
                name : "Kanso Market",
                url : "http://garden.iriscouch.com/garden/_design/garden/_rewrite/"
            });

            markets = addDashboardUrl(markets);
            callback(null, markets);
        }
    });
}

exports.updateDashboard = function(callback) {
    $.couch.replicate('http://garden20.iriscouch.com/garden20', exports.dashboard_db_name, {
              success : function() {
                  callback();
              }
   }, {doc_ids : [ '_design/dashboard'  ] });
}

exports.updateApp = function(appName, callback) {
    $.couch.db(exports.dashboard_db_name).openDoc(appName, {
        success : function(app_data) {
            $.couch.replicate(app_data.db_src, app_data.installed.db, {
               success : function(rep_result) {
                    var db = $.couch.db(app_data.installed.db);
                    copyDoc(db, app_data, function(err){
                        callback(err);
                    });
               }
           }, {
              doc_ids : [app_data.doc_id]
           });
        }
    })
}


exports.getBaseURL = function (/*optional*/req) {
    if (req.query.baseURL) {
        return req.query.baseURL;
    }
    if (req.query.db && req.query.ddoc) {
        return '/' + req.query.db + '/_design/' + req.query.ddoc + '/_rewrite/';
    }

    if (_.include(req.path, '_rewrite')) {
        return '/' + req.path.slice(0, 3).join('/') + '/_rewrite';
    }
    if (req.headers['x-couchdb-vhost-path']) {
        return '';
    }
    return '/' + req.path.slice(0, 3).join('/') + '/_rewrite';
};


exports.isAdmin = function(req) {
    if (!req.userCtx) return false;
    if (!req.userCtx.name) return false;
    if (!req.userCtx.roles) return false;
    if (req.userCtx.roles.indexOf('_admin') === -1) return false;

    return true;
}


exports.isUser = function(req) {
    if (!req.userCtx) return false;
    if (!req.userCtx.name) return false;
    return true;
}

exports.getUsername = function(req) {
    return req.userCtx.name;
}



function app_details_json(app_details_url) {
    return app_details_url + '/json';
}


exports.incr_app_name = function(app_name) {
    var num = 1;
    var delim = app_name.lastIndexOf('_');
    if (delim > 0) {
        var last_num = app_name.substr(delim+1)
        if (last_num > 0) {
            num = Number(last_num) + 1;
            app_name = app_name.substr(0, delim);
        }
    }
    return app_name + "_" + num;
}



function user_app_name_to_safe_url(app_name) {
    // needs some help
    return app_name.toLowerCase().replace(/ /g,"_");
}



var fnd = exports.find_next_db_name = function(app_name, current_dbs) {

    if (!current_dbs) return app_name;
    if (!current_dbs.length) return app_name;

    if (current_dbs.indexOf(app_name) !== -1 ) {
        return fnd(exports.incr_app_name(app_name), current_dbs);
    }

    return app_name;
}


exports.get_launch_url = function(install_doc, window_path) {


    if (window_path && window_path.indexOf('/dashboard/_design/dashboard/_rewrite/') == 0) {
        return '/' + install_doc.installed.db + '/_design/' + install_doc.doc_id + '/_rewrite/'
    }

    if (install_doc.open_path && install_doc.open_path.indexOf('_rewrite') === -1) {
        return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + install_doc.open_path;
    }
    if (install_doc.kanso.config.legacy_mode  ) {
        return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + '/_rewrite/';
    }
    //return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + install_doc.open_path;
    return  user_app_name_to_safe_url(install_doc.dashboard_title) + '/'
    //return '../../../../' + install_doc.installed.db + '/_design/' + install_doc.doc_id +  install_doc.open_path;
}


exports.formatSize = function(size) {
    var jump = 512;
    if (size < jump) return size + " bytes";
    var units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var i=0;
    while (size >= jump && i < units.length) {
        i += 1;
        size /= 1024;
    }
    return size.toFixed(1) + ' ' + units[i - 1];
}


exports.bestDashboardImage = function (install_doc) {
    try {
        if (install_doc.kanso.config.promo_images.small) {
            //http://ryan.garden20.com:5984/apps/wiki/wiki_2/_db/_design/wiki/icons/wiki_icon_128.png

            return  designDoc(install_doc) +   '/' + install_doc.kanso.config.promo_images.small;
        }
    } catch(e){}

    return 'http://placehold.it/210x150';
}


function designDoc(install_doc) {
    return './_couch/' + install_doc.installed.db +  '/_design/' +  install_doc.doc_id
    //return  './apps/' + safe(install_doc.dashboard_title) +  '/_db/_design/' +  install_doc.doc_id
}


exports.bestIcon96 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['96']) {
            return designDoc(install_doc) +    '/' + install_doc.kanso.config.icons['96'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}

exports.bestIcon128 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['128']) {
            return designDoc(install_doc) +   '/' + install_doc.kanso.config.icons['128'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}





exports.getDBSecurity = function(dbName, callback) {
    $.couch.db(dbName).getDbProperty("_security", {
      success: function(r) {
          callback(null, r);
      },
      error : function() {
          callback('cant get current db security on ' + dbName);
      }
  });
}


exports.addDBReaderRole = function(dbName, role, callback) {
  exports.getDBSecurity(dbName, function(err, sec) {
      if (err) return callback(err);
      if (!sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }

      sec.members.roles.push(role);
      $.couch.db(dbName).setDbProperty("_security", sec, {
          success : function() {
              callback(null);
          },
          error : function() {
              callback('cant add ' + role + ' to db ' + dbName);
          }
      });
  });
}



function addVhostRule(install_doc, callback) {
    var safe_name = user_app_name_to_safe_url(install_doc.dashboard_title);
    var rewrite_url = appFullUrl(install_doc.installed.db, install_doc.doc_id, install_doc.open_path);
    $.couch.config({
        success : function(result) {
            callback(null, result);
        }
    }, 'vhosts', appRewrite(safe_name), rewrite_url );
}

function renameVhostRule(install_doc, old_name, callback) {
    var safe_name = user_app_name_to_safe_url(old_name);
    var add = function() {
        addVhostRule(app_data, function(err, result) {
            callback(err, result);
        })
    };
    // remove any old one
    $.couch.config({
        success : function() {
            add();
        },
        error : function() {
            add();
        }
    }, 'vhosts', appRewrite(safe_name), null );
}


function copyDoc(couch_db, from_doc_id, to_doc_id, callback) {
    couch_db.copyDoc(
       from_doc_id,
       {
            error: function() {
                callback('could not copy doc from ' + from_doc_id + ' to ' + to_doc_id);
            },
            success: function() {
                callback(null);
            }
       },
       {
            headers : {Destination : to_doc_id}
        }
    );
}

function deleteDoc(couch_db, db_name, doc_id, callback) {
    couch_db.headDoc(doc_id, {}, {
        success : function(data, status, jqXHR) {
            var rev = jqXHR.getResponseHeader('ETag').replace(/"/gi, '');
            var purge_url = jQuery.couch.urlPrefix + '/' + db_name + '/_purge';
            var data = {};
            data[doc_id] = [rev];
            $.ajax({
              url : purge_url,
              data : JSON.stringify(data),
              dataType : 'json',
              contentType: 'application/json',
              type: 'POST',
              success : function(data) {
                  callback(null);
              },
              error : function() {
                  callback('a problem deleting the non prefixed doc');
              }
             });
        }
    });
}
function saveAppDetails(dashboad_couch_db, app_db_name, app_data, callback) {
    app_data.installed  = {
        date : new Date().getTime(),
        db : app_db_name
    }
    app_data.dashboard_title = app_db_name;
    app_data.type = 'install';
    dashboad_couch_db.saveDoc(app_data, {
        success : function() {
            callback(null, app_data)
        },
        error : function() {
            callback('cant save app details');
        }

    });
}