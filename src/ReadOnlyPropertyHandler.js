(function () {
    "use strict";

    var PropertyHandler = require('./PropertyHandler');

    /**
     * A property handler for read-only properties (i.e., set always fails).
     *
     * @constructor
     * @param {Logger} [logger]
     * @param {Object} [obj] The object to set.
     **/
    function ReadOnlyPropertyHandler(logger, obj) {
        this._logger = logger;
        this._obj = obj || null;
    }

    ReadOnlyPropertyHandler.prototype = new PropertyHandler();
    ReadOnlyPropertyHandler.prototype.constructor = ReadOnlyPropertyHandler;

    /**
     * @param {Object} obj The object to set.
     * @return {boolean|void} {@code true} if the object was set, {@code false} otherwise.
     */
    ReadOnlyPropertyHandler.prototype.set = function (obj) {
        this._logger.verbose("Ignored. (%s)", "ReadOnlyPropertyHandler");
        return false;
    };

    /**
     * @return {Object} The object that was set. (Note that object might also be set in the constructor of an implementation class).
     */
    ReadOnlyPropertyHandler.prototype.get = function () {
        return this._obj;
    };

    module.exports = ReadOnlyPropertyHandler;

}());