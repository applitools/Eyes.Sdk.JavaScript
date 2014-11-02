exports.GeneralUtils = require('./src/GeneralUtils');
exports.ImageUtils = require('./src/ImageUtils');
exports.GeometryUtils = require('./src/GeometryUtils');
exports.StreamUtils = require('./src/StreamUtils');
exports.PromiseFactory = require('./src/PromiseFactory');

/**
 * Set the promise factory to all modules which require it.
 * @param promiseFactory The promise factory to set.
 */
exports.setPromiseFactory = function (promiseFactory) {
    //noinspection JSUnresolvedVariable,JSLint
    if (!promiseFactory.makePromise || !promiseFactory.makeDeferred
        || typeof promiseFactory.makePromise !== 'function'
        || typeof promiseFactory.makeDeferred !== 'function') {
        throw "Promise factory must have 'makePromise' and 'makeDeferred' functions!";
    }

    //noinspection JSLint
    exports.ImageUtils.setPromiseFactory(promiseFactory);
};