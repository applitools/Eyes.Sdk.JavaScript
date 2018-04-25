(function () {
    'use strict';

    var NullLogHandler = require('./NullLogHandler');

    /**
     * Write log massages using the provided Log Handler
     *
     * @constructor
     **/
    function Logger() {
        this._logHandler = new NullLogHandler();
    }

    /**
     * Set the log handler
     *
     * @param {ConsoleLogHandler|FileLogHandler|NullLogHandler} logHandler
     */
    Logger.prototype.setLogHandler = function (logHandler) {
        this._logHandler = logHandler || new NullLogHandler();
    };

    /**
     * Get the log handler
     *
     * @return {ConsoleLogHandler|FileLogHandler|NullLogHandler} logHandler
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
