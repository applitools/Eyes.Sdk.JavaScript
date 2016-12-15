/**
 * This file is meant to be used as an input for Browserify for creating a browser version of the SDK, by adding
 * the EyesImages object to the global "window" instance.
 */
var Buffer = require('buffer').Buffer;
var RSVP = require('rsvp');
var EyesImages = require('./index.js');
var EyesUtils = require('eyes.utils');
window.RSVP = RSVP;
window.Buffer = Buffer;
window.EyesImages = EyesImages;
window.EyesUtils = EyesUtils;
console.log("loaded EyesImages into the 'window' object");