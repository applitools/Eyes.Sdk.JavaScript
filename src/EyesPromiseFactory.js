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
     *
     * @example:
     * function async_method(resolve, reject) {if (all_good) {resolve(val);} else {reject(Error("No good!"));};}
     * var promise = EyesPromiseFactory.makePromise(async_method);
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
