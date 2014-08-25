/*
 ---

 name: EyesPromiseFactory

 description: Wraps a promise in webdriver control flow execution

 provides: [EyesPromiseFactory]

 ---
 */

;(function() {
    "use strict";

    var EyesPromiseFactory = {};

    EyesPromiseFactory.setFactoryMethods = function(promiseFactory, deferredFactory) {
        this._promiseFactory = promiseFactory;
        this._deferredFactory = deferredFactory;
    };

    /**
     *
     * When ever you need to produce a promise - call this method and return the return value's promise.
     *
     * @example:
     * function async_method(resolve, reject) {if (all_good) {resolve(val);} else {reject(Error("No good!"));};}
     * var promise = EyesPromiseFactory.makePromise(async_method);
     *
     * @method makePromise
     *
     * @return {Promise} deferred promise
     *
     **/
    EyesPromiseFactory.makePromise = function (asyncAction) {
        return this._promiseFactory(asyncAction);
    };

    EyesPromiseFactory.makeDeferred = function (asyncAction) {
        return this._deferredFactory();
    };

    module.exports = EyesPromiseFactory;
}());
