(function() {
    'use strict';

    var EyesUtils = require('eyes.utils'),
        FixedScaleProvider = require('./FixedScaleProvider');
    var ScaleProviderFactory = EyesUtils.ScaleProviderFactory;

    /**
     * @constructor
     * @param {number} scaleRatio The scale ratio to use.
     * @param {ScaleMethod} scaleMethod The scale method to use.
     * @param {PropertyHandler} scaleProviderHandler
     * @augments ScaleProviderFactory
     */
    function FixedScaleProviderFactory(scaleRatio, scaleMethod, scaleProviderHandler) {
        this._scaleRatio = scaleRatio;
        this._scaleMethod = scaleMethod;

        ScaleProviderFactory.call(this, scaleProviderHandler);
    }

    FixedScaleProviderFactory.prototype = Object.create(ScaleProviderFactory.prototype);
    FixedScaleProviderFactory.prototype.constructor = FixedScaleProviderFactory;

    /**
     * The implementation of getting/creating the scale provider, should be implemented by child classes.
     *
     * @param {int} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} The scale provider to be used.
     */
    FixedScaleProviderFactory.prototype.getScaleProviderImpl = function (imageToScaleWidth) {
        return new FixedScaleProvider(this._scaleRatio, this._scaleMethod);
    };

    module.exports = FixedScaleProviderFactory;
}());