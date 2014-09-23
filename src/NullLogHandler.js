/*
 ---

 name: NullLogHandler

 description: a log handler that does nothing

 provides: [NullLogHandler]

 ---
 */

(function () {
    "use strict";

    /**
     *
     * C'tor = initializes the module settings
     *
     * @param {Boolean} isVerbose
     *
     **/
    function NullLogHandler(isVerbose) {
        this._isVerbose = !!isVerbose;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @param {Boolean} isVerbose
     */
    NullLogHandler.prototype.setIsVerbose = function (isVerbose) {
        this._isVerbose = !!isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @return {Boolean} isVerbose
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
     * @param {Boolean} verbose - is the message verbose
     * @param {String} message
     */
    NullLogHandler.prototype.onMessage = function (verbose, message) {
        return verbose + message;
    };

    module.exports = NullLogHandler;
}());
