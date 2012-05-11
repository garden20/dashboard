#!/bin/bash
cd test
kanso push "$1"
phantomjs --version
phantomjs run-nodeunit-browser.js "$1/_design/dashboard-core-test/_rewrite/SpecRunner.html"
