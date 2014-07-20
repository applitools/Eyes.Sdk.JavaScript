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

    EyesPromiseFactory.setPromiseHandler = function(handler) {
        this._handler = handler;
    };

    /**
     *
     * When ever you need to produce a promise - call this method and return the return value's promise.
     * call ret.fulfill(result) to fulfill the promise
     *
     * @example:
     * var deferred = EyesPromiseFactory.makePromise();
     * async_method(deferred) {deferred.fulfill(result};}
     * return deferred.promise;
     *
     * @method makePromise
     *
     * @return {Object} deferred promise
     *
     **/
    EyesPromiseFactory.makePromise = function (asyncAction) {
        return this._handler(asyncAction);
    };

    module.exports = EyesPromiseFactory;
}());
