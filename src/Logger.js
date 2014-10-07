/*
 ---

 name: Logger

 description: Write log massages using the provided Log Handler

 provides: [Logger]

 ---
 */

(function () {
    "use strict";

    var NullLogHandler = require('./NullLogHandler');

    /**
     *
     * C'tor = initializes the module settings
     *
     **/
    function Logger() {
        this._logHandler = new NullLogHandler();
    }

    /**
     * Set the log handler
     *
     * @param {Object} logHandler
     */
    Logger.prototype.setLogHandler = function (logHandler) {
        this._logHandler = logHandler || new NullLogHandler();
    };

    /**
     * Get the log handler
     *
     * @return {Object} logHandler
     */
    Logger.prototype.getLogHandler = function () {
        return this._logHandler;
    };

    function _stringify(args) {
        return args.map(function (arg) {
            if (typeof arg === 'object') {
                return JSON.stringify(arg);
            }

            return arg;
        }).join(" ");
    }

    Logger.prototype.verbose = function () {
        this._logHandler.onMessage(true, _stringify(Array.prototype.slice.call(arguments, 0)));
    };

    Logger.prototype.log = function () {
        this._logHandler.onMessage(false, _stringify(Array.prototype.slice.call(arguments, 0)));
    };

    module.exports = Logger;
}());
