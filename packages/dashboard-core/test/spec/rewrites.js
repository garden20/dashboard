var core = require('lib/dashboard_core');
var $ = require('jquery');
var db = require('db').current();


this.rewrites = {
    '_info should returns jsonp with dashboard info': function (test) {
        test.expect(2);
        $.ajax({
          url :  '_info',
          dataType : 'json',
          jsonp : true,
          success : function(remote_data) {
              test.ok(remote_data.dashboard, "Response contains dashboard:true")
              test.ok(remote_data.config, "contains config section")
              test.done();
          },
          error : function() {
              test.ok(false, 'error on request');
              test.done();
          }
        });

    }
};