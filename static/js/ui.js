var _ = require('underscore')._;
var handlebars = require('handlebars');
var garden_urls = require('lib/garden_urls');
var userType = require('lib/userType');
var session = require('session');
var users = require("users");
var semver = require("semver");


var show = function(what, context) {
    if (!context) context = {};
    $('.nav li').removeClass('active');
    $('.nav li.' + what).addClass('active');
    $('.main').html(handlebars.templates[what + '.html'](context, {}));
} 




function getApps(callback) {

    $.couch.db(dashboard_db_name).view('dashboard/by_active_install', {
        include_docs : true,
        success: function(response) {
            var data = {};
            data.apps = _.map(response.rows, function(row) {

                            // we should verify these by checking the db and design docs exist.

                            var app_data = row.doc;
                            return {
                                id   : app_data._id,
                                img  : garden_urls.bestIcon128(app_data),
                                name : app_data.dashboard_title,
                                db   : app_data.installed.db,
                                start_url : garden_urls.get_launch_url(app_data, window.location.pathname)
                            }
                        });
                        callback(data);
        }
    })
}


function getAppsByMarket(callback) {
    $.couch.db(dashboard_db_name).view('dashboard/app_version_by_market', {
        success: function(response) {
            var data = _.groupBy(response.rows, function(row) {
                return row.key;
            })
            callback(data);
        }
    });
}


