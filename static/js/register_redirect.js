var dashboard_core = require('lib/dashboard_core');


$(function(){
    $('.fixit').on('click', function(){
        var route =  $('#route').val() ;
        var to =  $('#to').val() ;


        var url = '/dashboard/_design/'+ dashboard_core.dashboard_ddoc_name +'/_update/addRedirect/redirect_assets?route=' + encodeURIComponent(route) + '&to=' + encodeURIComponent(to)
        $.ajax({
            url : url ,
            type: 'PUT',
            success : function(result) {
                if (result == 'update complete') {
                    window.location.reload();
                }
                else alert('Adding rule failed');

            },
            error : function() {
                alert('Adding rule failed');
            }
        });
        return false;

    });
});