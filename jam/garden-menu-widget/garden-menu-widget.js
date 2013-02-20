(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('url'), require('garden-menu'));
    } else if (typeof define === 'function' && define.amd) {
        define(['url', 'garden-menu', 'jscss', './garden-menu-widget.css.js', 'modernizer', 'sync-status-icon', 'svg'],factory);
    } else {
        root.garden_menu_widget = factory(
            root.url, root.garden_menu, root.jscss, root.garden_menu_widget_css, root.Modernizr, root.svg,
            root.SyncIcon, root.JST["templates/topbar.underscore"], root.JST["templates/profile.underscore"]);
    }
}(this, function (url, GardenMenu, jscss, css, Modernizr, svg, SyncIcon, topbar_t, profile_t) {


var app = function(dashboard_db_url) {
    this.dashboard_db_url = dashboard_db_url;

    var options = {
        disablePouch: true
    };
    if (Modernizr.indexeddb || Modernizr.websqldatabase) {
        options.disablePouch = false;
    }

    // also check version
    if (bowser.firefox && bowser.version < 12) {
        options.disablePouch= true;
    }
    if (bowser.opera && bowser.version < 12) {
        options.disablePouch= true;
    }
    if (bowser.chrome && bowser.version < 19) {
        options.disablePouch= true;
    }
    if (bowser.safari && bowser.version <= 5) {
        options.disablePouch= true;
    }
    if (bowser.iphone && bowser.version <= 5) {
        options.disablePouch= true;
    }

    this.garden_menu = new GardenMenu(dashboard_db_url, options);
};


app.prototype.init = function(callback) {
    var widget = this;
    widget.last_state = null;
    widget.garden_menu.init(function(err, results){


        widget.core = results.core;
        widget.garden_menu.getAppLinks(function(err, links){

            if (err) return callback(err);
            widget.loadTopbar(links, function(err){

                widget.cachedLinks = links;
                widget.core.getCachedSession(function(err, session){
                    widget.last_user = session.userCtx.name;
                    widget.showSession(session);
                });

                widget.poll_interval = setInterval(function() { widget.poll(); }, 5000);
                callback(err);
            });
        });
    });
};


app.prototype.poll = function() {
    this.core.poll();
};

app.prototype.loadTopbar = function(data, callback) {
    var me = this;

    // check for other styles
    jscss.embed(jscss.compile(css));


    var $topbar = $('#dashboard-topbar');
    if ($topbar.length === 0) {
        $topbar = $('<div id="dashboard-topbar"></div>');
        $('body').prepend($topbar);
    }


    $topbar.html(topbar_t(data));
    var path = window.location.pathname;

    // highlight the best thing
    var dash = $topbar.find('a.home').attr('href');
    if (dash == path)  $topbar.find('a.home').addClass('active');

    var login = $topbar.find('#dashboard-topbar-session a').attr('href');
    if (login == path)  $topbar.find('#dashboard-topbar-session').addClass('active');


    $('#dashboard-topbar ul.kanso-nav li').each(function(i) {
        var link = $(this).find('a');
        var href = link.attr('href');
        if ($(this).hasClass('home')) {
            if (href == path){
                $(this).addClass('active');
                link.addClass('active');
            }
        } else {
            if (path.indexOf(href) === 0) {
                $(this).addClass('active');
                link.addClass('active');
            }
            addNotLoggedInHack(link);
        }
    });

    $('#dashboard-topbar a').each(function(){
        var $a = $(this);
        var href = $a.attr('href');
        if ((path.indexOf(href) === 0 ) && ($a.data('remote_user_warn')) ){
            var remote_user = $a.data('remote_user');
            setTimeout(function(){
                if(confirm('Warning: The recommended user for this db is '+remote_user+'. Do you want to login as that user?')) {
                    window.location = $('#dashboard-topbar-session').data('login') + "?redirect=" + encodeURIComponent(window.location) + '&user=' + encodeURIComponent(remote_user);
                }
            }, 10);
        }
    });

    $('#dashboard-topbar .more-apps').click(function(){
        var me = $(this);
        var menu = $('#dashboard-more-apps');

        var left = me.position().left;
        menu.css('left', left + 'px').toggle(0, function(){
            if (menu.is(':visible')) me.addClass('dashboard-menu-highlight');
            else me.removeClass('dashboard-menu-highlight');
        });
        $(document).one('click', function() {
            me.removeClass('dashboard-menu-highlight');
            $('#dashboard-more-apps').hide();
        });
        return false;
    });


    $('#dashboard-topbar .username').click(function() {
        $('#dashboard-profile').toggle();
        $(document).one('click', function() {
            $('#dashboard-profile').hide();
        });
        return false;
    });

    $('#dashboard-topbar .logout').click(logout);

    $('#dashboard-topbar').data('ready', true);
    $('#dashboard-topbar').trigger('ready');

    me.sync_icon = new SyncIcon('dashboard-topbar-offline-icon', {
        size: 21,
        state: mapCoreStatesToDisplay(me.core.getState())
    });



    me.core.bind(function(event, old_state, new_state) {
        // filter some chaff
        if ((old_state !== 'FIRST_VISIT' && new_state !=='FIRST_VISIT') && (me.last_state === new_state)) return;


        // show the sync state
        var display_state = mapCoreStatesToDisplay(new_state);
        if (new_state === 'FIRST_VISIT' && me.sync_icon.getState() === 'syncing') {
            // not sure... for now do nothing...
        } else {
            me.sync_icon[display_state]();
        }

        me.core.getCachedSession(function(err, session){
            if (session.userCtx.name === me.last_user) return;
            me.showSession(session);
            me.last_user = session.userCtx.name;
        });


        me.last_state = new_state;
    });


    me.sync_icon.click(function(){
        var state = me.core.getState();
        if (state === 'FIRST_VISIT') {
            me.sync_icon.syncing();
            me.core.sync();
        }
    });

    callback(null);
};


app.prototype.showSession = function(session) {


    session.is_user = (session.userCtx.name || false);

    session.displayName = session.userCtx.name;
    session.login_url = this.cachedLinks.login_url;

    session.login_url = session.login_url + "?redirect=" + encodeURIComponent(window.location);

    $('#dashboard-profile').html(profile_t(session));
};



function mapCoreStatesToDisplay(core_state) {
        if (core_state === 'FIRST_VISIT') return "disabled";
        if (core_state === 'OFFLINE_NO_HOPE') return "disabled";
        if (core_state === 'READY_LOCAL_DB_UNSUPPORTED') return "disabled";
        if (core_state === 'OFFLINE_WITH_USER') return "offline";
        if (core_state === 'OFFLINE_WITHOUT_USER') return "offline";
        if (core_state === 'ONLINE_WITH_USER') return "online";
        if (core_state === 'ONLINE_WITHOUT_USER') return "online";
}


function logout() {
    $.ajax({
        url : '/dashboard/_design/dashboard/_rewrite/_couch/_session',
        type: 'DELETE',
        dataType: 'json',
        success: function(){
            var isOkToReload = checkLogoutDestination();
            if (isOkToReload) {
                window.location.reload();
            } else {
                window.location = $('#dashboard-topbar-session').data('login');
            }
        },
        error  : function() {
            alert('error loging out.');
        }
     });
    return false;
}


function checkLogoutDestination() {
    var pass;
    $.ajax({
        url : window.location,
        type: 'HEAD',
        async: false,
        success: function(data){
            pass = true;
        },
        error  : function() {
            pass = false;
        }

    });
    return pass;
}

/**
 *  does a head check to the db. before allowing the link to pass.
 * This double checks the user can login to the link.
 * THis is to prevent the dreaded json error.
 * @param link
 */
function addNotLoggedInHack(link) {
    var db = link.data('db');
    if (db) {
        $(link).bind('click', function(){
           $(this).removeClass('hover');
            var pass;
            $.ajax({
                url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db,
                 type: 'HEAD',
                 dataType: 'json',
                 async: false,
                 success: function(data){
                        pass = true;
                 },
                 error  : function() {
                    pass = false;
                    humane.error('Access Denied.');
                 }

             });
            return pass;

        });
    }
}



var offline_path = "M30.66554752,1.06327272C15.94942252,1.4410638199999999,2.67904052,13.81563802,1.28828452,28.48040802C-0.5069144800000001,42.39397402,8.504418520000002,56.82919702,21.84619652,61.23814702C35.07606852,66.06837902,51.20899352,60.38447702,58.39769252,48.242122020000004C66.24072452,35.93774102,63.66730352,18.15905002,52.444152519999996,8.75370002C46.52340152,3.51029022,38.560980519999994,0.73151612,30.66554752,1.06327272C30.66554752,1.06327272,30.66554752,1.06327272,30.66554752,1.06327272M32.38429752,10.15702302C40.72049052,10.074793020000001,49.451892519999994,14.83554902,52.22042552,23.01319002C52.50241952,24.71563202,55.12413752,28.96646602,51.821710519999996,28.18827302C48.80090652,28.18827302,45.780101519999995,28.18827302,42.75929752,28.18827302C42.75929752,30.61535602,42.75929752,33.04244002,42.75929752,35.46952302C46.38429752,35.46952302,50.00929752,35.46952302,53.63429752,35.46952302C52.80011552,42.98521802,47.764895519999996,50.11948802,40.41155851999999,52.43999502C32.140354519999995,55.23751602,22.072753519999996,53.890492019999996,15.840880519999995,47.42335402C12.594645519999995,44.21836502,10.971735519999996,39.739303019999994,10.446797519999995,35.28202302C13.915547519999995,35.28202302,17.384297519999993,35.28202302,20.853047519999993,35.28202302C20.853047519999993,32.854940019999994,20.853047519999993,30.427856019999997,20.853047519999993,28.000773019999997C17.415547519999993,28.000773019999997,13.978047519999993,28.000773019999997,10.540547519999993,28.000773019999997C11.475895519999993,20.89611402,16.129901519999994,14.137505019999997,23.067131519999993,11.790908019999996C26.032790519999992,10.664815019999995,29.214289519999994,10.124076019999997,32.38429751999999,10.157023019999997C32.38429751999999,10.157023019999997,32.38429752,10.15702302,32.38429752,10.15702302M20.94679752,18.84452302C20.94679752,27.54244002,20.94679752,36.24035602,20.94679752,44.93827302C23.17596452,44.93827302,25.40513052,44.93827302,27.63429752,44.93827302C27.63429752,36.24035601999999,27.63429752,27.542440019999997,27.63429752,18.844523019999997C25.40513052,18.844523019999997,23.17596452,18.844523019999997,20.94679752,18.844523019999997C20.94679752,18.844523019999997,20.94679752,18.84452302,20.94679752,18.84452302M35.97804752,19.18827302C35.97804752,27.88619002,35.97804752,36.58410602,35.97804752,45.28202302C38.207214519999994,45.28202302,40.43638051999999,45.28202302,42.66554752,45.28202302C42.66554752,36.58410601999999,42.66554752,27.886190019999997,42.66554752,19.188273019999997C40.43638052,19.188273019999997,38.20721452,19.188273019999997,35.97804752,19.188273019999997C35.97804752,19.188273019999997,35.97804752,19.18827302,35.97804752,19.18827302";
var online_bars_path ="M-7.2727275,54.781471C-7.2727275,54.781471,-8.8503233,54.781471,-8.8503233,54.781471C-8.8503233,54.781471,-8.8503233,52.267212,-8.8503233,52.267212C-8.8503233,52.267212,-7.272727499999999,52.267212,-7.272727499999999,52.267212C-7.272727499999999,52.267212,-7.2727275,54.781471,-7.2727275,54.781471 M-9.6861906,54.780155C-9.6861906,54.780155,-11.263786,54.780155,-11.263786,54.780155C-11.263786,54.780155,-11.263786,52.265896,-11.263786,52.265896C-11.263786,52.265896,-9.6861906,52.265896,-9.6861906,52.265896C-9.6861906,52.265896,-9.6861906,54.780155,-9.6861906,54.780155 M-12.035547,54.779095C-12.035547,54.779095,-13.613142999999999,54.779095,-13.613142999999999,54.779095C-13.613142999999999,54.779095,-13.613142999999999,52.264835,-13.613142999999999,52.264835C-13.613142999999999,52.264835,-12.035547,52.264835,-12.035547,52.264835C-12.035547,52.264835,-12.035547,54.779095,-12.035547,54.779095";

return app;

}));