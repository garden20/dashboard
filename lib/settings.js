exports.defaultSettings = {
    frontpage : {
        use_markdown : true,
        use_html : false,
        show_activity_feed : true,
        markdown : "## Welcome to your Garden\n\n- hello\n- there\n\nWe are united"
    },
    host_options : {
        short_urls : true,
        hostnames : 'http://localhost:5984',
        short_app_urls : true,
        rootDashboard : false,
        login_type: 'local',
        redirect_frontpage_on_anon : false
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
        admin_show_futon : true
    }
};