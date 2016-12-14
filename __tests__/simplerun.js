"use strict";

var fs = require('fs');
var Eyes = require('../index.js').Eyes;
var ConsoleLogHandler = require('../index.js').ConsoleLogHandler;
var Triggers = require('../index.js').Triggers;
var TestResultsFormatter = require('../index.js').TestResultsFormatter;
var eyes = new Eyes();
eyes.setLogHandler(new ConsoleLogHandler(true));
eyes.setApiKey(process.env.APPLITOOLS_API_KEY);
//process.env.HTTPS_PROXY = 'http://localhost:8888';
eyes.setHostOS('Mac OS X 10.10');
eyes.setHostingApp("My browser");
var image1 = fs.readFileSync('image1.png');
var image2 = fs.readFileSync('image2.png');
var testResultsFormatter = new TestResultsFormatter();

var firstTestPromise = eyes.open("eyes.images.javascript", "First test5_3", {width: 800, height: 600})
    .then(function () {
        // Notice since eyes.checkImage returns a promise, you need to call it with "return" in order for the wrapping
        // "then" to wait on it.
        //return eyes.checkRegion({left: 1024, top: 381, width: 185, height: 189}, image2, 'My second image');
        return eyes.checkImage(image2, 'My second image');
    })
    .then(function () {
        console.log('Running session: ', eyes.getRunningSession());
        eyes.addMouseTrigger(Triggers.MouseAction.Click, {left: 288, top: 44, width: 92, height: 36}, {x: 10, y: 10});
        return eyes.checkImage(image1, 'My first image');
    })
    .then(function () {
        //return eyes.checkRegion({left: 1773, top: 372, width: 180, height: 220}, image1, 'Specific region');
        return eyes.checkRegion({left: 1600, top: 372, width: 180, height: 220}, image1, 'Specific region');
    })
    .then(
        function () {
            // We're calling close with "false" so that the promise will resolve even if the test failed and not reject.
            // This will make waiting on firstTestPromise simpler (we just handle "resolve" part of the "then").
            return eyes.close(false);
        }, function () {
            return eyes.abortIfNotClosed();
        }
    );


// Handle first test results..
firstTestPromise = firstTestPromise.then(function (results) {
   // do something with results
   // ...
    testResultsFormatter.addResults(results);
    console.log("first results", results);
});

