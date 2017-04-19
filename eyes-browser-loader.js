/**
 * This file is meant to be used as an input for Browserify for creating a browser version of the SDK, by adding
 * the EyesImages object to the global "window" instance.
 */
var EyesImages = require('./index.js');
window.EyesImages = EyesImages;
console.log("loaded EyesImages into the 'window' object");