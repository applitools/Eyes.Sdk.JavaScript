(function () {
    'use strict';

    var LogHandler = require('./LogHandler').LogHandler;

    /**
     * Write log massages to the browser/node console
     *
     * @param {boolean} isVerbose Whether to handle or ignore verbose log messages.
     * @extends LogHandler
     * @constructor
     **/
    function ConsoleLogHandler(isVerbose) {
        LogHandler.call(this);

        this.setIsVerbose(isVerbose);
    }

    ConsoleLogHandler.prototype = Object.create(LogHandler.prototype);
    ConsoleLogHandler.prototype.constructor = LogHandler;

    //noinspection JSUnusedGlobalSymbols
    /**
     * Handle a message to be logged.
     *
     * @param {boolean} verbose - is the message verbose
     * @param {string} logString
     */
    ConsoleLogHandler.prototype.onMessage = function (verbose, logString) {
        if (!verbose || this._isVerbose) {
            console.log(this.formatMessage(logString));
        }
    };

    exports.ConsoleLogHandler = ConsoleLogHandler;
}());
