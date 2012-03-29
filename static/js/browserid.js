$(function(){
    $.couch.browserid.login(function(event, error, user) {
      if(error)
        return console.log("Something went wrong with login: " + error);

        var dashboard_url = $('#browserid').data('dashboardurl');
        window.location = dashboard_url;
    });

})