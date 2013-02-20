var assert = require("assert"),
    requireMock = require("requiremock")(__filename);

var garden_dashboard_core = require("../garden-dashboard-core.js"),
    dashboard = new garden_dashboard_core('http://localhost:5984/pouch');



describe('starts', function(){
    it('with the init', function(done){
        dashboard.init(function(err){
            assert.ifError(err);
            done();
        });
    });
});


describe('syncs', function(){
    it('syncs', function(done){
        this.timeout(50000);
        dashboard.sync(function(err){
            assert.ifError(err);
            done();
        });
    });
});


describe('lists all assets', function(){
    it('syncs', function(done){
        dashboard.allAssets(function(err2, res){
            done();
        });
    });
});



describe('lists topbar', function(){
    it('syncs', function(done){
        dashboard.topbar(function(err, details){
            assert.ifError(err);
            done();
        });
    });
});


describe('gets settings', function(){
    it('gives an empty object of settings does not exist', function(done) {
        dashboard.settings(function(err, settings){
            assert.ifError(err);
            done();
        });
    });
});