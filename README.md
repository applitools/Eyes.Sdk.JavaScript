eyes.images.javascript
=======================

Applitools Eyes Javascript SDK for working directly with images.

Example:
__________________________

```javascript
var Eyes = require('eyes.images').Eyes;
var eyes = new Eyes();
eyes.setApiKey("<YOUR_API_KEY>");

// A test with one image for simplicity's sake.
fs.readFile('my-image-1.png', function(err, image1) {
    if (!err) {
        eyes.open("eyes.images.javascript", "Javascript images simple test", {width: 800, height: 600})
            .then(function () {
                return eyes.checkImage(image1, "My Image 1");
            })
            .then(function () {
                return eyes.close();
            });
    } else {
        console.error("failed to read first image!");
    }
});
```