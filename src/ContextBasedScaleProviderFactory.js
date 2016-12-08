(function() {
    'use strict';

    var EyesUtils = require('eyes.utils'),
        ContextBasedScaleProvider = require('./ContextBasedScaleProvider');
    var ScaleProviderFactory = EyesUtils.ScaleProviderFactory;

    /**
     * Factory implementation for creating {@link ContextBasedScaleProvider} instances.
     *
     * @constructor
     * @param {{width: number, height: number}} topLevelContextEntireSize The total size of the top level context. E.g., for selenium this would be the document size of the top level frame.
     * @param {{width: number, height: number}} viewportSize The viewport size.
     * @param {ScaleMethod} scaleMethod The method used for scaling.
     * @param {number} devicePixelRatio The device pixel ratio of the platform on which the application is running.
     * @param {PropertyHandler} scaleProviderHandler
     * @augments ScaleProviderFactory
     */
    function ContextBasedScaleProviderFactory(topLevelContextEntireSize, viewportSize, scaleMethod, devicePixelRatio, scaleProviderHandler) {
        this._topLevelContextEntireSize = topLevelContextEntireSize;
        this._viewportSize = viewportSize;
        this._scaleMethod = scaleMethod;
        this._devicePixelRatio = devicePixelRatio;

        ScaleProviderFactory.call(this, scaleProviderHandler);
    }

    ContextBasedScaleProviderFactory.prototype = Object.create(ScaleProviderFactory.prototype);
    ContextBasedScaleProviderFactory.prototype.constructor = ContextBasedScaleProviderFactory;

    /**
     * The implementation of getting/creating the scale provider, should be implemented by child classes.
     *
     * @param {int} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} The scale provider to be used.
     */
    ContextBasedScaleProviderFactory.prototype.getScaleProviderImpl = function (imageToScaleWidth) {
        var scaleProvider = new ContextBasedScaleProvider(this._topLevelContextEntireSize, this._viewportSize, this._scaleMethod, this._devicePixelRatio);
        scaleProvider.updateScaleRatio(imageToScaleWidth);
        return scaleProvider;
    };

    module.exports = ContextBasedScaleProviderFactory;
}());