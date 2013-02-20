(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory( require('async'), require('pouchdb'), require('garden-views'), require('url'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async','pouchdb', 'garden-views', 'url'],factory);
    } else {
        root.garden_dashboard_core = factory(root.async, root.pouchdb, root.garden_views, root.url);
    }
}(this, function (async, pouch, garden_views, url) {

var app = {};
app.dashboard = function(dashboard_db_url, options) {
    var thus = this;
    thus.dashboard_db_url = dashboard_db_url;
    thus.pouchName = app.getPouchName(dashboard_db_url);
};


app.dashboard.prototype.init = function(callback) {
    var thus = this;

    async.parallel({
        local : function(cb) {
            pouch(thus.pouchName, cb);
        },
        remote: function(cb) {
            pouch(thus.dashboard_db_url, cb);
        }
    }, function(err, data){
        if (err) return callback(err);
        thus.local_db = data.local;
        thus.remote_db =  data.remote;
        callback();
    });
};


app.dashboard.prototype.sync = function(callback) {
    pouch.replicate(this.remote_db, this.local_db, {}, callback);
};


app.dashboard.prototype.allAssets = function(callback) {
    this.local_db.allDocs(callback);
};

app.dashboard.prototype.settings = function(callback) {
  this.local_db.get('settings', function(err, data){
    if (err && err.status === 404) return callback(null, {});
    callback(err, data);
  });
};

app.dashboard.prototype.topbar = function(callback) {
  var results = {
    settingsDoc : {},
    selectedThemeDoc : null,
    apps: [],
    scripts: []
  };

  this.local_db.query(garden_views.dashboard_assets, {reduce: false, include_docs: true}, function(err, resp){
    async.forEach(resp.rows, function(row, cb){
        if (row.key[0] === 0) results.settingsDoc = row.value;
        if (row.key[0] === 1) {
            if (row.key[3] == 'install') {
                results.apps.push({
                    title : row.key[2],
                    db :row.value.db,
                    doc : row.doc
                });
            }
            if (row.key[3] == 'link') {
                results.apps.push({
                    title : row.key[2],
                    link :row.value.url,
                    doc  : row.doc,
                    external : true
                });
            }
        }
        if (row.key[0] === 2) results.selectedThemeDoc = row.doc;
        if (row.key[0] === 3) results.scripts.push(row.doc.src);
        cb();
    }, function(err){
      callback(err, results);
    });
  });
};



app.getPouchName = function(dashboard_db_url) {
  var parsed = url.parse(dashboard_db_url),
      namespace = parsed.hostname + parsed.port;

  if (parsed.pathname) {
     var clean = parsed.pathname.replace(/\//g, '_');
     namespace += clean;
  }

  return namespace;
};



return app.dashboard;

}));