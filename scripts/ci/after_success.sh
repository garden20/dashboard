#!/bin/bash -x

SEED_DB='http://travis-ci:a5nghmongP!@staging.dev.medicmobile.org/dashboard_seed'
STAGING_DB='http://travis-ci:a5nghmongP!@staging.dev.medicmobile.org/dashboard'

if [ "$TRAVIS_BRANCH" == "master" ]; then
    # Update seed URL for all dashboards in the world.
    kanso push "$SEED_DB" &&
    # Create .couch file for distribution purposes that includes medic markets
    # and push to medic staging site.
    sudo cp `find /var/lib/couchdb/ -name dashboard.couch` ./static/dashboard.couch &&
    sudo chown travis ./static/dashboard.couch &&
    curl -X PUT http://localhost:5984/_config/couchdb/delayed_commits -d '"false"' &&
    wget https://gist.githubusercontent.com/mandric/4beda54677555c8c46f9/raw/markets.json &&
    kanso upload markets.json http://localhost:5984/dashboard &&
    sudo cp /var/lib/couchdb/1.3.0/dashboard.couch ./static/dashboard-medic.couch &&
    sudo chown travis ./static/dashboard-medic.couch &&
    kanso push "$STAGING_DB"
fi

if [ "$?" == 0 ]; then
    exit 0;
fi

exit 1;