function checkUpdates(apps, callback){
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


function displayApps() {
    getApps(function(data) {
        if (!data.apps || data.apps.length === 0) {
            $('.message').html(handlebars.templates['no_apps_message.html']({}, {}));
            return;
        }

        // get any stored ordering
        var order = amplify.store('dashboardOrder');

        if (order) {
            var max = 1000;
            var current_past_end = data.apps.length + 1;
            data.apps = _.sortBy(data.apps, function(app) {
                var dash_order = current_past_end++;
                if (order[app.id] && order[app.id] >= 0) dash_order = order[app.id];
                dash_order =  dash_order;

                return dash_order;
            });
        }



        $('.app').html(handlebars.templates['app_list.html'](data, {}));

        // count the thumbnails that get loaded. After all done, and no apps showing, display
        // a message to login
        var appAccessCheck = function() {
            if (loadedApps == 0) {
                $('.message').html(handlebars.templates['no_apps_access_message.html']({}, {}));
            }
        }
        var loadedApps = 0;
        var deniedApps = 0;
        var renderMessage = _.after(data.apps.length, appAccessCheck);
        $('.thumbnail img')
            .error(function() {
                // this is to handle apps that we dont have permissions to
                deniedApps++;
                $(this).closest('li').remove();
                renderMessage();
            })
            .load(function() {
                loadedApps++;
                renderMessage();
            });



        //  begin crazy stuff to get a short click (with animation) and a long click to settings
        $('ul.app .thumbnail').click(function(event){

            try {
                var id = $(this).data('id');
                var now = new Date().getTime();
                if (longclickinfo.id === id && (now - longclickinfo.start) > 900 ) return;

                var name = $(this).data('name');
                var link = $(this).parent().attr('href');


                window.location = link;


            } catch (e) {
                console.log(e);
            }
            return false;


        });

        var longclickinfo = {

        }
        function cancelLongClick() {
            longclickinfo.id = null;
            longclickinfo.start = null;
            if (longclickinfo.showMsg)
                clearTimeout(longclickinfo.showMsg);
        }

        $('ul.app a').click(function() {
            return false;
        });
        var thumbnail = $('ul.app .thumbnail')
        thumbnail.tooltip({
            trigger: 'manual',
            title: 'Enter Settings...'
        });

        thumbnail.bind('mousedown touchstart', function(event) {
            var me = $(this);
            me.find('img').addClass('thumbnail-mouse-down');
            longclickinfo.id = $(this).data('id');
            longclickinfo.start = new Date().getTime();
            longclickinfo.showMsg = setTimeout(function(){
                me.tooltip('show');
            }, 900)
        });
        thumbnail.bind('mousemove touchmove', function(){
            cancelLongClick();
            $(this).tooltip('hide')
              .find('img').removeClass('thumbnail-mouse-down');
        });
        thumbnail.bind('mouseup touchend', function(event){
            var id = $(this).data('id');
            var now = new Date().getTime();
            if (longclickinfo.id === id && (now - longclickinfo.start) > 900 ) {
                try {
                    event.stopPropagation();
                   $(this).tooltip('hide');
                   router.setRoute('/settings/info/' + id);

                } catch(e) {
                }
            } else {
                $(this).tooltip('hide');
                cancelLongClick();
            }
            $(this).find('img').removeClass('thumbnail-mouse-down');
        });

        // End of crazy

        $('ul.app').sortable({
            update: function() {
                var order = {};
                var count = 1;
                $('.thumbnail').each(function() {
                    var id = $(this).data('id');
                    order[id] = count++;
                });
                amplify.store('dashboardOrder', order);
            }
        });
        $('ul.app').disableSelection();


    });
}


function showApps() {
    show('apps');
    displayApps();

    setTimeout(function(){
        // this resets any apps the user may lose access to on a session change
        session.on('change', function(err, info){
            $('.message').hide();
            displayApps();
        });
    }, 1000); // wait some time for the page to finishe before binding to the session



}








function viewApp(id) {

    $('.nav li').removeClass('active');
    $('.nav li.apps' ).addClass('active');

    $.couch.db(dashboard_db_name).openDoc(id, {
        success: function(doc){
            doc.installed_text = moment(new Date(doc.installed.date)).calendar();
            doc.icon_src = garden_urls.bestIcon96(doc);


           $('.main').html(handlebars.templates['app_details.html'](doc, {}));


           $('.form-actions .btn').tooltip({placement: 'bottom'});

           var showDBSize = function() {
               $.couch.db(doc.installed.db).info({
                  success: function(data) {
                      var nice_size = garden_urls.formatSize(data.disk_size);
                     $('#db-size').text(nice_size);
                  }
              })
           };

           showDBSize();






           session.info(function(err, info) {
               adjustUIforUser(info);
           });

           $('.edit-title').blur(function() {
               var prev_name = garden_urls.user_app_name_to_safe_url(doc.dashboard_title);
               doc.dashboard_title = $(this).text();


               $.couch.db(dashboard_db_name).saveDoc(doc, {
                   success: function(response) {
                        doc._rev = response.rev;
                       renameVhostRule(doc, prev_name, function(err, result) {

                       });

                   }
               })
           })




           $('#delete-final').click(function() {
               $(this).parent().parent().modal('hide');

               $.couch.db(doc.installed.db).drop({
                   success: function() {
                       $.couch.db(dashboard_db_name).removeDoc(doc,  {
                           success : function() {
                               // go to the dashboard.
                              router.setRoute('/settings');
                           }
                       });
                   }
               })
           });


           function updateStatus(msg, percent, complete) {
               $('.activity-info .bar').css('width', percent);
               if (complete) {
                   $('.activity-info .progress').removeClass('active');
               }
           }


           $('#compact-final').click(function(){
               $('.activity-info').show();
               updateStatus('Compacting', '50%', true);
               $.couch.db(doc.installed.db).compact({
                  success : function(){
                      updateStatus('Done Compact', '100%', true);
                      setTimeout(function() {
                          $('.activity-info').hide();
                          showDBSize();

                      }, 3000);

                  }
               });
           });


           $('#clone-app-start').click(function(){
               $('#newAppName').val(doc.dashboard_title);
           });

           $('#clone-final').click(function() {
               $(this).parent().parent().modal('hide');
               $('.activity-info').show();
               updateStatus('Copying', '20%', true);


               var replicationOptions = {
                   create_target:true
               };

               if (! $('#copyData').is(':checked') ) {
                   replicationOptions.doc_ids = [ '_design/' + doc.doc_id ];
               }

               var app_data = $.extend(true, {}, doc);
               delete app_data._id;
               delete app_data._rev;
               delete app_data.installed_text;


               app_data.dashboard_title = $('#newAppName').val();


               $.couch.allDbs({
                   success : function(data) {
                       var db_name = garden_urls.find_next_db_name(doc.installed.db, data);

                       app_data.installed.db = db_name;
                       app_data.installed.date = new Date().getTime();


                       $.couch.replicate(doc.installed.db, db_name, {
                          success : function() {
                              $.couch.db(dashboard_db_name).saveDoc(app_data, {
                                  success: function() {
                                       addDBReaderRole(db_name, '_admin', function(err) {
                                           // update the rewrites
                                           var safe_name = garden_urls.user_app_name_to_safe_url(app_data.dashboard_title);

                                           $.post('./_db/_design/dashboard/_update/modifyAppRewrites/_design/dashboard?db=' + app_data.installed.db + '&ddoc=' + app_data.doc_id + '&new_name=' + safe_name , function(result) {
                                               //callback(null, result);
                                               setTimeout(function() {
                                                  $('.activity-info').hide();
                                               }, 3000);
                                           })
                                       })
                                    }

                              });
                          }
                       }, replicationOptions);
                   }
               });









           })
        }
    });
}



function showSync() {
    show('sync');




    // we need the following info to figure best option
    //console.log(System.os);
    //console.log(System.check_plugin('java'));

    $('.other').click(function() {
        $('table.platform-installs').show();
        $(this).hide();
        return false;
    });
}



function getAdmins(callback) {
    $.couch.config({
        success : function(data) {
              var keys = [];
              for(var i in data) if (data.hasOwnProperty(i)){
                keys.push(i);
              }

            if (callback) callback(keys);

        },
        error : function() {
            console.log('not an admin');
        }
    }, 'admins')

}



function getRoles(callback) {
    $.couch.db(dashboard_db_name).view('dashboard/by_roles', {
       success: function(response) {
           callback(response.rows);
       }
    });
}

function getUsers(callback) {
    users.list(function (err, list) {
        if (err) {
           
        }
        else  callback(list);
    });
}




function showSettings() {

    session.info(function(err, info) {
        isAdmin = userType.isAdmin(info);
        show('settings', {isAdmin : isAdmin});

        if (!isAdmin) return;
        getApps(function(data) {
             $('.app-list-condensed').html(handlebars.templates['settings-apps.html'](data, {}));
        });

        getAdmins(function(admins) {
            var data = {
                admins : admins
            };
            $('.admin-list').html(handlebars.templates['admins.html'](data, {}));
        });

        getRoles(function(roles) {
            var data = {
                roles : roles
            }
            $('.role-list').html(handlebars.templates['roles.html'](data, {}));
        });


        // dashboard version info
        $.getJSON("./_info",  function(data) {
            var ourVersion = data.config.version;

            $('.update-board tr.dashboard td.installed-version').html(ourVersion);

            $.ajax({
                url :  "http://garden20.iriscouch.com/garden20/_design/dashboard/_show/configInfo/_design/dashboard?callback=?",
                dataType : 'json',
                jsonp : true,
                success : function(remote_data) {
                    var currentVersion = remote_data.config.version;
                    $('.update-board tr.dashboard td.available-version').html(currentVersion);
                    if (semver.lt(ourVersion, currentVersion )) {
                        $('.update-board tr.dashboard div.update-action').show();
                    }
                },
                error : function() {
                }
            });
        });

        getAppsByMarket(function(apps) {
            _.each(apps, function(apps, location ) {
                var data = {
                    location: location,
                    apps : apps
                };
                $('.update-board').append(handlebars.templates['settings-app-updates.html'](data, {}));
                checkUpdates(data, function(appVersions) {
                    _.each(appVersions.apps, function(app) {
                        if (app.value.availableVersion) {
                            $('.update-board tr.'+ app.id +' td.available-version').html(app.value.availableVersion);
                           if (app.value.needsUpdate) {
                               $('.update-board tr.'+ app.id +' div.update-action').show();
                           }
                        } else {
                            $('.update-board tr.'+ app.id +' td.available-version').html("Can't determine");
                        }

                    })
                });
            })
        });






        getUsers(function(data) {

        });
    });



}

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}


