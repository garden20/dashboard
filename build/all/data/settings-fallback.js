define('data/settings', ['lib/env'], function (env) {

    // this module is used when loaded from appCache

    if (env.hasStorage) {
        return JSON.parse(
            localStorage.getItem('dashboard-settings')
        );
    }

    return null;

});
