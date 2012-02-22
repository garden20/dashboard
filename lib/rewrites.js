/**
 * Rewrite settings to be exported from the design doc
 * {from: '/*', to: '../../../*', query : {base_url : '*'}}
 */

module.exports = [

    {from: '/_couch', to: '../../../'},
    {from: '/_couch/', to: '../../../'},
    {from: '/_couch/*', to: '../../../*'},
    {from: '/_config', to : '../../../_config'},
    {from: '/_config/*', to : '../../../_config/*'},
    {from: '/_db/*', to : '../../*'},
    {from: '/_db', to : '../../'},
    {from: '/static/*', to: 'static/*'},
    {from: '/install', to: '_show/install'},
    {from: '/', to: 'index.html'},
    {from: '/apps', to: '_show/redirectRoot'},
    {from: '/_info', to: '_show/configInfo/_design/dashboard'},

    {from: '/kanso-topbar/*', to: '/kanso-topbar/*'},
    {from: '/modules.js', to: 'modules.js'}
];
