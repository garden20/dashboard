#!/bin/bash
curl -X PUT http://localhost:5984/_config/httpd/secure_rewrites -H 'Content-Type: application/json' -d '"false"'