(function () {
    'use strict';

    var PropertyHandler = require('./PropertyHandler').PropertyHandler;

    /**
     * A simple implementation of {@link PropertyHandler}. Allows get/set.
     *
     * @constructor
     * @param {*} [obj] The object to set.
     **/
    function SimplePropertyHandler(obj) {
        this._obj = obj || null;
    }

    SimplePropertyHandler.prototype = new PropertyHandler();
    SimplePropertyHandler.prototype.constructor = SimplePropertyHandler;

    /**
     * @param {*} obj The object to set.
     * @return {boolean} {@code true} if the object was set, {@code false} otherwise.
     */
    SimplePropertyHandler.prototype.set = function (obj) {
        this._obj = obj;
        return true;
    };

    /**
     * @return {*} The object that was set. (Note that object might also be set in the constructor of an implementation class).
     */
    SimplePropertyHandler.prototype.get = function () {
        return this._obj;
    };

    exports.SimplePropertyHandler = SimplePropertyHandler;
}());
