define('dashboard-data', function () {

    // this module is used when loaded from appCache

    var DATA = {databases: []};

    // Feature test (from Modernizr)
    var hasStorage = (function() {
        try {
            localStorage.setItem('dashboard-test', 'dashboard-test');
            localStorage.removeItem('dashboard-test');
            return true;
        } catch(e) {
            return false;
        }
    }());

    if (hasStorage) {
        DATA.databases = JSON.parse(
            localStorage.getItem('dashboard-databases')
        );
    }

    return DATA;

});
