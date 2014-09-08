eyes.images.javascript
=======================

Applitools Eyes Javascript SDK for working directly with images.

Example:
__________________________

```javascript
var Eyes = require('eyes.images').Eyes;
var eyes = new Eyes();
eyes.setApiKey("<YOUR_API_KEY>");

var image1 = fs.readFileSync('image1.png');
var image2 = fs.readFileSync('image2.png');
var image3 = fs.readFileSync('image2.png');
var image4 = fs.readFileSync('image2.png');

// First test
var firstTestPromise = eyes.open("eyes.images.javascript", "First test", {width: 800, height: 600})
    .then(function () {
        // Notice since eyes.checkImage returns a promise, you need to call it with "return" in order for the wrapping
        // "then" to wait on it.
        return eyes.checkImage(image1, 'My first image');
    })
    .then(function () {
        return eyes.checkImage(image2, 'My second image');
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
});

// Second test
var secondTestPromise = firstTestPromise.then(function () {
    return eyes.open("eyes.images.javascript", "Second test", {width: 800, height: 600})
        .then(function () {
            return eyes.checkImage(image3, 'My third image');
        })
        .then(function () {
            return eyes.checkImage(image4, 'My 4th image');
        })
        .then(
            function () {
                return eyes.close(false);
            }, function () {
                return eyes.abortIfNotClosed();
            }
        );
});

// Handle second test results
secondTestPromise.then(function (results) {
    // Do something with results.
});
```