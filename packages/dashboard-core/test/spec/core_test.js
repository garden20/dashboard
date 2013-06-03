var core = require('lib/dashboard_core');
var db = require('db').current();


core.dashboard_db_name = guessCurrent().db;
console.log('db: ' + core.dashboard_db_name );
core.dashboard_ddoc_name = 'dashboard-core-test';

this.core_test = {};

core_test.installed_apps = {
    setUp : function (callback) {
        var app_doc = {"_id":"c21e4a0225f4e224381023f4190d258d","kanso":{"config":{"name":"wiki","version":"0.0.1","description":"A general-purpose wiki for CouchDB","long_description":"A wiki is a website created by its users. It allows any user to make additions or changes to the site, and can help to keep content up-to-date and relevant.\n\nUsed by the Kanso project for documentation, this Wiki uses an extended version of Markdown for editing pages and features syntax highlighting and page history. Edit's can be attributed to a user and their changes to a page highlighted.","url":"https://github.com/kanso/wiki","categories":["productivity"],"attachments":["icons","images"],"icons":{"16":"icons/wiki_icon_16.png","48":"icons/wiki_icon_48.png","96":"icons/wiki_icon_96.png","128":"icons/wiki_icon_128.png"},"promo_images":{"small":"images/promo_small.png"},"screenshots":["images/screenshot1.png","images/screenshot2.png","images/screenshot3.png"],"dependencies":{"wiki-core":null,"wiki-theme-default":null,"attachments":null},"minify":false},"build_time":"2012-02-23T19:37:28Z","kanso_version":"0.2.0","push_time":"2012-02-23T19:37:44Z","pushed_by":"ryanramage"},"open_path":"/_rewrite/","style":"design-doc","db_src":"http://garden.iriscouch.com/garden/_design/garden/_rewrite/_db","doc_id":"wiki","src":"http://garden.iriscouch.com/garden/_design/garden/_rewrite/details/wiki","installed":{"date":1330067199576,"db":"wiki_1"},"dashboard_title":"wiki_1","type":"install"};
        db.saveDoc(app_doc, function(err, resp) {
            if (err) console.log(err.error);
            callback();
        })
    },
    tearDown : function(callback) {
        db.getDoc('c21e4a0225f4e224381023f4190d258d', function(err, doc) {
            db.removeDoc(doc, function(err, resp) {
                callback();
            });
        });
    },

    'Should list all installed apps': function (test) {
        test.expect(1);
        core.getInstalledApps(function(err, apps) {
            if (err) throw err;
            test.ok(apps.length > 0, 'no apps found');
            test.done();
        })

    }
}

core_test.list_markets = {
    setUp : function (callback) {
        var app_doc = {
            _id :'c21e4a0225f4e224381023f4190d258e',
            type : 'market',
            name : 'test market',
            url : 'http://market.garden20.com'
        };
        db.saveDoc(app_doc, function(err, resp) {
            if (err) console.log(err.error);
            callback();
        })
    },
    tearDown : function(callback) {
        db.getDoc('c21e4a0225f4e224381023f4190d258e', function(err, doc) {
            db.removeDoc(doc, function(err, resp) {
                callback();
            });
        });
    },

    'should list market docs, and the default kanso market': function (test) {
        test.expect(3);
        core.getMarkets(function(err, markets) {
            if (err) throw err;
            test.equal(markets.length, 2, 'DB market and kanso market count');

            var db_market = markets[0];
            var kanso_market = markets[1];
            test.equal(db_market.name, 'test market');
            test.equal(kanso_market.name, 'Kanso Market');

            //test.equal(db_market.url, 'http://market.garden20.com/?dashboard=');

            test.done();
        })

    }
}

core_test.garden_app_details = function(test) {
    var test_garden_app = 'http://garden.iriscouch.com/garden/_design/garden/_rewrite/details/wiki';
    core.getGardenAppDetails(test_garden_app, function(err, remote_app_details) {
       if (err) throw err;
       test.equal(remote_app_details.kanso.config.name, 'wiki', 'Wiki returned');
       test.done();
    });
}

var null_update_function = function(status, progress, complete) {}

function deleteVhostedDB(dbName, callback) {
    try {
        var db_url = core.hostRoot(window.location) + dbName + '/_db' ;
        db.request({
            type: 'DELETE',
            url: db_url
        }, function(err){
            callback();
        });
    } catch(e){}
}



core_test.install_wiki = {
    setUp : function(callback) {
        deleteVhostedDB('wikiwikiwiki', callback);
    },
    'a complete install of an app': function (test) {
        test.expect(6);
        var test_garden_app = 'http://garden.iriscouch.com/garden/_design/garden/_rewrite/details/wiki';
        core.getGardenAppDetails(test_garden_app, function(err, remote_app_details) {
           test.ifError(err);
           core.install_app(remote_app_details, 'wikiwikiwiki', null_update_function, function(err, install_doc) {
               test.ifError(err);
               test.equal(install_doc.doc_id, 'wiki', 'install doc correct name');
               test.equal(install_doc.installed.db, 'wikiwikiwiki', 'recorded correct db');


               var installed_db = require('db').use('wikiwikiwiki/_db');
               installed_db.allDocs(function(err, res) {
                   test.equals(res.rows.length, 1, "only one design doc");
                   test.equals(res.rows[0].id, '_design/wiki', 'correctly named');
                   test.done();
               });

           });

        });
    },
    tearDown : function(callback) {
        deleteVhostedDB('wikiwikiwiki', callback);
    }
}

core_test.test_incr_app_name = function(test) {

    var db = "test";
    var next = core.incr_app_name(db);
    test.equal(next, "test_1");

    db = "test_1";
    next = core.incr_app_name(db);
    test.equal(next, "test_2");

    db = "test_21";
    next = core.incr_app_name(db);
    test.equal(next, "test_22");

    db = "test_cool";
    next = core.incr_app_name(db);
    test.equal(next, "test_cool_1");


    db = "test_cool_10";
    next = core.incr_app_name(db);
    test.equal(next, "test_cool_11");

    test.done();
}



core_test.find_next_db = function(test) {
    var name = "test";
    var current_dbs = ["_users", "alpha"];
    var next = core.find_next_db_name(name, current_dbs);
    test.equal(next, "test");

    name = "test";
    current_dbs = ["_users", "alpha", "test"];
    next = core.find_next_db_name(name, current_dbs);
    test.equal(next, "test_1");


    test.done();
}







function guessCurrent (loc) {
    var loc = loc || window.location;
    var re = /\/([a-z][a-z0-9_\$\(\)\+-\/]*)\/_design\/([^\/]+)\//;
    var match = re.exec(loc.pathname);
    if (match) {
        return {
            db: match[1],
            design_doc: match[2],
            root: '/'
        }
    }
    return null;
};
