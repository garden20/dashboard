
function waitFor(testFx, callback, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timeout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    callback('timeout')
                } else {
                    callback(null);
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 100ms
};


function currentTestCount(page) {
    try {
        return page.evaluate(function(){
            return document.getElementsByTagName('li').length;
        });
    } catch(e) {
        return 0;
    }
}

function testComplete(page) {
    return page.evaluate(function(){
        var el = document.getElementById('nodeunit-testresult');
        if (el && el.innerText.match('completed')) {
            return true;
        }
        return false;
    });
}

function waitForNoResultIncrease(current, page, callback) {
    waitFor(function() {

        if (testComplete(page)) return true;

        var incCount = currentTestCount(page);
        if (incCount > current) return true;
        return false;

    }, function(err) {
        if (err) return callback(null);
        if (testComplete(page)) return callback(null);

        var newCount = currentTestCount(page);
        waitForNoResultIncrease(newCount, page, callback);
    }, 60000);
}

function getTestFails(page) {
    var failed = page.evaluate(function(){
        var failed = false;
        var li = document.getElementsByTagName('li');
        for (var i = 0; i < li.length; i++) {
            var status = li[i].getAttribute('class');
            var info = li[i].getElementsByTagName('strong');
            var pass = status == "pass"
            var symbol = '✔';
            if (!pass) {
                symbol = '✘';
                failed = true;
            }
            if (info && info[0]) {
                // it is a parent test
                console.log(symbol + ' ' + info[0].innerText);
            } else {
                // it is an assertion entry
                if (!pass) {
                    var pre = li[i].getElementsByTagName('pre');
                    console.log('   '+ symbol +' ' + pre[0].innerText);
                }
            }
        }

        var el = document.getElementById('nodeunit-testresult');
        console.log('\n' + el.innerText);
        return failed;
    });
    var returnVal = 0;
    if (failed > 0) returnVal = 1;
}

function isNodeUnitPage(page) {
    var isNodeUnit = page.evaluate(function() {
        var el = document.getElementById('nodeunit-header');
        if (!el) {
            return false;
        }
        return true;
    });
    if (!isNodeUnit) {
        console.log('not a nodeunit page');
        phantom.exit(1)
    }
}


if (phantom.args.length === 0 || phantom.args.length > 2) {
    console.log('Usage: run-nodeunit-browser.js URL');
    phantom.exit();
}
console.log(phantom.args[0]);

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.open(phantom.args[0], function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit();
    } else {

        isNodeUnitPage(page);

        console.log('\nwaiting for results');
        waitForNoResultIncrease(0, page, function() {
            var returnVal = getTestFails(page);
            phantom.exit(returnVal);
        });



    }
});
