To install, push the couchapp to the database "dashboard" and add the
following global httpd handler to your CouchDB local.ini:

```ini
[httpd_global_handlers]
_dashboard = {couch_httpd_proxy, handle_proxy_req, <<"/dashboard/_design/dashboard/_rewrite">>}
```
