/**
 * topbar.js
 *
 * Used to get page navigation for garden apps.
 *
 */

(function() {

var have_jquery = function(){

    var baseStyleSheet = "/dashboard/_design/dashboard/_rewrite/_topbar.css";
    var baseJavascript = "/dashboard/_design/dashboard/_rewrite/static/js/topbar.js";

    loadStyleSheet();
    // there are some timing issues on pages if loaded directly. We load after a brief timeout.
    setTimeout(loadTopbar, 10);




    function loadStyleSheet() {

        if (!doesPageHaveStyleSheet() )  {
            var toload = baseStyleSheet;
            var styleSheetParams = findScriptToStyleSheetParams();
            if (styleSheetParams) toload += '?' + styleSheetParams;

            $('head').append('<link rel="stylesheet" type="text/css" href="'+ toload +'" />');
        }
    }

    function findScriptToStyleSheetParams() {
        var links = $('script');
        var result = '';
        $.each(links, function(i, script){
            var src = $(script).attr('src');
            if (src && src.indexOf(baseJavascript) == 0) {
                var param =  src.split('?')[1];
                if (param) result = param;
            }
        });
        return result;
    }


    function doesPageHaveStyleSheet() {
        var hasStyleSheet = false;
        var links = $('link');
        $.each(links, function(i, link){
            var href = $(link).attr('href');
            if (href.indexOf(baseStyleSheet) == 0) {
                hasStyleSheet = true
            }
        });
        return hasStyleSheet;
    }

    function loadTopbar () {
        var $topbar = $('#dashboard-topbar');
        if ($topbar.length === 0) {
            $topbar = $('<div id="dashboard-topbar"></div>');
            $('body').prepend($topbar);
        }
        var path = window.location.pathname;

        // only cache bust if there is no cookie
        var bust = '';
        var last_cache = readCookie('last-dashboard-cache');
        if (!last_cache) {
            var date = new Date().getTime();
            bust = '?d=' + date;
            createCookie('last-dashboard-cache', date);
        } else {
            bust = '?d=' + last_cache;
        }
        $topbar.load('/dashboard/_design/dashboard/_rewrite/_topbar' + bust, function() {
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
                        link.addClass('active')
                    }
                } else {
                    if (path.indexOf(href) == 0) {
                        $(this).addClass('active');
                        link.addClass('active');
                    }
                    addNotLoggedInHack(link);
                }
            });

            $('#dashboard-topbar a').each(function(){
                var $a = $(this);
                var href = $a.attr('href');
                if ((path.indexOf(href) == 0) && ($a.data('remote_user_warn')) ){
                    var remote_user = $a.data('remote_user')
                    setTimeout(function(){
                        if(confirm('Warning: The recommended user for this db is '+remote_user+'. Do you want to login as that user?')) {
                            window.location = $('#dashboard-topbar-session').data('login') + "?redirect=" + encodeURIComponent(window.location) + '&user=' + encodeURIComponent(remote_user);
                        }
                    }, 10)
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

            $('#dashboard-more-apps a').each(function(){
                var link = $(this);
                addNotLoggedInHack(link);
            });

            $('#dashboard-topbar .username').click(function() {
                $('#dashboard-profile').toggle();
                $(document).one('click', function() {
                    $('#dashboard-profile').hide();
                });
                return false;
            });

            $('#dashboard-topbar .logout').click(logout);

            var login_base = $('#dashboard-topbar .login').attr('href');
            var full_login = login_base + "?redirect=" + encodeURIComponent(window.location);

            var sessionType = $('#dashboard-topbar-session').data('sessiontype')
            if (sessionType == 'other') {
                full_login = login_base +  "/" + encodeURIComponent(window.location);
            }

            $('#dashboard-topbar .login').attr('href', full_login);

            try {
                var userCtx = JSON.parse(decodeURI( $('#dashboard-topbar-session').data('userctx') ));
                var session = require('session');
                session.emit('change', userCtx);
            } catch(ignore){}

            // if we are on the login, set the class to active
            var fullPath = path + window.location.hash;
            if (fullPath.indexOf(login_base) == 0) {
                $('#dashboard-topbar-session').addClass('active');
                // add active to any ul
                $('#dashboard-topbar-session').find('ul li:first').addClass('active');
            }

            $('#dashboard-topbar').data('ready', true);
            $('#dashboard-topbar').trigger('ready');

        });

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
                $.ajax({ url : '/dashboard/_design/dashboard/_rewrite/_couch/' + db
                     , type: 'HEAD'
                     , async: false
                     , success: function(data){
                            pass = true;
                     }
                     , error  : function() {
                         pass = false;
                         humane.error('Access Denied.');
                     }

                 });
                return pass;

            });
        }
    }

    function logout(ev) {
        var proto = window.location.protocol,
            host = window.location.host,
            path = '/dashboard/_design/dashboard/_rewrite/_couch/_session',
            url = proto + '//' + '_:_@' + host + path;
        $.ajax({ url : url
         , type: 'DELETE'
         , dataType: 'json'
         , success: function(){
                eraseCookie('last-dashboard-cache');
                var isOkToReload = checkLogoutDestination();
                if (isOkToReload) {
                    window.location.reload();
                } else {
                    window.location = $('#dashboard-topbar-session').data('login');
                }


            }
         , error: function(xhr, status, error) {
                alert('Error logging out: ' + error);
           }
         });
        return false;
    }

    function checkLogoutDestination() {
        var pass;
        $.ajax({ url : window.location
             , type: 'HEAD'
             , async: false
             , success: function(data){
                    pass = true;
             }
             , error  : function() {
                 pass = false;
             }

         });
        return pass;
    }

    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
        else var expires = "";



        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, "", -1);
    }
}

