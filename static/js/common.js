var session = require('session');
var utils = require('lib/utils');

var dashboard_db_name = 'dashboard';
jQuery.couch.urlPrefix = '_couch';



function oneUrl(location) {
    return location.protocol + '//' + location.host ;
}

function dbRoot(location) {
    return location.protocol + '//' + location.host + '/';
}

function appRewrite(db) {
    return location.host + '/' + db ;
}

function appFullUrl(db, ddoc_name, open_path) {
    return '/' + db + '/_design/' + ddoc_name + open_path;

}

function thisDashboardUrl(location) {
    var installPath = '/';
    if (location.pathname.indexOf('_rewrite') >= 0) {
        installPath = '/dashboard/_design/dashboard/_rewrite/'
    }
    return oneUrl(location) + installPath;
}



function addDashboardUrl(data) {
    var dashboardUrl = thisDashboardUrl(window.location);
    data.gardens = _.map(data.gardens, function(row) {
       row.url = row.url + '?dashboard=' + dashboardUrl;
       return row;
    });
    return data;
}


function adjustUIforUser(info, callback) {
        var isAdmin = utils.isAdmin(info);
        if (!isAdmin) {
            $('.admin-only').hide();
        } else {
            $('.admin-only').show();
        }


        if (callback) callback();


}


function getDBSecurity(dbName, callback) {
    $.couch.db(dbName).getDbProperty("_security", {
      success: function(r) {
          callback(null, r);
      }
  });
}


function addDBReaderRole(dbName, role, callback) {
  getDBSecurity(dbName, function(err, sec) {
      console.log(sec);
      if (!sec.admins) {
          sec = {"admins":{"names":[],"roles":[]},"members":{"names":[],"roles":[]}};
      }

      sec.members.roles.push(role);
      $.couch.db(dbName).setDbProperty("_security", sec, {
          success : function() {
              callback(null);
          }
      });
  });
}

function updateStatus(msg, percent, complete, success) {
    console.log(msg, percent, complete, success);
    $('.install-info h4').text(msg);
    $('.install-info .bar').css('width', percent);
    if (complete) {
        $('.install-info .progress')
            .addClass(success ? 'success' : 'danger')
            .removeClass('active info');
    }
}

function addVhostRule(app_data, callback) {
    var safe_name = garden_urls.user_app_name_to_safe_url(app_data.dashboard_title);
    console.log(app_data);
    var rewrite_url = appFullUrl(app_data.installed.db, app_data.doc_id, app_data.open_path);
    console.log(rewrite_url);
    $.couch.config({
        success : function(result) {
            callback(null, result);
        }
    }, 'vhosts', appRewrite(safe_name), rewrite_url );
}

function renameVhostRule(app_data, old_name, callback) {
    var safe_name = garden_urls.user_app_name_to_safe_url(old_name);
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

$(function() {
    $('.help').tooltip({placement: 'bottom'});


    $('.modal .cancel').live('click', function() {
        $(this).parent().parent().modal('hide');
    });
    session.on('change', function(err){
        adjustUIforUser({});
    });


});