function installApp() {
    $('.nav li').removeClass('active');
    $('.nav li.apps' ).addClass('active');


    var context = {
        app_url : getParameterByName('app_url'),
        app_name : getParameterByName('app_name'),
        is_auth : true
    };


    $('.main').html(handlebars.templates['install.html'](context, {}));
}


function showLogin(redirect) {
    show('login');

    var stored_user = amplify.store('user');
    if (stored_user) {
        $('#email').val(stored_user);
    }

    $('#login-btn').click(function() {
        var username = $('#email').val();
        var password = $('#password').val();
        session.login(username, password, function (err, info) {
            if (err) {
                var warning = $('.warning');
                    warning.show()
                    warning.find('strong').text(err.error);
                    warning.find('span').text(err.reason);
                    $('#password').val('');
            } else {
                amplify.store('user', username);

                if (redirect) {
                    redirect = decodeURIComponent(redirect);
                    window.location = redirect;
                } else {
                    //lame but, we can only get admin names for this.
                    afterRender(function() {
                        router.setRoute('/apps');
                    });
                }

            }
        });
        return false;
    });
    
}

function logout() {
    session.logout(function(err, response) {
        if (err) return alert('Cant Logout');
        router.setRoute('/login');
    });
}

function showProfile(username) {
    username = decodeURIComponent(username);
    console.log(username);
}


function afterRender(callback) {

    session.info(function(err, info) {
        adjustUIforUser(info, callback);
    });
}


var routes = {
  '/apps'   : showApps,
  '/settings/info/:db' : viewApp,
  '/dashboard/install' : installApp,
  '/sync'   : showSync,
  '/settings'   : showSettings,
  '/login/redirect/(.*)' : showLogin,
  '/login' : showLogin,
  '/profile/(.*)' : showProfile,
  '/logout' : logout
};


var router = Router(routes);
router.configure({
   on: function() {
       afterRender();
   }
});
router.init('/apps');





