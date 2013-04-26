var assert = require("assert"),
    couchr = require('couchr'),
    requireMock = require("requiremock")(__filename);

var couchrMock = {
    test: true,
    post: function(url, data, callback) {}
};

requireMock.mock("couchr", couchrMock);
var pico_couch_ddoc = requireMock("../pico-couch-ddoc.js");

describe('design docs', function(){
    it('should make a design doc with a map function', function(){
        var view = {
            map: function(doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});}
        };
        var ddoc = pico_couch_ddoc.simple_ddoc('gardener', view);
        assert.equal(ddoc.views.gardener.map, "function (doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});}");
        assert(ddoc._id, '_design/gardener');
    });

    it('should make a design doc with a map/reduce (str) function', function(){
        var view = {
            map: function(doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});},
            reduce: '_sum'
        };
        var ddoc = pico_couch_ddoc.simple_ddoc('gardener', view);
        assert.equal(ddoc.views.gardener.map, "function (doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});}");
        assert.equal(ddoc.views.gardener.reduce, '_sum');
        assert(ddoc._id, '_design/gardener');
    });


    it('should make a design doc with a map/reduce function', function(){
        var view = {
            map: function(doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});},
            reduce: function(keys, values) { return sum(values); }
        };
        var ddoc = pico_couch_ddoc.simple_ddoc('gardener', view);
        assert.equal(ddoc.views.gardener.map, "function (doc) {if (doc.type !== 'gardener_progress') return;emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg});}");
        assert.equal(ddoc.views.gardener.reduce, 'function (keys, values) { return sum(values); }');
        assert(ddoc._id, '_design/gardener');
    });

});


describe('ddoc equality', function(){
    it('should be equal even with _rev', function(){
        var a = {
            _rev: '2121232233'
        }, b = {

        };
        assert.ok(pico_couch_ddoc.equal(a, b));
    });
    it('should be check views', function(){
        var a = {
            _rev: '2121232233',
            views: {
                map: 'function(doc) { emit(doc.id, null) }'
            }
        }, b = {
            views: {
                map: 'function(doc) { emit(doc.id, null) }'
            }
        };
        assert.ok(pico_couch_ddoc.equal(a, b));
    });

    it('should be check views for differences', function(){
        var a = {
            _rev: '2121232233',
            views: {
                map: 'function(doc) { emit(doc.id, null) }'
            }
        }, b = {
            views: {
                map: 'function(doc) { emit(doc.id, 1) }'
            }
        };
        assert.ok(! pico_couch_ddoc.equal(a, b));
    });


});





