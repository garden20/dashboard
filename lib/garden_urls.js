
exports.app_details_json = function(app_details_url) {
    return app_details_url + '/json';
}


exports.incr_app_name = function(app_name) {
    var num = 1;
    var delim = app_name.lastIndexOf('_');
    if (delim > 0) {
        var last_num = app_name.substr(delim+1)
        if (last_num > 0) {
            num = Number(last_num) + 1;
            app_name = app_name.substr(0, delim);
        }
    }
    return app_name + "_" + num;
}



var safe = exports.user_app_name_to_safe_url = function(app_name) {
    // needs some help
    return app_name.toLowerCase().replace(/ /g,"_");
}



var fnd = exports.find_next_db_name = function(app_name, current_dbs) {

    if (!current_dbs) return app_name;
    if (!current_dbs.length) return app_name;

    if (current_dbs.indexOf(app_name) !== -1 ) {
        return fnd(exports.incr_app_name(app_name), current_dbs);
    }

    return app_name;
}


exports.get_launch_url = function(install_doc, window_path) {


    if (window_path && window_path.indexOf('/dashboard/_design/dashboard/_rewrite/') == 0) {
        return '/' + install_doc.installed.db + '/_design/' + install_doc.doc_id + '/_rewrite/'
    }

    if (install_doc.open_path && install_doc.open_path.indexOf('_rewrite') === -1) {
        return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + install_doc.open_path;
    }
    if (install_doc.kanso.config.legacy_mode  ) {
        return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + '/_rewrite/';
    }
    //return './' + install_doc.installed.db + '/_design/' + install_doc.doc_id + install_doc.open_path;
    return  safe(install_doc.dashboard_title) + '/'




    //return '../../../../' + install_doc.installed.db + '/_design/' + install_doc.doc_id +  install_doc.open_path;
}

exports.formatSize = function(size) {
    var jump = 512;
    if (size < jump) return size + " bytes";
    var units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    var i=0;
    while (size >= jump && i < units.length) {
        i += 1;
        size /= 1024;
    }
    return size.toFixed(1) + ' ' + units[i - 1];
}


exports.bestDashboardImage = function (install_doc) {
    try {
        if (install_doc.kanso.config.promo_images.small) {
            //http://ryan.garden20.com:5984/apps/wiki/wiki_2/_db/_design/wiki/icons/wiki_icon_128.png

            return  designDoc(install_doc) +   '/' + install_doc.kanso.config.promo_images.small;
        }
    } catch(e){}

    return 'http://placehold.it/210x150';
}


function designDoc(install_doc) {
    return './_couch/' + install_doc.installed.db +  '/_design/' +  install_doc.doc_id
    //return  './apps/' + safe(install_doc.dashboard_title) +  '/_db/_design/' +  install_doc.doc_id
}


exports.bestIcon96 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['96']) {
            return designDoc(install_doc) +    '/' + install_doc.kanso.config.icons['96'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}

exports.bestIcon128 = function(install_doc) {
    try {
        if (install_doc.kanso.config.icons['128']) {
            return designDoc(install_doc) +   '/' + install_doc.kanso.config.icons['128'];
        }
    } catch(e){}

    return 'http://placehold.it/96x96';
}