var dashboard_core = require('lib/dashboard_core');
var _ = require('underscore')._;
var handlebars = require('handlebars');
var utils = require('lib/utils');
var session = require('session');
var users = require("users");
var semver = require("semver");

$(function(){

    function viewApp(id) {
        $.couch.db(dashboard_db_name).openDoc(id, {
            success: function(doc){
                doc.installed_text = moment(new Date(doc.installed.date)).calendar();
                doc.icon_src = dashboard_core.bestIcon96(doc);

               $('#apps').html(handlebars.templates['app_details.html'](doc, {}));

               $('.form-actions .btn').tooltip({placement: 'bottom'});

               var showDBSize = function() {
                   $.couch.db(doc.installed.db).info({
                      success: function(data) {
                          var nice_size = dashboard_core.formatSize(data.disk_size);
                         $('#db-size').text(nice_size);
                      }
                  })
               };

               showDBSize();

               $('.edit-title').blur(function() {

                   doc.dashboard_title = $(this).text();
                   $.couch.db(dashboard_db_name).saveDoc(doc, {
                      success: function(results) {

                      }
                   });
               })




               $('#delete-final').click(function() {
                   $(this).parent().parent().modal('hide');

                   $.couch.db(doc.installed.db).drop({
                       success: function() {
                           $.couch.db(dashboard_db_name).removeDoc(doc,  {
                               success : function() {
                                   // go to the dashboard.
                                  router.setRoute('/apps');
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


            }
        });
    }

    function showApps() {
        if ($('#apps table').length > 0) return; // weird bug we are getting called twice. prevent re-render.
        $('#apps').html(handlebars.templates['apps.html']({}));

        dashboard_core.getInstalledApps(function(err, data) {
             $('.app-list-condensed').html(handlebars.templates['settings-apps.html'](data, {}));
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


        dashboard_core.getInstalledAppsByMarket(function(err, apps) {
            _.each(apps, function(apps, location ) {
                var data = {
                    location: location,
                    apps : apps
                };
                $('.update-board').append(handlebars.templates['settings-app-updates.html'](data, {}));
                dashboard_core.checkUpdates(data, function(err, appVersions) {
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
    }

    $('.front-page .btn-group .btn').on('click', function() {
        var type = $(this).data('type');
        $('.front-page .type').hide();
        $('.front-page .' + type).show();

    })
    $('.front-page .primary').on('click', function() {
        var btn = $(this);
        btn.button('loading');

        var isMarkdown =  $('.front-page .btn-group .btn.active').data('type') === 'markdown';
        var showActivityFeed = $('.front-page input.showActivityFeed').attr('checked') === 'checked';
        var text;
        if (isMarkdown) {
            text = escape($('.front-page .markdown textarea').val());
        } else {
            text = escape($('.front-page .html textarea').val());
        }
        var started = new Date().getTime();
        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/frontpage/settings?isMarkdown=' + isMarkdown + '&showActivityFeed=' + showActivityFeed + '&text=' + text,
            type: 'PUT',
            success : function(result) {
                if (result == 'update complete') {
                    var now = new Date().getTime();
                    var minUItime = 1000 - (now - started);
                    if (minUItime > 0);
                    setTimeout(function() {
                        btn.button('reset');
                    }, minUItime);
                }
                else alert('update failed');

            },
            error : function() {

            }
        });

    });

    $('#short_urls').on('click', function() {
        if ($(this).attr('checked')==='checked') $('.short_urls').show(300);
        else $('.short_urls').hide(300);
    });
    $('#show_brand').on('click', function() {
            if ($(this).attr('checked')==='checked') $('.show_brand').show(300);
            else $('.show_brand').hide(300);
    });



    $('#brand_img').on('change', function() {
        var icon_name = $('#brand_img').val().split('\\').pop();
        if (icon_name) {
            $('#image-upload-form').ajaxSubmit({
                url:  "_db/settings",
                success: function(resp) {
                    var json_resp = JSON.parse(resp);
                    $('#attachmentRevision').val(json_resp.rev);
                    $('#brand_img_display').attr('src', '_db/settings/' + icon_name);
                }
            });

        }
    });


    function resetButtonAfter(btn, started) {
       var now = new Date().getTime();
       var minUItime = 1000 - (now - started);
       if (minUItime > 0);
       setTimeout(function() {
           btn.button('reset');
       }, minUItime);
    }





    $('#navigation .primary').click(function() {
        var btn = $(this);
        btn.button('loading');
        var started = new Date().getTime();
        var params = $('#navigation form.a').formParams();
        _.extend(params, $('#navigation form.c').formParams());

        var icon_name = $('#brand_img').val().split('\\').pop();
        if (icon_name) {
            params.icon_name = icon_name;
            var height = $('#brand_img_display').height();
            if (height > 25) return alert('your icon is greater than 25px.');
            params.icon_height = height;

            var width = $('#brand_img_display').width();
            params.icon_width = width;

        }


        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/navigation/settings?' + $.param(params),
            type: 'PUT',
            success : function(result, textStatus, xmlHttpRequest) {
                if (result == 'update complete') {

                    var userBrowserid = 'false';
                    if (params.login_type == 'browserid') {
                        userBrowserid = 'true';
                    }
                    $.couch.config({
                        success : function(result) {
                            resetButtonAfter(btn, started);
                            window.location.reload();
                        }
                    }, 'browserid', 'enabled', userBrowserid );



                }
                else alert('update failed');

            },
            error : function() {

            }
        });
        return false;
    })

    //var url = document.location.toString();
    //if (url.match('#')) {
    //    $('.nav.tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
    //}

    // Change hash for page-reload
    $('.nav.tabs a').on('shown', function (e) {
        var tab = e.target.hash.split('#')[1];
        router.setRoute('/' + tab);
//        window.location.hash = '/' + tab;
    })
    function showTab(id) {
        $('#' + id).tab('show');
    }
    function showTab() {
        var url = document.location.toString();
        $('.nav.tabs a[href=#'+url.split('#/')[1]+']').tab('show') ;
    }
    var routes = {

      '/apps/:db' : function(app_id) {
          viewApp(app_id);
      },
      '/apps'   : function(){
          showApps();
      },
      '/frontpage'  : showTab,
      '/navigation' : showTab,
      '/admins'     : showTab,
      '/roles'      : showTab
    };


    var router = Router(routes);
    router.init('/apps');
})




