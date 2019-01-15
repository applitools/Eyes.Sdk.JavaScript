'use strict';

var fs = require('fs');

var EyesImages = require('../index.js');

var eyes = new EyesImages.Eyes();
eyes.setLogHandler(new EyesImages.ConsoleLogHandler(true));
eyes.setHostOS('Mac OS X 10.10');
eyes.setHostingApp("My browser");
// eyes.setProxy('http://localhost:9999');

// load images from local storage
var image1 = fs.readFileSync('image1.png');
var image2 = fs.readFileSync('image2.png');

var firstTestPromise = eyes.open("eyes.images.javascript", "First test5_3", {width: 800, height: 600}).then(function () {
    // Notice since eyes.checkImage returns a promise, you need to call it with "return" in order for the wrapping
    // "then" to wait on it.
    return eyes.checkImage(image2, 'My second image');
}).then(function () {
    console.log('Running session: ', eyes.getRunningSession());
    eyes.addMouseTrigger(EyesImages.Triggers.MouseAction.Click, {left: 288, top: 44, width: 92, height: 36}, {x: 10, y: 10});
    return eyes.checkImage(image1, 'My first image');
}).then(function () {
    return eyes.checkRegion({left: 495, top: 100, width: 355, height: 360}, image1, 'Specific region');
}).then(function () {
    // We're calling close with "false" so that the promise will resolve even if the test failed and not reject.
    // This will make waiting on firstTestPromise simpler (we just handle "resolve" part of the "then").
    return eyes.close(false);
}, function (err) {
    console.error("An error occurs during runtime", err);
    return eyes.abortIfNotClosed();
});

// Handle first test results..
firstTestPromise = firstTestPromise.then(function (results) {
   // do something with results
    var testResultsFormatter = new EyesImages.TestResultsFormatter();
    testResultsFormatter.addResults(results);
    console.log("first results", results);
});

