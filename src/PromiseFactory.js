/*
 ---

 name: PromiseFactory

 description: After initialization, provides factory methods for creating deferreds/promises.

 ---
 */

(function () {
    "use strict";

    var PromiseFactory = {};

    /**
     * Sets the factory methods which will be used to create promises and deferred-s.
     * @param promiseFactoryFunc A function which receives as a parameter the same function you would pass to a Promise
     *                          constructor.
     * @param deferredFactoryFunc A function which returns a deferred.
     */
    PromiseFactory.setFactoryMethods = function (promiseFactoryFunc, deferredFactoryFunc) {
        this._promiseFactoryFunc = promiseFactoryFunc;
        this._deferredFactoryFunc = deferredFactoryFunc;
    };

    PromiseFactory.makePromise = function (asyncAction) {
        return this._promiseFactoryFunc(asyncAction);
    };

    PromiseFactory.makeDeferred = function () {
        return this._deferredFactoryFunc();
    };

    module.exports = PromiseFactory;
}());
