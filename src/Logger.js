/*
 ---

 name: Logger

 description: Write log massages using the provided Log Handler

 provides: [Logger]

 ---
 */

;(function() {
    "use strict";

    var NullLogHanlder = require('./NullLogHandler');

    /**
     *
     * C'tor = initializes the module settings
     *
     **/
    function Logger() {
        this._logHandler = new NullLogHanlder();
    }

    /**
     * Set the log handler
     *
     * @param {Object} logHandler
     */
    Logger.prototype.setLogHandler = function (logHandler) {
        this._logHandler = logHandler || new NullLogHanlder();
    };

    /**
     * Get the log handler
     *
     * @return {Object} logHandler
     */
    Logger.prototype.getLogHandler = function () {
        return this._logHandler;
    };

    Logger.prototype.verbose = function(message){
        this._logHandler.onMessage(true, message);
    };

    Logger.prototype.log = function(message){
        this._logHandler.onMessage(false, message);
    };

    module.exports = Logger;
}());
