Ractive Couch
==============

Easy couchdb data binding with mustache syntax. Bind your mustache templates to a couchdb document, or view, and watch it get updated via the couchdb changes feed. Works in browser, nodejs, amd, commonjs, couchapps, and cors-couchapps.


Ractive Couch uses [Ractive](http://rich-harris.github.io/Ractive/index.html). If the use cases below dont work for you, it's easy to use Ractive to make something do what you want.

Install
--------

Jam/requirejs

    jam install ractive-couch

    define(['ractive-couch'], function(RactiveCouch){
        // use it
    });

Or npm/commonjs

    npm install ractive-couch

    var RactiveCouch = require('ractive-couch');
    // use it

Or global javascript

    <script type="text/javascript" src="ractive-couch"></script>
    // use it


Example
-------

```
    var template = "<h2>{{doc.name}}</h2><ul>{{#doc.attendees}}<li>{{.}}</li>{{/doc.attendees}}</ul>";

    var rdoc = new RactiveCouch.Doc('http://localhost:5984/test', '75015a3c312c02231e2b6b3da400ab40', {
        el: 'pane1',
        template: template
    });


    var list = "<table>{{#rows}}<tr><td>{{doc.tag}}</td></tr>{{/rows}}</table>";

    var rview = new RactiveCouch.View('http://localhost:5984/test', 'app/all_people', {
        el: 'pane2',
        template: list,
        include_docs: true
    });
```

API
---

Template a document, and change when doc changes

```new RactiveCouch.Doc(couchdb_url, doc_id, options)```

  - **couchdb_url** URL to a couch database. Can be a full url if couch is CORS enabled, or a relative url.
  - **doc_id** the document id to bind the template to, and watch for changes.
  - **options** for both Ractive and Couchr
     - **el** the element id do bind the template to
     - **template** the template to use
     - **include_docs** to use include docs for changes.


Template a view, and show create/updates/deletes to the view

```new RactiveCouch.View(couchdb_url, view_name, options)```

  - **couchdb_url** URL to a couch database. Can be a full url if couch is CORS enabled, or a relative url.
  - **view_name** the view to use. Format is either ddoc/viewname or _design/ddoc/_view/viewname.
  - **options** for both Ractive and Couchr
     - **el** the element id do bind the template to
     - **template** the template to use
     - **include_docs** to use include docs for the updates/delete changes feed.
     - **watch_added** watch changes feed for new docs. Currently this does not check startkey, key, or endkey that the doc actually matches, so use witch caution, and filter.
     - **watch_deletes** add another change feed to watch for deletes.
     - **view_options** critera to send for the initial view query. See [query options](http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options)
     - **is_same** function(row, change){ return true/false;} optional function to match a change feed change to a row
     - **map_change** function(change) {  } optional function to map a change to a row object.


