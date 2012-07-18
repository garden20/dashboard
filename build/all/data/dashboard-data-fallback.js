define('data/dashboard-data', ['lib/env'], function (env) {

    // this module is used when loaded from appCache

    var DATA = {projects: []};

    if (env.hasStorage) {
        DATA.projects = JSON.parse(
            localStorage.getItem('dashboard-projects')
        );
    }

    return DATA;

});
