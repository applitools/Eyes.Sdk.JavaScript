(function () {
    'use strict';

    /**
     * Handles log messages produces by the Eyes API.
     *
     * @abstract
     * @constructor
     **/
    function LogHandler() {
        this._isVerbose = false;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @param {boolean} isVerbose
     */
    LogHandler.prototype.setIsVerbose = function (isVerbose) {
        // noinspection PointlessBooleanExpressionJS
        this._isVerbose = !!isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @return {boolean} isVerbose
     */
    LogHandler.prototype.getIsVerbose = function () {
        return this._isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {boolean}
     */
    LogHandler.prototype.open = function () {
        return true;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @return {boolean}
     */
    LogHandler.prototype.close = function () {
        return true;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @param {boolean} verbose
     * @param {string} logString
     */
    LogHandler.prototype.onMessage = function (verbose, logString) {};

    module.exports = LogHandler;
}());
