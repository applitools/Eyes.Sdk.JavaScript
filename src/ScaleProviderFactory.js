(function () {
    "use strict";

    /**
     * Abstraction for instantiating scale providers.
     *
     * @constructor
     * @param {PropertyHandler} scaleProviderHandler A handler to update once a {@link ScaleProvider} instance is created.
     **/
    function ScaleProviderFactory(scaleProviderHandler) {
        this._scaleProviderHandler = scaleProviderHandler;
    }

    /**
     * The main API for this factory.
     *
     * @param {int} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} A {@link ScaleProvider} instance.
     */
    ScaleProviderFactory.prototype.getScaleProvider = function (imageToScaleWidth) {
        var scaleProvider = this.getScaleProviderImpl(imageToScaleWidth);
        this._scaleProviderHandler.set(scaleProvider);
        return scaleProvider;
    };

    /**
     * The implementation of getting/creating the scale provider, should be implemented by child classes.
     *
     * @param {int} imageToScaleWidth The width of the image to scale. This parameter CAN be by class implementing the factory, but this is not mandatory.
     * @return {ScaleProvider} The scale provider to be used.
     */
    ScaleProviderFactory.prototype.getScaleProviderImpl = function (imageToScaleWidth) {};

    module.exports = ScaleProviderFactory;

}());