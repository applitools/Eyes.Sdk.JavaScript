(function () {
    'use strict';

    var LogHandler = require('./LogHandler').LogHandler;

    /**
     * Ignores all log messages.
     *
     * @constructor
     * @extends LogHandler
     **/
    function NullLogHandler() {
        LogHandler.call(this);
    }

    NullLogHandler.prototype = Object.create(LogHandler.prototype);
    NullLogHandler.prototype.constructor = LogHandler;

    exports.NullLogHandler = NullLogHandler;
}());
