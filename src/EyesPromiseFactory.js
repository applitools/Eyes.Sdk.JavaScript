/*
 ---

 name: EyesPromiseFactory

 description: Wraps a promise in webdriver control flow execution

 provides: [EyesPromiseFactory]

 ---
 */

(function () {
    "use strict";

    var EyesPromiseFactory = {};

    /**
     * Sets the factory methods which will be used to create promises and deferreds.
     * @param promiseFactory A function which receives as a parameter the same function you would pass to a Promise
     *                          constructor.
     * @param deferredFactory A function which returns a deferred.
     */
    EyesPromiseFactory.setFactoryMethods = function (promiseFactory, deferredFactory) {
        this._promiseFactory = promiseFactory;
        this._deferredFactory = deferredFactory;
    };

    EyesPromiseFactory.makePromise = function (asyncAction) {
        return this._promiseFactory(asyncAction);
    };

    EyesPromiseFactory.makeDeferred = function () {
        return this._deferredFactory();
    };

    module.exports = EyesPromiseFactory;
}());
