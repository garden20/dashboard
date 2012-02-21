var dashboard_db_name = 'dashboard';
jQuery.couch.urlPrefix = '_couch';



function oneUrl(location) {
    return location.protocol + '//' + location.host ;
}

function dbRoot(location) {
    return location.protocol + '//' + location.host + '/';
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
        var isAdmin = userType.isAdmin(info);
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

function updateStatus(msg, percent, complete) {
    console.log(msg, percent, complete);
    $('.install-info h4').text(msg);
    $('.install-info .bar').css('width', percent);
    if (complete) {
        $('.install-info .progress').removeClass('active');
    }
}



$(function() {
    $('.help').tooltip({placement: 'bottom'});

    require('kanso-topbar').init();

    $('.modal .cancel').live('click', function() {
        $(this).parent().parent().modal('hide');
    });
    session.on('change', function(err){
        adjustUIforUser({});
    });

    // version info
    $.getJSON("./_info",  function(data) {
        var git_rev_small = data.git.commit.substring(0,7);
        var modified = "";
        if (data.git.uncommitted && data.git.uncommitted.length > 0) modified = "*";
        $('footer span.version').text(data.config.version + ':' + git_rev_small + modified);

    })
});
