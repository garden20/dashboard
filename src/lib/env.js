define(['exports'], function (exports) {

    // Feature test (from Modernizr)
    exports.hasStorage = (function() {
        try {
            localStorage.setItem('dashboard-test', 'dashboard-test');
            localStorage.removeItem('dashboard-test');
            return true;
        } catch(e) {
            return false;
        }
    }());

});
