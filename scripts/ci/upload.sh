#!/bin/bash

SELF="`basename $0`"
SELF_HOME="`dirname $0`"
DATE=`date +%Y%d%m%H%M` 
COUCHDB_URL=${COUCHDB_URL:-http://localhost:5984}
UPLOAD_DB_URL=${1:-${COUCHDB_URL}/downloads}
FILE="$2"
ID="`basename $FILE`"
DOC_URL="$UPLOAD_DB_URL/$ID"
#DIST_DIR=${DIST_DIR:-dist}
#DIST_ARCHIVE=${DIST_ARCHIVE:-medic-demos-${DATE}.tgz}
#FILE="${DIST_DIR}/${DIST_ARCHIVE}"

source "${SELF_HOME}/functions.sh" 

usage () {
    echo "Uploads CouchDB attachment based on filename."
    echo "Usage: $SELF <database url> <path to file>"
    exit 1
}

if [ $? != 0 ]; then
    echo "Failed to source functions lib."
    exit 1
fi

if [ -z "$FILE" ]; then
    usage
fi

if [ ! -f "$FILE" ]; then
    echo "Can't find file: \"$FILE\""
    exit 1
fi

(hasDB "$UPLOAD_DB_URL" || createDB "$UPLOAD_DB_URL" ) || exitError "Failed to init db."
(hasDoc "$DOC_URL" || createDoc "$DOC_URL") || exitError "Failed to init document."
attachFile "$DOC_URL" "$FILE" || exitError "Failed to upload attachment."
