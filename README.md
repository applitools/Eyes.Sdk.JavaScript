eyes.images
===========

Applitools Eyes Javascript SDK for working directly with images.

Additional information can be found on the Applitools website: http://www.applitools.com.

Example:
__________________________

```javascript
var https = require('https');
var Eyes = require('eyes.images').Eyes;
var Triggers = require('eyes.images').Triggers;
// This example uses RSVP library for creating promises.
var RSVP = require('rsvp');

// Switch between the versions to generate test failure.
var version = "0.1";
//var version = "0.2";

var eyes = new Eyes();
// Set your Applitools API key here.
eyes.setApiKey("YOUR_API_KEY");
// Define the OS and hosting application to identify the baseline
eyes.setOs("Windows 7");
eyes.setHostingApp("My Maxthon browser");

// Start visual testing.
var testPromise = eyes.open("Applitools site", "Sanity Test", {width: 785, height: 1087})
    .then(function () {
        // Load page image and validate.
        return getImage("store.applitools.com","/download/contact_us.png/" + version).then(function (img) {
            // Visual validation point #1
            return eyes.checkImage(img, 'Contact-us page');
        });
    })
    .then(function () {
        // Simulate click on the "Resources" button".
        eyes.addMouseTrigger(Triggers.MouseAction.Click, {left: 288, top: 44, width: 92, height: 36}, {x: 10, y: 10});
    })
    .then(function () {
        // Load another page image and validate
        return getImage("store.applitools.com", "/download/resources.png/" + version).then(function (img) {
            // Visual validation point #2
            return eyes.checkImage(img);
        });
    })
    .then(function () {
        // End visual testing. Validate visual correctness.
        return eyes.close(false);
    }, function () {
        return eyes.abortIfNotClosed();
    }
);

// Handle test results.
testPromise.then(function (results) {
    console.log("results", results);
});


function getImage(host, path) {
    var options = {
        host: host,
        path: path
    };

    var deferred = RSVP.defer();

    https.request(options, function (res) {
        res.setEncoding('binary');

        var data = "";
        res.on('data', function(chunk) {
            return data += chunk;
        });
        res.on('end', function() {
            return deferred.resolve(new Buffer(data, 'binary'));
        });
        res.on('error', function(err) {
            console.log("Error during HTTP request");
            console.log(err.message);
            deferred.reject();
        });
    }).end();

    return deferred.promise;
}
```
