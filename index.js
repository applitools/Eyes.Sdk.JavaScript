exports.GeneralUtils = require('./src/GeneralUtils');
exports.ImageUtils = require('./src/ImageUtils');
exports.GeometryUtils = require('./src/GeometryUtils');
exports.StreamUtils = require('./src/StreamUtils');

/**
 * Set the promise factory to all modules which require it.
 * @param PromiseFactory The promise factory to set.
 */
exports.setPromiseFactory = function (PromiseFactory) {
    //noinspection JSUnresolvedVariable,JSLint
    if (!PromiseFactory.makePromise || !PromiseFactory.makeDeferred
        || typeof PromiseFactory.makePromise !== 'function'
        || typeof PromiseFactory.makeDeferred !== 'function') {
        throw "Promise factory must have 'makePromise' and 'makeDeferred' functions!";
    }

    //noinspection JSLint
    exports.ImageUtils.setPromiseFactory(PromiseFactory);
};