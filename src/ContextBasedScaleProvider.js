(function() {
    'use strict';

    var EyesUtils = require('eyes.utils');
    var ScaleProvider = EyesUtils.ScaleProvider,
        ArgumentGuard = EyesUtils.ArgumentGuard,
        ImageUtils = EyesUtils.ImageUtils;

    // Allowed deviations for viewport size and default content entire size.
    var ALLOWED_VS_DEVIATION = 1,
        ALLOWED_DCES_DEVIATION = 10,
        UNKNOWN_SCALE_RATIO = 0;

    /**
     * @constructor
     * @param {{width: number, height: number}} topLevelContextEntireSize The total size of the top level context.
     *        E.g., for selenium this would be the document size of the top level frame.
     * @param {{width: number, height: number}} viewportSize The viewport size.
     * @param {number} devicePixelRatio The device pixel ratio of the platform on which the application is running.
     * @param {PromiseFactory} promiseFactory
     * @param {boolean} [isReadOnly=false]
     * @augments ScaleProvider
     */
    function ContextBasedScaleProvider(topLevelContextEntireSize, viewportSize, devicePixelRatio, promiseFactory, isReadOnly) {
        this._topLevelContextEntireSize = topLevelContextEntireSize;
        this._viewportSize = viewportSize;
        this._devicePixelRatio = devicePixelRatio;
        this._promiseFactory = promiseFactory;

        // Since we need the image size to decide what the scale ratio is.
        this._scaleRatio = UNKNOWN_SCALE_RATIO;

        ScaleProvider.call(this, isReadOnly);
    }

    ContextBasedScaleProvider.prototype = new ScaleProvider();
    ContextBasedScaleProvider.prototype.constructor = ContextBasedScaleProvider;

    /**
     * @return {number} The ratio by which an image will be scaled.
     */
    ContextBasedScaleProvider.prototype.getScaleRatio = function () {
        ArgumentGuard.isValidState(this._scaleRatio != UNKNOWN_SCALE_RATIO, "scaleRatio not defined yet");
        return this._scaleRatio;
    };

    var calculateScaleRatio = function (provider, image) {
        return provider._promiseFactory.makePromise(function (resolve) {
            if (provider._scaleRatio == UNKNOWN_SCALE_RATIO) {

                return image.getSize().then(function (imageSize) {
                    var imageWidth = imageSize.width;
                    var viewportWidth = provider._viewportSize.width;
                    var dcesWidth = provider._topLevelContextEntireSize.width;

                    // If the image's width is the same as the viewport's width or the
                    // top level context's width, no scaling is necessary.
                    if (((imageWidth >= viewportWidth - ALLOWED_VS_DEVIATION)
                        && (imageWidth <= viewportWidth + ALLOWED_VS_DEVIATION))
                        || ((imageWidth >= dcesWidth - ALLOWED_DCES_DEVIATION)
                        && imageWidth <= dcesWidth + ALLOWED_DCES_DEVIATION)) {
                        resolve(1);
                    } else {
                        resolve(1 / provider._devicePixelRatio);
                    }
                });

            }

            resolve(provider._scaleRatio);
        });
    };

    /**
     * @param {MutableImage} image The image to scale.
     * @return {Promise<MutableImage>} A new scaled image.
     */
    ContextBasedScaleProvider.prototype.scaleImage = function (image) {
        // First time an image is given we determine the scale ratio.
        var that = this;
        return calculateScaleRatio(that, image).then(function (scaleRatio) {
            that._scaleRatio = scaleRatio;
            return ImageUtils.scaleImage(image, scaleRatio, that._promiseFactory);
        });
    };

    module.exports = ContextBasedScaleProvider;
}());