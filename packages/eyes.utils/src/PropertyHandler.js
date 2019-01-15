(function () {
    'use strict';

    /**
     * Encapsulates getter/setter behavior. (e.g., set only once etc.).
     *
     * @constructor
     **/
    function PropertyHandler() { }

    /**
     * @param {*} obj The object to set.
     * @return {boolean} {@code true} if the object was set, {@code false} otherwise.
     */
    PropertyHandler.prototype.set = function (obj) {};

    /**
     *
     * @return {*} The object that was set. (Note that object might also be set in the constructor of an implementation class).
     */
    PropertyHandler.prototype.get = function () {};

    exports.PropertyHandler = PropertyHandler;
}());
