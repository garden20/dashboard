var dashboard_core = require('lib/dashboard_core');
var dashboard_links = require('lib/dashboard_links');
var _ = require('underscore')._;
var handlebars = require('handlebars');
var utils = require('lib/utils');
var session = require('session');
var users = require("users");
var semver = require("semver");
var revalidator = require("revalidator");
var password = require('lib/password');
var flattr = require('flattr');
var async = require('async');


$(function(){

    function getNiceDBSize(db, callback) {
        $.couch.db(db).info({
           success: function(data) {
               var nice_size = dashboard_core.formatSize(data.disk_size);
               callback(null, nice_size);
           }
       })
    }

    function viewAppBase(id, callback) {
        $.couch.db(dashboard_db_name).openDoc(id, {
            success: function(doc){
                doc.installed_text = moment(new Date(doc.installed.date)).calendar();
                doc.icon_src = dashboard_core.bestIcon96(doc);
                doc.display_name = dashboard_core.display_name(doc);
                if (flattr.hasFlattr(doc)) {
                    var flattrDetails = flattr.getFlattrDetailsFromInstallDoc(doc);
                    doc.flattrLink = flattr.generateFlatterLinkHtml(flattrDetails);
                }

               $('#apps').html(handlebars.templates['app_details_base.html'](doc, {}));
               $('.settings.nav-pills').removeClass('active');
               $('.flattr_link').tooltip({placement: 'bottom'});

               getNiceDBSize(doc.installed.db, function(err, nice_size){
                   $('#db-size').text(nice_size);
               });
               callback(null, doc);
            }
        });
    }

    function viewAppAccess(id) {
        viewAppBase(id, function(err, doc) {
            $('.app_access').addClass('active');
            dashboard_core.getDBSecurity(doc.installed.db, function(err, security){
                if (err) return console.log(err);

                if (!security.members || !security.members.roles || security.members.roles.length === 0 ) {
                    security.access_type_public = true;
                    security.members = security.members || {names:[],roles:[]};
                } else {
                    var actual = { roles: security.members.roles };
                    var admin  = { roles: ['_admin'] };
                    if (_.isEqual(actual, admin)) {
                        security.access_type_admins = true;
                    } else {
                        security.access_type_groups = true;
                    }
                }
                security.members.roles = _.without(security.members.roles, "_admin");
                var cleaned_roles = {};
                _.each(security.members.roles, function(role) {
                    if (role.indexOf('group.') === 0 ) {
                        cleaned_roles[role.substring(6)] = true;
                    }
                });
                $('.tab_details').html(handlebars.templates['app_details_access.html'](security));
                if (security.access_type_groups) {
                    renderAppGroupTable(cleaned_roles);
                }


                // show or hide the app group table based on selection
                $('.access_radio').on('click', function(){
                   var access_type = $(this).val();
                   if (access_type == 'admins' || access_type == 'public') {
                        $('.group-table').hide();
                        $('.group-table tbody tr').remove();
                   }
                   else renderAppGroupTable(cleaned_roles);
                });

                $('form').on('submit', function(){
                    var btn = $('button.save');
                     btn.button('saving');
                     var access_type = $('.access_radio:checked').val();
                     var groups = null;
                     if (access_type == 'groups') {
                         groups = $('#group_access').trigger("liszt:updated").val();
                         groups = _.map(groups, function(group){ return 'group.' + group });
                     }
                     saveAccessType(doc.installed.db, access_type, groups, function(err, new_security) {
                         btn.button('reset');
                         humane.info('Save Complete');
                     });
                    return false;
                });
            });
        });
    }

    function viewAppActions(id) {
        viewAppBase(id, function(err, doc) {
            $('.app_actions').addClass('active');
            $('.tab_details').html(handlebars.templates['app_details_actions.html']({}));
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
                           getNiceDBSize(doc.installed.db, function(err, nice_size){
                               $('#db-size').text(nice_size);
                           });

                       }, 3000);

                   }
                });
            });


            $('#clone-app-start').click(function(){
                $('#newAppName').val(doc.dashboard_title);
            });
            $('#delete-final').click(function() {
                $(this).parent().parent().modal('hide');

                $.couch.db(doc.installed.db).drop({
                    success: function() {
                        $.couch.db(dashboard_db_name).removeDoc(doc,  {
                            success : function() {
                                // go to the dashboard.
                               router.setRoute('/apps');
                               // reload page to reload the topbar
                               window.location.reload();
                            }
                        });
                    }
                })
            });
        });
    }

    function getAppSettings(doc, callback) {
        var appSettingsUrl = '/' + doc.doc_id + '/_design/' + doc.doc_id + '/_rewrite/app_settings/' + doc.doc_id;
        $.ajax({
            dataType: 'json',
            url: appSettingsUrl,
            success: function(data) {
                callback({
                    ddoc: false,
                    settings: data.settings,
                    schema: data.schema
                });
            },
            error: function () {
                // app-settings package not installed - attempt slower fallback method
                var doc_path = '_couch/' + doc.installed.db + '/_design/' + doc.doc_id;
                $.getJSON(doc_path, function(data) {
                    var schema;
                    var ddoc_meta = data.kanso || data.couchapp;
                    if (ddoc_meta && ddoc_meta.config && ddoc_meta.config.settings_schema) {
                        schema = ddoc_meta.config.settings_schema;
                    }
                    callback({ 
                        ddoc: data,
                        settings: data.app_settings,
                        schema: schema
                    });
                });
            }
        });
    }


    function viewAppSettings(id) {
        var editor, settings;

        viewAppBase(id, function(err, doc) {
            $('.app_settings').addClass('active');
            $('.tab_details').html(handlebars.templates['app_details_settings.html'](doc, {}));

            var meta = doc.couchapp || doc.kanso;
            if (meta.config.settings_schema) {

                getAppSettings(doc, function(data) {
                    settings = data;
                    if (!settings.schema) {
                        // default the schema
                        settings.schema = meta.config.settings_schema;
                    }
                    if (settings.settings) {
                        settings.schema.default = settings.settings;
                    }
                    editor = JsonEdit('app_settings_schema', settings.schema);
                    cleanUpJsonEdit();

                    $('a.backup').on('click', function(){

                        if (!settings.settings) {
                            return alert('Please save app settings first');
                        }

                        var a = $(this)[0];
                        var URL = window.webkitURL || window.URL;
                        var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                        var file = new Blob([JSON.stringify(settings.settings, null, 4)], {"type": "application\/json"});

                        var timestamp = moment().format('YYYY-MM-DD-HHmmss');
                        a.download = doc.doc_id + '_' +  doc.installed.db + '_' + timestamp + '_settings.json';
                        a.href = URL.createObjectURL(file);

                    });

                    $('button.restore').on('click', function(ev){
                        ev.preventDefault();
                        $('#fileUploader').click();
                    });
                    $('#fileUploader').on('change', function(ev) {

                        if (this.files.length === 0) return;

                        var reader = new FileReader();
                        reader.onloadend = function(ev) {
                            try {
                                var json = JSON.parse(ev.target.result);
                                schema_to_use.default = json;
                                $('.je-field').remove();
                                editor = JsonEdit('app_settings_schema', schema_to_use);
                                cleanUpJsonEdit();
                                alert('Restored values loaded. Click "Save" to complete restore.');
                            } catch(e) {
                                alert('Could not restore from file provided.');
                            }
                        }
                        reader.readAsText(this.files[0]);
                    });

                });

            } else {
                $('#app_settings_schema').html('<h2>No settings to configure</h2>')
                $('.form-actions').hide();
            }


            function cleanUpJsonEdit() {
                // hide spinner
                $('#app_settings_schema .spinner').hide();

                // make html more boostrap compatible
                $('#app_settings_schema .je-field').addClass('control-group');

                // move title/field description to div for better UX
                $('#app_settings_schema .je-field').each(function(idx, el) {
                    $(el).children('input, select, textarea, label').each(function(i, input) {
                        var $input = $(input),
                            text = $input.attr('title');
                        // no description property on json schema, skip
                        if (!text) {
                            return;
                        }
                        $input.after(
                            '<div class="help-block">' +  text + '</div>'
                        );
                        $input.removeAttr('title');
                    });
                });
            }


            function onFormSubmit(ev) {
                ev.preventDefault();

                var btn = $('button.save');
                btn.button('saving');
                var err_alert = $('.alert');
                err_alert.hide(10);

                var form = editor.collect();

                // clear errors on each form submission
                err_alert.find('.msg').html('');
                $('.je-field').removeClass('error');

                if (!form.result.ok) {

                    err_alert.show(200)
                        .find('button.close')
                        .on('click', function () { err_alert.hide(); })

                    err_alert.find('h4')
                        .text(form.result.msg);

                    // append detailed errors msgs to div
                    var $err_list = err_alert.find('.msg').append('<ul/>');

                    console.error('failed validation', form.result);

                    // highlight fields with errors
                    var selector = '';
                    function highlightErrors(obj, key) {
                        if (!obj) return;
                        if (!selector) {
                            selector = '.je-' + key;
                        }
                        if (obj.ok === false && obj.isRoot === true) {
                            if (_.isArray(obj.data)) {
                                selector +=  ' .je-' + key;
                            } else {
                                $(selector + ' .je-' + key).addClass('error');
                            }
                            if (obj.msg) {
                                $err_list.append(
                                    '<li>' + key + ': ' + obj.msg +'</li>'
                                );
                            }
                        }
                        if (_.isArray(obj)) {
                            _.each(obj[1], highlightErrors);
                        } else if (_.isObject(obj) && !obj.isRoot) {
                            _.each(obj, highlightErrors);
                        } else if (_.isArray(obj.data)) {
                            _.each(obj.data[0], highlightErrors);
                        }
                    };
                    _.each(form.result.data, highlightErrors);

                    return;
                }

                function updateSuccess() {
                    btn.button('reset');
                    humane.info('Save Complete');
                }

                function updateError(status, error, reason) {
                    console.error('couchdb error', status, error, reason);
                    alert('Error ' + status + ' ' + reason);
                }

                if (settings.ddoc) {
                    // app-settings package not installed - attempt slower fallback method
                    settings.ddoc.app_settings = form.data;
                    $.couch.db(doc.installed.db).saveDoc(settings.ddoc, {
                        success: updateSuccess,
                        error: updateError
                    });
                } else {
                    $.ajax({
                        type: 'PUT',
                        data: JSON.stringify(form.data),
                        contentType: 'application/json',
                        dataType: 'json',
                        url: '/' + doc.doc_id + '/_design/' + doc.doc_id + '/_rewrite/update_settings/' + doc.doc_id,
                        success: updateSuccess,
                        error: updateError
                    });
                }

            };
            $('form.app-settings').on('submit', onFormSubmit);
        });
    }

    function viewApp(id) {
        viewAppBase(id, function(err, doc) {
           $('.app_name').addClass('active');
           $('.tab_details').html(handlebars.templates['app_details.html'](doc, {}));
           $('form').on('submit', function() {
               var btn = $('button.save');
               btn.button('saving');
               doc.dashboard_title = $('#menu_name').val();
               doc.hide_on_topbar  = $('#hide_on_topbar').is(':checked');
               $.couch.db(dashboard_db_name).saveDoc(doc, {
                  success: function(results) {
                      btn.button('reset');
                      humane.info('Save Complete');
                  }
               });
               return false;
           });
        });
    }

    function renderAppGroupTable(cleaned_roles) {
        $('.group-table').show();
        configureRolesSelection('#group_access', cleaned_roles);
    }

    function clearRolesSelection(select) {
       $(select).val('').trigger("liszt:updated");
    };
    function configureRolesSelection(select, roles_selected) {

        if (!roles_selected) roles_selected = {};

        if ($(select).hasClass('chzn-done')) return;


        getRoles(function(roles) {
           if (!roles || roles.length == 0) {
               $(select).hide();
           }  else {
               $(select).empty();
               _.each(roles, function(row) {

                   var selected = '';
                   if (roles_selected[row.key]) {
                       selected = ' selected ';
                   }

                   var option = $('<option '+ selected +'>'+ row.key +'</option>');
                   $(select).append(option);
               });
               $(select).show().chosen({no_results_text: "No results matched"});

           }
        });
    }


    function saveAccessType(db, type, groups, callback) {
        if (type == 'admins'){
            return dashboard_core.onlyAdminDBReaderRole(db, callback);
        }
        if (type == 'public') {
            return dashboard_core.removeAllDBReaderRoles(db, callback);
        }
        if (type == 'groups') {
            return dashboard_core.setDBReaderRoles(db, groups, callback);
        }
    }


    function updateMapping(form, mapping) {
        form.each(function(i, row){
            var $me = $(this);
            var i = $me.data('index');
            var to_sync = ($me.find('.to_sync').val() === 'on');
            var sync_type = $me.find('.sync_type').val();
            mapping.mapping[i].enable = to_sync;
            mapping.mapping[i].type = sync_type;
        });
        return mapping;
    }


    function showSync() {
        dashboard_core.getSyncDocs(function(err, results) {

           var has_sync = (results.length > 0)
           $('#sync').html(handlebars.templates['settings-sync.html']({
               syncs : results,
               has_sync : has_sync
           }));


            $('.cancel-existing-sync').on('click', function(){
                if (confirm("Are you sure you want to cancel this sync?")) {
                    var $sync_block = $(this).closest('.sync-block');
                    var sync_id = $(this).data('id');
                    var sync_doc = _.find(results, function(mapping) { if (mapping._id == sync_id) return true;   });
                    dashboard_core.cancel_garden_sync(sync_doc, function(err){
                        if (err) return alert('Could not cancel: ' + err);
                        $sync_block.remove();
                    });
                }
            });
            $('button.add-sync').on('click', function(){
                $(this).hide();
                $('div.new').show(300);
            });

            $('.cancel-new-sync').on('click', function(){
                $('.step1').show();
                $('.step1 button').button('reset');
                $('.new .mappings').empty();
                $('.step2').hide();
                $('div.new').hide(300);
                $('button.add-sync').show();
            });

            $('form.new_sync').bind('submit', function(){
                try {
                $('.step1 button').button('loading');
                var dashboard_root_url = $('input[name="url"]').val();
                async.parallel({
                    user_details : function(cb){

                        var username = $('#uname').val();
                        if (!username || username.trim() === '') return cb(null, { remote_username: false });


                        // find out if the user exists, if the garden is in admin party, etc
                        var req = {
                            userCtx : JSON.parse(decodeURI($('#dashboard-topbar-session').data('userctx')))
                        };
                        var local_user_details = {
                            remote_username : $('#uname').val(),
                            remote_pw : $('#pw').val(),
                            is_admin_party : utils.isAdminParty(req)
                        }
                        if (local_user_details.is_admin_party) return cb(null, local_user_details)
                        users.get(username, function(err, doc){
                            if (err) local_user_details.local_user_exists = false;
                            else local_user_details.local_user_exists = true;
                            cb(null, local_user_details);
                        })
                    },
                    initial_sync_mapping : function(cb){
                        dashboard_core.guess_initial_sync_mapping(dashboard_root_url, cb);
                    }
                }, function(err, results){
                    if (err) return alert('Problem: ' + err);
                     $('.step1').hide();

                     console.log(results);
                     if (results.initial_sync_mapping.dashboard_root_url.indexOf('https://') !== 0) {
                         $('.unsecure_transport_warning').show();
                     }



                     $('.new .mappings').html(handlebars.templates['settings-sync-mapping.html'](results));
                     $('.step2').show();
                     $('.review').on('click', function(){  $('.new table').show();  })
                     var m = results.initial_sync_mapping;
                     $('.step2 button.primary').on('click', function(){
                         var btn = $(this);
                         btn.button('loading');

                         var mapping = updateMapping($('.sync_row'), m);
                         m.user = $('#uname').val();
                         m.pass = $('#pw').val();
                         m.dashboard_root_url =   $('input[name="url"]').val(); // give them a chance to change minds
                         var host_options = $('#sync').data('host_options')
                         dashboard_core.create_sync_mapping(m, host_options, results.user_details, function(err, results){
                             if (err) return alert('Something went wrong: ' + err);
                             window.location.reload();
                         });
                     });
                });
                } catch(e) {console.log(e)}
                return false;
            });
            dashboard_core.clean_unused_remote_dashboard_dbs(results, function(err){
                //ignore for now
            });

        });


    }


    function showApps() {
        if ($('#apps table.apps').length > 0) return; // weird bug we are getting called twice. prevent re-render.
        $('#apps').html(handlebars.templates['apps.html']({}));

        dashboard_core.getInstalledApps(function(err, data) {
             $('.app-list-condensed').html(handlebars.templates['settings-apps.html'](data, {}));
        });

        // dashboard version info
        $.getJSON("./_info",  function(data) {
            var ourVersion = data.config.version;

            $('.update-board tr.dashboard td.installed-version').html(ourVersion);

            $.ajax({
                url :  "http://garden20.iriscouch.com/dashboard_seed/_design/dashboard/_show/configInfo/_design/dashboard?callback=?",
                dataType : 'json',
                jsonp : true,
                success : function(remote_data) {
                    var currentVersion = remote_data.config.version;
                    $('.update-board tr.dashboard td.available-version').html(currentVersion);
                    if (semver.lt(ourVersion, currentVersion )) {
                        $('.update-board tr.dashboard .update-action').show();
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
                    if (!appVersions) return;
                    _.each(appVersions.apps, function(app) {
                        if (app.value.availableVersion) {
                            $('.update-board tr.'+ app.id +' td.available-version').html(app.value.availableVersion);
                           if (app.value.needsUpdate) {
                               $('.update-board tr.'+ app.id +' .update-action').show();
                           }
                        } else {
                            $('.update-board tr.'+ app.id +' td.available-version').html("Can't determine");
                        }

                    })
                });
            })
        });
    }

    function showOrdering() {
        $('#save-ordering-final')
            .attr('disabled', 'disabled')
            .on('click', function(){
                $(this).attr('disabled', 'disabled');

                var showing = [];
                var onDropdownMenu = [];
                $('#sortable1 li').each(function(i, entry) {
                   showing.push($(entry).data('id'));
                });
                $('#sortable2 li').each(function(i, entry) {
                    onDropdownMenu.push($(entry).data('id'));
                });

                dashboard_core.updateNavOrdering(showing, onDropdownMenu, function(err) {
                    if (err) return alert(err);
                    humane.info('Save Complete');
                });
            });
        $( "#sortable1, #sortable2" ).empty().sortable({
            connectWith: ".connectedSortable",
            stop: function(event, ui) {
                $('#save-ordering-final').removeAttr('disabled');
            }
        }).disableSelection();

        dashboard_core.getTopbarEntries(function(err, rows) {
            _.each(rows, function(row) {
                if (row.key[0] === 0) return; // settings doc
                 if(row.doc.onDropdownMenu) {
                     $('#sortable2').append('<li class="ui-state-default" data-id="'+ row.id + '">' + row.key[2] + '</li>');
                 } else {
                     $('#sortable1').append('<li class="ui-state-default" data-id="'+ row.id + '">' + row.key[2] + '</li>');
                 }
            });
            $('.loading-ordering').hide();
        });


    }


    $('.update-board tr.dashboard .update-run').live('click',function(){
       var btn = $(this);
       btn.button('loading');
       $.couch.replicate('http://garden20.iriscouch.com/dashboard_seed', dashboard_core.dashboard_db_name, {
          success : function() {
              btn
                  .button('complete')
                  .addClass('disabled')
                  .attr('disabled', 'disabled');

          }
       }, {doc_ids : [ '_design/dashboard'  ] });
    });


    $('.front-page .btn-group .btn').on('click', function() {
        var type = $(this).data('type');
        $('.front-page .type').hide();
        $('.front-page .' + type).show();

    })
    $('.front-page .primary').on('click', function() {
        var btn = $(this);
        btn.button('loading');

        var frontpage_type =  $('.front-page .btn-group .btn.active').data('type');
        var showActivityFeed = $('.front-page input.showActivityFeed').attr('checked') === 'checked';
        var text;
        if (frontpage_type === 'markdown') {
            text = escape($('.front-page .markdown textarea').val());
        } else if (frontpage_type === 'html') {
            text = escape($('.front-page .html textarea').val());
        } else {
            text = escape($('#frontpage_link_url').val());
        }
        var started = new Date().getTime();
        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/frontpage/settings?type=' + frontpage_type + '&showActivityFeed=' + showActivityFeed + '&text=' + text,
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





    $('#theme .primary').click(function() {
        var btn = $(this);
        btn.button('loading');
        var started = new Date().getTime();
        var params = $('#theme form.a').formParams();
        _.extend(params, $('#theme form.c').formParams());

        var icon_name = $('#brand_img').val().split('\\').pop();
        if (icon_name) {
            params.icon_name = icon_name;
            var height = $('#brand_img_display').height();
            if (height > 25) return alert('your icon is greater than 25px.');
            params.icon_height = height;

            var width = $('#brand_img_display').width();
            params.icon_width = width;

        }

        console.log(params);

        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/navigation/settings?' + $.param(params),
            type: 'PUT',
            success : function(result, textStatus, xmlHttpRequest) {
                if (result == 'update complete') {
                    window.location.reload();
                }
                else alert('update failed');
            },
            error : function() {
            }
        });
        return false;
    })

    $('#host-options .primary').click(function() {
        var btn = $(this);
        btn.button('loading');
        var started = new Date().getTime();
        var params = $('#host-options form').formParams();

        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/host_options/settings?' + $.param(params),
            type: 'PUT',
            success : function(result, textStatus, xmlHttpRequest) {
                if (result !== 'update complete') return alert('update failed');

                // we need to modify to rewrites for all apps based on the settings
                async.parallel({
                    apps : dashboard_core.getAllActiveInstallDocs,
                    settings : dashboard_core.getDashboardSettings,
                    links : getLinks,
                    allDBs : function(cb) {
                        $.couch.allDbs({
                            success: function(data) {
                                cb(null, data);
                            }
                        });
                    }
                }, function(err, results){
                    var link_dbs = dashboard_core.getLinkDBs(results.links);

                    async.series([
                        dashboard_core.clearAllVhosts,
                        function remapVhostsForApps(cb) {
                            if (results.settings.host_options.short_urls && results.settings.host_options.short_app_urls){
                                    var mockStatus = function(){}
                                    async.forEach(results.apps, function(app, for_cb){
                                        link_dbs = _.without(link_dbs, app.doc.installed.db);
                                        dashboard_core.install_app_vhosts(results.settings.host_options, app.doc, mockStatus, for_cb);
                                    }, cb);
                            } else cb()
                        }, function mapOutstandingLinkDBVhosts (cb){
                            if (results.settings.host_options.short_urls && results.settings.host_options.rootDashboard && link_dbs.length > 0) {
                                dashboard_core.setLinkedDBVhosts(results.settings.host_options, link_dbs, cb);
                            } else cb();
                        }, function mapDashboardVhosts(cb) {
                            if (results.settings.host_options.short_urls && results.settings.host_options.rootDashboard) {
                                dashboard_core.setRootDashboardVhosts(results.settings.host_options, cb);
                            } else cb();
                        }
                    ], function(err){
                        window.location.reload();
                    })
                })
            }
        });
        return false;
    })


    function getLinks(callback) {
        $.couch.db(dashboard_db_name).view('dashboard/links_only', {
            success: function(response) {
                callback(null, response.rows);
            }
         });
    }

    function showLinks() {
        getLinks(function(err, links) {
            $('.link-table').append(handlebars.templates['settings-links.html']({links: links}));
            $('.remove-link').on('click', function() {
                var id = $(this).data('id');
                var row = $(this).closest('tr');

                $.couch.db(dashboard_db_name).openDoc(id, {
                    success: function(doc) {
                        $.couch.db(dashboard_db_name).removeDoc(doc, {
                            success: function() {
                                row.remove();
                                window.location.reload();
                            }
                        });
                    }
                });

                return false;

            });
        });
    }

    /**
     *  Expects radio button group to be in a form, one of the input fields
     *  should have a class of `default` to determine which is checked if value
     *  argument is not used.
     *
     *  @param {Jquery} $radios - group of radio buttons
     *  @param {String} value - (optional) value attribute value of radio input
     *  to be checked
     *
     * */
    function setRadioButtons($radios, value) {
        var $form = $radios.closest('form'),
            name = $radios.attr('name');
        $form.find('[name='+name+']').each(function() {
            var $el = $(this);
            if (value && $el.attr('value') === value)
                return $el.prop('checked', true);
            else if (value && $el.attr('value') === value)
                return $el.prop('checked', false);
            if ($el.hasClass('default'))
                $el.prop('checked', true);
            else
                $el.prop('checked', false);
        });
    };

    // update sessions property in settings doc
    function updateSessions(params, callback) {
        $.ajax({
            url :  '_db/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/sessions/settings?' + $.param(params),
            type: 'PUT',
            success : function(result, textStatus, xmlHttpRequest) {
                if (result !== 'update complete')
                    return callback('Update Failed');
                callback();
            },
            error : function() {
                return callback('Update Failed');
            }
        });
    }

    function updateDBConfigValue(options, callback) {
        if (!options || !options.section || !options.property || !options.value)
            return callback('Missing parameters.');
        $.couch.config({
            success: function() { callback() },
            error: function(xhr, status, error) {
                callback(error);
            }
        }, options.section, options.property, options.value);
    };

    function updateDBConfigs(params, callback) {

        var list = [];

        if (!params)
            return callback('Missing parameters.');

        list.push(function(cb) {
            var opts = {
                section:'browserid',
                property:'enabled',
                value: params.login_type == 'browserid' ? 'true' : 'false'
            };
            updateDBConfigValue(opts, cb);
        });
        list.push(function(cb) {
            var opts = {
                section:'couch_httpd_auth',
                property:'require_valid_user',
                value: params.require_valid_user == 'on' ? 'true' : 'false'
            };
            updateDBConfigValue(opts, cb);
        });
        list.push(function(cb) {
            var opts = {
                section:'couch_httpd_auth',
                property:'allow_persistent_cookies',
                value: params.session_persist == 'on' ? 'true' : 'false'
            };
            updateDBConfigValue(opts, cb);
        });
        if (params.session_timeout) {
            list.push(function(cb) {
                var opts = {
                    section:'couch_httpd_auth',
                    property:'timeout',
                    value: params.session_timeout
                };
                updateDBConfigValue(opts, cb);
            });
        }
        async.parallel(list, function(err, results) {
            if (err) return callback(err);
            callback(null, results);
        });
    };

    function validateSessionsForm(callback) {
        // todo
        var $timeout = $('#sessions [name=session_timeout]'),
            timeout_val = parseInt($timeout.val(), 10);
        if (timeout_val < 300) {
            $timeout.parents('.control-group').addClass('error');
            return callback('Timeout value should be 300 or greater.');
        }
        callback();
    }

    $('input[name=type]').on('click', function(){
        var selected = $('input[name=type]:checked').val();
        if (selected == 'internal') {
            $('.internal_session_method').show(300);
            $('.other_session_method').hide(300);
        } else {
            $('.internal_session_method').hide(300);
            $('.other_session_method').show(300);
        }
    });

    $('#sessions [type=reset]').click(function(ev) {
        ev.preventDefault();
        $('.internal_session_method').show(300);
        $('.other_session_method').hide(300);
        setRadioButtons($('#sessions [name=type]'));
    });


    $('#sessions form[name=settings] .btn.primary').click(function(ev) {
        ev.preventDefault();
        var btn = $(this),
            form = $(this).closest('form'),
            params = form.formParams();
        btn.attr('disabled','disabled');
        // special hanlding on some fields
        if (params.type === 'internal') {
            delete params.login_url;
            delete params.login_url_next;
            delete params.profile_url;
            delete params.signup_url;
        }
        function done(err) {
            btn.removeAttr('disabled');
            if (err) return alert(err);
            humane.info('Save Complete');
            form.find('.control-group').removeClass('error');
        }
        validateSessionsForm(function(err) {
            if (err) return done(err);
            updateSessions(params, function(err) {
                if (err) return done(err);
                updateDBConfigs(params, done);
            });
        });
    });

    function showSessions() {

        var isAdmin = false;
        session.info(function(err, data) {
            isAdmin = dashboard_core.isAdmin(data);
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

    function showAdmins() {
        getAdmins(function(admins) {
            var data = {
                admins : admins
            };
            $('.admin-list').html(handlebars.templates['admins.html'](data, {}));
        });


    }

    function getRoles(callback) {

        $.couch.db(dashboard_db_name).view('dashboard/get_roles', {
            include_docs: true,
           success: function(response) {
               callback(response.rows);
           }
        });
    }

    function showRoles() {
        getRoles(function(roles) {
            var data = {
                roles : roles
            }
            $('.role-list').html(handlebars.templates['roles.html'](data, {}));
        });
    }


    function getUsers(callback) {
        $.couch.db('_users').allDocs({
            include_docs: true,
            startkey : 'org.couchdb.user:',
            endkey : 'org.couchdb.user_',
            success: function(response) {
               callback(null, response.rows);
            }
        });
    }


    function showUserDetails(user) {
      user = 'org.couchdb.user:' + user;
      $('.user-list').hide();
      $('.user-details').show();


      async.parallel({
        groups: function(cb) {
          getRoles(function(data){
            var groups = _.map(data, function(row){ return row.key; })
            cb(null, groups);
          });
        },
        appdata: function(cb) {
          couchr.get('_ddoc/_view/user_data', function(err, resp){
            var appdata = _.map(resp.rows, function(row){
               var val = row.value;
               val.id = row.id;
               return val;
            });
            cb(null, appdata);
          });
        }

      }, function(err, data){
        new couchdb_user_editor('./_couch', user, '#user_editor', {
          show_groups: true,
          groups: data.groups,
          appdata: data.appdata
        });
      });



    }


    function showUsers() {

        $('.user-list').show();
        $('.user-details').hide();

        $('#add-user-dialog').on('shown', function(){
           // populate the roles
            configureRolesSelection('#new-user-roles');
            $('.password').val('');
        });


        getAdmins(function(admins) {
           var admins = _.map(admins, function(admin) { return 'org.couchdb.user:' + admin })
           getUsers(function(err, users) {
               var users_pure = [];
               _.each(users, function(user) {
                    if (_.contains(admins, user.id)) return;
                   user.just_name = user.id.substring(17);
                   user.groups = [];
                   _.each(user.doc.roles, function(role) {
                        if (role.indexOf('group.') === 0 ) {
                            user.groups.push(role.substring(6));
                        }
                   });

                   user.safe_id = encodeURIComponent(user.just_name);
                   users_pure.push(user);
               });
               $('.users-list').html(handlebars.templates['users.html'](users_pure, {}));
               $('.help').tooltip({placement: 'bottom'});

               $('#uploadUsers').on('click', function(){
                  $('#fileUploaderUsers').click();
               });

               $('#fileUploaderUsers').on('change', function() {
                  if (this.files.length === 0) return;
                  var reader = new FileReader();
                  reader.onloadend = function(ev) {

                       var json = JSON.parse(ev.target.result),
                           load_count = 0, error_users = [];
                       async.forEach(json, function(user, cb){
                          couchr.put('/_users/' + user._id, user, function(err) {
                              if (err) {
                                 error_users.push(user.name);
                              } else load_count++;
                              cb(null);
                          });
                       }, function(err){
                           if (err) return alert('Error loading: ' + err);
                           var msg = 'Load complete. ' + load_count + ' users loaded. ';
                           if (error_users.length > 0) {
                              msg += 'The following users did not load: ';
                              for (var i = error_users.length - 1; i >= 0; i--) {
                                msg = msg + error_users[i] + ', ';
                              };
                           }
                           alert(msg);
                           window.location.reload();
                       });
                  };
                  reader.readAsText(this.files[0]);
                });

           });
        });
    }



    $('.admin-delete').live('click', function(){
       var me = $(this);
       var name = $(this).data('name');

       if (confirm('Delete user '+name+'?')) {
           users.delete(name, function(err) {
               if (err) return alert('could not delete.' + err);
               me.closest('tr').remove();
           });
       }

    });

    // reset field values on modal cancel
    $('#add-admin-dialog .cancel').on('click', function() {
        resetAdminUserForm();
    });

    $('#add-admin-final').live('click', function(){
        var form = $(this).closest('.modal').find('form'),
            username = $('#admin-name').val(),
            password = $('#admin-password').val();
        if (validateForm(form)) {
            $('#add-admin-dialog').modal('hide');
            users.create(username, password,{roles : ['_admin']}, function(err) {
                if(err) return alert('Cant create admin');
                // admin created
                var data = {
                    admins : [username]
                };
                $('.admin-list').append(handlebars.templates['admins.html'](data, {}));
                resetAdminUserForm();
            })
        } else {
            return false;
        }
    });

    // revert password field to password type if generated password is changed
    $('.password').live('keyup', function(){
        var $this = $(this);

        if ($this.attr('type') === 'text' && $this.val() !== $this.data('generated-password')) {
            // will not work with IE < 9
            $this.prop('type', 'password');
        }
    });

    $('.generate-password').live('click', function(){
        var pass = password(6,false);

        // setting type will not work with IE < 9
        $('.password').val(pass).data('generated-password', pass).prop('type', 'text').trigger('change');

        return false;
    });


    function addUser(){
        var roles = $('#new-user-roles').val();
        roles = _.map(roles, function(role){ return 'group.' + role })
        var password = $('#user-password').val();
        if (password == null || password == '') roles.push('browserid');

        var properties = {
            roles : roles,
            fullname : $('#user-name').val()
        }

        var onCreate = function(err, data) {
            if (err) return console.error(err);
            var just_name = data.id.substring(17),
                groups = _.map(roles, function(role){ return role.replace('group.', '') });
            $('#add-user-dialog').modal('hide');
            resetUserForm();
            $('.users-list').append(
                handlebars.templates['users.html'](
                    [{
                        id: data.id,
                        just_name: just_name,
                        groups: groups
                    }]
                )
            );
        }

        users.create($('#user-email').val(), password, properties, onCreate);
    }

    function resetAdminUserForm() {
        $('#add-admin-dialog').find('form')
            .find("input[type=text], textarea").val("");
    }

    function resetUserForm() {
        $('#add-user-dialog').find('form')
            .find("input[type=text], textarea").val("");
        clearRolesSelection('#new-user-roles');
    }

    function validateForm($form) {
        var $required = $form.find('.required'),
            valid = true;
        $required.each(function(i, el) {
            var $el = $(el);
            if ($el.val())
                return $el.closest('.control-group').removeClass('error');
            $el.closest('.control-group').addClass('error');
            valid = false;
        });
        return valid;
    }

    function validateUserForm() {
        var password = $('#user-password').val(),
            email = $('#user-email').val();
        if (password && email)
            return true;
        if (!password)
            $('#user-password').parents('.control-group').addClass('error');
        else
            $('#user-password').parents('.control-group').removeClass('error');
        if (!email)
            $('#user-email').parents('.control-group').addClass('error');
        else
            $('#user-email').parents('.control-group').removeClass('error');
    }

    $('#add-user-final').live('click', function(){
        if (validateUserForm())
            addUser();
        else
            return false;
    });

    $('#add-user-final-email').live('click', function(){
        if (validateUserForm())
            addUser();
        else
            return false;
    });

    $('#user-email, #user-password, #user-name').live('change', function(){
        var mailto = generateAccountInfoMailto($('#user-email').val(), $('#user-password').val(), $('#user-name').val());
        $('#add-user-final-email').attr('href', mailto);
    });

    function generateAccountInfoMailto(email, password, name) {
        var data = {
            email : email,
            password: password,
            name : name
        }


        data.host = dashboard_links.hostRoot(window.location);
        data.login = data.host + $('#dashboard-topbar-session').data('login');

        var text =  handlebars.templates['accountEmail.txt'](data, {});

        //mailto:someone@example.com?subject=This%20is%20the%20subject&body=This%20is%20the%20body
        var subject = encodeURIComponent("New Account Created");


        return 'mailto:' + email + '?subject=' + subject + '&body=' + encodeURIComponent(text);
    }

    $('.user-delete').live('click', function(){
        var me = $(this);
        var _id = $(this).data('id');
        if (_id.indexOf('org.couchdb.user:') == 0) {
            _id = _id.substring(17);
        }

       if (confirm('Delete user '+_id+'?')) {
            users.delete(_id, function(err){
                if (err) return alert(err);
                me.closest('tr').remove();
                humane.info('user deleted');
            });
       }
       return false;
    });


    $('#add-role-final').live('click', function() {
        var role = {
            type : 'role',
            name : $('#role-name').val()
        };
        $('#add-role-dialog').modal('hide');

        $.couch.db(dashboard_db_name).saveDoc(role, function(){
            role.key = role.name; // to keep the template rigt
            showRoles();
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

    $('a.add-link').on('click', function() {
        $(this).hide();
        $('#add-link').show(600);
        return false;
    });
    $('#add-link-final').on('click', function() {
        var link = $('#add-link').formParams();
        link.type = 'link';

        $.couch.db(dashboard_db_name).saveDoc(link, {
            success: function(response) {
                window.location.reload();
            }
        });

        return false;
    });
    $('#add-link-cancel').on('click', function() {
        $('#add-link').hide();
        $('a.add-link').show();
    });
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

    // remove error classes when controls are focused
    $('.control-group').children().on('focus', function(ev) {
        $(this).parents('.control-group').removeClass('error');
    });

    function showTabByID(id) {
        $('.nav.tabs a[href=#' + id + ']').tab('show');
    }
    function showTab() {
        var url = document.location.toString();
        $('.nav.tabs a[href=#'+url.split('#/')[1]+']').tab('show') ;
    }
    var routes = {

      '/apps/:db' : function(app_id) {
          viewApp(app_id);
      },
      '/apps/:db/settings' : function(app_id) {
            viewAppSettings(app_id);
      },
      '/apps/:db/access' : function(app_id) {
            viewAppAccess(app_id);
      },
      '/apps/:db/actions' : function(app_id) {
              viewAppActions(app_id);
      },
      '/apps'   : function(){
          showApps();
      },
      '/sync' : function(){
          showTab();
          showSync();
      },
      '/frontpage'  : showTab,
      '/theme' : showTab,
      '/host-options' : showTab,
      '/sessions'   : function() {
          showTab();
          showSessions();
      },
      '/admins'     : function(){
          showTab();
          showAdmins();
      },
      '/groups'      : function(){
          showTab();
          showRoles();
      },
      '/links'      : function(){
          showTab();
          showLinks();
      },
      '/ordering'   : function() {
          showTab();
          showOrdering();
      },
      '/users'   : function() {
            showTab();
            showUsers();
      },
      '/users/*'   : function(user) {
          showTabByID('users');
          showUserDetails(user);
      }
    };


    var router = Router(routes);
    router.init('/apps');
})




