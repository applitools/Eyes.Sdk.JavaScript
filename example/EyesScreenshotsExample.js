var fetch = require('node-fetch');
var EyesImages = require('../index'); // should be replaced to 'eyes.images'

// Initialize the eyes SDK and set your private API key.
var eyes = new EyesImages.Eyes();
// eyes.setApiKey('YOUR_API_KEY'); // Set APPLITOOLS_API_KEY env variable or uncomment and update this line
eyes.setLogHandler(new EyesImages.ConsoleLogHandler(false));
eyes.setHostOS('Windows 10'); // Define the OS.

return eyes.open('Image test2', 'Javascript screenshot test!', {width: 300, height: 100}).then(function () {
    return fetch('https://www.google.de/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png')
        .then(function (res) {return res.buffer()});
}).then(function (img) {
    return eyes.checkImage(img, 'Google Logo');
}).then(function () {
    return eyes.close();
}).catch(function (reason) {
    console.error(reason);
});
