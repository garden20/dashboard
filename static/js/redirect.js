(function() {



    var l = $('#redirect_location').attr('href');
    if (checkDestination(l)) {
        window.location = l;
    } else {
        $('.redirecting_msg').hide();
        $('.fail_access').show();
    }


    function checkDestination(dest) {
        var pass;
        $.ajax({
            url : dest,
            type: 'HEAD',
            async: false,
            success: function(data){
                pass = true;
            },
            error  : function() {
                pass = false;
            }
         });
        return pass;
    }


})();