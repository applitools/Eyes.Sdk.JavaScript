(function() {
    'use strict';

    var EyesUtils = require('eyes.utils');
    var ScaleProvider = EyesUtils.ScaleProvider,
        ArgumentGuard = EyesUtils.ArgumentGuard;
    /**
     * @constructor
     * @param {number} scaleRatio The scale ratio to use.
     * @augments ScaleProvider
     */
    function FixedScaleProvider(scaleRatio) {
        ArgumentGuard.greaterThanZero(scaleRatio, "scaleRatio");

        this._scaleRatio = scaleRatio;
    }

    FixedScaleProvider.prototype = new ScaleProvider();
    FixedScaleProvider.prototype.constructor = FixedScaleProvider;

    /**
     * @return {number} The ratio by which an image will be scaled.
     */
    FixedScaleProvider.prototype.getScaleRatio = function () {
        return this._scaleRatio;
    };

    module.exports = FixedScaleProvider;
}());