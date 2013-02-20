(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.garden_views = factory();
    }
}(this, function () {


var views = {};

views.by_active_install =  {
     map: function (doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;
        emit(doc.dashboard_title, null);
     }
};

views.dashboard_assets = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'install'], { db : doc.installed.db });

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order, doc.dashboard_title, 'link'], { url : doc.url });

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], null);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};

views.cache_manifest = {
    map : function(doc) {

        var order;

        if (doc._id == 'settings') {
            emit([0], doc);
        }
        if (!doc.type) return; // safety first
        if (doc.type === 'install' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'link' ) {
            if (doc.removed) return;
            order = Number.MAX_VALUE;
            if (doc.order) order = Number(doc.order);
            emit([1, order], doc._rev);

        }
        if (doc.type === 'theme' && doc.selectedTheme) {
            emit([2], doc._rev);
        }
        if (doc.type === 'script') {
            emit([3], doc._rev);
        }
    }
};


views.app_version_by_market = {
    map : function(doc) {
        if (!doc.type || doc.type !== 'install' ) return;
        if (doc.removed) return;

        var end = 'details/' + doc.doc_id;
        var src = doc.src.substring(0, doc.src.indexOf(end));

        var meta = doc.couchapp || doc.kanso;
        emit(src, {
            dashboard_title: doc.dashboard_title,
            app: doc.doc_id,
            version: meta.config.version
        });

    }
};



views.get_markets =  {
     map: function (doc) {
        if (doc.type && doc.type === 'market' ) {
            emit(doc.name, doc.url);
        }
     }
};

views.get_roles = {
    map : function(doc) {
        if (doc.type && doc.type === 'role' ) {
            emit(doc.name, doc.url);
        }
    }
};

views.get_syncs = {
    map : function(doc) {
        if (doc.type && doc.type === 'sync') {
            emit(doc.name, null);
        }
    }
};

return views;


}));