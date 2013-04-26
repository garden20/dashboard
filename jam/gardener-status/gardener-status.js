/**
 * Universal module definition
 */

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('ractive-couch'), require('pico-couch-ddoc'));
    } else if (typeof define === 'function' && define.amd) {
        define(['ractive-couch', 'pico-couch-ddoc'], factory);
    } else {
        root.GardenerStatus = factory(root.RactiveCouch, root.PicoCouchDDoc);
    }
}(this, function (RactiveCouch, pico_couch_ddoc) {


    return GardenerStatus;


    function GardenerStatus(dashboard_url, ddoc_path, elem_id) {

        pico_couch_ddoc.view(dashboard_url,  'gardener',  getView(), function(err){
            if (err) return showError(err, elem_id);

            new RactiveCouch.View(dashboard_url, 'gardener/gardener', {
                el : elem_id,
                template: '{{#rows.length}}<h4>Modules</h4>{{/rows.length}}{{#rows}}<div><h6>{{key[1]}}</h6><div>{{value.msg}}</div><div class="progress" ><div class="bar" style="width: {{value.percent}}%; "></div></div></div>{{/rows}}',
                include_docs: true,
                view_options: {
                    startkey: [ddoc_path],
                    endkey: [ddoc_path, {}, {}],
                    group: true,
                    group_level: 2
                },
                no_change_filter: true,
                is_same: is_same,
                map_change: map_change
            });
        });
    }

    function showError(err, elem_id) {
        console.log(err);
    }

    function map_change(change) {
        return {
            key: [change.doc.path, change.doc.module],
            value: {
                percent: change.doc.percent,
                msg: change.doc.msg
            }
        };
    }

    function is_same(row, change) {
        try {
            if (row.key[0] === change.doc.path && row.key[1] === change.doc.module) return true;
        } catch(e) {}
        return false;

    }


    function getView() {
        return {
            map: function(doc) {
                if (doc.type !== 'gardener_progress') return;
                emit([doc.path, doc.module, doc.time], {percent: doc.percent, msg: doc.msg, time: doc.time});
            },
            reduce: function(keys, values) {
                var max;

                for (var i=0; i < values.length; i++) {
                    var val = values[i];
                    if (!max) max = val;
                    else {
                        if (val.time > max.time) max = val;
                    }
                }
                return max;
            }
        };
    }





// end of UMD
}));