(function () {
    "use strict";

    var FixedScaleProvider = require('./FixedScaleProvider');

    /**
     * A scale provider which does nothing.
     *
     * @constructor
     * @augments FixedScaleProvider
     * @param {PromiseFactory} promiseFactory
     **/
    function NullScaleProvider(promiseFactory) {
        FixedScaleProvider.call(this, 1, undefined, promiseFactory)
    }

    NullScaleProvider.prototype = Object.create(FixedScaleProvider.prototype);
    NullScaleProvider.prototype.constructor = NullScaleProvider;

    module.exports = NullScaleProvider;

}());