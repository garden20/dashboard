module.exports = function (newDoc, oldDoc, userCtx, secObj) {
    secObj.admins = secObj.admins || {};
    secObj.admins.names = secObj.admins.names || [];
    secObj.admins.roles = secObj.admins.roles || [];

    var IS_DB_ADMIN = false;
    if(~ userCtx.roles.indexOf('_admin'))
      IS_DB_ADMIN = true;
    if(~ secObj.admins.names.indexOf(userCtx.name))
      IS_DB_ADMIN = true;
    for(var i = 0; i < userCtx.roles; i++)
      if(~ secObj.admins.roles.indexOf(userCtx.roles[i]))
        IS_DB_ADMIN = true;

    if(IS_DB_ADMIN)
      log('Admin change on read-only db: ' + newDoc._id);
    else
      throw {'forbidden':'This database is read-only'};
}