(function () {
    'use strict';

    /**
     * A log handler that does nothing
     *
     * @constructor
     **/
    function NullLogHandler() {
        this._isVerbose = false;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @param {boolean} isVerbose
     */
    NullLogHandler.prototype.setIsVerbose = function (isVerbose) {
        this._isVerbose = !!isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @return {boolean} isVerbose
     */
    NullLogHandler.prototype.getIsVerbose = function () {
        return this._isVerbose;
    };

    NullLogHandler.prototype.open = function () {
        return true;
    };

    NullLogHandler.prototype.close = function () {
        return true;
    };

    /**
     * Write a message
     * @param {boolean} verbose - is the message verbose
     * @param {string} message
     */
    NullLogHandler.prototype.onMessage = function (verbose, message) {
        return verbose + message;
    };

    module.exports = NullLogHandler;
}());