$(function() {





    //query feeds
    var data = [];
    data.feeds = [
        {
            app : 'http://placehold.it/20x20',
            message : 'You added Get Milk',
            date: '2012-01-13T09:24:17Z'
        }

    ]
    $('.feed').append(handlebars.templates['feed_details.html'](data, {}));



    $('.admin-delete').live('click', function(){
       var me = $(this);
       var name = $(this).data('name');

       users.delete(name, function(err) {
           if (err) return alert('could not delete.' + err);
           me.closest('tr').remove();
       });

    });

    $('#add-admin-final').live('click', function(){
        var username = $('#admin-name').val();
        var password = $('#admin-password').val();
        $('#add-admin-dialog').modal('hide');
        users.create(username, password,{roles : ['_admin']}, function(err) {
            if(err) return alert('Cant create admin');
            // admin created
            var data = {
                admins : [username]
            };
            $('.admin-list').append(handlebars.templates['admins.html'](data, {}));
            $('#admin-name').val('');
            $('#admin-password').val('');

        })
    });


    $('#add-role-final').live('click', function() {
        var role = {
            type : 'role',
            name : $('#role-name').val()
        };
        $('#add-role-dialog').modal('hide');

        $.couch.db(dashboard_db_name).saveDoc(role, function(){
            role.key = role.name; // to keep the template rigt
            var data = {
                roles : [role]
            };
            $('.role-list').append(handlebars.templates['roles.html'](data, {}));
            $('#role-name').val('');
        })

    });


    $('.role-delete').live('click', function() {
       var me = $(this);
       var toDelete = {
           _id : $(this).data('id'),
           _rev : $(this).data('rev')
       };
       $.couch.db(dashboard_db_name).removeDoc(toDelete, {
           success: function() {
               me.closest('tr').remove();
           }
       })
    });




    $('.update-board tr.dashboard .update-run').live('click',function(){
       var btn = $(this);
       btn.button('loading');
       $.couch.replicate('http://garden20.iriscouch.com/garden20', dashboard_db_name, {
          success : function() {
              btn
                  .button('complete')
                  .addClass('disabled')
                  .attr('disabled', 'disabled');

          }
       }, {doc_ids : [ '_design/dashboard'  ] });
    });

    $('.update-board  button.update-run-app').live('click',function(){
        var btn = $(this);
        btn.button('loading');
        var id = btn.data('id');
        $.couch.db(dashboard_db_name).openDoc(id, {
            success : function(app_data) {
                $.couch.replicate(app_data.db_src, app_data.installed.db, {
                   success : function(rep_result) {
                        var db = $.couch.db(app_data.installed.db);
                        copyDoc(db, app_data, function(err){
                            if (err) {
                                return alert(err);
                            } else {
                                btn
                                 .button('complete')
                                 .addClass('disabled')
                                 .attr('disabled', 'disabled');
                            }

                        });

                   }
               }, {
                  doc_ids : [app_data.doc_id]
               });
            }
        })
    });

    /** vary lame copy and past job from install.js. Need to merge **/

    function copyDoc(db, app_data, callback) {
        var design_doc_id = '_design/' + app_data.doc_id;
        db.headDoc(design_doc_id,{}, {
            success : function(data, status, jqXHR) {
                if (!jqXHR) callback('Update failed.');
                var rev = jqXHR.getResponseHeader('ETag').replace(/"/gi, '');
                design_doc_id += "?rev=" + rev;
                db.copyDoc(
                  app_data.doc_id,
                  {
                       success: function() {
                           deleteDoc(db, app_data, callback);
                       }

                  },
                  {
                       headers : {Destination : design_doc_id }
                   }
               );
            },
            error: function() {
                callback('Update failed.');
            }
        })
    }

    function deleteDoc(db, app_data, callback) {
        db.headDoc(app_data.doc_id, {}, {
            success : function(data, status, jqXHR) {
                var rev = jqXHR.getResponseHeader('ETag').replace(/"/gi, '');

                var purge_url = jQuery.couch.urlPrefix + '/' + app_data.installed.db + '/_purge';
                var data = {};
                data[app_data.doc_id] = [rev];
                $.ajax({
                  url : purge_url,
                  data : JSON.stringify(data),
                  dataType : 'json',
                  contentType: 'application/json',
                  type: 'POST',
                  success : function(data) {
                      saveAppDetails(db, app_data, callback)
                  }
                 });
            }
        });
    }

    function saveAppDetails(db, app_data, callback) {
        var app_json_url = garden_urls.app_details_json(app_data.src);
        $.ajax({
            url : app_json_url + "?callback=?",
            dataType : 'json',
            jsonp : true,
            success : function(data) {
                app_data.kanso = data.kanso;
                app_data.updated  =  new Date().getTime();
                $.couch.db(dashboard_db_name).saveDoc(app_data, {
                    success : function() {
                         callback();
                    }
                });
            }
        });
    }


    $('.timeago').each(function() {
       var textTime = $(this).attr('title');
       var date = Date.parse(textTime);
       var text = moment(date).fromNow();
       $(this).text(text);
       $(this).attr('title', moment(date).calendar());

    }).tooltip({placement: 'right'});

});