function load_script(s) {
    var head = document.getElementsByTagName("head")[0] || document.documentElement;
    var script = document.createElement("script");
    if ( s.scriptCharset ) {
        script.charset = s.scriptCharset;
    }
    script.src = s.url;

    // Handle Script loading
        var done = false;

    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function() {
        if ( !done && (!this.readyState ||
                this.readyState === "loaded" || this.readyState === "complete") ) {
            done = true;
            // Handle memory leak in IE
            script.onload = script.onreadystatechange = null;
            if ( head && script.parentNode ) {
                head.removeChild( script );
            }
            if (s.callback) s.callback();
        }
    };

    // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
    // This arises when a base node is used (#2709 and #4378).
    head.insertBefore( script, head.firstChild );
}


/*
 *  Ensure the page has jquery
 */
if (window.$ === undefined) {
    if (window.require) {
        $ = window.require('jquery');
        $(have_jquery);
    } else {
        load_script({
            url : '/_utils/script/jquery.js',
            callback : function(){
                $(have_jquery);
            }
        })
    }
} else {
    $(have_jquery);
}


})();
/**
 * humane.js
 * Humanized Messages for Notifications
 * @author Marc Harter (@wavded)
 * @example
 *   humane('hello world');
 * See more usage examples at: http://wavded.github.com/humane-js/
 */(function(a,b){function t(a){return n?n+a:a.toLowerCase()}function u(b,c){return p.instance[c]!==void 0?p.instance[c]:a.humane[c]}function v(){j=b.createElement("div"),j.id="humane",j.className="humane",b.body.appendChild(j);for(vendor in m)vendor+"TransitionProperty"in j.style&&(n=m[vendor],h=!0);h||(x=B),o=!0,w()}function w(){if(i)return;if(!s.length)return;after=null,i=!0,k&&(clearTimeout(k),k=null);var a=s.shift();p={type:a[0],message:a[1],instance:a[2],callback:a[3]};var c=p.message,e=p.type;u(e,"clickToClose")===!0&&(d(j,"click",y),d(j,"touchstart",y));var h=u(e,"timeout");h>0&&(k=setTimeout(function(){g||(d(b.body,"mousemove",y),d(b.body,"click",y),d(b.body,"keypress",y),d(b.body,"touchstart",y),g=!0,u(e,"waitForMove")!==!0&&y())},h)),r.show(e,c,"show"),f(c)&&(c="<ul><li>"+c.join("<li>")+"</ul>"),j.innerHTML=c,j.style.display="block",setTimeout(function(){x(1,e)},50)}function x(a,b){a===1?j.className="humane humane-"+b+" humane-animate":(j.className=j.className.replace(" humane-animate",""),d(j,t("TransitionEnd"),z))}function y(){e(b.body,"mousemove",y),e(b.body,"click",y),e(b.body,"keypress",y),e(b.body,"touchstart",y),e(j,"click",y),e(j,"touchstart",y),g=!1,i&&x(0)}function z(){h&&e(j,t("TransitionEnd"),z),i=!1,p.callback&&p.callback(),r.hide(p.type,p.message,"hide"),j.style.display="none",w()}function B(a,b){var c,d;a===1?(d=0,j.className="humane humane-js-animate humane-"+b,l&&A(0),j.style.zIndex=1e6,c=setInterval(function(){d<1?(d+=.1,d>1&&(d=1),A(d)):clearInterval(c)},5)):(d=1,c=setInterval(function(){d>0?(d-=.1,d<0&&(d=0),A(d)):(j.className=j.className.replace(" humane-js-animate",""),j.style.zIndex=-1,clearInterval(c),z())},5))}function C(a){return function b(c,d){s.push([a,c,b,d]),r.add(a,c,"add"),o&&w()}}var c,d,e,f,g=!1,h=!1,i=!1,j=null,k=null,l=/msie [678]/i.test(navigator.userAgent),m={Webkit:"webkit",Moz:"",O:"o",ms:"MS"},n="",o=!1,p={},q=function(){},r={add:q,show:q,hide:q},s=[];"addEventListener"in a?(d=function(a,b,c){a.addEventListener(b,c,!1)},e=function(a,b,c){a.removeEventListener(b,c,!1)}):(d=function(a,b,c){a.attachEvent("on"+b,c)},e=function(a,b,c){a.detachEvent("on"+b,c)}),f=Array.isArray||function(a){return Object.prototype.toString.call(a)==="[object Array]"},d(a,"load",v);var A=l?function(a){j.filters.item("DXImageTransform.Microsoft.Alpha").Opacity=a*100}:function(a){j.style.opacity=String(a)};c=C("log"),c.log=C("log"),c.error=C("error"),c.info=C("info"),c.success=C("success"),c.remove=y,c.create=function(a){var b=C(a.type||"log");return b.timeout=a.timeout||2500,b.waitForMove=a.waitForMove||!1,b.clickToClose=a.clickToClose||!1,b},c.timeout=2500,c.waitForMove=!1,c.clickToClose=!1,c.on=function(a,b){r[a]=b},a.humane=c})(window,document);

humane.clickToClose = true;
humane.timeout = 1000;
