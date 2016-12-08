(function() {
    'use strict';

    var EyesUtils = require('eyes.utils');
    var ScaleProvider = EyesUtils.ScaleProvider,
        ArgumentGuard = EyesUtils.ArgumentGuard,
        ScaleMethod = EyesUtils.ScaleMethod;

    /**
     * @constructor
     * @param {number} scaleRatio The scale ratio to use.
     * @param {ScaleMethod} scaleMethod The scale method to use.
     * @augments ScaleProvider
     */
    function FixedScaleProvider(scaleRatio, scaleMethod) {
        ArgumentGuard.greaterThanZero(scaleRatio, "scaleRatio");

        this._scaleRatio = scaleRatio;
        this._scaleMethod = scaleMethod || ScaleMethod.getDefault();
    }

    FixedScaleProvider.prototype = new ScaleProvider();
    FixedScaleProvider.prototype.constructor = FixedScaleProvider;

    /**
     * @return {number} The ratio by which an image will be scaled.
     */
    FixedScaleProvider.prototype.getScaleRatio = function () {
        return this._scaleRatio;
    };

    /**
     * @return {ScaleMethod}
     */
    FixedScaleProvider.prototype.getScaleMethod = function () {
        return this._scaleMethod;
    };

    module.exports = FixedScaleProvider;
}());