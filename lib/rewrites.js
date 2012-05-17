var dashboard_rewrites = require('lib/dashboard_rewrites');
var base_rewrites = dashboard_rewrites.getNeededRewrties('dashboard');

base_rewrites.push([
    {from: '/static/*', to: 'static/*'},
    {from: '/install', to: '_show/install/settings'},
    {from: '/', to: '_show/frontpage/settings'},
    {from: '/login', to: '_show/login/settings'},
    {from: '/settings', to: '_show/settings/settings'},
    {from: '/redirect/:path', to : '_list/redirect/redirect_assets', query : { path : ':path' }  },
    {from: '/redirect/:path1/:path2', to : '_list/redirect/redirect_assets', query : { path : [':path1', '/', ':path2']  }  },

    {from: '/redirect2', to : '_list/redirect2/redirect_assets'  },

    {from: '/_info', to: '_show/configInfo/_design/dashboard'},
    {from: '/_topbar', to: '_list/topbar/dashboard_assets', query: {include_docs : 'true'} },
    {from: '/_topbar.css', to: '_show/topbar_css/settings'},
    {from: '/_img/*', to: 'static/img/*'},
    {from: '/modules.js', to: 'modules.js'}
]);
module.exports = base_rewrites;
