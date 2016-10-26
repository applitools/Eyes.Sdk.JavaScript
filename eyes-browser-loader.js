/**
 * This file is meant to be used as an input for Browserify for creating a browser version of the SDK, by adding
 * the EyesImages object to the global "window" instance.
 *
 * Command example:
 * browserify eyes-browser-loader.js --ignore winston > dist\eyes-browser.js
 */
var Buffer = require('buffer').Buffer;
var RSVP = require('rsvp').RSVP;
var EyesImages = require('./index.js');
window.RSVP = RSVP;
window.Buffer = Buffer;
window.EyesImages = EyesImages;
console.log("loaded EyesImages into the 'window' object");