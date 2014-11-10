#!/bin/bash

LABEL=''
SHOULD_RUN=''
MARKETS_URL='https://gist.githubusercontent.com/mandric/4beda54677555c8c46f9/raw/markets.json'

if [ -z "$UPLOAD_URL" ]; then
  echo 'Environment must contain UPLOAD_URL' >&2
  exit 1
fi

# Never push to market on pull requests
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  exit 0;
fi

# Always run for whitelisted branches
for branch in master develop; do
  if [ "$TRAVIS_BRANCH" = "$branch" ]; then
    SHOULD_RUN='t'
  fi
done

# Exit now if we're not needed
if [ -z "$SHOULD_RUN" ]; then
  exit 0
fi

# Label all branches other than master
if [ "$TRAVIS_BRANCH" != "master" ]; then
  LABEL="-$TRAVIS_BRANCH"
fi

# Upload targets
STAGING_DB="$UPLOAD_URL/dashboard"
SEED_DB="$UPLOAD_URL/dashboard_seed$LABEL"

# Update seed URL for all dashboards in the world.
kanso push --minify "$SEED_DB" || exit "$?";

# Create .couch file for distribution purposes that includes medic markets
# and push to medic staging site.
\
curl -X PUT -d '"false"' \
  'http://localhost:5984/_config/couchdb/delayed_commits' && \
\
wget "$MARKETS_URL" && \
kanso upload markets.json 'http://localhost:5984/dashboard' && \
\
# This uploads the raw on-disk file in /var/lib/couchdb/dashboard.couch
# to the remote CouchDB server specified in $STAGING_DB, as a attachment.
# From there, it's accessible to web clients/builds, including medic-os.
\
sudo cp "`sudo find /var/lib/couchdb/ -name dashboard.couch`" \
  "./static/dashboard-medic$LABEL.couch" && \
\
sudo chown travis "./static/dashboard-medic$LABEL.couch" && \
kanso push "$STAGING_DB"

exit "$?";

