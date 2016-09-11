/*
 ---

 name: PromiseFactory

 description: After initialization, provides factory methods for creating deferreds/promises.

 ---
 */

(function () {
    "use strict";

    /**
     * @constructor
     * @param {function} promiseFactoryFunc A function which receives as a parameter
     *                   the same function you would pass to a Promise constructor.
     * @param {function} deferredFactoryFunc A function which returns a deferred.
     */
    function PromiseFactory(promiseFactoryFunc, deferredFactoryFunc) {
        this._promiseFactoryFunc = promiseFactoryFunc;
        this._deferredFactoryFunc = deferredFactoryFunc;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * Sets the factory methods which will be used to create promises and deferred-s.
     *
     * @param {function} promiseFactoryFunc A function which receives as a parameter
     *                   the same function you would pass to a Promise constructor.
     * @param {function} deferredFactoryFunc A function which returns a deferred.
     */
    PromiseFactory.prototype.setFactoryMethods = function (promiseFactoryFunc, deferredFactoryFunc) {
        this._promiseFactoryFunc = promiseFactoryFunc;
        this._deferredFactoryFunc = deferredFactoryFunc;
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {function} asyncAction
     * @returns {*}
     */
    PromiseFactory.prototype.makePromise = function (asyncAction) {
        if (this._promiseFactoryFunc) {
            return this._promiseFactoryFunc(asyncAction);
        }

        throw new Error('Promise factory was not initialized with proper callback');
    };

    //noinspection JSUnusedGlobalSymbols
    /**
     * @deprecated
     * @returns {*}
     */
    PromiseFactory.prototype.makeDeferred = function () {
        if (this._deferredFactoryFunc) {
            return this._deferredFactoryFunc();
        }

        throw new Error('Promise factory was not initialized with proper callback');
    };

    module.exports = PromiseFactory;
}());
