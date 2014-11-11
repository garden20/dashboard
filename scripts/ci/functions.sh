exitError () {
    echo "Exiting: $1"
    exit 1
}

escapeURL () {
    local str="$1"
    local cmd="node -e \"console.log(encodeURIComponent('${str}'));\""
    echo `"$cmd" | tr -d '\n' | tr -d '\r'`
}

hasDB () {
    test -n "$1" || exitError "Database argument is empty."
    curl -s -f -k "$1" | grep 'db_name' > /dev/null 
}

createDB () {
    test -n "$1" || exitError "Database argument is empty."
    curl -s -f -k -X PUT "$1" > /dev/null
}

hasDoc () {
    curl -s -f -k "$1" > /dev/null 
}

createDoc () {
    local d=`date +%Y-%m-%dT%H:%M:%S%z`
    # creates empty doc
    curl -s -f -k -d "{}" -X PUT "$1" > /dev/null
}

# Overwrite file attachment if exists
attachFile () {
    local doc="$1"
    local path="$2"
    local filename=`basename "$path"`
    test -n "$doc" || exitError "Missing Document URL parameter."
    test -n "$path" || exitError "Missing path parameter."
    test -f "$path" || exitError "File not found: $path"
    local rev=`curl -f -s -I -XHEAD "${doc}" | grep -Fi etag | sed 's/.*: //'`
    # remove quotes and new lines from rev
    rev=`echo "$rev" | sed 's/\"//g' | tr -d '\n' | tr -d '\r'`
    if [ -n $rev ]; then
        curl -f -k -X PUT -H "Content-Type: application/octet-stream" \
            --data-binary "@${path}" \
            "${doc}/${filename}?rev=${rev}"
    else
        curl -f -k -X PUT -H "Content-Type: application/octet-stream" \
            --data-binary "@${path}" \
            "${doc}/${filename}"
    fi
}
