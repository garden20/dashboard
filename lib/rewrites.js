var dashboard_rewrites = require('lib/dashboard_rewrites');
var base_rewrites = dashboard_rewrites.getNeededRewrties('dashboard');

base_rewrites.push([
    {from: '/static/*', to: 'static/*'},
    {from: '/install', to: '_show/install/settings'},
    {from: '/', to: '_show/frontpage/settings'},
    {from: '/login', to: '_show/login/settings'},
    {from: '/settings', to: '_show/settings/settings'},
    {from: '/redirect/:path', to : '_show/redirect/redirect_assets', query : { path : ':path' }  },
    {from: '/redirect/:path1/:path2', to : '_show/redirect/redirect_assets', query : { path : [':path1', '/', ':path2']  }  },
    {from: '/redirect/:path1/:path2/:path3', to : '_show/redirect/redirect_assets', query : { path : [':path1', '/', ':path2', '/', ':path3']  }  },

    {from: '/_info', to: '_show/configInfo/_design/dashboard'},
    {from: '/_topbar', to: '_list/topbar/dashboard_assets', query: {include_docs : 'true'} },
    {from: '/_topbar.css', to: '_list/topbar_css/selected_theme', query: {include_docs : 'true'} },
    {from: '/dashboard.appcache', to: '_list/cache_manifest/cache_manifest' },
    {from: '/_img/*', to: 'static/img/*'},
    {from: '/modules.js', to: 'modules.js'},
    {from: '/browserid', to: '../../../browserid'},
    {from: '/browserid/*', to: '../../../browserid/*'},
]);
module.exports = base_rewrites;
