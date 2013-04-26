/* Universal module definition header preamble */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('couchr'));
    } else if (typeof define === 'function' && define.amd) {
        define(['couchr'], factory);
    } else {
        root.PicoCouchDDoc = factory(root.couchr);
    }
}(this, function (couchr) {

    var app = {};

    app.view = function(couchdb_url, view_name, view, callback) {
        var ddoc = app.simple_ddoc(view_name, view);
        app.ddoc(couchdb_url, view_name, ddoc, callback);
    };

    app.ddoc = function(couchdb_url, view_name, ddoc, callback) {
        // check hash
        var ddoc_url = [couchdb_url, '_design', view_name].join('/');


        couchr.get(ddoc_url, {}, function(err, resp, req){
            if (err && err.error && err.error === 'not_found' && err.reason === 'missing') {
                return app.first_save(ddoc_url, ddoc, callback);
            } else if (err) {
                return callback(err);
            }

            // there was an existing doc
            return app.existing_doc(ddoc_url, resp, ddoc, callback);

        });
    };


    app.simple_ddoc = function(view_name, view) {
        var ddoc = {
            _id: '_design/' + view_name,
            views: {}
        };
        ddoc.views[view_name] = {
            map: view.map.toString()
        };
        if (view.reduce) {
            ddoc.views[view_name].reduce = view.reduce.toString();
        }
        return ddoc;
    };

    app.first_save = function(ddoc_url, ddoc, callback) {
        couchr.put(ddoc_url, ddoc, callback);
    };

    app.existing_doc = function(ddoc_url, old_doc, new_doc, callback) {
        var _rev = old_doc._rev;
        if ( !app.equal(old_doc, new_doc) ){
            new_doc._rev = _rev;
            return couchr.put(ddoc_url, new_doc, callback);
        }
        callback(null);
    };

    app.equal = function(old_doc, new_doc) {
        delete old_doc._rev; // only thing that should be different
        return eq(old_doc, new_doc, [], []);
    };


      /* borrowed from underscore */
      // Internal recursive comparison function for `isEqual`.
      var eq = function(a, b, aStack, bStack) {
        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
        if (a === b) return a !== 0 || 1 / a == 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;

        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className != toString.call(b)) return false;
        switch (className) {
          // Strings, numbers, dates, and booleans are compared by value.
          case '[object String]':
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
            return a == String(b);
          case '[object Number]':
            // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
            // other numeric values.
            return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
          case '[object Date]':
          case '[object Boolean]':
            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
            // millisecond representations. Note that invalid dates with millisecond representations
            // of `NaN` are not equivalent.
            return +a == +b;
          // RegExps are compared by their source patterns and flags.
          case '[object RegExp]':
            return a.source == b.source &&
                   a.global == b.global &&
                   a.multiline == b.multiline &&
                   a.ignoreCase == b.ignoreCase;
        }
        if (typeof a != 'object' || typeof b != 'object') return false;
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        var length = aStack.length;
        while (length--) {
          // Linear search. Performance is inversely proportional to the number of
          // unique nested structures.
          if (aStack[length] == a) return bStack[length] == b;
        }
        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);
        var size = 0, result = true;
        // Recursively compare objects and arrays.
        if (className == '[object Array]') {
          // Compare array lengths to determine if a deep comparison is necessary.
          size = a.length;
          result = size == b.length;
          if (result) {
            // Deep compare the contents, ignoring non-numeric properties.
            while (size--) {
              if (!(result = eq(a[size], b[size], aStack, bStack))) break;
            }
          }
        } else {
          // Objects with different constructors are not equivalent, but `Object`s
          // from different frames are.
          var aCtor = a.constructor, bCtor = b.constructor;
          if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                                   _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
            return false;
          }
          // Deep compare objects.
          for (var key in a) {
            if (has(a, key)) {
              // Count the expected number of properties.
              size++;
              // Deep compare each member.
              if (!(result = has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
            }
          }
          // Ensure that both objects contain the same number of properties.
          if (result) {
            for (key in b) {
              if (has(b, key) && !(size--)) break;
            }
            result = !size;
          }
        }
        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return result;
      };

      // Shortcut function for checking if an object has a given property directly
      // on itself (in other words, not on a prototype).
      function has (obj, key) {
        return obj.hasOwnProperty(key);
      };
      /** end borrowed from underscore */




    // what we are exporting.
    if (couchr.test) return app; // in a test env, return everything
    return {
        view: app.view,
        doc: app.ddoc
    };


})); // end of UMD