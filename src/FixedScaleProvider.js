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
     * @param {PromiseFactory} promiseFactory
     * @param {boolean} [isReadOnly=false]
     * @augments ScaleProvider
     */
    function FixedScaleProvider(scaleRatio, scaleMethod, promiseFactory, isReadOnly) {
        ArgumentGuard.greaterThanZero(scaleRatio, "scaleRatio");

        this._scaleRatio = scaleRatio;
        this._scaleMethod = scaleMethod || ScaleMethod.getDefault();
        this._promiseFactory = promiseFactory;

        ScaleProvider.call(this, isReadOnly);
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
     * @param {MutableImage} image The image to scale.
     * @return {Promise<MutableImage>} A new scaled image.
     */
    FixedScaleProvider.prototype.scaleImage = function (image) {
        return image.scaleImage(this._scaleRatio, this._scaleMethod);
    };

    module.exports = FixedScaleProvider;
}());