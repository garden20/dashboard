

exports.getFlattrUserId = function(installDoc) {
    if (installDoc && installDoc.kanso && installDoc.kanso.config && installDoc.kanso.config.flattr_user_id) {
        return installDoc.kanso.config.flattr_user_id;
    }
    return null;
}


exports.hasFlattr = function(installDoc) {
    var user_id = exports.getFlattrUserId(installDoc);
    if (user_id) return true;
    return false;
}

exports.getFlattrDetailsFromInstallDoc = function(installDoc) {
    return {
        user_id : exports.getFlattrUserId(installDoc),
        url : installDoc.src,
        title : encodeURIComponent(installDoc.kanso.config.name),
        description : encodeURIComponent(installDoc.kanso.config.description),
        category : 'software'
    }
}



exports.generateFlattrUrl = function(flattrDetails) {

    var flattrLink =    'https://flattr.com/submit/auto' +
                        '?user_id=' + flattrDetails.user_id +
                        '&url=' + flattrDetails.url +
                        '&title=' + flattrDetails.title +
                        '&description=' + flattrDetails.description +
                        '&category=' + flattrDetails.category;
     return flattrLink;
}

exports.generateFlatterLinkHtml = function(flattrDetails, /*optional*/ tooltip) {
    if (!tooltip) tooltip = 'Flattr this app!';
    var flattrLink = exports.generateFlattrUrl(flattrDetails);
    return '<a class="flattr_link" href="' + flattrLink + '"  title="'+tooltip+'"><img src="https://api.flattr.com/button/flattr-badge-large.png" alt="'+tooltip+'" /></a>';
}