(function() {
    'use strict';

    var EyesUtils = require('eyes.utils');
    var ScaleProvider = EyesUtils.ScaleProvider,
        ArgumentGuard = EyesUtils.ArgumentGuard,
        ImageUtils = EyesUtils.ImageUtils;

    /**
     * @constructor
     * @param {number} scaleRatio The scale ratio to use.
     * @param {PromiseFactory} promiseFactory
     * @param {boolean} [isReadOnly=false]
     * @augments ScaleProvider
     */
    function FixedScaleProvider(scaleRatio, promiseFactory, isReadOnly) {
        ArgumentGuard.greaterThanZero(scaleRatio, "scaleRatio");

        this._scaleRatio = scaleRatio;
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
        return ImageUtils.scaleImage(image, this._scaleRatio, this._promiseFactory);
    };

    module.exports = FixedScaleProvider;
}());