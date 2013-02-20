(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_default_settings = factory();
    }
}(this, function () {

return {
    frontpage : {
        use_markdown : true,
        use_html : false,
        show_activity_feed : false,
        markdown : "## Welcome to your Garden\n\nHere are some things you might want to do:\n\n- [Configure](./settings#/frontpage) this front page.\n- [Install](./install) some apps.\n- [Sync](./settings#/sync) with another garden.\n\n\n\n"
    },
    host_options : {
        short_urls : false,
        hostnames : 'http://localhost:5984,http://0.0.0.0:5985',
        short_app_urls : true,
        rootDashboard : false,
        hosted : false,
        login_type : 'local'

    },
    top_nav_bar : {
        bg_color : '#1D1D1D',
        link_color : '#BFBFBF',
        active_link_color : '#FFFFFF',
        active_link_bg_color : '#000000',
        active_bar_color : '#bd0000',
        show_brand : false,
        icon_name : null,
        brand_link : null,
        show_gravatar : true,
        show_username : true,
        notification_theme: 'libnotify',
        admin_show_futon : false
    },
    sessions : {
        type : 'internal',
        internal : {
            login_type: 'local',
            redirect_frontpage_on_anon : false
        },
        other : {
            login_url : '/users/_design/users-default/_rewrite/#/login',
            login_url_next : '/users/_design/users-default/_rewrite/#/login/{next}',
            signup_url : '/users/_design/users-default/_rewrite/#/signup',
            profile_url : '/users/_design/users-default/_rewrite/#/profile/{username}'
        }
    }
};



}));