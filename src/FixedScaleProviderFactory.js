(function() {
    'use strict';

    var FixedScaleProvider = require('./FixedScaleProvider').FixedScaleProvider,
        ScaleProviderFactory = require('./ScaleProviderFactory').ScaleProviderFactory;

    /**
     * @constructor
     * @param {number} scaleRatio The scale ratio to use.
     * @param {PropertyHandler} scaleProviderHandler
     * @augments ScaleProviderFactory
     */
    function FixedScaleProviderFactory(scaleRatio, scaleProviderHandler) {
        this._scaleRatio = scaleRatio;

        ScaleProviderFactory.call(this, scaleProviderHandler);
    }

    FixedScaleProviderFactory.prototype = Object.create(ScaleProviderFactory.prototype);
    FixedScaleProviderFactory.prototype.constructor = FixedScaleProviderFactory;

    /**
     * The implementation of getting/creating the scale provider, should be implemented by child classes.
     *
     * @param {number} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} The scale provider to be used.
     */
    FixedScaleProviderFactory.prototype.getScaleProviderImpl = function (imageToScaleWidth) {
        return new FixedScaleProvider(this._scaleRatio);
    };

    exports.FixedScaleProviderFactory = FixedScaleProviderFactory;
}());
