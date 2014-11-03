/*
 ---

 name: ConsoleLogHandler

 description: Write log massages to the browser/node console

 provides: [ConsoleLogHandler]

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
    function ConsoleLogHandler(isVerbose) {
        this._isVerbose = !!isVerbose;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @param {Boolean} isVerbose
     */
    ConsoleLogHandler.prototype.setIsVerbose = function (isVerbose) {
        this._isVerbose = !!isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Whether to handle or ignore verbose log messages.
     *
     * @return {Boolean} isVerbose
     */
    ConsoleLogHandler.prototype.getIsVerbose = function () {
        return this._isVerbose;
    };

    //noinspection JSUnusedGlobalSymbols
    ConsoleLogHandler.prototype.open = function () {
        return true;
    };

    //noinspection JSUnusedGlobalSymbols
    ConsoleLogHandler.prototype.close = function () {
        return true;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * Write a message
     * @param {Boolean} verbose - is the message verbose
     * @param {String} message
     */
    ConsoleLogHandler.prototype.onMessage = function (verbose, message) {
        if (!verbose || this._isVerbose) {
            console.log(ConsoleLogHandler.getTimeString() + " - Eyes: " + message);
        }
    };

    //noinspection JSUnusedGlobalSymbols
    ConsoleLogHandler.getTimeString = function () {
        var pad10 = function (x) {
            return (x < 10) ? '0' + x : x;
        };

        var now = new Date(),
            h = now.getUTCHours(),
            m = pad10(now.getUTCMinutes()),
            s = pad10(now.getUTCSeconds()),
            amPm = h >= 12 ? 'pm' : 'am',
            D = pad10(now.getUTCDate()),
            M = pad10(now.getUTCMonth() + 1),
            Y = now.getUTCFullYear();

        if (h > 12) {
            h -= 12;
        }

        h = pad10(h);

        return D + '/' + M + '/' + Y + ' ' + h + ':' + m + ':' + s + ' ' + amPm;
    };

    module.exports = ConsoleLogHandler;
}());
